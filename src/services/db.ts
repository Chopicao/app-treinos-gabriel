import Dexie, { type Table } from 'dexie';
import type {
  AppSettings,
  AthleteProfile,
  OccurrenceOverride,
  PersistedTimer,
  SessionLog,
} from '@/domain/types';

/**
 * Local database.
 *
 * Everything the app writes lives here. The UI never talks to Dexie directly —
 * it goes through `services/repository.ts`, so a remote backend can be added later
 * by swapping that layer.
 */
export const DB_NAME = 'app-treinos';

/** Bump together with a new `version(n).stores(...)` block below. */
export const SCHEMA_VERSION = 2;

/**
 * Marca de eliminação. Sem isto, apagar uma sessão num dispositivo não se
 * propagava: a sincronização seguinte voltava a trazê-la do servidor.
 */
export interface Tombstone {
  /** `${kind}:${id}` */
  key: string;
  kind: 'session' | 'override';
  id: string;
  deletedAt: string;
}

/** Estado da sincronização com a conta na nuvem. */
export interface SyncMeta {
  id: 'sync';
  /** Conta a que os dados locais pertencem. Muda ⇒ os dados locais são limpos. */
  userId: string | null;
  /** Carimbo do servidor até ao qual já foi lido. */
  lastPulledAt: string | null;
  lastSyncedAt: string | null;
  lastErrorPt: string | null;
}

export function emptySyncMeta(): SyncMeta {
  return {
    id: 'sync',
    userId: null,
    lastPulledAt: null,
    lastSyncedAt: null,
    lastErrorPt: null,
  };
}

export class TrainingDatabase extends Dexie {
  sessions!: Table<SessionLog, string>;
  overrides!: Table<OccurrenceOverride, string>;
  settings!: Table<AppSettings, string>;
  profile!: Table<AthleteProfile, string>;
  timers!: Table<PersistedTimer, string>;
  tombstones!: Table<Tombstone, string>;
  syncMeta!: Table<SyncMeta, string>;

  constructor(name: string = DB_NAME) {
    super(name);
    this.version(1).stores({
      sessions: 'id, occurrenceKey, date, templateId, status, planWeek',
      overrides: 'key, newDate, originalDate',
      settings: 'id',
      profile: 'id',
      timers: 'id, sessionLogId',
    });
    // v2 acrescenta o necessário para sincronizar com uma conta.
    this.version(2).stores({
      tombstones: 'key, kind, deletedAt',
      syncMeta: 'id',
    });
  }
}

export const db = new TrainingDatabase();

/**
 * One-time import of data left behind by an earlier localStorage-based build.
 * Safe to call on every boot: it only runs when the legacy key exists and the
 * database is still empty, and it never deletes anything.
 */
export const LEGACY_STORAGE_KEY = 'app-treinos:v0';

export async function migrateLegacyStorage(database: TrainingDatabase = db): Promise<number> {
  if (typeof localStorage === 'undefined') return 0;
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return 0;

  const existing = await database.sessions.count();
  if (existing > 0) return 0;

  try {
    const parsed: unknown = JSON.parse(raw);
    const sessions = Array.isArray((parsed as { sessions?: unknown }).sessions)
      ? ((parsed as { sessions: SessionLog[] }).sessions ?? [])
      : [];
    if (sessions.length === 0) return 0;
    await database.sessions.bulkPut(sessions);
    localStorage.setItem(`${LEGACY_STORAGE_KEY}:migrated`, new Date().toISOString());
    return sessions.length;
  } catch {
    // Dados antigos ilegíveis: não apagamos nada e seguimos com a base vazia.
    return 0;
  }
}
