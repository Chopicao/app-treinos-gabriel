import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarSync, Clock, Dumbbell, RotateCcw } from 'lucide-react';
import { useAppStore } from '@/state/useAppStore';
import { useOccurrence } from '@/hooks/useSchedule';
import { getSessionTemplate, PHASES_BY_ID } from '@/data/plan';
import { getExercise } from '@/data/exercises';
import { itemsForPhase } from '@/services/sessionBuilder';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@/components/ui/Field';
import { Badge, StatusBadge } from '@/components/ui/StatusBadge';
import { Notice, PageHeader } from '@/components/ui/Misc';
import { VideoButton } from '@/components/VideoModal';
import { formatMinutesRange, formatPrescription, formatRpe, formatReserve } from '@/lib/format';
import { formatFullPt } from '@/lib/dates';
import { TEMPO_EXPLANATION_PT } from '@/data/safety';

export function SessionDetailPage() {
  const { occurrenceKey } = useParams<{ occurrenceKey: string }>();
  const key = occurrenceKey ? decodeURIComponent(occurrenceKey) : undefined;
  const occurrence = useOccurrence(key);
  const navigate = useNavigate();
  const reschedule = useAppStore((state) => state.reschedule);
  const restoreSchedule = useAppStore((state) => state.restoreSchedule);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState(occurrence?.date ?? '');

  if (!occurrence) {
    return (
      <div className="space-y-4">
        <PageHeader title="Sessão não encontrada" subtitle="Esta sessão já não existe no plano." />
        <ButtonLink to="/calendario">Voltar ao calendário</ButtonLink>
      </div>
    );
  }

  const template = getSessionTemplate(occurrence.templateId);
  if (!template) return null;

  const phase = PHASES_BY_ID.get(occurrence.phaseId);
  const items = itemsForPhase(template, occurrence.phaseId);

  return (
    <div className="space-y-5">
      <Link to="/calendario" className="text-muted inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Calendário
      </Link>

      <PageHeader
        title={template.namePt}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{formatFullPt(occurrence.date)}</span>
            <span>Semana {occurrence.planWeek}</span>
            {(template.estimatedMinutes.max ?? template.estimatedMinutes.min) > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Clock aria-hidden="true" className="size-3.5" />
                {formatMinutesRange(template.estimatedMinutes)}
              </span>
            ) : null}
          </span>
        }
        action={<StatusBadge status={occurrence.status} />}
      />

      <p className="text-muted text-sm">{template.summaryPt}</p>

      <div className="flex flex-wrap gap-3">
        <ButtonLink
          to={`/sessao/${encodeURIComponent(occurrence.key)}/treinar`}
          variant="primary"
          size="lg"
        >
          <Dumbbell aria-hidden="true" className="size-5" />
          {occurrence.status === 'in-progress'
            ? 'Continuar treino'
            : occurrence.status === 'completed'
              ? 'Rever e editar'
              : 'Iniciar treino'}
        </ButtonLink>
        <Button onClick={() => setRescheduleOpen(true)}>
          <CalendarSync aria-hidden="true" className="size-4" />
          Remarcar
        </Button>
        {occurrence.rescheduled ? (
          <Button onClick={() => void restoreSchedule(occurrence.key)}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Repor data original
          </Button>
        ) : null}
      </div>

      {occurrence.rescheduled ? (
        <Notice>
          Esta ocorrência foi remarcada de {formatFullPt(occurrence.originalDate)} para{' '}
          {formatFullPt(occurrence.date)}. As semanas seguintes mantêm-se inalteradas.
        </Notice>
      ) : null}

      {phase ? (
        <Card>
          <CardHeader title={`Progressão — ${phase.labelPt}`} />
          <p className="text-muted text-sm">{phase.guidancePt}</p>
        </Card>
      ) : null}

      {template.equipmentPt.length > 0 ? (
        <Card>
          <CardHeader title="Material" />
          <ul className="flex flex-wrap gap-2">
            {template.equipmentPt.map((equipment) => (
              <li key={equipment}>
                <Badge>{equipment}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {template.notesPt?.length ? (
        <Card>
          <CardHeader title="Notas do plano" />
          <ul className="text-muted list-disc space-y-1.5 pl-5 text-sm">
            {template.notesPt.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <section aria-labelledby="blocos-titulo" className="space-y-4">
        <h2 id="blocos-titulo" className="text-lg">
          Estrutura da sessão
        </h2>

        {template.blocks.map((block) => {
          const blockItems = items.filter((entry) => entry.block.id === block.id);
          if (blockItems.length === 0) return null;
          return (
            <Card key={block.id} as="section">
              <CardHeader
                title={block.namePt}
                subtitle={block.descriptionPt}
                level={3}
                action={
                  block.estimatedMinutes ? (
                    <span className="text-muted text-xs">≈ {block.estimatedMinutes} min</span>
                  ) : null
                }
              />
              <ul className="divide-app divide-y">
                {blockItems.map(({ item, values }) => {
                  const exercise = getExercise(item.exerciseId);
                  if (!exercise) return null;
                  return (
                    <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            to={`/exercicios/${exercise.id}`}
                            className="font-medium hover:underline"
                          >
                            {exercise.namePt}
                          </Link>
                          {item.optional ? <Badge className="ml-2">Opcional</Badge> : null}
                          <p className="text-muted mt-1 text-sm">
                            {formatPrescription(values, {
                              perSide: item.perSide,
                              metric: exercise.metric,
                            })}
                          </p>
                          {values.rpe || values.repsInReserve ? (
                            <p className="text-muted mt-0.5 text-xs">
                              {[formatRpe(values.rpe), formatReserve(values.repsInReserve)]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          ) : null}
                          {values.notePt ? (
                            <p className="text-muted mt-1 text-xs">{values.notePt}</p>
                          ) : null}
                          {item.notesPt?.map((note) => (
                            <p key={note} className="text-muted mt-1 text-xs">
                              {note}
                            </p>
                          ))}
                          {item.allowedAlternativeIds?.length ? (
                            <p className="text-muted mt-1 text-xs">
                              Alternativas autorizadas:{' '}
                              {item.allowedAlternativeIds
                                .map((id) => getExercise(id)?.namePt ?? id)
                                .join(', ')}
                              .
                            </p>
                          ) : null}
                        </div>
                        <VideoButton exercise={exercise} size="sm" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </section>

      <p className="text-muted text-xs">{TEMPO_EXPLANATION_PT}</p>

      <Modal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title="Remarcar esta sessão"
        description="Só esta ocorrência muda de dia. As semanas seguintes continuam iguais."
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setRescheduleOpen(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!newDate}
              onClick={() => {
                void reschedule(occurrence, newDate).then(() => {
                  setRescheduleOpen(false);
                  navigate(`/sessao/${encodeURIComponent(occurrence.key)}`, { replace: true });
                });
              }}
            >
              Remarcar
            </Button>
          </div>
        }
      >
        <TextInput
          label="Nova data"
          type="date"
          value={newDate}
          onChange={(event) => setNewDate(event.target.value)}
          hint={`Data original: ${formatFullPt(occurrence.originalDate)}`}
        />
      </Modal>
    </div>
  );
}
