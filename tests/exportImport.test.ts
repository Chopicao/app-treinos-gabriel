import { beforeEach, describe, expect, it } from 'vitest';
import type { SessionLog } from '@/domain/types';
import { TrainingDatabase } from '@/services/db';
import { createRepository, defaultProfile, defaultSettings } from '@/services/repository';
import {
  applyImport,
  buildExportBundle,
  bundleToFilename,
  parseImportBundle,
} from '@/services/exportImport';
import { buildSessionLog } from '@/services/sessionBuilder';
import { requireSessionTemplate } from '@/data/plan';

function sampleSession(): SessionLog {
  return buildSessionLog({
    occurrence: {
      key: 'gym-a@2026-08-04',
      templateId: 'gym-a',
      originalDate: '2026-08-04',
      date: '2026-08-04',
      planWeek: 1,
      phaseId: 'w1-2',
      rescheduled: false,
      status: 'planned',
    },
    template: requireSessionTemplate('gym-a'),
    planVersion: '1.0.0',
  });
}

let database: TrainingDatabase;
let repository: ReturnType<typeof createRepository>;

beforeEach(async () => {
  database = new TrainingDatabase(`test-${Math.random().toString(36).slice(2)}`);
  repository = createRepository(database);
  await repository.init();
});

describe('exportação', () => {
  it('inclui definições, perfil, sessões e remarcações', () => {
    const bundle = buildExportBundle({
      settings: defaultSettings(),
      profile: defaultProfile(),
      sessions: [sampleSession()],
      overrides: [],
      now: new Date('2026-08-04T12:00:00.000Z'),
    });
    expect(bundle.kind).toBe('app-treinos-export');
    expect(bundle.sessions).toHaveLength(1);
    expect(bundleToFilename(bundle)).toBe('treinos-2026-08-04.json');
  });

  it('um ficheiro exportado volta a ser aceite pela importação', () => {
    const bundle = buildExportBundle({
      settings: defaultSettings(),
      profile: defaultProfile(),
      sessions: [sampleSession()],
      overrides: [
        {
          key: 'gym-a@2026-08-04',
          originalDate: '2026-08-04',
          newDate: '2026-08-05',
          createdAt: '2026-08-04T12:00:00.000Z',
        },
      ],
    });
    const result = parseImportBundle(JSON.stringify(bundle));
    expect(result.ok).toBe(true);
  });
});

describe('importação', () => {
  it('rejeita JSON inválido', () => {
    const result = parseImportBundle('{ isto não é json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorPt).toContain('JSON');
  });

  it('rejeita JSON válido com formato inesperado', () => {
    const result = parseImportBundle(JSON.stringify({ ola: 'mundo' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issuesPt.length).toBeGreaterThan(0);
  });

  it('rejeita um ficheiro com uma sessão corrompida', () => {
    const bundle = buildExportBundle({
      settings: defaultSettings(),
      profile: defaultProfile(),
      sessions: [sampleSession()],
      overrides: [],
    });
    const broken = JSON.parse(JSON.stringify(bundle));
    broken.sessions[0].date = '04/08/2026';
    const result = parseImportBundle(JSON.stringify(broken));
    expect(result.ok).toBe(false);
  });

  it('um ficheiro inválido não apaga os dados existentes', async () => {
    await repository.saveSession(sampleSession());
    expect(await repository.listSessions()).toHaveLength(1);

    const result = parseImportBundle('não é json de todo');
    expect(result.ok).toBe(false);
    // Nada é escrito porque a validação corre antes de tocar na base.
    expect(await repository.listSessions()).toHaveLength(1);
  });

  it('um ficheiro válido substitui os dados locais', async () => {
    await repository.saveSession(sampleSession());

    const incoming = sampleSession();
    incoming.id = 'importada';
    incoming.occurrenceKey = 'gym-b@2026-08-06';
    incoming.date = '2026-08-06';

    const bundle = buildExportBundle({
      settings: defaultSettings(),
      profile: defaultProfile(),
      sessions: [incoming],
      overrides: [],
    });
    const result = parseImportBundle(JSON.stringify(bundle));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    await applyImport(repository, result.bundle);
    const sessions = await repository.listSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe('importada');
  });

  it('avisa quando a versão do plano é diferente', () => {
    const bundle = buildExportBundle({
      settings: defaultSettings(),
      profile: defaultProfile(),
      sessions: [],
      overrides: [],
    });
    const older = { ...bundle, planVersion: '0.9.0' };
    const result = parseImportBundle(JSON.stringify(older));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warningsPt.join(' ')).toContain('0.9.0');
  });
});

describe('persistência', () => {
  it('guarda e devolve uma sessão pela chave da ocorrência', async () => {
    const session = sampleSession();
    await repository.saveSession(session);
    const found = await repository.getSessionByOccurrence(session.occurrenceKey);
    expect(found?.id).toBe(session.id);
  });

  it('eliminar uma sessão também remove os seus temporizadores', async () => {
    const session = sampleSession();
    await repository.saveSession(session);
    await repository.saveTimer({
      id: `${session.id}::rest::x`,
      sessionLogId: session.id,
      status: 'paused',
      targetDurationMs: 90_000,
      startedAt: null,
      accumulatedMs: 10_000,
      completedAt: null,
      updatedAt: new Date().toISOString(),
    });
    expect(await repository.listTimers(session.id)).toHaveLength(1);

    await repository.deleteSession(session.id);
    expect(await repository.listTimers(session.id)).toHaveLength(0);
    expect(await repository.getSession(session.id)).toBeUndefined();
  });
});
