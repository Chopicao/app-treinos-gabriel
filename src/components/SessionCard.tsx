import { Link } from 'react-router-dom';
import { ChevronRight, Clock, CalendarSync } from 'lucide-react';
import type { SessionOccurrence } from '@/domain/types';
import { getSessionTemplate } from '@/data/plan';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatMinutesRange } from '@/lib/format';
import { sessionHref } from '@/lib/routes';
import { cn } from '@/lib/cn';

export function SessionCard({
  occurrence,
  showDate,
}: {
  occurrence: SessionOccurrence;
  showDate?: string;
}) {
  const template = getSessionTemplate(occurrence.templateId);
  if (!template) return null;

  return (
    <li>
      <Link
        to={sessionHref(occurrence)}
        className={cn(
          'surface-raised border-app hover:surface-sunken flex items-center gap-3 rounded-2xl border p-4 transition-colors',
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base leading-tight font-semibold">{template.namePt}</h3>
            <StatusBadge status={occurrence.status} />
            {occurrence.rescheduled ? (
              <span className="text-muted inline-flex items-center gap-1 text-xs">
                <CalendarSync aria-hidden="true" className="size-3.5" />
                Remarcado
              </span>
            ) : null}
          </div>
          <p className="text-muted mt-1 line-clamp-2 text-sm">{template.summaryPt}</p>
          <p className="text-muted mt-2 flex items-center gap-3 text-xs">
            {(template.estimatedMinutes.max ?? template.estimatedMinutes.min) > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Clock aria-hidden="true" className="size-3.5" />
                {formatMinutesRange(template.estimatedMinutes)}
              </span>
            ) : null}
            <span>Semana {occurrence.planWeek}</span>
            {showDate ? <span>{showDate}</span> : null}
          </p>
        </div>
        <ChevronRight aria-hidden="true" className="text-muted size-5 shrink-0" />
      </Link>
    </li>
  );
}
