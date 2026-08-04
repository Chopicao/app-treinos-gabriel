import type {
  ExerciseLogEntry,
  ExerciseMetric,
  PlanBlock,
  PlanItem,
  PrescriptionValues,
  SessionLog,
  SessionOccurrence,
  SessionTemplate,
  SetLog,
  Side,
} from '@/domain/types';
import { requireExercise } from '@/data/exercises';
import { createId } from '@/lib/id';
import { formatPrescription, formatSetTarget } from '@/lib/format';

const SIDES: Side[] = ['left', 'right'];

export function entryId(blockId: string, itemId: string): string {
  return `${blockId}::${itemId}`;
}

/** Multiplies the prescription by the number of circuit rounds in the block. */
function applyRounds(values: PrescriptionValues, rounds: number): PrescriptionValues {
  if (rounds <= 1) return values;
  return {
    ...values,
    sets: values.sets * rounds,
    setsMax: values.setsMax ? values.setsMax * rounds : undefined,
  };
}

export function buildSets(
  values: PrescriptionValues,
  metric: ExerciseMetric,
  perSide: boolean,
): SetLog[] {
  const target = formatSetTarget(values, metric);
  const rows: SetLog[] = [];
  const total = Math.max(values.sets, 1);

  for (let index = 1; index <= total; index += 1) {
    if (perSide) {
      for (const side of SIDES) {
        rows.push(newSet(index, side, target, values, metric));
      }
    } else {
      rows.push(newSet(index, null, target, values, metric));
    }
  }
  return rows;
}

function newSet(
  index: number,
  side: Side | null,
  targetLabelPt: string,
  values: PrescriptionValues,
  metric: ExerciseMetric,
): SetLog {
  return {
    id: createId('set'),
    index,
    side,
    targetLabelPt,
    targetReps: metric === 'reps' ? values.reps : undefined,
    targetSeconds: metric === 'time' ? values.seconds : undefined,
    targetMeters: metric === 'distance' ? values.meters : undefined,
    reps: null,
    seconds: null,
    meters: null,
    loadKg: null,
    status: 'pending',
  };
}

function buildEntry(
  block: PlanBlock,
  item: PlanItem,
  values: PrescriptionValues,
): ExerciseLogEntry {
  const exercise = requireExercise(item.exerciseId);
  const effective = applyRounds(values, block.rounds ?? 1);
  return {
    id: entryId(block.id, item.id),
    blockId: block.id,
    blockNamePt: block.namePt,
    itemId: item.id,
    exerciseId: exercise.id,
    exerciseNamePt: exercise.namePt,
    metric: exercise.metric,
    perSide: item.perSide,
    loadTracked: item.loadTracked,
    prescription: effective,
    prescriptionLabelPt: formatPrescription(effective, {
      perSide: item.perSide,
      metric: exercise.metric,
    }),
    status: 'pending',
    sets: buildSets(effective, exercise.metric, item.perSide),
  };
}

/** Items not prescribed in the current phase are left out of the session entirely. */
export function itemsForPhase(
  template: SessionTemplate,
  phaseId: SessionOccurrence['phaseId'],
): Array<{ block: PlanBlock; item: PlanItem; values: PrescriptionValues }> {
  const out: Array<{ block: PlanBlock; item: PlanItem; values: PrescriptionValues }> = [];
  for (const block of template.blocks) {
    for (const item of block.items) {
      const values = item.byPhase[phaseId];
      if (!values || values.sets === 0) continue;
      out.push({ block, item, values });
    }
  }
  return out;
}

export function buildSessionLog(params: {
  occurrence: SessionOccurrence;
  template: SessionTemplate;
  planVersion: string;
  now?: Date;
}): SessionLog {
  const { occurrence, template, planVersion } = params;
  const now = (params.now ?? new Date()).toISOString();

  const entries = itemsForPhase(template, occurrence.phaseId).map(({ block, item, values }) =>
    buildEntry(block, item, values),
  );

  return {
    id: createId('sess'),
    occurrenceKey: occurrence.key,
    templateId: template.id,
    templateNamePt: template.namePt,
    kind: template.kind,
    planVersion,
    planWeek: occurrence.planWeek,
    phaseId: occurrence.phaseId,
    date: occurrence.date,
    status: 'planned',
    plannedMinutes: template.estimatedMinutes,
    activeSeconds: 0,
    cursorEntryId: entries[0]?.id ?? null,
    entries,
    createdAt: now,
    updatedAt: now,
  };
}

