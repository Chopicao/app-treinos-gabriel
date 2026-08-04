import type {
  OccurrenceOverride,
  PhaseId,
  SessionLog,
  SessionOccurrence,
  SessionStatus,
} from '@/domain/types';
import { TRAINING_PLAN, templateIdsForWeekday } from '@/data/plan';
import { addDays, daysBetween, isoWeekday, startOfWeek, type DateKey } from '@/lib/dates';

export function occurrenceKey(templateId: string, originalDate: DateKey): string {
  return `${templateId}@${originalDate}`;
}

export function parseOccurrenceKey(key: string): { templateId: string; originalDate: DateKey } {
  const at = key.lastIndexOf('@');
  return { templateId: key.slice(0, at), originalDate: key.slice(at + 1) };
}

/**
 * 1-based plan week. Week 1 is the week of `planStartDate` (a Monday).
 * Returns 0 or less for days before the plan starts.
 */
export function planWeekFor(dateKey: DateKey, planStartDate: DateKey): number {
  const firstMonday = startOfWeek(planStartDate);
  return Math.floor(daysBetween(firstMonday, dateKey) / 7) + 1;
}

export function phaseForWeek(week: number): PhaseId {
  if (week <= 2) return 'w1-2';
  if (week <= 4) return 'w3-4';
  if (week <= 6) return 'w5-6';
  return 'w7+';
}

export function phaseForDate(dateKey: DateKey, planStartDate: DateKey): PhaseId {
  return phaseForWeek(planWeekFor(dateKey, planStartDate));
}

export interface ScheduleContext {
  planStartDate: DateKey;
  overrides: readonly OccurrenceOverride[];
  logs: readonly SessionLog[];
}

interface ResolvedContext {
  planStartDate: DateKey;
  overrideByKey: Map<string, OccurrenceOverride>;
  logByKey: Map<string, SessionLog>;
}

function resolve(context: ScheduleContext): ResolvedContext {
  return {
    planStartDate: context.planStartDate,
    overrideByKey: new Map(context.overrides.map((o) => [o.key, o])),
    logByKey: new Map(context.logs.map((log) => [log.occurrenceKey, log])),
  };
}

/** Order inside a day follows the week template (warm-up before match, football before mobility). */
function orderInDay(templateId: string, weekday: number): number {
  const index = templateIdsForWeekday(weekday).indexOf(templateId);
  return index === -1 ? 99 : index;
}

function buildOccurrence(
  templateId: string,
  originalDate: DateKey,
  ctx: ResolvedContext,
): SessionOccurrence {
  const key = occurrenceKey(templateId, originalDate);
  const override = ctx.overrideByKey.get(key);
  const log = ctx.logByKey.get(key);
  const date = override?.newDate ?? originalDate;
  const status: SessionStatus = log?.status ?? 'planned';
  const week = planWeekFor(date, ctx.planStartDate);
  return {
    key,
    templateId,
    originalDate,
    date,
    planWeek: week,
    phaseId: phaseForWeek(week),
    rescheduled: Boolean(override),
    status,
    logId: log?.id,
  };
}

/** Natural occurrences the week template puts on a given day. */
function naturalOccurrencesOn(dateKey: DateKey, ctx: ResolvedContext): SessionOccurrence[] {
  if (daysBetween(ctx.planStartDate, dateKey) < 0) return [];
  return templateIdsForWeekday(isoWeekday(dateKey)).map((templateId) =>
    buildOccurrence(templateId, dateKey, ctx),
  );
}

/**
 * All occurrences whose effective date falls inside `[from, to]`.
 * Rescheduling moves a single occurrence; it never shifts the generated weeks.
 */
export function occurrencesInRange(
  from: DateKey,
  to: DateKey,
  context: ScheduleContext,
): SessionOccurrence[] {
  const ctx = resolve(context);
  const result: SessionOccurrence[] = [];

  const total = daysBetween(from, to);
  for (let i = 0; i <= total; i += 1) {
    const day = addDays(from, i);
    for (const occurrence of naturalOccurrencesOn(day, ctx)) {
      if (occurrence.date >= from && occurrence.date <= to) result.push(occurrence);
    }
  }

  // Occurrences moved *into* the range from outside it.
  for (const override of context.overrides) {
    if (override.newDate < from || override.newDate > to) continue;
    if (override.originalDate >= from && override.originalDate <= to) continue;
    const { templateId, originalDate } = parseOccurrenceKey(override.key);
    if (daysBetween(ctx.planStartDate, originalDate) < 0) continue;
    if (!templateIdsForWeekday(isoWeekday(originalDate)).includes(templateId)) continue;
    result.push(buildOccurrence(templateId, originalDate, ctx));
  }

  return result.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return (
      orderInDay(a.templateId, isoWeekday(a.originalDate)) -
      orderInDay(b.templateId, isoWeekday(b.originalDate))
    );
  });
}

export function occurrencesOn(dateKey: DateKey, context: ScheduleContext): SessionOccurrence[] {
  return occurrencesInRange(dateKey, dateKey, context);
}

export function findOccurrence(
  key: string,
  context: ScheduleContext,
): SessionOccurrence | undefined {
  const { templateId, originalDate } = parseOccurrenceKey(key);
  if (!templateIdsForWeekday(isoWeekday(originalDate)).includes(templateId)) return undefined;
  if (daysBetween(context.planStartDate, originalDate) < 0) return undefined;
  return buildOccurrence(templateId, originalDate, resolve(context));
}

export const STATUS_LABELS_PT: Record<SessionStatus, string> = {
  planned: 'Planeado',
  'in-progress': 'Em curso',
  completed: 'Concluído',
  partial: 'Parcial',
  skipped: 'Ignorado',
};

/** Total number of weeks the plan describes before asking for a review. */
export const PLAN_TOTAL_WEEKS = TRAINING_PLAN.totalWeeks;
