import type { NumericRange, PrescriptionValues } from '@/domain/types';

/** "8", "8–12", "20–30" */
export function formatRange(range: NumericRange | undefined, unit = ''): string {
  if (!range) return '';
  const suffix = unit ? ` ${unit}` : '';
  if (range.max !== undefined && range.max !== range.min) {
    return `${range.min}–${range.max}${suffix}`;
  }
  return `${range.min}${suffix}`;
}

/** "2" or "2–3" when the plan writes a range of sets. */
export function formatSets(values: PrescriptionValues): string {
  if (values.setsMax && values.setsMax !== values.sets) {
    return `${values.sets}–${values.setsMax}`;
  }
  return String(values.sets);
}

/** Seconds as "30 s", "1 min 30 s", "5 min". */
export function formatSeconds(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} s`;
}

/**
 * Descansos e isometrias leem-se melhor em segundos até aos 3 minutos
 * ("90–120 s" e não "1 min 30 s–2 min"). Acima disso, minutos.
 */
function formatSecondsRange(range: NumericRange): string {
  if (range.max !== undefined && range.max !== range.min) {
    if (range.max <= 180) return `${range.min}–${range.max} s`;
    return `${formatSeconds(range.min)}–${formatSeconds(range.max)}`;
  }
  return formatSeconds(range.min);
}

/** Countdown display: "01:30", "10:00". */
export function formatCountdown(milliseconds: number): string {
  const safe = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** "1 h 12 min", "45 min", "—" */
export function formatDurationMinutes(totalSeconds: number | undefined): string {
  if (totalSeconds === undefined || totalSeconds <= 0) return '—';
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatMinutesRange(range: NumericRange): string {
  if (range.max !== undefined && range.max !== range.min) {
    return `${range.min}–${range.max} min`;
  }
  return `${range.min} min`;
}

/**
 * The one-line prescription shown on cards and snapshotted into the log.
 * Examples: "2 × 10 · descanso 90–120 s", "3 × 30 s por lado", "3 × 20–25 m por lado".
 */
export function formatPrescription(
  values: PrescriptionValues,
  options: { perSide: boolean; metric: 'reps' | 'time' | 'distance' | 'informational' },
): string {
  if (options.metric === 'informational') return 'Entrada informativa';

  const parts: string[] = [];
  const sets = formatSets(values);

  if (options.metric === 'reps' && values.reps) {
    parts.push(`${sets} × ${formatRange(values.reps)}`);
  } else if (options.metric === 'time' && values.seconds) {
    parts.push(`${sets} × ${formatSecondsRange(values.seconds)}`);
  } else if (options.metric === 'distance' && values.meters) {
    parts.push(`${sets} × ${formatRange(values.meters, 'm')}`);
  } else {
    parts.push(`${sets} série${values.sets === 1 ? '' : 's'}`);
  }

  if (options.perSide) parts[0] += ' por lado';
  if (values.tempo) parts.push(`tempo ${values.tempo.replaceAll('-', '–')}`);
  if (values.restSeconds) parts.push(`descanso ${formatSecondsRange(values.restSeconds)}`);

  return parts.join(' · ');
}

/** Target label for a single set row, e.g. "10 reps", "30 s", "20–25 m". */
export function formatSetTarget(
  values: PrescriptionValues,
  metric: 'reps' | 'time' | 'distance' | 'informational',
): string {
  if (metric === 'reps' && values.reps) return `${formatRange(values.reps)} reps`;
  if (metric === 'time' && values.seconds) return formatSecondsRange(values.seconds);
  if (metric === 'distance' && values.meters) return formatRange(values.meters, 'm');
  return '—';
}

export function formatLoad(loadKg: number | null | undefined): string {
  if (loadKg === null || loadKg === undefined) return '—';
  return `${Number.isInteger(loadKg) ? loadKg : loadKg.toFixed(1)} kg`;
}

export function formatRpe(range: NumericRange | undefined): string {
  if (!range) return '';
  return `RPE ${formatRange(range)}/10`;
}

export function formatReserve(range: NumericRange | undefined): string {
  if (!range) return '';
  const value = formatRange(range);
  return `${value} ${range.max && range.max !== range.min ? 'repetições' : 'repetição'} em reserva`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}
