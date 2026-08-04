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
import { SCHEMA_VERSION, db, migrateLegacyStorage, type TrainingDatabase } from './db';

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
      await database.transaction('rw', database.sessions, database.timers, async () => {
        await database.sessions.delete(id);
        await database.timers.where('sessionLogId').equals(id).delete();
      });
    },

    async listOverrides() {
      return database.overrides.toArray();
    },

    async saveOverride(override) {
      await database.overrides.put(override);
    },

    async deleteOverride(key) {
      await database.overrides.delete(key);
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
            database.settings.clear(),
            database.profile.clear(),
          ]);
        },
      );
    },
  };
}

export const repository: Repository = createRepository();

export type { DateKey };
