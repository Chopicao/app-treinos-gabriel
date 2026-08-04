import { create } from 'zustand';
import type {
  AppSettings,
  AthleteProfile,
  ExportBundle,
  OccurrenceOverride,
  SessionLog,
  SessionOccurrence,
  SetLog,
  SkipReason,
} from '@/domain/types';
import { PLAN_VERSION, requireSessionTemplate } from '@/data/plan';
import { requireExercise } from '@/data/exercises';
import { repository, defaultProfile, defaultSettings } from '@/services/repository';
import {
  appendSet,
  buildSessionLog,
  buildSets,
  deriveEntryStatus,
  deriveSessionStatus,
} from '@/services/sessionBuilder';
import type { ScheduleContext } from '@/services/schedule';
import { formatPrescription } from '@/lib/format';
import { createId } from '@/lib/id';

export interface AppState {
  status: 'loading' | 'ready' | 'error';
  errorPt?: string;
  settings: AppSettings;
  profile: AthleteProfile;
  sessions: SessionLog[];
  overrides: OccurrenceOverride[];

  init(): Promise<void>;
  updateSettings(patch: Partial<AppSettings>): Promise<void>;
  updateProfile(patch: Partial<AthleteProfile>): Promise<void>;

  /** Creates the log for an occurrence the first time it is opened. */
  ensureSession(occurrence: SessionOccurrence): Promise<SessionLog>;
  patchSession(id: string, patch: Partial<SessionLog>, markEdited?: boolean): Promise<void>;
  deleteSession(id: string): Promise<void>;
  startSession(id: string): Promise<void>;
  setCursor(id: string, entryId: string | null): Promise<void>;
  updateSet(id: string, entryId: string, setId: string, patch: Partial<SetLog>): Promise<void>;
  addSetRow(id: string, entryId: string): Promise<void>;
  skipEntry(id: string, entryId: string, reason: SkipReason, notePt?: string): Promise<void>;
  unskipEntry(id: string, entryId: string): Promise<void>;
  substituteExercise(id: string, entryId: string, exerciseId: string): Promise<void>;
  finishSession(
    id: string,
    summary: { sessionRpe?: number | null; discomfort?: number | null; notesPt?: string },
  ): Promise<void>;
  reopenSession(id: string): Promise<void>;

  reschedule(occurrence: SessionOccurrence, newDate: string): Promise<void>;
  restoreSchedule(key: string): Promise<void>;

  importBundle(bundle: ExportBundle): Promise<void>;
  resetAllData(): Promise<void>;
}

function replaceSession(sessions: SessionLog[], next: SessionLog): SessionLog[] {
  const index = sessions.findIndex((session) => session.id === next.id);
  if (index === -1) return [...sessions, next];
  const copy = sessions.slice();
  copy[index] = next;
  return copy;
}

