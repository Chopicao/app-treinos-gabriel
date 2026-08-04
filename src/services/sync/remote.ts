import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AppSettings,
  AthleteProfile,
  OccurrenceOverride,
  SessionLog,
} from '@/domain/types';
import type { RemoteRecord } from './merge';

/**
 * Acesso às tabelas da conta. Nada aqui decide o que ganha em caso de conflito —
 * isso é `merge.ts`. Aqui só se lê e escreve.
 *
 * O esquema está em `docs/supabase-setup.sql`. Cada linha guarda o registo em
 * JSONB com a mesma forma que a aplicação usa localmente, para o modelo local e
 * o remoto não divergirem.
 */

const PAGE_SIZE = 500;

interface SessionRow {
  id: string;
  updated_at: string;
  deleted_at: string | null;
  data: SessionLog | null;
}

interface OverrideRow {
  key: string;
  updated_at: string;
  deleted_at: string | null;
  data: OccurrenceOverride | null;
}

function fail(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context}: ${error.message}`);
}

/** Lê uma tabela em páginas, para não ficar limitado pelo máximo por pedido. */
async function fetchAllPages<Row>(
  client: SupabaseClient,
  table: string,
  columns: string,
  since: string | null,
): Promise<Row[]> {
  const rows: Row[] = [];
  for (let page = 0; ; page += 1) {
    let query = client
      .from(table)
      .select(columns)
      .order('updated_at', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (since) query = query.gt('updated_at', since);

    const { data, error } = await query;
    fail(`ler ${table}`, error);
    const batch = (data ?? []) as Row[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
}

export function createRemoteGateway(client: SupabaseClient, userId: string) {
  return {
    async fetchSessions(since: string | null): Promise<Array<RemoteRecord<SessionLog>>> {
      const rows = await fetchAllPages<SessionRow>(
        client,
        'sessions',
        'id, updated_at, deleted_at, data',
        since,
      );
      return rows.map((row) => ({
        id: row.id,
        serverUpdatedAt: row.updated_at,
        deletedAt: row.deleted_at,
        data: row.data,
      }));
    },

    async fetchOverrides(since: string | null): Promise<Array<RemoteRecord<OccurrenceOverride>>> {
      const rows = await fetchAllPages<OverrideRow>(
        client,
        'overrides',
        'key, updated_at, deleted_at, data',
        since,
      );
      return rows.map((row) => ({
        id: row.key,
        serverUpdatedAt: row.updated_at,
        deletedAt: row.deleted_at,
        data: row.data,
      }));
    },

    async fetchProfile(): Promise<AthleteProfile | undefined> {
      const { data, error } = await client.from('profiles').select('data').maybeSingle();
      fail('ler perfil', error);
      return (data?.data as AthleteProfile | undefined) ?? undefined;
    },

    async fetchSettings(): Promise<AppSettings | undefined> {
      const { data, error } = await client.from('settings').select('data').maybeSingle();
      fail('ler definições', error);
      return (data?.data as AppSettings | undefined) ?? undefined;
    },

    async pushSessions(sessions: SessionLog[]): Promise<void> {
      if (sessions.length === 0) return;
      const { error } = await client.from('sessions').upsert(
        sessions.map((session) => ({
          user_id: userId,
          id: session.id,
          occurrence_key: session.occurrenceKey,
          session_date: session.date,
          deleted_at: null,
          data: session,
        })),
        { onConflict: 'user_id,id' },
      );
      fail('gravar sessões', error);
    },

    async pushOverrides(overrides: OccurrenceOverride[]): Promise<void> {
      if (overrides.length === 0) return;
      const { error } = await client.from('overrides').upsert(
        overrides.map((override) => ({
          user_id: userId,
          key: override.key,
          deleted_at: null,
          data: override,
        })),
        { onConflict: 'user_id,key' },
      );
      fail('gravar remarcações', error);
    },

    /**
     * Eliminação suave: a linha fica com `deleted_at` para os outros
     * dispositivos saberem que foi apagada, em vez de a voltarem a enviar.
     */
    async pushSessionDeletions(deletions: Array<{ id: string; deletedAt: string }>): Promise<void> {
      if (deletions.length === 0) return;
      const { error } = await client.from('sessions').upsert(
        deletions.map((deletion) => ({
          user_id: userId,
          id: deletion.id,
          occurrence_key: '',
          session_date: deletion.deletedAt.slice(0, 10),
          deleted_at: deletion.deletedAt,
          data: null,
        })),
        { onConflict: 'user_id,id' },
      );
      fail('propagar sessões apagadas', error);
    },

    async pushOverrideDeletions(
      deletions: Array<{ id: string; deletedAt: string }>,
    ): Promise<void> {
      if (deletions.length === 0) return;
      const { error } = await client.from('overrides').upsert(
        deletions.map((deletion) => ({
          user_id: userId,
          key: deletion.id,
          deleted_at: deletion.deletedAt,
          data: null,
        })),
        { onConflict: 'user_id,key' },
      );
      fail('propagar remarcações apagadas', error);
    },

    async pushProfile(profile: AthleteProfile): Promise<void> {
      const { error } = await client
        .from('profiles')
        .upsert({ user_id: userId, data: profile }, { onConflict: 'user_id' });
      fail('gravar perfil', error);
    },

    async pushSettings(settings: AppSettings): Promise<void> {
      const { error } = await client
        .from('settings')
        .upsert({ user_id: userId, data: settings }, { onConflict: 'user_id' });
      fail('gravar definições', error);
    },
  };
}

export type RemoteGateway = ReturnType<typeof createRemoteGateway>;
