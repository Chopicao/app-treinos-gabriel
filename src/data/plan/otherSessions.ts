import type { SessionTemplate } from '@/domain/types';
import { item, samePhases } from './helpers';

/** Treino da equipa. A aplicação apenas regista que aconteceu. */
export const footballSession: SessionTemplate = {
  id: 'football',
  namePt: 'Treino de futebol',
  shortNamePt: 'Futebol',
  kind: 'football',
  summaryPt: 'Sessão da equipa, cerca de 90 minutos, intensidade média-alta.',
  estimatedMinutes: { min: 90, max: 90 },
  equipmentPt: [],
  notesPt: [
    'O conteúdo do treino é definido pela equipa técnica. A aplicação só regista a sessão e as tuas notas.',
    'Faz a rotina de mobilidade em separado do treino, não imediatamente antes.',
  ],
  blocks: [
    {
      id: 'fut-b1',
      namePt: 'Sessão da equipa',
      items: [
        item({
          id: 'fut-1',
          exerciseId: 'football-training',
          byPhase: samePhases({ sets: 1 }),
        }),
      ],
    },
  ],
};

export const matchSession: SessionTemplate = {
  id: 'match',
  namePt: 'Jogo',
  shortNamePt: 'Jogo',
  kind: 'match',
  summaryPt: 'Jogo oficial, normalmente 90 minutos.',
  estimatedMinutes: { min: 90, max: 90 },
  equipmentPt: [],
  notesPt: [
    'Sem alongamento estático prolongado antes do jogo.',
    'Regista nas notas os minutos jogados e como te sentiste.',
  ],
  blocks: [
    {
      id: 'jogo-b1',
      namePt: 'Jogo',
      items: [
        item({
          id: 'jogo-1',
          exerciseId: 'match-play',
          byPhase: samePhases({ sets: 1 }),
        }),
      ],
    },
  ],
};

export const recoverySession: SessionTemplate = {
  id: 'recovery',
  namePt: 'Recuperação ativa',
  shortNamePt: 'Recuperação',
  kind: 'recovery',
  summaryPt: 'Movimento muito leve no dia seguinte ao jogo, para circular sangue sem criar fadiga.',
  estimatedMinutes: { min: 15, max: 25 },
  equipmentPt: ['Bicicleta, passadeira ou apenas caminhar'],
  notesPt: [
    'Intensidade muito baixa. Deves conseguir manter uma conversa normal do princípio ao fim.',
    'Se ficares com dor que não recupera entre sessões, procura avaliação em vez de fazer mais recuperação ativa.',
  ],
  blocks: [
    {
      id: 'rec-b1',
      namePt: 'Recuperação ativa',
      estimatedMinutes: 20,
      items: [
        item({
          id: 'rec-1',
          exerciseId: 'active-recovery-easy',
          allowedAlternativeIds: ['stationary-bike', 'treadmill-walk', 'rowing-machine'],
          byPhase: samePhases({
            sets: 1,
            seconds: { min: 900, max: 1200 },
            notePt: '15 a 20 minutos muito leves.',
          }),
        }),
        item({
          id: 'rec-2',
          exerciseId: 'diaphragmatic-breathing',
          byPhase: samePhases({ sets: 1, reps: { min: 5 } }),
        }),
      ],
    },
  ],
};
