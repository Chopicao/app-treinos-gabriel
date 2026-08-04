import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CATEGORY_LABELS_PT, METRIC_LABELS_PT, TAG_LABELS_PT, getExercise } from '@/data/exercises';
import { SESSION_TEMPLATES } from '@/data/plan';
import { useAppStore } from '@/state/useAppStore';
import { performanceHistory } from '@/services/progression';
import { ButtonLink } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/StatusBadge';
import { Notice, PageHeader } from '@/components/ui/Misc';
import { VideoButton } from '@/components/VideoModal';
import { formatLoad } from '@/lib/format';
import { formatFullPt } from '@/lib/dates';

export function ExerciseDetailPage() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const exercise = exerciseId ? getExercise(exerciseId) : undefined;
  const sessions = useAppStore((state) => state.sessions);

  const appearsIn = useMemo(() => {
    if (!exercise) return [];
    return SESSION_TEMPLATES.flatMap((template) =>
      template.blocks.flatMap((block) =>
        block.items
          .filter((item) => item.exerciseId === exercise.id)
          .map(() => ({
            templateId: template.id,
            templateNamePt: template.namePt,
            blockNamePt: block.namePt,
          })),
      ),
    );
  }, [exercise]);

  const history = useMemo(
    () => (exercise ? performanceHistory(sessions, exercise.id).slice(0, 5) : []),
    [sessions, exercise],
  );

  if (!exercise) {
    return (
      <div className="space-y-4">
        <PageHeader title="Exercício não encontrado" subtitle="Verifica o endereço." />
        <ButtonLink to="/exercicios">Voltar à biblioteca</ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link to="/exercicios" className="text-muted inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Exercícios
      </Link>

      <PageHeader title={exercise.namePt} subtitle={exercise.nameEn} />

      <div className="flex flex-wrap gap-1.5">
        <Badge tone="accent">{CATEGORY_LABELS_PT[exercise.category]}</Badge>
        <Badge>{METRIC_LABELS_PT[exercise.metric]}</Badge>
        {exercise.unilateral ? <Badge>Por lado</Badge> : null}
        {exercise.tags.map((tag) => (
          <Badge key={tag} tone={tag === 'later-phase' ? 'warn' : 'neutral'}>
            {TAG_LABELS_PT[tag]}
          </Badge>
        ))}
      </div>

      {exercise.tags.includes('later-phase') ? (
        <Notice tone="warn">
          Progressão de fase posterior. Não está programada neste bloco de seis semanas e exige
          avaliação antes de ser introduzida.
        </Notice>
      ) : null}

      <VideoButton exercise={exercise} block />

      <Card>
        <CardHeader title="Como executar" />
        <ol className="text-muted list-decimal space-y-1.5 pl-5 text-sm">
          {exercise.instructionsPt.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Card>

      <Card>
        <CardHeader title="Pontos-chave" />
        <ul className="text-muted list-disc space-y-1.5 pl-5 text-sm">
          {exercise.techniqueCuesPt.map((cue) => (
            <li key={cue}>{cue}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Atenção" />
        <ul className="text-muted list-disc space-y-1.5 pl-5 text-sm">
          {exercise.safetyNotesPt.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </Card>

      {exercise.equipment.length > 0 ? (
        <Card>
          <CardHeader title="Material" />
          <ul className="flex flex-wrap gap-2">
            {exercise.equipment.map((value) => (
              <li key={value}>
                <Badge>{value}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {appearsIn.length > 0 ? (
        <Card>
          <CardHeader title="Onde aparece no plano" />
          <ul className="text-muted list-disc space-y-1 pl-5 text-sm">
            {appearsIn.map((entry, index) => (
              <li key={`${entry.templateId}-${index}`}>
                {entry.templateNamePt} — {entry.blockNamePt}
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          <CardHeader title="Onde aparece no plano" />
          <p className="text-muted text-sm">
            Este exercício está na biblioteca como alternativa ou progressão futura e não faz parte
            das sessões ativas.
          </p>
        </Card>
      )}

      {history.length > 0 ? (
        <Card>
          <CardHeader title="Últimos registos" />
          <ul className="text-muted space-y-1 text-sm">
            {history.map((performance) => (
              <li key={performance.sessionId}>
                <Link to={`/historico/${performance.sessionId}`} className="hover:underline">
                  {formatFullPt(performance.date)}
                </Link>{' '}
                — {performance.entry.sets.filter((set) => set.status === 'done').length} séries
                {performance.maxLoadKg !== null
                  ? ` · até ${formatLoad(performance.maxLoadKg)}`
                  : ''}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
