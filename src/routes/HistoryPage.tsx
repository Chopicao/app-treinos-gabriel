import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAppStore } from '@/state/useAppStore';
import { SESSION_KIND_LABELS_PT } from '@/data/plan';
import { sessionProgress } from '@/services/sessionBuilder';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SelectInput } from '@/components/ui/Field';
import { EmptyState, PageHeader } from '@/components/ui/Misc';
import { formatDurationMinutes } from '@/lib/format';
import { formatFullPt } from '@/lib/dates';

export function HistoryPage() {
  const sessions = useAppStore((state) => state.sessions);
  const [kind, setKind] = useState<string>('all');

  const visible = useMemo(() => {
    return sessions
      .filter((session) => session.status !== 'planned')
      .filter((session) => kind === 'all' || session.kind === kind)
      .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  }, [sessions, kind]);

  const kinds = useMemo(() => [...new Set(sessions.map((session) => session.kind))], [sessions]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Histórico"
        subtitle="Sessões iniciadas ou concluídas, com os valores que registaste."
      />

      {kinds.length > 1 ? (
        <SelectInput
          label="Tipo de sessão"
          value={kind}
          onChange={(event) => setKind(event.target.value)}
          wrapperClassName="max-w-xs"
        >
          <option value="all">Todos os tipos</option>
          {kinds.map((value) => (
            <option key={value} value={value}>
              {SESSION_KIND_LABELS_PT[value]}
            </option>
          ))}
        </SelectInput>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          title="Ainda não há sessões registadas"
          description="Assim que iniciares um treino, ele aparece aqui com as séries, cargas e notas que registaste."
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((session) => {
            const progress = sessionProgress(session);
            return (
              <li key={session.id}>
                <Link
                  to={`/historico/${session.id}`}
                  className="surface-raised border-app hover:surface-sunken flex items-center gap-3 rounded-2xl border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold">{session.templateNamePt}</h2>
                      <StatusBadge status={session.status} />
                    </div>
                    <p className="text-muted mt-1 text-sm">{formatFullPt(session.date)}</p>
                    <p className="text-muted mt-1 text-xs tabular">
                      Semana {session.planWeek} · {progress.doneSets}/{progress.totalSets} séries ·{' '}
                      {formatDurationMinutes(session.activeSeconds)}
                      {session.editedAt ? ' · editada' : ''}
                    </p>
                  </div>
                  <ChevronRight aria-hidden="true" className="text-muted size-5 shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
