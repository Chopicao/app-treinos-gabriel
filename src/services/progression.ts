import type { ExerciseLogEntry, SessionLog, SetLog } from '@/domain/types';
import { PROGRESSION_RULE_PT } from '@/data/safety';

/** A set counts as "on target" when the logged value reached the lower bound. */
function metOnTarget(set: SetLog): boolean {
  if (set.status !== 'done') return false;
  if (set.targetReps) return (set.reps ?? 0) >= set.targetReps.min;
  if (set.targetSeconds) return (set.seconds ?? 0) >= set.targetSeconds.min;
  if (set.targetMeters) return (set.meters ?? 0) >= set.targetMeters.min;
  return true;
}

export interface ExercisePerformance {
  sessionId: string;
  date: string;
  planWeek: number;
  entry: ExerciseLogEntry;
  /** Every prescribed set completed on target, without pain being reported. */
  clean: boolean;
  maxLoadKg: number | null;
}

function isClean(entry: ExerciseLogEntry, log: SessionLog): boolean {
  if (entry.status !== 'done') return false;
  if (entry.skipReason === 'pain') return false;
  if ((log.discomfort ?? 0) > 2) return false;
  return entry.sets.every(metOnTarget);
}

function maxLoad(entry: ExerciseLogEntry): number | null {
  const loads = entry.sets
    .map((set) => set.loadKg)
    .filter((load): load is number => typeof load === 'number');
  return loads.length ? Math.max(...loads) : null;
}

/** Every logged performance of one exercise, newest first. */
export function performanceHistory(
  logs: readonly SessionLog[],
  exerciseId: string,
): ExercisePerformance[] {
  const out: ExercisePerformance[] = [];
  for (const log of logs) {
    for (const entry of log.entries) {
      if (entry.exerciseId !== exerciseId) continue;
      if (entry.status === 'pending') continue;
      out.push({
        sessionId: log.id,
        date: log.date,
        planWeek: log.planWeek,
        entry,
        clean: isClean(entry, log),
        maxLoadKg: maxLoad(entry),
      });
    }
  }
  return out.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
}

export interface ProgressionSuggestion {
  suggest: boolean;
  headlinePt: string;
  detailPt: string;
}

/**
 * Informative only. The plan's rule: consider the next small increase after two
 * consecutive sessions with every repetition completed, good technique and no pain.
 */
export function progressionSuggestion(
  history: readonly ExercisePerformance[],
): ProgressionSuggestion {
  const [latest, previous] = history;

  if (!latest || !previous) {
    return {
      suggest: false,
      headlinePt: 'Ainda sem histórico suficiente',
      detailPt:
        'A sugestão de progressão aparece depois de duas sessões registadas deste exercício.',
    };
  }

  if (latest.clean && previous.clean) {
    return {
      suggest: true,
      headlinePt: 'Podes considerar um pequeno aumento',
      detailPt: PROGRESSION_RULE_PT,
    };
  }

  return {
    suggest: false,
    headlinePt: 'Mantém a carga atual',
    detailPt:
      'Ainda não houve duas sessões consecutivas com todas as repetições completas, boa técnica e sem dor.',
  };
}

/** Comparison against the two previous executions. Sem recordes máximos. */
export interface ExerciseComparison {
  current: ExercisePerformance;
  previous: ExercisePerformance[];
}

export function compareWithPrevious(
  history: readonly ExercisePerformance[],
  sessionId: string,
): ExerciseComparison | null {
  const index = history.findIndex((performance) => performance.sessionId === sessionId);
  if (index === -1) return null;
  return {
    current: history[index],
    previous: history.slice(index + 1, index + 3),
  };
}
