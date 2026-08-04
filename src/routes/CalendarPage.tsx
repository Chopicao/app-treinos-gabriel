import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useOccurrences } from '@/hooks/useSchedule';
import { SessionCard } from '@/components/SessionCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageHeader } from '@/components/ui/Misc';
import { StatusBadge, StatusLegend } from '@/components/ui/StatusBadge';
import {
  addDays,
  addMonths,
  eachDay,
  endOfMonth,
  endOfWeek,
  formatDayNumber,
  formatFullPt,
  formatMonthYearPt,
  formatWeekdayShortPt,
  monthGrid,
  startOfMonth,
  startOfWeek,
  todayKey,
  WEEKDAY_HEADERS_FULL_PT,
} from '@/lib/dates';
import { cn } from '@/lib/cn';

type View = 'week' | 'month';

export function CalendarPage() {
  const today = todayKey();
  const [view, setView] = useState<View>('week');
  const [anchor, setAnchor] = useState(today);
  const [selected, setSelected] = useState(today);

  const rangeStart = view === 'week' ? startOfWeek(anchor) : startOfWeek(startOfMonth(anchor));
  const rangeEnd = view === 'week' ? endOfWeek(anchor) : endOfWeek(endOfMonth(anchor));

  const occurrences = useOccurrences(rangeStart, rangeEnd);
  const selectedOccurrences = useOccurrences(selected, selected);

  const byDate = useMemo(() => {
    const map = new Map<string, typeof occurrences>();
    for (const occurrence of occurrences) {
      const list = map.get(occurrence.date) ?? [];
      list.push(occurrence);
      map.set(occurrence.date, list);
    }
    return map;
  }, [occurrences]);

  function shift(direction: 1 | -1) {
    setAnchor(view === 'week' ? addDays(anchor, direction * 7) : addMonths(anchor, direction));
  }

  function goToday() {
    setAnchor(today);
    setSelected(today);
  }

  const weekDays = eachDay(startOfWeek(anchor), endOfWeek(anchor));
  const gridDays = monthGrid(anchor);
  const monthKey = anchor.slice(0, 7);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calendário"
        subtitle={
          view === 'week'
            ? `Semana de ${formatFullPt(startOfWeek(anchor))}`
            : formatMonthYearPt(anchor)
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          className="surface-raised border-app inline-flex rounded-xl border p-1"
          role="tablist"
          aria-label="Vista do calendário"
        >
          {(['week', 'month'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={view === value}
              onClick={() => setView(value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium',
                view === value ? 'bg-accent text-on-accent' : 'text-muted',
              )}
            >
              {value === 'week' ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button size="sm" onClick={() => shift(-1)} aria-label="Período anterior">
            <ChevronLeft aria-hidden="true" className="size-4" />
          </Button>
          <Button size="sm" onClick={goToday}>
            Hoje
          </Button>
          <Button size="sm" onClick={() => shift(1)} aria-label="Período seguinte">
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>

      {view === 'week' ? (
        <ul className="grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => {
            const items = byDate.get(day) ?? [];
            const isSelected = day === selected;
            return (
              <li key={day}>
                <button
                  type="button"
                  onClick={() => setSelected(day)}
                  aria-current={day === today ? 'date' : undefined}
                  aria-label={`${WEEKDAY_HEADERS_FULL_PT[index]}, ${formatFullPt(day)}, ${items.length} sessões`}
                  className={cn(
                    'border-app flex w-full flex-col items-center gap-1 rounded-xl border p-2',
                    isSelected ? 'border-accent bg-accent/10' : 'surface-raised',
                  )}
                >
                  <span className="text-muted text-[11px] uppercase">
                    {formatWeekdayShortPt(day)}
                  </span>
                  <span
                    className={cn(
                      'tabular text-sm font-semibold',
                      day === today && 'text-accent underline',
                    )}
                  >
                    {formatDayNumber(day)}
                  </span>
                  <span className="flex min-h-4 flex-wrap justify-center gap-0.5">
                    {items.map((occurrence) => (
                      <StatusBadge
                        key={occurrence.key}
                        status={occurrence.status}
                        compact
                        className="px-1 py-0"
                      />
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div>
          <div className="text-muted mb-1 grid grid-cols-7 gap-1 text-center text-[11px]">
            {WEEKDAY_HEADERS_FULL_PT.map((label) => (
              <abbr key={label} title={label} className="no-underline">
                {label.slice(0, 3)}
              </abbr>
            ))}
          </div>
          <ul className="grid grid-cols-7 gap-1">
            {gridDays.map((day) => {
              const items = byDate.get(day) ?? [];
              const outside = !day.startsWith(monthKey);
              return (
                <li key={day}>
                  <button
                    type="button"
                    onClick={() => setSelected(day)}
                    aria-label={`${formatFullPt(day)}, ${items.length} sessões`}
                    className={cn(
                      'border-app flex aspect-square w-full flex-col items-center justify-start gap-0.5 rounded-lg border p-1',
                      day === selected ? 'border-accent bg-accent/10' : 'surface-raised',
                      outside && 'opacity-40',
                    )}
                  >
                    <span
                      className={cn('tabular text-xs', day === today && 'text-accent font-bold')}
                    >
                      {formatDayNumber(day)}
                    </span>
                    <span className="flex flex-wrap justify-center gap-px">
                      {items.slice(0, 3).map((occurrence) => (
                        <span
                          key={occurrence.key}
                          aria-hidden="true"
                          className={cn(
                            'size-1.5 rounded-full',
                            occurrence.status === 'completed'
                              ? 'bg-brand-500'
                              : occurrence.status === 'in-progress' ||
                                  occurrence.status === 'partial'
                                ? 'bg-warn-400'
                                : 'bg-ink-400',
                          )}
                        />
                      ))}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <section aria-live="polite" aria-labelledby="dia-selecionado">
        <h2 id="dia-selecionado" className="mb-3 text-lg">
          {formatFullPt(selected)}
        </h2>
        {selectedOccurrences.length === 0 ? (
          <EmptyState
            title="Sem sessões neste dia"
            description="Escolhe outro dia no calendário ou remarca uma sessão a partir do respetivo detalhe."
          />
        ) : (
          <ul className="space-y-3">
            {selectedOccurrences.map((occurrence) => (
              <SessionCard key={occurrence.key} occurrence={occurrence} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="legenda" className="pt-2">
        <h2 id="legenda" className="text-muted mb-2 text-xs font-medium tracking-wide uppercase">
          Legenda dos estados
        </h2>
        <StatusLegend />
      </section>
    </div>
  );
}