export const useAppStore = create<AppState>((set, get) => ({
  status: 'loading',
  settings: defaultSettings(),
  profile: defaultProfile(),
  sessions: [],
  overrides: [],

  async init() {
    try {
      const { settings, profile } = await repository.init();
      const [sessions, overrides] = await Promise.all([
        repository.listSessions(),
        repository.listOverrides(),
      ]);
      set({ status: 'ready', settings, profile, sessions, overrides });
    } catch (error) {
      set({
        status: 'error',
        errorPt:
          'Não foi possível abrir a base de dados local. Verifica se o navegador permite armazenamento neste site.',
      });
      console.error(error);
    }
  },

  async updateSettings(patch) {
    const next = await repository.saveSettings({ ...get().settings, ...patch });
    set({ settings: next });
  },

  async updateProfile(patch) {
    const next = await repository.saveProfile({ ...get().profile, ...patch });
    set({ profile: next });
  },

  async ensureSession(occurrence) {
    const existing = get().sessions.find((session) => session.occurrenceKey === occurrence.key);
    if (existing) return existing;

    const template = requireSessionTemplate(occurrence.templateId);
    const log = buildSessionLog({ occurrence, template, planVersion: PLAN_VERSION });
    const saved = await repository.saveSession(log);
    set({ sessions: [...get().sessions, saved] });
    return saved;
  },

  async patchSession(id, patch, markEdited = false) {
    const current = get().sessions.find((session) => session.id === id);
    if (!current) return;
    const next: SessionLog = {
      ...current,
      ...patch,
      ...(markEdited ? { editedAt: new Date().toISOString() } : {}),
    };
    const saved = await repository.saveSession(next);
    set({ sessions: replaceSession(get().sessions, saved) });
  },

  async deleteSession(id) {
    await repository.deleteSession(id);
    set({ sessions: get().sessions.filter((session) => session.id !== id) });
  },

  async startSession(id) {
    const current = get().sessions.find((session) => session.id === id);
    if (!current) return;
    if (current.status === 'in-progress') return;
    await get().patchSession(id, {
      status: 'in-progress',
      startedAt: current.startedAt ?? new Date().toISOString(),
      lastResumedAt: new Date().toISOString(),
    });
  },

  async setCursor(id, entryId) {
    await get().patchSession(id, { cursorEntryId: entryId });
  },

  async updateSet(id, entryId, setId, patch) {
    const current = get().sessions.find((session) => session.id === id);
    if (!current) return;

    const entries = current.entries.map((entry) => {
      if (entry.id !== entryId) return entry;
      const sets = entry.sets.map((row) =>
        row.id === setId
          ? {
              ...row,
              ...patch,
              completedAt:
                patch.status === 'done'
                  ? (patch.completedAt ?? new Date().toISOString())
                  : patch.status === 'pending'
                    ? undefined
                    : row.completedAt,
            }
          : row,
      );
      const updated = { ...entry, sets };
      return { ...updated, status: deriveEntryStatus(updated) };
    });

    const next: SessionLog = {
      ...current,
      entries,
      status: current.status === 'planned' ? 'in-progress' : current.status,
      startedAt: current.startedAt ?? new Date().toISOString(),
    };
    const saved = await repository.saveSession(next);
    set({ sessions: replaceSession(get().sessions, saved) });
  },

  async addSetRow(id, entryId) {
    const current = get().sessions.find((session) => session.id === id);
    if (!current) return;
    const entries = current.entries.map((entry) =>
      entry.id === entryId ? appendSet(entry) : entry,
    );
    const saved = await repository.saveSession({ ...current, entries });
    set({ sessions: replaceSession(get().sessions, saved) });
  },

  async skipEntry(id, entryId, reason, notePt) {
    const current = get().sessions.find((session) => session.id === id);
    if (!current) return;
    const entries = current.entries.map((entry) =>
      entry.id === entryId
        ? {
            ...entry,
            status: 'skipped' as const,
            skipReason: reason,
            skipNotePt: notePt,
            sets: entry.sets.map((row) =>
              row.status === 'pending' ? { ...row, status: 'skipped' as const } : row,
            ),
          }
        : entry,
    );
    const saved = await repository.saveSession({ ...current, entries });
    set({ sessions: replaceSession(get().sessions, saved) });
  },

  async unskipEntry(id, entryId) {
    const current = get().sessions.find((session) => session.id === id);
    if (!current) return;
    const entries = current.entries.map((entry) => {
      if (entry.id !== entryId) return entry;
      const sets = entry.sets.map((row) =>
        row.status === 'skipped' ? { ...row, status: 'pending' as const } : row,
      );
      const updated = { ...entry, sets, skipReason: undefined, skipNotePt: undefined };
      return { ...updated, status: deriveEntryStatus({ ...updated, status: 'pending' }) };
    });
    const saved = await repository.saveSession({ ...current, entries });
    set({ sessions: replaceSession(get().sessions, saved) });
  },

  async substituteExercise(id, entryId, exerciseId) {
    const current = get().sessions.find((session) => session.id === id);
    if (!current) return;
    const exercise = requireExercise(exerciseId);

    const entries = current.entries.map((entry) => {
      if (entry.id !== entryId) return entry;
      // A prescrição não muda: só muda o exercício que a cumpre.
      const sets = buildSets(entry.prescription, exercise.metric, entry.perSide);
      return {
        ...entry,
        substitutedFromExerciseId: entry.substitutedFromExerciseId ?? entry.exerciseId,
        exerciseId: exercise.id,
        exerciseNamePt: exercise.namePt,
        metric: exercise.metric,
        prescriptionLabelPt: formatPrescription(entry.prescription, {
          perSide: entry.perSide,
          metric: exercise.metric,
        }),
        status: 'pending' as const,
        sets,
      };
    });
    const saved = await repository.saveSession({ ...current, entries });
    set({ sessions: replaceSession(get().sessions, saved) });
  },

  async finishSession(id, summary) {
    const current = get().sessions.find((session) => session.id === id);
    if (!current) return;
    const completedAt = new Date().toISOString();
    const startedAt = current.startedAt ? new Date(current.startedAt).getTime() : null;
    const activeSeconds = startedAt
      ? Math.max(0, Math.round((new Date(completedAt).getTime() - startedAt) / 1000))
      : current.activeSeconds;

    const next: SessionLog = {
      ...current,
      ...summary,
      status: deriveSessionStatus(current),
      completedAt,
      activeSeconds,
      cursorEntryId: null,
      ...(current.completedAt ? { editedAt: completedAt } : {}),
    };
    const saved = await repository.saveSession(next);
    await repository.deleteTimersForSession(id);
    set({ sessions: replaceSession(get().sessions, saved) });
  },

  async reopenSession(id) {
    await get().patchSession(id, { status: 'in-progress', completedAt: undefined }, true);
  },

  async reschedule(occurrence, newDate) {
    const override: OccurrenceOverride = {
      key: occurrence.key,
      originalDate: occurrence.originalDate,
      newDate,
      createdAt: new Date().toISOString(),
    };
    await repository.saveOverride(override);
    const overrides = [...get().overrides.filter((item) => item.key !== override.key), override];

    // O registo acompanha a data efetiva da ocorrência.
    const log = get().sessions.find((session) => session.occurrenceKey === occurrence.key);
    if (log) {
      const saved = await repository.saveSession({ ...log, date: newDate });
      set({ overrides, sessions: replaceSession(get().sessions, saved) });
      return;
    }
    set({ overrides });
  },

  async restoreSchedule(key) {
    await repository.deleteOverride(key);
    const overrides = get().overrides.filter((item) => item.key !== key);
    const log = get().sessions.find((session) => session.occurrenceKey === key);
    if (log) {
      const originalDate = key.slice(key.lastIndexOf('@') + 1);
      const saved = await repository.saveSession({ ...log, date: originalDate });
      set({ overrides, sessions: replaceSession(get().sessions, saved) });
      return;
    }
    set({ overrides });
  },

  async importBundle(bundle) {
    // Importado a pedido para o Zod não entrar no primeiro pacote da aplicação.
    const { applyImport } = await import('@/services/exportImport');
    await applyImport(repository, bundle);
    const [settings, profile, sessions, overrides] = await Promise.all([
      repository.getSettings(),
      repository.getProfile(),
      repository.listSessions(),
      repository.listOverrides(),
    ]);
    set({ settings, profile, sessions, overrides });
  },

  async resetAllData() {
    await repository.clearAll();
    const settings = await repository.saveSettings({ ...defaultSettings(), id: 'app' });
    const profile = await repository.saveProfile(defaultProfile());
    set({ settings, profile, sessions: [], overrides: [] });
  },
}));

/** Everything the schedule engine needs, derived from the store. */
export function selectScheduleContext(state: AppState): ScheduleContext {
  return {
    planStartDate: state.settings.planStartDate,
    overrides: state.overrides,
    logs: state.sessions,
  };
}

export function selectSessionByOccurrence(state: AppState, key: string): SessionLog | undefined {
  return state.sessions.find((session) => session.occurrenceKey === key);
}

export function selectSessionById(state: AppState, id: string): SessionLog | undefined {
  return state.sessions.find((session) => session.id === id);
}

/** Used by the demo-data action in Definições. */
export function makeDemoSessionId(): string {
  return createId('demo');
}
