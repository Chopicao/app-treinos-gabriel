import { create } from 'zustand';
import type { PersistedTimer, TimerSnapshot } from '@/domain/types';
import { repository } from '@/services/repository';
import { createTimer } from '@/lib/timer';

export function setTimerId(sessionLogId: string, setId: string): string {
  return `${sessionLogId}::set::${setId}`;
}

export function restTimerId(sessionLogId: string, entryId: string): string {
  return `${sessionLogId}::rest::${entryId}`;
}

interface TimerStore {
  loadedSessionId: string | null;
  timers: Record<string, TimerSnapshot>;
  load(sessionLogId: string): Promise<void>;
  read(id: string, targetDurationMs: number): TimerSnapshot;
  write(sessionLogId: string, id: string, snapshot: TimerSnapshot): void;
  clearSession(sessionLogId: string): Promise<void>;
}

/**
 * Timer snapshots live outside the session log so a running countdown can be
 * persisted on every transition without rewriting the whole session record.
 */
export const useTimerStore = create<TimerStore>((set, get) => ({
  loadedSessionId: null,
  timers: {},

  async load(sessionLogId) {
    if (get().loadedSessionId === sessionLogId) return;
    const rows = await repository.listTimers(sessionLogId);
    const timers: Record<string, TimerSnapshot> = {};
    for (const row of rows) {
      timers[row.id] = {
        status: row.status,
        targetDurationMs: row.targetDurationMs,
        startedAt: row.startedAt,
        accumulatedMs: row.accumulatedMs,
        completedAt: row.completedAt,
      };
    }
    set({ loadedSessionId: sessionLogId, timers });
  },

  read(id, targetDurationMs) {
    return get().timers[id] ?? createTimer(targetDurationMs);
  },

  write(sessionLogId, id, snapshot) {
    set({ timers: { ...get().timers, [id]: snapshot } });
    const record: PersistedTimer = {
      ...snapshot,
      id,
      sessionLogId,
      updatedAt: new Date().toISOString(),
    };
    void repository.saveTimer(record);
  },

  async clearSession(sessionLogId) {
    await repository.deleteTimersForSession(sessionLogId);
    const timers = { ...get().timers };
    for (const key of Object.keys(timers)) {
      if (key.startsWith(`${sessionLogId}::`)) delete timers[key];
    }
    set({ timers });
  },
}));
