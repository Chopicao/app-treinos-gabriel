import type { Repository } from '@/services/repository';
import type { SyncMeta } from '@/services/db';
import { mergeCollection, mergeSingleton, type LocalDeletion } from './merge';
import type { RemoteGateway } from './remote';

export interface SyncOutcome {
  ok: boolean;
  /** Registos trazidos do servidor para este dispositivo. */
  pulled: number;
  /** Registos enviados deste dispositivo para o servidor. */
  pushed: number;
  at: string;
  errorPt?: string;
}

export class DifferentAccountError extends Error {
  constructor() {
    super('Os dados locais pertencem a outra conta.');
    this.name = 'DifferentAccountError';
  }
}

/**
 * Uma passagem completa de sincronização.
 *
 * Ordem: ler o que mudou no servidor → juntar → escrever localmente → enviar o
 * que é local. Escrever primeiro o que vem de fora evita que uma falha a meio
 * do envio deixe o dispositivo sem as alterações que já tinham chegado.
 *
 * Se o envio falhar, o que veio do servidor **fica na mesma** guardado e a
 * marca de leitura não avança, por isso a passagem seguinte repete o envio.
 */
export async function runSync(input: {
  repo: Repository;
  gateway: RemoteGateway;
  userId: string;
}): Promise<SyncOutcome> {
  const { repo, gateway, userId } = input;
  const at = new Date().toISOString();
  const meta = await repo.getSyncMeta();

  if (meta.userId && meta.userId !== userId) throw new DifferentAccountError();

  const [localSessions, localOverrides, tombstones, localProfile, localSettings] =
    await Promise.all([
      repo.listSessions(),
      repo.listOverrides(),
      repo.listTombstones(),
      repo.getProfile(),
      repo.getSettings(),
    ]);

  const sessionDeletions: LocalDeletion[] = tombstones
    .filter((tombstone) => tombstone.kind === 'session')
    .map((tombstone) => ({ id: tombstone.id, deletedAt: tombstone.deletedAt }));
  const overrideDeletions: LocalDeletion[] = tombstones
    .filter((tombstone) => tombstone.kind === 'override')
    .map((tombstone) => ({ id: tombstone.id, deletedAt: tombstone.deletedAt }));

  const [remoteSessions, remoteOverrides, remoteProfile, remoteSettings] = await Promise.all([
    gateway.fetchSessions(meta.lastPulledAt),
    gateway.fetchOverrides(meta.lastPulledAt),
    gateway.fetchProfile(),
    gateway.fetchSettings(),
  ]);

  const sessions = mergeCollection({
    local: localSessions,
    idOf: (session) => session.id,
    timestampOf: (session) => session.updatedAt,
    localDeletions: sessionDeletions,
    remote: remoteSessions,
    watermark: meta.lastPulledAt,
  });

  const overrides = mergeCollection({
    local: localOverrides,
    idOf: (override) => override.key,
    // Uma remarcação não é editada: é criada ou apagada.
    timestampOf: (override) => override.createdAt,
    localDeletions: overrideDeletions,
    remote: remoteOverrides,
    watermark: sessions.nextWatermark,
  });

  const profile = mergeSingleton(localProfile, remoteProfile);
  const settings = mergeSingleton(localSettings, remoteSettings);

  // 1. O que veio do servidor entra primeiro, tal e qual.
  await repo.applyRemote({
    sessions: sessions.toApplyLocally,
    overrides: overrides.toApplyLocally,
    deletedSessionIds: sessions.toDeleteLocally,
    deletedOverrideKeys: overrides.toDeleteLocally,
    profile: profile.apply ?? undefined,
    settings: settings.apply ?? undefined,
  });

  // 2. E depois vai o que é local.
  await gateway.pushSessions(sessions.toPush);
  await gateway.pushOverrides(overrides.toPush);
  await gateway.pushSessionDeletions(sessions.toPushDeletions);
  await gateway.pushOverrideDeletions(overrides.toPushDeletions);
  if (profile.push) await gateway.pushProfile(profile.push);
  if (settings.push) await gateway.pushSettings(settings.push);

  // 3. Marcas de eliminação já refletidas no servidor podem sair.
  await repo.clearTombstones([
    ...sessions.settledDeletions.map((id) => `session:${id}`),
    ...sessions.toPushDeletions.map((deletion) => `session:${deletion.id}`),
    ...overrides.settledDeletions.map((id) => `override:${id}`),
    ...overrides.toPushDeletions.map((deletion) => `override:${deletion.id}`),
  ]);

  const next: SyncMeta = {
    id: 'sync',
    userId,
    lastPulledAt: overrides.nextWatermark,
    lastSyncedAt: at,
    lastErrorPt: null,
  };
  await repo.saveSyncMeta(next);

  return {
    ok: true,
    at,
    pulled:
      sessions.toApplyLocally.length +
      overrides.toApplyLocally.length +
      sessions.toDeleteLocally.length +
      overrides.toDeleteLocally.length +
      (profile.apply ? 1 : 0) +
      (settings.apply ? 1 : 0),
    pushed:
      sessions.toPush.length +
      overrides.toPush.length +
      sessions.toPushDeletions.length +
      overrides.toPushDeletions.length +
      (profile.push ? 1 : 0) +
      (settings.push ? 1 : 0),
  };
}

/**
 * Prepara o dispositivo para uma conta diferente da que estava aqui: os dados
 * locais são de outra pessoa e não podem ser misturados nem enviados.
 */
export async function resetForAccount(repo: Repository, userId: string): Promise<void> {
  await repo.clearAll();
  await repo.init();
  await repo.saveSyncMeta({
    id: 'sync',
    userId,
    lastPulledAt: null,
    lastSyncedAt: null,
    lastErrorPt: null,
  });
}
