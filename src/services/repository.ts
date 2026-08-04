import type {
  AppSettings,
  AthleteProfile,
  OccurrenceOverride,
  PersistedTimer,
  SessionLog,
} from '@/domain/types';
import { DEFAULT_PROFILE } from '@/data/profile';
import { PLAN_VERSION } from '@/data/plan';
import { startOfWeek, todayKey, type DateKey } from '@/lib/dates';
import { notifyLocalChange } from '@/state/syncBus';
import {
  SCHEMA_VERSION,
  db,
  emptySyncMeta,
  migrateLegacyStorage,
  type SyncMeta,
  type Tombstone,
  type TrainingDatabase,
} from './db';

/**
 * The only module allowed to touch the database.
 * Every function is async so a networked implementation can replace it later.
 */

export function defaultSettings(now: Date = new Date()): AppSettings {
  return {
    id: 'app',
    schemaVersion: SCHEMA_VERSION,
    planVersion: PLAN_VERSION,
    planStartDate: startOfWeek(todayKey(now)),
    theme: 'system',
    soundEnabled: false,
    vibrationEnabled: false,
    keepScreenAwake: false,
    restTimerAutoStart: true,
    showLaterPhaseInLibrary: true,
    updatedAt: now.toISOString(),
  };
}

export function defaultProfile(now: Date = new Date()): AthleteProfile {
  return { ...DEFAULT_PROFILE, updatedAt: now.toISOString() };
}

export interface Repository {
  init(): Promise<{ settings: AppSettings; profile: AthleteProfile }>;
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<AppSettings>;
  getProfile(): Promise<AthleteProfile>;
  saveProfile(profile: AthleteProfile): Promise<AthleteProfile>;
  listSessions(): Promise<SessionLog[]>;
  getSession(id: string): Promise<SessionLog | undefined>;
  getSessionByOccurrence(key: string): Promise<SessionLog | undefined>;
  saveSession(log: SessionLog): Promise<SessionLog>;
  deleteSession(id: string): Promise<void>;
  listOverrides(): Promise<OccurrenceOverride[]>;
  saveOverride(override: OccurrenceOverride): Promise<void>;
  deleteOverride(key: string): Promise<void>;
  listTimers(sessionLogId: string): Promise<PersistedTimer[]>;
  saveTimer(timer: PersistedTimer): Promise<void>;
  deleteTimersForSession(sessionLogId: string): Promise<void>;
  replaceAll(data: {
    settings: AppSettings;
    profile: AthleteProfile;
    sessions: SessionLog[];
    overrides: OccurrenceOverride[];
  }): Promise<void>;
  clearAll(): Promise<void>;

  // --- Sincronização com a conta na nuvem ---------------------------------
  /** Eliminações locais ainda por propagar. */
  listTombstones(): Promise<Tombstone[]>;
  clearTombstones(keys: string[]): Promise<void>;
  getSyncMeta(): Promise<SyncMeta>;
  saveSyncMeta(meta: SyncMeta): Promise<SyncMeta>;
  /**
   * Escreve registos vindos do servidor **tal e qual**, sem carimbar
   * `updatedAt` — caso contrário o que acabou de chegar parecia uma alteração
   * local e voltaria a ser enviado, em ciclo.
   */
  applyRemote(data: {
    sessions?: SessionLog[];
    overrides?: OccurrenceOverride[];
    deletedSessionIds?: string[];
    deletedOverrideKeys?: string[];
    profile?: AthleteProfile;
    settings?: AppSettings;
  }): Promise<void>;
}

