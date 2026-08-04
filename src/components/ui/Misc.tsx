import type { ReactNode } from 'react';
import { Info, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/cn';

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className={cn('surface-sunken h-2 w-full overflow-hidden rounded-full', className)}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="bg-accent h-full rounded-full transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function Notice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'warn';
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const Icon = tone === 'warn' ? TriangleAlert : Info;
  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border p-3 text-sm',
        tone === 'warn'
          ? 'border-warn-600/40 bg-warn-400/10 text-warn-600 dark:text-warn-400'
          : 'border-app surface-raised text-muted',
        className,
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        {title ? <p className="text-main mb-1 font-medium">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-app rounded-2xl border border-dashed p-6 text-center">
      <p className="font-medium">{title}</p>
      <p className="text-muted mx-auto mt-1 max-w-prose text-sm">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl">{title}</h1>
        {subtitle ? <p className="text-muted mt-1 text-sm">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function DescriptionList({ items }: { items: Array<{ term: string; value: ReactNode }> }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {items.map((entry) => (
        <div key={entry.term} className="flex justify-between gap-4 text-sm">
          <dt className="text-muted">{entry.term}</dt>
          <dd className="text-right font-medium">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}
