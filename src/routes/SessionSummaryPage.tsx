import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useAppStore } from '@/state/useAppStore';
import { getExercise } from '@/data/exercises';
import { performanceHistory, progressionSuggestion } from '@/services/progression';
import { sessionProgress } from '@/services/sessionBuilder';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DescriptionList, Notice, PageHeader } from '@/components/ui/Misc';
import { formatDurationMinutes, formatLoad, formatMinutesRange, formatSeconds } from '@/lib/format';
import { formatDateTimePt, formatFullPt } from '@/lib/dates';

export function SessionSummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const sessions = useAppStore((state) => state.sessions);
  const deleteSession = useAppStore((state) => state.deleteSession);
  const reopenSession = useAppStore((state) => state.reopenSession);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const session = sessions.find((candidate) => candidate.id === sessionId);

  if (!session) {
    return (
      <div className="space-y-4">
        <PageHeader title="Sessão não encontrada" subtitle="Pode ter sido eliminada." />
        <ButtonLink to="/historico">Voltar ao histórico</ButtonLink>
      </div>
    );
  }

  const progress = sessionProgress(session);

  return (
    <div className="space-y-5">
      <Link to="/historico" className="text-muted inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Histórico
      </Link>

      <PageHeader
        title={session.templateNamePt}
        subtitle={`${formatFullPt(session.date)} · semana ${session.planWeek}`}
        action={<StatusBadge status={session.status} />}
      />

      <Card>
        <CardHeader title="Resumo" />
        <DescriptionList
          items={[
            { term: 'Duração planeada', value: formatMinutesRange(session.plannedMinutes) },
            { term: 'Duração real', value: formatDurationMinutes(session.activeSeconds) },
            {
              term: 'Séries concluídas',
              value: `${progress.doneSets} de ${progress.totalSets}`,
            },
            {
              term: 'Exercícios concluídos',
              value: `${progress.doneEntries} de ${progress.totalEntries}`,
            },
            { term: 'Esforço (RPE)', value: session.sessionRpe ?? '—' },
            { term: 'Dor/desconforto', value: session.discomfort ?? '—' },
          ]}
        />
        {session.fatigueFlag ? (
          <Notice tone="warn" className="mt-3">
            Fadiga assinalada nesta sessão.
          </Notice>
        ) : null}
        {session.notesPt ? (
          <p className="text-muted mt-3 text-sm whitespace-pre-wrap">{session.notesPt}</p>
        ) : null}
        {session.editedAt ? (
          <p className="text-muted mt-3 text-xs">
            Última alteração: {formatDateTimePt(session.editedAt)}
          </p>
        ) : null}
      </Card>

      <div className="flex flex-wrap gap-2">
        <ButtonLink to={`/sessao/${encodeURIComponent(session.occurrenceKey)}/treinar`}>
          <Pencil aria-hidden="true" className="size-4" />
          Editar sessão
        </ButtonLink>
        {session.status === 'completed' || session.status === 'partial' ? (
          <Button onClick={() => void reopenSession(session.id)}>Reabrir como em curso</Button>
        ) : null}
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          <Trash2 aria-hidden="true" className="size-4" />
          Eliminar
        </Button>
      </div>

      <section aria-labelledby="registos-titulo" className="space-y-3">
        <h2 id="registos-titulo" className="text-lg">
          Registos
        </h2>
        {session.entries.map((entry) => {
          const exercise = getExercise(entry.exerciseId);
          const history = performanceHistory(sessions, entry.exerciseId);
          const suggestion = progressionSuggestion(history);
          const previous = history
            .filter((performance) => performance.sessionId !== session.id)
            .slice(0, 2);

          return (
            <Card key={entry.id} as="article">
              <CardHeader
                title={
                  exercise ? (
                    <Link to={`/exercicios/${exercise.id}`} className="hover:underline">
                      {entry.exerciseNamePt}
                    </Link>
                  ) : (
                    entry.exerciseNamePt
                  )
                }
                subtitle={entry.prescriptionLabelPt}
                level={3}
              />

              {entry.status === 'skipped' ? (
                <p className="text-muted text-sm">Saltado ({entry.skipReason ?? 'sem motivo'}).</p>
              ) : (
                <ul className="text-sm">
                  {entry.sets.map((set) => (
                    <li
                      key={set.id}
                      className="border-app flex flex-wrap justify-between gap-2 border-b py-1.5 last:border-b-0"
                    >
                      <span className="text-muted">
                        Série {set.index}
                        {set.side ? ` · ${set.side === 'left' ? 'esquerdo' : 'direito'}` : ''}
                      </span>
                      <span className="tabular">
                        {set.status === 'done'
                          ? [
                              set.reps !== null && set.reps !== undefined
                                ? `${set.reps} reps`
                                : null,
                              set.seconds ? formatSeconds(set.seconds) : null,
                              set.meters ? `${set.meters} m` : null,
                              entry.loadTracked ? formatLoad(set.loadKg) : null,
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'Concluída'
                          : set.status === 'skipped'
                            ? 'Saltada'
                            : 'Por fazer'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {previous.length > 0 ? (
                <div className="text-muted mt-3 text-xs">
                  <p className="font-medium">Execuções anteriores</p>
                  <ul className="mt-1 space-y-0.5">
                    {previous.map((performance) => (
                      <li key={performance.sessionId}>
                        {formatFullPt(performance.date)} —{' '}
                        {performance.entry.sets.filter((set) => set.status === 'done').length}{' '}
                        séries
                        {performance.maxLoadKg !== null
                          ? ` · até ${formatLoad(performance.maxLoadKg)}`
                          : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {suggestion.suggest ? (
                <Notice className="mt-3" title={suggestion.headlinePt}>
                  {suggestion.detailPt}
                </Notice>
              ) : null}
            </Card>
          );
        })}
      </section>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Eliminar esta sessão?"
        description="Esta ação não pode ser desfeita."
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => {
                void deleteSession(session.id).then(() =>
                  navigate('/historico', { replace: true }),
                );
              }}
            >
              Eliminar definitivamente
            </Button>
          </div>
        }
      >
        <p className="text-sm">
          A sessão de {formatFullPt(session.date)} e todos os seus registos serão apagados deste
          dispositivo.
        </p>
      </Modal>
    </div>
  );
}
