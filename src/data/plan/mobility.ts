import type { SessionTemplate } from '@/domain/types';
import { item, samePhases } from './helpers';

/** Rotina diária de mobilidade — versão padrão de cerca de 20 minutos. */
export const mobilityDailySession: SessionTemplate = {
  id: 'mobility-daily',
  namePt: 'Rotina diária de mobilidade',
  shortNamePt: 'Mobilidade',
  kind: 'mobility',
  summaryPt:
    'Rotina consistente de cerca de 20 minutos: libertação, pé e tornozelo, anca, cadeia posterior, coluna e controlo.',
  estimatedMinutes: { min: 20, max: 25 },
  equipmentPt: ['Foam roller', 'Bola de massagem', 'Banda elástica', 'Parede', 'Tapete'],
  notesPt: [
    'O rolo e a bola podem ajudar temporariamente na amplitude e na sensação de recuperação, mas não partem nem descolam a fáscia.',
    'Nunca aplicar muita pressão sobre ossos, joelho, tendão de Aquiles ou zonas dolorosas.',
    'Antes de futebol ou jogo usa movimentos dinâmicos. Os alongamentos estáticos prolongados ficam para depois do treino ou para uma sessão separada.',
    'Os exercícios marcados como opcionais podem ser retirados nos dias em que houver menos tempo, sem apressar a técnica dos restantes.',
  ],
  blocks: [
    {
      id: 'mob-b1',
      namePt: 'Bloco 1 — Libertação',
      estimatedMinutes: 4,
      items: [
        item({
          id: 'mob-1',
          exerciseId: 'plantar-fascia-ball-release',
          perSide: true,
          byPhase: samePhases({ sets: 1, seconds: { min: 30 } }),
        }),
        item({
          id: 'mob-2',
          exerciseId: 'calf-foam-roll',
          perSide: true,
          byPhase: samePhases({ sets: 1, seconds: { min: 30 }, notePt: 'Pressão moderada.' }),
        }),
        item({
          id: 'mob-3',
          exerciseId: 'adductor-foam-roll',
          perSide: true,
          optional: true,
          byPhase: samePhases({
            sets: 1,
            seconds: { min: 30 },
            notePt: 'Não rolar sobre osso nem sobre o joelho.',
          }),
        }),
        item({
          id: 'mob-4',
          exerciseId: 'glute-foam-roll',
          perSide: true,
          byPhase: samePhases({ sets: 1, seconds: { min: 30 } }),
        }),
      ],
    },
    {
      id: 'mob-b2',
      namePt: 'Bloco 2 — Pé e tornozelo',
      estimatedMinutes: 5,
      items: [
        item({
          id: 'mob-5',
          exerciseId: 'knee-to-wall',
          perSide: true,
          byPhase: samePhases({
            sets: 2,
            reps: { min: 8 },
            notePt: 'Calcanhar sempre no chão.',
          }),
        }),
        item({
          id: 'mob-6',
          exerciseId: 'ankle-cars',
          perSide: true,
          optional: true,
          byPhase: samePhases({
            sets: 1,
            reps: { min: 5 },
            notePt: 'Círculos lentos e controlados.',
          }),
        }),
        item({
          id: 'mob-7',
          exerciseId: 'toe-yoga',
          perSide: true,
          optional: true,
          byPhase: samePhases({ sets: 1, reps: { min: 10 } }),
        }),
        item({
          id: 'mob-8',
          exerciseId: 'short-foot',
          perSide: true,
          byPhase: samePhases({
            sets: 1,
            reps: { min: 8 },
            notePt: 'Manter o arco elevado 5 segundos em cada repetição.',
          }),
        }),
      ],
    },
    {
      id: 'mob-b3',
      namePt: 'Bloco 3 — Anca',
      estimatedMinutes: 4,
      items: [
        item({
          id: 'mob-9',
          exerciseId: 'hip-90-90-switches',
          perSide: true,
          byPhase: samePhases({ sets: 2, reps: { min: 6 } }),
        }),
        item({
          id: 'mob-10',
          exerciseId: 'adductor-rock-back',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 10 } }),
        }),
        item({
          id: 'mob-11',
          exerciseId: 'half-kneeling-hip-flexor-stretch',
          perSide: true,
          byPhase: samePhases({
            sets: 2,
            seconds: { min: 20 },
            notePt: 'Sem arquear a lombar.',
          }),
        }),
      ],
    },
    {
      id: 'mob-b4',
      namePt: 'Bloco 4 — Cadeia posterior',
      estimatedMinutes: 3,
      items: [
        item({
          id: 'mob-12',
          exerciseId: 'supine-active-slr',
          perSide: true,
          byPhase: samePhases({
            sets: 2,
            reps: { min: 8 },
            notePt: 'Amplitude sem dor.',
          }),
        }),
        item({
          id: 'mob-13',
          exerciseId: 'banded-hamstring-floss',
          perSide: true,
          byPhase: samePhases({
            sets: 1,
            reps: { min: 8 },
            notePt: 'Repetições lentas; nunca forçar.',
          }),
        }),
      ],
    },
    {
      id: 'mob-b5',
      namePt: 'Bloco 5 — Coluna e ombros',
      estimatedMinutes: 3,
      items: [
        item({
          id: 'mob-14',
          exerciseId: 'cat-cow',
          byPhase: samePhases({ sets: 1, reps: { min: 8 } }),
        }),
        item({
          id: 'mob-15',
          exerciseId: 'open-book',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 6 } }),
        }),
        item({
          id: 'mob-16',
          exerciseId: 'wall-slides',
          byPhase: samePhases({ sets: 1, reps: { min: 10 } }),
        }),
      ],
    },
    {
      id: 'mob-b6',
      namePt: 'Bloco 6 — Controlo',
      estimatedMinutes: 4,
      items: [
        item({
          id: 'mob-17',
          exerciseId: 'single-leg-balance',
          perSide: true,
          byPhase: samePhases({
            sets: 2,
            seconds: { min: 20, max: 30 },
            notePt: 'Chão antes do BOSU.',
          }),
        }),
        item({
          id: 'mob-18',
          exerciseId: 'dead-bug',
          perSide: true,
          byPhase: samePhases({ sets: 2, reps: { min: 6 }, notePt: 'Repetições controladas.' }),
        }),
      ],
    },
  ],
};

