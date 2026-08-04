import type { PhaseId, SessionTemplate, TrainingPlan } from '@/domain/types';
import { matchWarmupSession, mobilityDailySession, mobilityShortSession } from './mobility';
import { gymASession } from './gymA';
import { gymBSession } from './gymB';
import { footballSession, matchSession, recoverySession } from './otherSessions';

/** Bump this whenever the prescriptions change, so historical sessions stay readable. */
export const PLAN_VERSION = '1.0.0';

export const SESSION_TEMPLATES: SessionTemplate[] = [
  mobilityDailySession,
  mobilityShortSession,
  matchWarmupSession,
  gymASession,
  gymBSession,
  footballSession,
  matchSession,
  recoverySession,
];

export const TRAINING_PLAN: TrainingPlan = {
  planVersion: PLAN_VERSION,
  namePt: 'Plano base de pré-época — 6 semanas',
  descriptionPt:
    'Bloco de seis semanas centrado em prevenção de lesões, mobilidade, cadeia posterior e força geral, à volta de três treinos de futebol e um jogo por semana.',
  totalWeeks: 6,
  phases: [
    {
      id: 'w1-2',
      labelPt: 'Semanas 1–2',
      weeks: [1, 2],
      guidancePt:
        'Duas séries na maioria dos exercícios de força, técnica e cargas leves, RPE 5–6/10, deixando aproximadamente 4 a 5 repetições em reserva.',
    },
    {
      id: 'w3-4',
      labelPt: 'Semanas 3–4',
      weeks: [3, 4],
      guidancePt:
        'Três séries nos principais, RPE perto de 6/10, deixando 3 a 4 repetições em reserva.',
    },
    {
      id: 'w5-6',
      labelPt: 'Semanas 5–6',
      weeks: [5, 6],
      guidancePt:
        'Pequeno aumento de carga ou variante ligeiramente mais difícil, sem aumentar ao mesmo tempo carga, séries e repetições.',
    },
    {
      id: 'w7+',
      labelPt: 'Depois da semana 6',
      weeks: [],
      guidancePt:
        'O plano mantém a prescrição das semanas 5–6. Pedir avaliação antes de passar para barra pesada, saltos e trabalho explosivo.',
    },
  ],
  week: [
    { weekday: 1, labelPt: 'Segunda-feira', sessionTemplateIds: ['football', 'mobility-daily'] },
    { weekday: 2, labelPt: 'Terça-feira', sessionTemplateIds: ['gym-a'] },
    { weekday: 3, labelPt: 'Quarta-feira', sessionTemplateIds: ['football', 'mobility-daily'] },
    { weekday: 4, labelPt: 'Quinta-feira', sessionTemplateIds: ['gym-b'] },
    { weekday: 5, labelPt: 'Sexta-feira', sessionTemplateIds: ['football', 'mobility-short'] },
    { weekday: 6, labelPt: 'Sábado', sessionTemplateIds: ['match-warmup', 'match'] },
    { weekday: 7, labelPt: 'Domingo', sessionTemplateIds: ['recovery', 'mobility-daily'] },
  ],
  sessions: SESSION_TEMPLATES,
};

export const SESSION_TEMPLATES_BY_ID: ReadonlyMap<string, SessionTemplate> = new Map(
  SESSION_TEMPLATES.map((template) => [template.id, template]),
);

export function getSessionTemplate(id: string): SessionTemplate | undefined {
  return SESSION_TEMPLATES_BY_ID.get(id);
}

export function requireSessionTemplate(id: string): SessionTemplate {
  const template = SESSION_TEMPLATES_BY_ID.get(id);
  if (!template) {
    throw new Error(`Sessão desconhecida: ${id}`);
  }
  return template;
}

export const PHASES_BY_ID: ReadonlyMap<PhaseId, TrainingPlan['phases'][number]> = new Map(
  TRAINING_PLAN.phases.map((phase) => [phase.id, phase]),
);

/** Weekday (1 = Monday) → the session ids the week template puts on that day. */
export function templateIdsForWeekday(weekday: number): string[] {
  return TRAINING_PLAN.week.find((day) => day.weekday === weekday)?.sessionTemplateIds ?? [];
}

export const SESSION_KIND_LABELS_PT: Record<SessionTemplate['kind'], string> = {
  mobility: 'Mobilidade',
  'mobility-short': 'Mobilidade curta',
  'match-warmup': 'Aquecimento',
  'gym-a': 'Ginásio A',
  'gym-b': 'Ginásio B',
  football: 'Futebol',
  match: 'Jogo',
  recovery: 'Recuperação',
};

export {
  mobilityDailySession,
  mobilityShortSession,
  matchWarmupSession,
  gymASession,
  gymBSession,
  footballSession,
  matchSession,
  recoverySession,
};
