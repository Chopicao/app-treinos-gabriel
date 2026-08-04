import type { SessionOccurrence } from '@/domain/types';

export function sessionHref(occurrence: Pick<SessionOccurrence, 'key'>): string {
  return `/sessao/${encodeURIComponent(occurrence.key)}`;
}

export function runnerHref(occurrence: Pick<SessionOccurrence, 'key'>): string {
  return `${sessionHref(occurrence)}/treinar`;
}
