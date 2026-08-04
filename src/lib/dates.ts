import { formatInTimeZone } from 'date-fns-tz';
import { pt } from 'date-fns/locale';

/**
 * Calendar helpers.
 *
 * A "date key" is a plain `yyyy-MM-dd` calendar day. Keys are manipulated through
 * UTC-anchored Date objects so arithmetic never shifts a day across a DST boundary.
 * Only "what day is it right now" consults the athlete's timezone.
 */
export const TIME_ZONE = 'Europe/Lisbon';

export type DateKey = string;

const KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): boolean {
  return KEY_PATTERN.test(value);
}

/** Today, as seen in Europe/Lisbon. */
export function todayKey(now: Date = new Date()): DateKey {
  return formatInTimeZone(now, TIME_ZONE, 'yyyy-MM-dd');
}

/** UTC-anchored Date for a calendar day. Never use it for wall-clock arithmetic. */
export function keyToUtcDate(key: DateKey): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function utcDateToKey(date: Date): DateKey {
  return date.toISOString().slice(0, 10);
}

export function addDays(key: DateKey, days: number): DateKey {
  const date = keyToUtcDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return utcDateToKey(date);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(key: DateKey): number {
  const day = keyToUtcDate(key).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Monday of the week that contains `key`. */
export function startOfWeek(key: DateKey): DateKey {
  return addDays(key, -(isoWeekday(key) - 1));
}

export function endOfWeek(key: DateKey): DateKey {
  return addDays(startOfWeek(key), 6);
}

export function startOfMonth(key: DateKey): DateKey {
  return `${key.slice(0, 7)}-01`;
}

export function endOfMonth(key: DateKey): DateKey {
  const date = keyToUtcDate(startOfMonth(key));
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return utcDateToKey(date);
}

export function addMonths(key: DateKey, months: number): DateKey {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  return utcDateToKey(date);
}

export function daysBetween(from: DateKey, to: DateKey): number {
  const ms = keyToUtcDate(to).getTime() - keyToUtcDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function eachDay(from: DateKey, to: DateKey): DateKey[] {
  const out: DateKey[] = [];
  const total = daysBetween(from, to);
  for (let i = 0; i <= total; i += 1) out.push(addDays(from, i));
  return out;
}

/** The 6 × 7 grid of a month view, always starting on a Monday. */
export function monthGrid(key: DateKey): DateKey[] {
  const first = startOfWeek(startOfMonth(key));
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}

function formatKey(key: DateKey, pattern: string): string {
  return formatInTimeZone(keyToUtcDate(key), 'UTC', pattern, { locale: pt });
}

/** "segunda-feira, 4 de agosto de 2026" */
export function formatFullPt(key: DateKey): string {
  return formatKey(key, "EEEE, d 'de' MMMM 'de' yyyy");
}

/** "seg, 4 ago" */
export function formatShortPt(key: DateKey): string {
  return formatKey(key, 'EEE, d MMM');
}

/** "4 de agosto" */
export function formatDayMonthPt(key: DateKey): string {
  return formatKey(key, "d 'de' MMMM");
}

/** "agosto de 2026" */
export function formatMonthYearPt(key: DateKey): string {
  return formatKey(key, "MMMM 'de' yyyy");
}

export function formatWeekdayShortPt(key: DateKey): string {
  return formatKey(key, 'EEEEEE');
}

export function formatDayNumber(key: DateKey): string {
  return formatKey(key, 'd');
}

/** "14:35" in the athlete's timezone, from an ISO timestamp. */
export function formatClock(isoTimestamp: string): string {
  return formatInTimeZone(new Date(isoTimestamp), TIME_ZONE, 'HH:mm', { locale: pt });
}

export function formatDateTimePt(isoTimestamp: string): string {
  return formatInTimeZone(new Date(isoTimestamp), TIME_ZONE, "d MMM yyyy 'às' HH:mm", {
    locale: pt,
  });
}

export const WEEKDAY_HEADERS_PT = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
export const WEEKDAY_HEADERS_FULL_PT = [
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
  'domingo',
];
