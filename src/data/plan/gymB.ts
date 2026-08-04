import type { SessionTemplate } from '@/domain/types';
import { NOT_IN_PHASE, item, progressivePhases, samePhases } from './helpers';

/** Treino B — anca e cadeia posterior (quinta-feira, 65–75 min). */
export const gymBSession: SessionTemplate = {
  id: 'gym-b',
  namePt: 'Ginásio B — anca e cadeia posterior',
  shortNamePt: 'Ginásio B',
  kind: 'gym-b',
  summaryPt:
    'Hip hinge, extensão da anca, posteriores, adutores, tronco superior, core e transportes.',
  estimatedMinutes: { min: 65, max: 75 },
  equipmentPt: [
    'Bicicleta ou remo',
    'Foam roller',
    'Banda elástica',
    'Kettlebell',
    'Caixa ou banco',
    'Cabo/polia',
    'Barra olímpica (landmine)',
    'Rack',
  ],
  notesPt: [
    'Esta sessão deve terminar com a sensação de que ainda seria possível fazer mais, porque há futebol na sexta e jogo no sábado.',
    'Na quinta-feira mantém RPE 6–7 no máximo.',
    'Se o treino de quarta tiver sido muito intenso, assinala fadiga: a recomendação predefinida do plano é reduzir uma série dos exercícios de pernas.',
    'Se os posteriores ficarem pesados na sexta-feira, a primeira adaptação do plano é retirar o hamstring walkout e reduzir o peso morto para duas séries. É uma nota do plano, não uma decisão clínica automática.',
  ],
  blocks: [
    {
      id: 'b-b1',
      namePt: 'Bloco 1 — Aquecimento e rolo',
      descriptionPt:
        'Não pressionar diretamente uma zona posterior dolorosa ou sensível de uma lesão recente.',
      estimatedMinutes: 9,
      items: [
        item({
          id: 'b-1',
          exerciseId: 'stationary-bike',
          choiceWithIds: ['rowing-machine'],
          allowedAlternativeIds: ['rowing-machine'],
          byPhase: samePhases({ sets: 1, seconds: { min: 300 }, notePt: 'Leve a moderado.' }),
        }),
        item({
          id: 'b-2',
          exerciseId: 'calf-foam-roll',
          perSide: true,
          byPhase: samePhases({ sets: 1, seconds: { min: 30 } }),
        }),
        item({
          id: 'b-3',
          exerciseId: 'quadriceps-foam-roll',
          perSide: true,
          byPhase: samePhases({ sets: 1, seconds: { min: 30 } }),
        }),
        item({
          id: 'b-4',
          exerciseId: 'adductor-foam-roll',
          perSide: true,
          byPhase: samePhases({ sets: 1, seconds: { min: 30 } }),
        }),
        item({
          id: 'b-5',
          exerciseId: 'glute-foam-roll',
          perSide: true,
          byPhase: samePhases({ sets: 1, seconds: { min: 30 } }),
        }),
      ],
    },
    {
      id: 'b-b2',
      namePt: 'Bloco 2 — Mobilidade dinâmica',
      estimatedMinutes: 8,
      items: [
        item({
          id: 'b-6',
          exerciseId: 'hip-90-90-switches',
          perSide: true,
          byPhase: samePhases({ sets: 2, reps: { min: 6 } }),
        }),
        item({
          id: 'b-7',
          exerciseId: 'adductor-rock-back',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 10 } }),
        }),
        item({
          id: 'b-8',
          exerciseId: 'knee-to-wall',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 10 } }),
        }),
        item({
          id: 'b-9',
          exerciseId: 'banded-hamstring-floss',
          perSide: true,
          byPhase: samePhases({
            sets: 1,
            reps: { min: 8 },
            notePt: 'Devagar e sem forçar a extensão.',
          }),
        }),
        item({
          id: 'b-10',
          exerciseId: 'worlds-greatest-stretch',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 5 } }),
        }),
      ],
    },
    {
      id: 'b-b3',
      namePt: 'Bloco 3 — Preparação do hinge e ativação',
      descriptionPt: 'Duas voltas por todos os exercícios do bloco.',
      rounds: 2,
      restBetweenRoundsSeconds: { min: 30, max: 45 },
      estimatedMinutes: 8,
      items: [
        item({
          id: 'b-11',
          exerciseId: 'hip-hinge-with-dowel',
          byPhase: samePhases({ sets: 1, reps: { min: 8 } }),
        }),
        item({
          id: 'b-12',
          exerciseId: 'long-lever-hamstring-bridge',
          byPhase: samePhases({
            sets: 1,
            reps: { min: 8 },
            notePt: 'Pausa de 2 segundos no topo.',
          }),
        }),
        item({
          id: 'b-13',
          exerciseId: 'bird-dog',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 6 } }),
        }),
        item({
          id: 'b-14',
          exerciseId: 'short-foot',
          perSide: true,
          byPhase: samePhases({ sets: 1, reps: { min: 8, max: 10 } }),
        }),
      ],
    },
    {
      id: 'b-b4',
      namePt: 'Bloco 4 — Força principal da cadeia posterior',
      estimatedMinutes: 24,
      items: [
        item({
          id: 'b-15',
          exerciseId: 'elevated-kettlebell-deadlift',
          loadTracked: true,
          allowedAlternativeIds: ['kettlebell-deadlift', 'cable-pull-through'],
          notesPt: [
            'Começar com o kettlebell elevado para reduzir a amplitude.',
            'Baixar gradualmente apenas após dominar. O peso morto romeno com barra fica para uma fase posterior.',
          ],
          byPhase: progressivePhases(
            {
              sets: 2,
              reps: { min: 10 },
              restSeconds: { min: 90, max: 120 },
              tempo: '3-1-1',
              rpe: { min: 5, max: 6 },
              repsInReserve: { min: 4, max: 5 },
            },
            {
              sets: 3,
              reps: { min: 8 },
              restSeconds: { min: 90, max: 120 },
              tempo: '3-1-1',
              rpe: { min: 6, max: 7 },
              repsInReserve: { min: 3, max: 4 },
            },
            {
              sets: 3,
              reps: { min: 6, max: 8 },
              restSeconds: { min: 90, max: 120 },
              tempo: '3-1-1',
              rpe: { min: 6, max: 7 },
              repsInReserve: { min: 3, max: 4 },
            },
          ),
        }),
        item({
          id: 'b-16',
          exerciseId: 'glute-bridge',
          loadTracked: true,
          allowedAlternativeIds: ['hip-thrust', 'single-leg-bridge'],
          notesPt: [
            'Começa com a ponte de glúteos no chão. Passa a hip thrust apenas com bom controlo da bacia.',
            'Não hiperestender a lombar.',
          ],
          byPhase: progressivePhases(
            {
              sets: 2,
              reps: { min: 10 },
              restSeconds: { min: 75, max: 90 },
              tempo: '2-2-1',
              notePt: 'Pausa de 2 segundos no topo e descida em 2 segundos.',
            },
            {
              sets: 3,
              reps: { min: 8, max: 10 },
              restSeconds: { min: 75, max: 90 },
              tempo: '2-2-1',
              notePt: 'Pausa de 2 segundos no topo e descida em 2 segundos.',
            },
            {
              sets: 3,
              reps: { min: 8, max: 10 },
              restSeconds: { min: 75, max: 90 },
              tempo: '2-2-1',
              notePt: 'Pausa de 2 segundos no topo e descida em 2 segundos.',
            },
          ),
        }),
        item({
          id: 'b-17',
          exerciseId: 'supported-single-leg-rdl',
          perSide: true,
          loadTracked: true,
          allowedAlternativeIds: ['b-stance-rdl', 'single-leg-hamstring-hinge-reach'],
          notesPt: ['Primeiro sem peso; depois kettlebell na mão oposta à perna de apoio.'],
          byPhase: progressivePhases(
            {
              sets: 2,
              reps: { min: 6 },
              restSeconds: { min: 60, max: 75 },
              tempo: '3-0-1',
              notePt: '3 segundos na descida.',
            },
            {
              sets: 2,
              setsMax: 3,
              reps: { min: 8 },
              restSeconds: { min: 60, max: 75 },
              tempo: '3-0-1',
              notePt: '2 a 3 séries, conforme a qualidade do movimento.',
            },
            {
              sets: 2,
              setsMax: 3,
              reps: { min: 8 },
              restSeconds: { min: 60, max: 75 },
              tempo: '3-0-1',
              notePt: '2 a 3 séries, conforme a qualidade do movimento.',
            },
          ),
        }),
      ],
    },
    {
      id: 'b-b5',
      namePt: 'Bloco 5 — Posteriores da coxa',
      descriptionPt:
        'Nesta primeira fase não se usa o Nordic completo, sobretudo dois dias antes do jogo.',
      estimatedMinutes: 7,
      items: [
        item({
          id: 'b-18',
          exerciseId: 'isometric-heel-dig-bridge',
          notesPt: [
            'Progressão inicial dos posteriores, indicada quando há historial de lesão nessa zona.',
          ],
          byPhase: {
            'w1-2': { sets: 3, seconds: { min: 20 }, restSeconds: { min: 40, max: 60 } },
            'w3-4': NOT_IN_PHASE,
            'w5-6': NOT_IN_PHASE,
            'w7+': NOT_IN_PHASE,
          },
        }),
        item({
          id: 'b-19',
          exerciseId: 'hamstring-walkout',
          allowedAlternativeIds: ['isometric-heel-dig-bridge'],
          notesPt: [
            'A partir da semana 3, apenas se estiver sem dor e com controlo. Caso contrário mantém a ponte isométrica, que é a alternativa autorizada.',
            'Cada repetição inclui pequenos passos para fora e o regresso. Parar se perderes a posição da bacia.',
          ],
          byPhase: {
            'w1-2': NOT_IN_PHASE,
            'w3-4': { sets: 2, reps: { min: 4, max: 6 }, restSeconds: { min: 60, max: 75 } },
            'w5-6': { sets: 2, reps: { min: 4, max: 6 }, restSeconds: { min: 60, max: 75 } },
            'w7+': { sets: 2, reps: { min: 4, max: 6 }, restSeconds: { min: 60, max: 75 } },
          },
        }),
      ],
    },
    {
      id: 'b-b6',
      namePt: 'Bloco 6 — Adutores e estabilidade lateral',
      estimatedMinutes: 5,
      items: [
        item({
          id: 'b-20',
          exerciseId: 'short-lever-copenhagen-plank',
          perSide: true,
          allowedAlternativeIds: ['side-lying-hip-adduction'],
          notesPt: ['Apoio pelo joelho, não pelo tornozelo. Parar se houver dor na virilha.'],
          byPhase: progressivePhases(
            {
              sets: 2,
              seconds: { min: 10, max: 15 },
              restSeconds: { min: 45, max: 60 },
            },
            {
              sets: 2,
              setsMax: 3,
              seconds: { min: 15, max: 25 },
              restSeconds: { min: 45, max: 60 },
            },
            {
              sets: 2,
              setsMax: 3,
              seconds: { min: 15, max: 25 },
              restSeconds: { min: 45, max: 60 },
            },
          ),
        }),
      ],
    },
    {
      id: 'b-b7',
      namePt: 'Bloco 7 — Tronco superior',
      estimatedMinutes: 12,
      items: [
        item({
          id: 'b-21',
          exerciseId: 'lat-pulldown',
          loadTracked: true,
          allowedAlternativeIds: ['assisted-pull-up', 'inverted-row'],
          notesPt: ['Sem balançar o tronco.'],
          byPhase: progressivePhases(
            { sets: 2, reps: { min: 10 }, restSeconds: { min: 75, max: 90 } },
            { sets: 3, reps: { min: 8, max: 10 }, restSeconds: { min: 75, max: 90 } },
            { sets: 3, reps: { min: 8, max: 10 }, restSeconds: { min: 75, max: 90 } },
          ),
        }),
        item({
          id: 'b-22',
          exerciseId: 'half-kneeling-landmine-press',
          perSide: true,
          loadTracked: true,
          allowedAlternativeIds: ['half-kneeling-cable-press', 'landmine-press'],
          notesPt: ['Joelho contrário ao braço que empurra fica à frente.'],
          byPhase: progressivePhases(
            { sets: 2, reps: { min: 8 }, restSeconds: { min: 60, max: 75 } },
            { sets: 3, reps: { min: 8 }, restSeconds: { min: 60, max: 75 } },
            { sets: 3, reps: { min: 8 }, restSeconds: { min: 60, max: 75 } },
          ),
        }),
      ],
    },
    {
      id: 'b-b8',
      namePt: 'Bloco 8 — Core e transporte',
      estimatedMinutes: 8,
      items: [
        item({
          id: 'b-23',
          exerciseId: 'side-plank',
          perSide: true,
          byPhase: samePhases({
            sets: 2,
            seconds: { min: 20, max: 30 },
            restSeconds: { min: 30, max: 45 },
          }),
        }),
        item({
          id: 'b-24',
          exerciseId: 'farmer-carry',
          loadTracked: true,
          byPhase: samePhases({
            sets: 3,
            meters: { min: 20, max: 30 },
            restSeconds: { min: 45, max: 60 },
            notePt: 'Postura alta e passos controlados.',
          }),
        }),
      ],
    },
    {
      id: 'b-b9',
      namePt: 'Bloco 9 — Recuperação ativa',
      estimatedMinutes: 8,
      items: [
        item({
          id: 'b-25',
          exerciseId: 'stationary-bike',
          byPhase: samePhases({
            sets: 1,
            seconds: { min: 300 },
            notePt: 'Muito leve, permitindo falar normalmente.',
          }),
        }),
        item({
          id: 'b-26',
          exerciseId: 'diaphragmatic-breathing',
          byPhase: samePhases({ sets: 1, reps: { min: 5 } }),
        }),
        item({
          id: 'b-27',
          exerciseId: 'gentle-hip-mobility',
          byPhase: samePhases({ sets: 1, seconds: { min: 60, max: 120 } }),
        }),
      ],
    },
  ],
};