/** Versão curta de sexta-feira: tudo leve e sem forçar. */
export const mobilityShortSession: SessionTemplate = {
  id: 'mobility-short',
  namePt: 'Rotina curta de mobilidade',
  shortNamePt: 'Mobilidade curta',
  kind: 'mobility-short',
  summaryPt: 'Versão leve para o dia anterior ao jogo. Uma série de cada, sem forçar amplitude.',
  estimatedMinutes: { min: 8, max: 12 },
  equipmentPt: ['Parede', 'Tapete'],
  notesPt: [
    'Tudo leve e sem forçar. O objetivo é manter a sensação de movimento, não ganhar amplitude.',
    'Se os posteriores estiverem pesados, reduz ainda mais a amplitude e regista essa sensação nas notas.',
  ],
  blocks: [
    {
      id: 'mobs-b1',
      namePt: 'Rotina curta',
      estimatedMinutes: 10,
      items: [
        item({
          id: 'mobs-1',
          exerciseId: 'knee-to-wall',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 8 } }),
        }),
        item({
          id: 'mobs-2',
          exerciseId: 'hip-90-90-switches',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 6 } }),
        }),
        item({
          id: 'mobs-3',
          exerciseId: 'adductor-rock-back',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 8 } }),
        }),
        item({
          id: 'mobs-4',
          exerciseId: 'supine-active-slr',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 6 } }),
        }),
        item({
          id: 'mobs-5',
          exerciseId: 'open-book',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 5 } }),
        }),
        item({
          id: 'mobs-6',
          exerciseId: 'single-leg-balance',
          perSide: true,
          byPhase: samePhases({ sets: 1, seconds: { min: 20 } }),
        }),
      ],
    },
  ],
};

/** Sábado: entrada apenas informativa. Não substitui o aquecimento da equipa. */
export const matchWarmupSession: SessionTemplate = {
  id: 'match-warmup',
  namePt: 'Aquecimento dinâmico antes do jogo',
  shortNamePt: 'Aquecimento',
  kind: 'match-warmup',
  summaryPt:
    'Entrada informativa. Antes do jogo usa movimentos dinâmicos e segue o aquecimento da equipa.',
  estimatedMinutes: { min: 0, max: 0 },
  equipmentPt: [],
  notesPt: [
    'Esta entrada não é uma prescrição médica nem substitui o aquecimento da equipa.',
    'Sem foam rolling demorado nem alongamentos estáticos prolongados imediatamente antes do jogo.',
  ],
  blocks: [
    {
      id: 'warm-b1',
      namePt: 'Antes do jogo',
      items: [
        item({
          id: 'warm-1',
          exerciseId: 'dynamic-warmup-note',
          byPhase: samePhases({ sets: 1 }),
        }),
      ],
    },
  ],
};
