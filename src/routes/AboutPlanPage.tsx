import { Link } from 'react-router-dom';
import { useAppStore } from '@/state/useAppStore';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/StatusBadge';
import { Notice, PageHeader } from '@/components/ui/Misc';
import { TRAINING_PLAN } from '@/data/plan';
import { OBJECTIVE_SUMMARY_PT, PLAN_EQUIPMENT_PT, PLAN_GOALS_PT } from '@/data/profile';
import { orNotSet } from '@/lib/text';
import {
  DISCLAIMER_LONG_PT,
  HEAVY_HAMSTRINGS_NOTE_PT,
  FATIGUE_RECOMMENDATION_PT,
  PLAN_REFERENCES,
  PROGRESSION_RULE_PT,
  REFERENCES_DISCLAIMER_PT,
  STOP_SIGNS_PT,
  TEMPO_EXPLANATION_PT,
} from '@/data/safety';

export function AboutPlanPage() {
  const profile = useAppStore((state) => state.profile);

  return (
    <div className="space-y-5">
      <PageHeader title="Sobre o plano" subtitle={TRAINING_PLAN.namePt} />

      <Card as="section">
        <CardHeader title="Aviso" />
        <div className="text-muted space-y-2 text-sm">
          {DISCLAIMER_LONG_PT.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Card>

      <Notice tone="warn" title="Interrompe o exercício e procura avaliação se surgir:">
        <ul className="list-disc space-y-0.5 pl-5">
          {STOP_SIGNS_PT.map((sign) => (
            <li key={sign}>{sign}</li>
          ))}
        </ul>
      </Notice>

      <Card as="section">
        <CardHeader title="O plano" subtitle={OBJECTIVE_SUMMARY_PT} />
        <p className="text-muted text-sm">{TRAINING_PLAN.descriptionPt}</p>
        <ul className="mt-3 space-y-3">
          {TRAINING_PLAN.phases.map((phase) => (
            <li key={phase.id}>
              <p className="text-sm font-medium">{phase.labelPt}</p>
              <p className="text-muted text-sm">{phase.guidancePt}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card as="section">
        <CardHeader title="Semana-tipo" />
        <ul className="divide-app divide-y text-sm">
          {TRAINING_PLAN.week.map((day) => (
            <li key={day.weekday} className="flex justify-between gap-4 py-2">
              <span className="text-muted">{day.labelPt}</span>
              <span className="text-right font-medium">
                {day.sessionTemplateIds
                  .map(
                    (id) =>
                      TRAINING_PLAN.sessions.find((session) => session.id === id)?.shortNamePt,
                  )
                  .filter(Boolean)
                  .join(' + ')}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card as="section">
        <CardHeader title="Regras de progressão" />
        <p className="text-muted text-sm">{PROGRESSION_RULE_PT}</p>
        <p className="text-muted mt-2 text-sm">{TEMPO_EXPLANATION_PT}</p>
        <p className="text-muted mt-2 text-sm">{FATIGUE_RECOMMENDATION_PT}</p>
        <p className="text-muted mt-2 text-sm">{HEAVY_HAMSTRINGS_NOTE_PT}</p>
      </Card>

      <Card as="section">
        <CardHeader
          title="Perfil do atleta"
          subtitle="Preenchido por ti no onboarding e guardado apenas neste dispositivo."
          action={
            <Link to="/definicoes" className="text-accent text-sm underline">
              Editar
            </Link>
          }
        />
        <dl className="space-y-2 text-sm">
          <Row term="Nome" value={orNotSet(profile.namePt)} />
          <Row term="Idade" value={orNotSet(profile.ageYears, ' anos')} />
          <Row term="Altura" value={orNotSet(profile.heightCm, ' cm')} />
          <Row term="Peso" value={orNotSet(profile.weightKg, ' kg')} />
          <Row term="Posição" value={orNotSet(profile.positionPt)} />
          <Row term="Pé dominante" value={orNotSet(profile.dominantFootPt)} />
          <Row term="Supervisão" value={orNotSet(profile.supervisionPt)} />
        </dl>
      </Card>

      <Card as="section">
        <CardHeader title="Historial e mobilidade" />
        <p className="text-sm font-medium">Historial de lesões</p>
        {profile.injuryHistoryPt.length > 0 ? (
          <ul className="text-muted mt-1 list-disc space-y-1 pl-5 text-sm">
            {profile.injuryHistoryPt.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted mt-1 text-sm">
            Nada registado. Podes acrescentar em Definições.
          </p>
        )}

        <p className="mt-3 text-sm font-medium">Mobilidade</p>
        {profile.mobilityNotesPt.length > 0 ? (
          <ul className="text-muted mt-1 list-disc space-y-1 pl-5 text-sm">
            {profile.mobilityNotesPt.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted mt-1 text-sm">Nada registado.</p>
        )}

        <p className="text-muted mt-3 text-xs">
          A aplicação não diagnostica a causa da falta de mobilidade.
        </p>
      </Card>

      {profile.openQuestionsPt.length > 0 ? (
        <Notice tone="warn" title="Questões a esclarecer">
          <ul className="list-disc space-y-1 pl-5">
            {profile.openQuestionsPt.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </Notice>
      ) : null}

      <Card as="section">
        <CardHeader title="Objetivos do plano, por prioridade" />
        <ol className="text-muted list-decimal space-y-0.5 pl-5 text-sm">
          {PLAN_GOALS_PT.map((goal) => (
            <li key={goal}>{goal}</li>
          ))}
        </ol>
      </Card>

      <Card as="section">
        <CardHeader title="Material assumido pelo plano" />
        <ul className="flex flex-wrap gap-2">
          {PLAN_EQUIPMENT_PT.map((equipment) => (
            <li key={equipment}>
              <Badge>{equipment}</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card as="section">
        <CardHeader title="Referências" subtitle={REFERENCES_DISCLAIMER_PT} />
        <ul className="space-y-2 text-sm">
          {PLAN_REFERENCES.map((reference) => (
            <li key={reference.url}>
              <a
                href={reference.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-accent underline"
              >
                {reference.titlePt}
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-4">
      <dt className="text-muted">{term}</dt>
      <dd className="max-w-[60ch] text-right font-medium">{value}</dd>
    </div>
  );
}