export function createRepository(database: TrainingDatabase = db): Repository {
  return {
    async init() {
      await migrateLegacyStorage(database);
      const settings = (await database.settings.get('app')) ?? defaultSettings();
      const profile = (await database.profile.get('athlete')) ?? defaultProfile();
      await database.settings.put(settings);
      await database.profile.put(profile);
      return { settings, profile };
    },

    async getSettings() {
      return (await database.settings.get('app')) ?? defaultSettings();
    },

    async saveSettings(settings) {
      const next = { ...settings, updatedAt: new Date().toISOString() };
      await database.settings.put(next);
      return next;
    },

    async getProfile() {
      return (await database.profile.get('athlete')) ?? defaultProfile();
    },

    async saveProfile(profile) {
      const next = { ...profile, updatedAt: new Date().toISOString() };
      await database.profile.put(next);
      return next;
    },

    async listSessions() {
      return database.sessions.toArray();
    },

    async getSession(id) {
      return database.sessions.get(id);
    },

    async getSessionByOccurrence(key) {
      return database.sessions.where('occurrenceKey').equals(key).first();
    },

    async saveSession(log) {
      const next = { ...log, updatedAt: new Date().toISOString() };
      await database.sessions.put(next);
      return next;
    },

    async deleteSession(id) {
      await database.transaction(
        'rw',
        database.sessions,
        database.timers,
        database.tombstones,
        async () => {
          await database.sessions.delete(id);
          await database.timers.where('sessionLogId').equals(id).delete();
          await database.tombstones.put({
            key: `session:${id}`,
            kind: 'session',
            id,
            deletedAt: new Date().toISOString(),
          });
        },
      );
    },

    async listOverrides() {
      return database.overrides.toArray();
    },

    async saveOverride(override) {
      await database.overrides.put(override);
    },

    async deleteOverride(key) {
      await database.transaction('rw', database.overrides, database.tombstones, async () => {
        await database.overrides.delete(key);
        await database.tombstones.put({
          key: `override:${key}`,
          kind: 'override',
          id: key,
          deletedAt: new Date().toISOString(),
        });
      });
    },

    async listTimers(sessionLogId) {
      return database.timers.where('sessionLogId').equals(sessionLogId).toArray();
    },

    async saveTimer(timer) {
      await database.timers.put(timer);
    },

    async deleteTimersForSession(sessionLogId) {
      await database.timers.where('sessionLogId').equals(sessionLogId).delete();
    },

    async replaceAll(data) {
      await database.transaction(
        'rw',
        database.sessions,
        database.overrides,
        database.settings,
        database.profile,
        database.timers,
        async () => {
          await Promise.all([
            database.sessions.clear(),
            database.overrides.clear(),
            database.timers.clear(),
          ]);
          await database.settings.put(data.settings);
          await database.profile.put(data.profile);
          if (data.sessions.length) await database.sessions.bulkPut(data.sessions);
          if (data.overrides.length) await database.overrides.bulkPut(data.overrides);
        },
      );
    },

    async clearAll() {
      await database.transaction(
        'rw',
        [
          database.sessions,
          database.overrides,
          database.settings,
          database.profile,
          database.timers,
          database.tombstones,
          database.syncMeta,
        ],
        async () => {
          await Promise.all([
            database.sessions.clear(),
            database.overrides.clear(),
            database.timers.clear(),
            database.settings.clear(),
            database.profile.clear(),
            database.tombstones.clear(),
            database.syncMeta.clear(),
          ]);
        },
      );
    },

    async listTombstones() {
      return database.tombstones.toArray();
    },

    async clearTombstones(keys) {
      if (keys.length === 0) return;
      await database.tombstones.bulkDelete(keys);
    },

    async getSyncMeta() {
      return (await database.syncMeta.get('sync')) ?? emptySyncMeta();
    },

    async saveSyncMeta(meta) {
      await database.syncMeta.put(meta);
      return meta;
    },

    async applyRemote(data) {
      await database.transaction(
        'rw',
        database.sessions,
        database.overrides,
        database.settings,
        database.profile,
        database.timers,
        async () => {
          if (data.sessions?.length) await database.sessions.bulkPut(data.sessions);
          if (data.overrides?.length) await database.overrides.bulkPut(data.overrides);
          if (data.deletedSessionIds?.length) {
            await database.sessions.bulkDelete(data.deletedSessionIds);
            for (const id of data.deletedSessionIds) {
              await database.timers.where('sessionLogId').equals(id).delete();
            }
          }
          if (data.deletedOverrideKeys?.length) {
            await database.overrides.bulkDelete(data.deletedOverrideKeys);
          }
          if (data.profile) await database.profile.put(data.profile);
          if (data.settings) await database.settings.put(data.settings);
        },
      );
    },
  };
}

/**
 * Métodos que representam uma alteração feita pelo atleta e que, por isso, têm
 * de ser sincronizadas. Fica de fora tudo o que é interno à sincronização
 * (`applyRemote`, marcas de leitura) e os temporizadores, que são estado de uma
 * sessão em curso neste dispositivo e não valem a pena na nuvem.
 */
const SYNCED_MUTATIONS = [
  'saveSettings',
  'saveProfile',
  'saveSession',
  'deleteSession',
  'saveOverride',
  'deleteOverride',
  'replaceAll',
] as const satisfies ReadonlyArray<keyof Repository>;

/** Avisa que houve uma alteração local, depois de ela ter sido gravada. */
export function withChangeNotifications(repo: Repository, notify: () => void): Repository {
  const mutations = new Set<string>(SYNCED_MUTATIONS);
  return new Proxy(repo, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function' || !mutations.has(String(property))) return value;
      return async (...args: unknown[]) => {
        const result: unknown = await (value as (...a: unknown[]) => unknown).apply(target, args);
        notify();
        return result;
      };
    },
  });
}

export const repository: Repository = withChangeNotifications(createRepository(), notifyLocalChange);

export type { DateKey };
