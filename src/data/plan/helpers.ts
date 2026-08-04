import type { PhaseId, PlanItem, PrescriptionValues } from '@/domain/types';

/** Same prescription in every phase (mobility work, warm-ups, cool-downs). */
export function samePhases(values: PrescriptionValues): Record<PhaseId, PrescriptionValues> {
  return { 'w1-2': values, 'w3-4': values, 'w5-6': values, 'w7+': values };
}

/**
 * Prescription that progresses across the six-week block.
 * After week 6 the plan holds the week 5–6 load and the app asks for a review
 * before barbell work, jumps and explosive training.
 */
export function progressivePhases(
  early: PrescriptionValues,
  mid: PrescriptionValues,
  late: PrescriptionValues,
): Record<PhaseId, PrescriptionValues> {
  return { 'w1-2': early, 'w3-4': mid, 'w5-6': late, 'w7+': late };
}

type ItemInput = Omit<PlanItem, 'perSide' | 'loadTracked'> &
  Partial<Pick<PlanItem, 'perSide' | 'loadTracked'>>;

export function item(input: ItemInput): PlanItem {
  return {
    perSide: false,
    loadTracked: false,
    ...input,
  };
}

/** A phase where the item is not prescribed at all. */
export const NOT_IN_PHASE: PrescriptionValues = { sets: 0 };
