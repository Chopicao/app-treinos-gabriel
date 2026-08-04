import { CalendarClock, CheckCircle2, CircleDashed, CircleSlash, PlayCircle } from 'lucide-react';
import type { SessionStatus } from '@/domain/types';
import { STATUS_LABELS_PT } from '@/services/schedule';
import { cn } from '@/lib/cn';

/**
 * Estado com cor **e** ícone **e** texto. A cor nunca é o único sinal.
 */
const STYLES: Record<SessionStatus, { className: string; Icon: typeof CheckCircle2 }> = {
  planned: {
    className: 'border-app text-muted',
    Icon: CalendarClock,
  },
  'in-progress': {
    className: 'border-warn-600/50 text-warn-600 dark:text-warn-400 dark:border-warn-400/50',
    Icon: PlayCircle,
  },
  completed: {
    className: 'border-brand-600/50 text-brand-700 dark:text-brand-300 dark:border-brand-300/50',
    Icon: CheckCircle2,
  },
  partial: {
    className: 'border-warn-600/50 text-warn-600 dark:text-warn-400 dark:border-warn-400/50',
    Icon: CircleDashed,
  },
  skipped: {
    className: 'border-app text-muted',
    Icon: CircleSlash,
  },
};

export function StatusBadge({
  status,
  className,
  compact = false,
}: {
  status: SessionStatus;
  className?: string;
  compact?: boolean;
}) {
  const { className: tone, Icon } = STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        tone,
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" />
      {/* Na versão compacta fica só o ícone, que é diferente para cada estado.
          O texto continua disponível para leitores de ecrã e há legenda no calendário. */}
      <span className={cn(compact && 'sr-only')}>{STATUS_LABELS_PT[status]}</span>
    </span>
  );
}

/** Legenda dos estados, para o ícone compacto nunca ficar por explicar. */
export function StatusLegend({ className }: { className?: string }) {
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {(Object.keys(STYLES) as SessionStatus[]).map((status) => {
        const { className: tone, Icon } = STYLES[status];
        return (
          <li
            key={status}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
              tone,
            )}
          >
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {STATUS_LABELS_PT[status]}
          </li>
        );
      })}
    </ul>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'warn';
  className?: string;
}) {
  const tones = {
    neutral: 'border-app text-muted',
    accent: 'border-accent text-accent',
    warn: 'border-warn-600/50 text-warn-600 dark:text-warn-400 dark:border-warn-400/50',
  } as const;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