/** Adds one more set row (both sides for unilateral work), respecting `setsMax`. */
export function appendSet(entry: ExerciseLogEntry): ExerciseLogEntry {
  const max = entry.prescription.setsMax ?? entry.prescription.sets;
  const currentSets = entry.sets.length / (entry.perSide ? 2 : 1);
  if (currentSets >= max) return entry;

  const index = currentSets + 1;
  const target = formatSetTarget(entry.prescription, entry.metric);
  const added = entry.perSide
    ? SIDES.map((side) => newSet(index, side, target, entry.prescription, entry.metric))
    : [newSet(index, null, target, entry.prescription, entry.metric)];

  return { ...entry, sets: [...entry.sets, ...added] };
}

export function canAppendSet(entry: ExerciseLogEntry): boolean {
  const max = entry.prescription.setsMax ?? entry.prescription.sets;
  return entry.sets.length / (entry.perSide ? 2 : 1) < max;
}

export function deriveEntryStatus(entry: ExerciseLogEntry): ExerciseLogEntry['status'] {
  if (entry.status === 'skipped') return 'skipped';
  const done = entry.sets.filter((set) => set.status === 'done').length;
  const resolved = entry.sets.filter((set) => set.status !== 'pending').length;
  if (resolved === 0) return 'pending';
  if (resolved === entry.sets.length) return done > 0 ? 'done' : 'skipped';
  return 'in-progress';
}

export interface SessionProgress {
  totalSets: number;
  doneSets: number;
  totalEntries: number;
  doneEntries: number;
  /** Entries still pending that are not marked optional in the plan. */
  incompleteEntries: ExerciseLogEntry[];
  ratio: number;
}

export function sessionProgress(log: SessionLog): SessionProgress {
  const totalSets = log.entries.reduce((sum, entry) => sum + entry.sets.length, 0);
  const doneSets = log.entries.reduce(
    (sum, entry) => sum + entry.sets.filter((set) => set.status === 'done').length,
    0,
  );
  const doneEntries = log.entries.filter(
    (entry) => entry.status === 'done' || entry.status === 'skipped',
  ).length;
  const incompleteEntries = log.entries.filter(
    (entry) => entry.status !== 'done' && entry.status !== 'skipped',
  );
  return {
    totalSets,
    doneSets,
    totalEntries: log.entries.length,
    doneEntries,
    incompleteEntries,
    ratio: totalSets === 0 ? 0 : doneSets / totalSets,
  };
}

/** `completed` when everything is resolved, `partial` when something was left out. */
export function deriveSessionStatus(log: SessionLog): SessionLog['status'] {
  const progress = sessionProgress(log);
  if (progress.incompleteEntries.length > 0) return 'partial';
  const anyDone = log.entries.some((entry) => entry.status === 'done');
  return anyDone ? 'completed' : 'skipped';
}

/**
 * Rough duration estimate from the prescriptions, used to sanity-check the plan
 * against the durations it advertises. Work time is modelled as 3.5 s per rep,
 * the prescribed hold for time work and 1.2 s per metre for carries.
 */
export function estimateSessionSeconds(
  template: SessionTemplate,
  phaseId: string,
  options: { includeOptional?: boolean } = {},
): number {
  const { includeOptional = true } = options;
  let seconds = 0;
  for (const block of template.blocks) {
    const rounds = block.rounds ?? 1;
    for (const item of block.items) {
      if (!includeOptional && item.optional) continue;
      const values = item.byPhase[phaseId as keyof typeof item.byPhase];
      if (!values || values.sets === 0) continue;
      const exercise = requireExercise(item.exerciseId);
      const sides = item.perSide ? 2 : 1;
      const sets = values.sets * rounds * sides;

      let work = 0;
      if (exercise.metric === 'time' && values.seconds) work = values.seconds.min;
      else if (exercise.metric === 'reps' && values.reps) work = values.reps.min * 3.5;
      else if (exercise.metric === 'distance' && values.meters) work = values.meters.min * 1.2;

      const rest = values.restSeconds?.min ?? 10;
      seconds += sets * work + Math.max(0, sets - 1) * rest;
      seconds += 15; // transição entre exercícios
    }
    if (rounds > 1) {
      seconds += (rounds - 1) * (block.restBetweenRoundsSeconds?.min ?? 30);
    }
  }
  return Math.round(seconds);
}
