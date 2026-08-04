import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Info } from 'lucide-react';
import { useAppStore } from '@/state/useAppStore';
import { useOccurrences } from '@/hooks/useSchedule';
import { SessionCard } from '@/components/SessionCard';
import { runnerHref, sessionHref } from '@/lib/routes';
import { Card, CardHeader } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, Notice, PageHeader, ProgressBar } from '@/components/ui/Misc';
import { addDays, endOfWeek, formatFullPt, startOfWeek, todayKey } from '@/lib/dates';
import { PHASES_BY_ID } from '@/data/plan';
import { phaseForDate, planWeekFor, PLAN_TOTAL_WEEKS } from '@/services/schedule';
import { DISCLAIMER_SHORT_PT } from '@/data/safety';

export function TodayPage() {
  const today = todayKey();
  const planStartDate = useAppStore((state) => state.settings.planStartDate);
  const profileName = useAppStore((state) => state.profile.namePt);

  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);
  const todays = useOccurrences(today, today);
  const week = useOccurrences(weekStart, weekEnd);
  const upcoming = useOccurrences(addDays(today, 1), addDays(today, 3));

  const planWeek = planWeekFor(today, planStartDate);
  const phase = PHASES_BY_ID.get(phaseForDate(today, planStartDate));

  const weekDone = week.filter((o) => o.status === 'completed').length;
  const weekTotal = week.length;

  const next = useMemo(
    () => todays.find((o) => o.status !== 'completed' && o.status !== 'skipped') ?? upcoming[0],
    [todays, upcoming],
  );

  const beforeStart = planWeek < 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title={profileName.trim() ? `Olá, ${profileName}` : 'Olá'}
        subtitle={formatFullPt(today)}
        action={
          <ButtonLink to="/calendario" size="sm" aria-label="Abrir calendário">
            <CalendarDays aria-hidden="true" className="size-4" />
            Calendário
          </ButtonLink>
        }
      />

      {beforeStart ? (
        <Notice tone="warn" title="O plano ainda não começou">
          A semana 1 começa em {formatFullPt(startOfWeek(planStartDate))}. Podes alterar a data
          inicial nas definições.
        </Notice>
      ) : null}

      <Card>
        <CardHeader
          title={`Semana ${planWeek > 0 ? planWeek : 1} do plano`}
          subtitle={phase?.labelPt}
          action={
            <span className="text-muted text-sm tabular">
              {weekDone}/{weekTotal}
            </span>
          }
        />
        <ProgressBar
          value={weekTotal === 0 ? 0 : weekDone / weekTotal}
          label={`Sessões concluídas esta semana: ${weekDone} de ${weekTotal}`}
        />
        <p className="text-muted mt-3 text-sm">{phase?.guidancePt}</p>
        {planWeek > PLAN_TOTAL_WEEKS ? (
          <Notice tone="warn" className="mt-3">
            Passaste as seis semanas do bloco base. O plano mantém a prescrição das semanas 5–6.
            Pede avaliação antes de passar para barra pesada, saltos e trabalho explosivo.
          </Notice>
        ) : null}
      </Card>

      <section aria-labelledby="hoje-titulo">
        <h2 id="hoje-titulo" className="mb-3 text-lg">
          Sessões de hoje
        </h2>
        {todays.length === 0 ? (
          <EmptyState
            title="Não há sessões marcadas para hoje"
            description="Podes ver a semana completa no calendário ou consultar a biblioteca de exercícios."
            action={
              <ButtonLink to="/calendario" variant="secondary">
                Ver calendário
              </ButtonLink>
            }
          />
        ) : (
          <ul className="space-y-3">
            {todays.map((occurrence) => (
              <SessionCard key={occurrence.key} occurrence={occurrence} />
            ))}
          </ul>
        )}
      </section>

      {next ? (
        <Card>
          <CardHeader
            title="Próxima sessão"
            subtitle={next.date === today ? 'Hoje' : formatFullPt(next.date)}
          />
          <div className="flex flex-wrap gap-3">
            <ButtonLink to={sessionHref(next)} variant="secondary">
              Ver treino
            </ButtonLink>
            <ButtonLink to={runnerHref(next)} variant="primary">
              {next.status === 'in-progress' ? 'Continuar' : 'Iniciar'}
            </ButtonLink>
          </div>
        </Card>
      ) : null}

      {upcoming.length > 0 ? (
        <section aria-labelledby="proximos-titulo">
          <h2 id="proximos-titulo" className="mb-3 text-lg">
            Próximos dias
          </h2>
          <ul className="space-y-3">
            {upcoming.map((occurrence) => (
              <SessionCard
                key={occurrence.key}
                occurrence={occurrence}
                showDate={formatFullPt(occurrence.date)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-muted flex items-start gap-2 text-xs">
        <Info aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <span>
          {DISCLAIMER_SHORT_PT}{' '}
          <Link to="/sobre" className="underline">
            Sobre o plano
          </Link>
          .
        </span>
      </p>
    </div>
  );
}
