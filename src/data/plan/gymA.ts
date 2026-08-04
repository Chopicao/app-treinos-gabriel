import type { SessionTemplate } from '@/domain/types';
import { item, progressivePhases, samePhases } from './helpers';

/** Treino A — dominante de joelho (terça-feira, 75–85 min). */
export const gymASession: SessionTemplate = {
  id: 'gym-a',
  namePt: 'Ginásio A — dominante de joelho',
  shortNamePt: 'Ginásio A',
  kind: 'gym-a',
  summaryPt:
    'Agachamento, trabalho unilateral de joelho, pé e perna inferior, tronco superior, core e transportes.',
  estimatedMinutes: { min: 75, max: 85 },
  equipmentPt: [
    'Bicicleta ou remo',
    'Foam roller',
    'Mini-band',
    'Kettlebell',
    'Caixa ou banco',
    'Cabo/polia',
    'Parede',
  ],
  notesPt: [
    'Tempo 3–1–1 nos movimentos principais enquanto estás a aprender: 3 segundos na descida, 1 segundo de pausa, 1 segundo na subida.',
    'Não treinar até à falha. A progressão depende sempre de técnica correta, ausência de dor e supervisão.',
  ],
  blocks: [
    {
      id: 'a-b1',
      namePt: 'Bloco 1 — Aquecimento geral',
      estimatedMinutes: 5,
      items: [
        item({
          id: 'a-1',
          exerciseId: 'stationary-bike',
          choiceWithIds: ['rowing-machine'],
          allowedAlternativeIds: ['rowing-machine'],
          byPhase: samePhases({
            sets: 1,
            seconds: { min: 300 },
            notePt:
              'Ritmo leve a moderado. Aumenta ligeiramente apenas nos últimos 60 segundos, sem chegar à fadiga.',
          }),
        }),
      ],
    },
    {
      id: 'a-b2',
      namePt: 'Bloco 2 — Rolo',
      estimatedMinutes: 4,
      items: [
        item({
          id: 'a-2',
          exerciseId: 'calf-foam-roll',
          perSide: true,
          byPhase: samePhases({ sets: 1, seconds: { min: 30 } }),
        }),
        item({
          id: 'a-3',
          exerciseId: 'quadriceps-foam-roll',
          perSide: true,
          byPhase: samePhases({ sets: 1, seconds: { min: 30 } }),
        }),
        item({
          id: 'a-4',
          exerciseId: 'adductor-foam-roll',
          perSide: true,
          byPhase: samePhases({ sets: 1, seconds: { min: 30 } }),
        }),
        item({
          id: 'a-5',
          exerciseId: 'glute-foam-roll',
          perSide: true,
          byPhase: samePhases({ sets: 1, seconds: { min: 30 } }),
        }),
      ],
    },
    {
      id: 'a-b3',
      namePt: 'Bloco 3 — Mobilidade dinâmica',
      estimatedMinutes: 8,
      items: [
        item({
          id: 'a-6',
          exerciseId: 'knee-to-wall',
          perSide: true,
          byPhase: samePhases({ sets: 2, reps: { min: 8 } }),
        }),
        item({
          id: 'a-7',
          exerciseId: 'hip-90-90-switches',
          perSide: true,
          byPhase: samePhases({ sets: 2, reps: { min: 6 } }),
        }),
        item({
          id: 'a-8',
          exerciseId: 'adductor-rock-back',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 10 } }),
        }),
        item({
          id: 'a-9',
          exerciseId: 'worlds-greatest-stretch',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 5 } }),
        }),
        item({
          id: 'a-10',
          exerciseId: 'deep-squat-pry',
          byPhase: samePhases({ sets: 2, seconds: { min: 20 } }),
        }),
      ],
    },
    {
      id: 'a-b4',
      namePt: 'Bloco 4 — Ativação e estabilidade',
      descriptionPt: 'Duas voltas por todos os exercícios do bloco.',
      rounds: 2,
      restBetweenRoundsSeconds: { min: 30, max: 45 },
      estimatedMinutes: 8,
      items: [
        item({
          id: 'a-11',
          exerciseId: 'mini-band-lateral-walk',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 8 }, notePt: '8 passos para cada lado.' }),
        }),
        item({
          id: 'a-12',
          exerciseId: 'glute-bridge',
          byPhase: samePhases({
            sets: 1,
            reps: { min: 10 },
            notePt: 'Pausa de 2 segundos no topo.',
          }),
        }),
        item({
          id: 'a-13',
          exerciseId: 'dead-bug',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 6 } }),
        }),
        item({
          id: 'a-14',
          exerciseId: 'single-leg-balance',
          perSide: true,
          notesPt: [
            'Nas primeiras 2 a 3 semanas usar o chão. BOSU apenas mais tarde e sem carga externa.',
          ],
          byPhase: samePhases({ sets: 1, seconds: { min: 20, max: 30 } }),
        }),
      ],
    },
    {
      id: 'a-b5',
      namePt: 'Bloco 5 — Força principal',
      estimatedMinutes: 26,
      items: [
        item({
          id: 'a-15',
          exerciseId: 'goblet-squat-to-box',
          loadTracked: true,
          allowedAlternativeIds: ['goblet-squat', 'bodyweight-box-squat', 'counterbalance-squat'],
          notesPt: [
            'Depois de dominares o movimento, retira gradualmente a caixa e passa a goblet squat livre.',
            'Sem pressa para agachamento pesado com barra.',
          ],
          byPhase: progressivePhases(
            {
              sets: 2,
              reps: { min: 10 },
              restSeconds: { min: 90, max: 120 },
              tempo: '3-1-1',
              rpe: { min: 5, max: 6 },
              repsInReserve: { min: 4, max: 5 },
              notePt: 'Carga leve. Foco na técnica.',
            },
            {
              sets: 3,
              reps: { min: 8 },
              restSeconds: { min: 90, max: 120 },
              tempo: '3-1-1',
              rpe: { min: 6 },
              repsInReserve: { min: 3, max: 4 },
            },
            {
              sets: 3,
              setsMax: 4,
              reps: { min: 6, max: 8 },
              restSeconds: { min: 90, max: 120 },
              tempo: '3-1-1',
              rpe: { min: 6 },
              repsInReserve: { min: 3, max: 4 },
              notePt: '3 × 8 ou 4 × 6, apenas se a técnica justificar.',
            },
          ),
        }),
        item({
          id: 'a-16',
          exerciseId: 'split-squat',
          perSide: true,
          loadTracked: true,
          allowedAlternativeIds: ['reverse-lunge', 'split-squat-isometric-hold'],
          notesPt: ['Inicialmente peso corporal; depois kettlebell junto ao peito.'],
          byPhase: progressivePhases(
            {
              sets: 2,
              reps: { min: 8 },
              restSeconds: { min: 75, max: 90 },
              tempo: '3-1-1',
              rpe: { min: 5, max: 6 },
              repsInReserve: { min: 4, max: 5 },
            },
            {
              sets: 3,
              reps: { min: 8 },
              restSeconds: { min: 75, max: 90 },
              tempo: '3-1-1',
              rpe: { min: 6 },
              repsInReserve: { min: 3, max: 4 },
            },
            {
              sets: 3,
              reps: { min: 8 },
              restSeconds: { min: 75, max: 90 },
              tempo: '3-1-1',
              rpe: { min: 6 },
              repsInReserve: { min: 3, max: 4 },
            },
          ),
        }),
        item({
          id: 'a-17',
          exerciseId: 'low-step-down',
          perSide: true,
          allowedAlternativeIds: ['step-up', 'lateral-step-up'],
          notesPt: ['Caixa baixa. Joelho alinhado com o pé.'],
          byPhase: progressivePhases(
            {
              sets: 2,
              reps: { min: 6 },
              restSeconds: { min: 60 },
              tempo: '3-0-1',
              notePt: '3 segundos na descida.',
            },
            {
              sets: 2,
              setsMax: 3,
              reps: { min: 8 },
              restSeconds: { min: 60 },
              tempo: '3-0-1',
              notePt: '2 a 3 séries, conforme a qualidade do movimento.',
            },
            {
              sets: 2,
              setsMax: 3,
              reps: { min: 8 },
              restSeconds: { min: 60 },
              tempo: '3-0-1',
              notePt: '2 a 3 séries, conforme a qualidade do movimento.',
            },
          ),
        }),
      ],
    },
    {
      id: 'a-b6',
      namePt: 'Bloco 6 — Pé, tornozelo e perna inferior',
      estimatedMinutes: 10,
      items: [
        item({
          id: 'a-18',
          exerciseId: 'standing-calf-raise',
          loadTracked: true,
          allowedAlternativeIds: ['single-leg-calf-raise'],
          byPhase: samePhases({
            sets: 3,
            reps: { min: 10, max: 12 },
            restSeconds: { min: 45, max: 60 },
            tempo: '2-1-2',
            notePt: 'Amplitude completa, sem balanço.',
          }),
        }),
        item({
          id: 'a-19',
          exerciseId: 'bent-knee-soleus-raise',
          loadTracked: true,
          byPhase: samePhases({
            sets: 2,
            reps: { min: 12, max: 15 },
            restSeconds: { min: 45, max: 60 },
            tempo: '2-1-2',
          }),
        }),
        item({
          id: 'a-20',
          exerciseId: 'tibialis-raise',
          byPhase: samePhases({
            sets: 2,
            reps: { min: 15, max: 20 },
            restSeconds: { min: 45 },
            notePt: 'Começar com pouca amplitude e parar perante qualquer dor na frente da perna.',
          }),
        }),
      ],
    },
    {
      id: 'a-b7',
      namePt: 'Bloco 7 — Tronco superior',
      descriptionPt:
        'Podem alternar-se os dois exercícios, mas não como circuito rápido de exaustão.',
      estimatedMinutes: 12,
      items: [
        item({
          id: 'a-21',
          exerciseId: 'push-up',
          allowedAlternativeIds: ['cable-chest-press', 'half-kneeling-cable-press'],
          notesPt: ['Se for difícil, apoia as mãos num banco.'],
          byPhase: progressivePhases(
            {
              sets: 2,
              reps: { min: 8, max: 10 },
              restSeconds: { min: 75, max: 90 },
              repsInReserve: { min: 4, max: 5 },
            },
            {
              sets: 3,
              reps: { min: 8, max: 12 },
              restSeconds: { min: 75, max: 90 },
              repsInReserve: { min: 3, max: 4 },
            },
            {
              sets: 3,
              reps: { min: 8, max: 12 },
              restSeconds: { min: 75, max: 90 },
              repsInReserve: { min: 3, max: 4 },
            },
          ),
        }),
        item({
          id: 'a-22',
          exerciseId: 'seated-cable-row',
          loadTracked: true,
          allowedAlternativeIds: ['inverted-row', 'half-kneeling-cable-row'],
          byPhase: progressivePhases(
            {
              sets: 2,
              reps: { min: 10 },
              restSeconds: { min: 75, max: 90 },
              notePt:
                'Pausa de 1 segundo com as omoplatas atrás e retorno controlado em 2 segundos.',
            },
            {
              sets: 3,
              reps: { min: 8, max: 12 },
              restSeconds: { min: 75, max: 90 },
              notePt:
                'Pausa de 1 segundo com as omoplatas atrás e retorno controlado em 2 segundos.',
            },
            {
              sets: 3,
              reps: { min: 8, max: 12 },
              restSeconds: { min: 75, max: 90 },
              notePt:
                'Pausa de 1 segundo com as omoplatas atrás e retorno controlado em 2 segundos.',
            },
          ),
        }),
      ],
    },
    {
      id: 'a-b8',
      namePt: 'Bloco 8 — Core e transporte',
      estimatedMinutes: 9,
      items: [
        item({
          id: 'a-23',
          exerciseId: 'pallof-press',
          perSide: true,
          loadTracked: true,
          byPhase: samePhases({
            sets: 2,
            setsMax: 3,
            reps: { min: 8 },
            restSeconds: { min: 30, max: 45 },
            notePt: 'Braços estendidos 2 segundos em cada repetição.',
          }),
        }),
        item({
          id: 'a-24',
          exerciseId: 'suitcase-carry',
          perSide: true,
          loadTracked: true,
          byPhase: samePhases({
            sets: 3,
            meters: { min: 20, max: 25 },
            restSeconds: { min: 45, max: 60 },
            notePt: 'Tronco vertical.',
          }),
        }),
      ],
    },
    {
      id: 'a-b9',
      namePt: 'Bloco 9 — Regresso à calma',
      estimatedMinutes: 6,
      items: [
        item({
          id: 'a-25',
          exerciseId: 'stationary-bike',
          byPhase: samePhases({ sets: 1, seconds: { min: 180 }, notePt: 'Muito leve.' }),
        }),
        item({
          id: 'a-26',
          exerciseId: 'half-kneeling-hip-flexor-stretch',
          perSide: true,
          byPhase: samePhases({ sets: 2, seconds: { min: 20, max: 30 } }),
        }),
        item({
          id: 'a-27',
          exerciseId: 'diaphragmatic-breathing',
          byPhase: samePhases({ sets: 1, reps: { min: 5 }, notePt: 'Respiração lenta deitado.' }),
        }),
      ],
    },
  ],
};
