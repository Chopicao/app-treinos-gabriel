import type { ExerciseDefinition } from '@/domain/types';
import { EQUIPMENT } from './equipment';

/**
 * Entradas informativas. Representam o que acontece fora do controlo da aplicação
 * (treino da equipa, jogo) ou orientações que não são uma prescrição de exercício.
 */
export const sessionMarkerExercises: ExerciseDefinition[] = [
  {
    id: 'football-training',
    namePt: 'Treino de futebol com a equipa',
    nameEn: 'Football team training',
    category: 'conditioning',
    equipment: [EQUIPMENT.space],
    metric: 'informational',
    unilateral: false,
    instructionsPt: [
      'Sessão da equipa, cerca de 90 minutos, intensidade média-alta.',
      'Marca aqui se o treino se realizou e regista o que achares relevante nas notas.',
    ],
    techniqueCuesPt: [
      'A aplicação não prescreve o conteúdo do treino da equipa.',
      'Usa a rotina de mobilidade do dia como complemento, não como substituição do aquecimento da equipa.',
      'Regista fadiga ou desconforto para ajustar a sessão de ginásio seguinte.',
    ],
    safetyNotesPt: ['Comunicar ao treinador qualquer dor que apareça durante o treino.'],
    tags: ['base'],
  },
  {
    id: 'match-play',
    namePt: 'Jogo',
    nameEn: 'Match',
    category: 'conditioning',
    equipment: [EQUIPMENT.space],
    metric: 'informational',
    unilateral: false,
    instructionsPt: [
      'Jogo oficial, normalmente 90 minutos.',
      'Marca aqui se jogaste e quanto tempo, nas notas.',
    ],
    techniqueCuesPt: [
      'Antes do jogo usa movimentos dinâmicos.',
      'Evita alongamentos estáticos prolongados imediatamente antes do jogo.',
      'Hidratação e alimentação fazem parte da preparação.',
    ],
    safetyNotesPt: [
      'Perante dor aguda, estalido ou perda súbita de força, sair e procurar avaliação.',
    ],
    tags: ['base'],
  },
  {
    id: 'dynamic-warmup-note',
    namePt: 'Aquecimento dinâmico antes do jogo',
    nameEn: 'Pre-match dynamic warm-up',
    category: 'conditioning',
    equipment: [EQUIPMENT.space],
    metric: 'informational',
    unilateral: false,
    instructionsPt: [
      'Entrada informativa: antes do jogo usa movimentos dinâmicos, progressivos e curtos.',
      'Segue o aquecimento da equipa. Esta entrada não o substitui nem é uma prescrição médica.',
    ],
    techniqueCuesPt: [
      'Movimentos dinâmicos e progressivos, sem procurar amplitude máxima.',
      'Sem foam rolling demorado imediatamente antes do jogo.',
      'Sem alongamentos estáticos prolongados antes do jogo; ficam para depois ou para uma sessão separada.',
    ],
    safetyNotesPt: [
      'Se algo estiver dorido no aquecimento, informa a equipa técnica antes de entrar em campo.',
    ],
    tags: ['base'],
  },
  {
    id: 'active-recovery-easy',
    namePt: 'Recuperação ativa muito leve',
    nameEn: 'Easy active recovery',
    category: 'recovery',
    equipment: [EQUIPMENT.bike, EQUIPMENT.space, EQUIPMENT.treadmill],
    metric: 'time',
    unilateral: false,
    instructionsPt: [
      'Caminhada, bicicleta ou remo muito leve durante 15 a 20 minutos.',
      'Deves conseguir manter uma conversa normal do princípio ao fim.',
    ],
    techniqueCuesPt: [
      'Intensidade muito baixa: o objetivo é circular sangue, não treinar.',
      'Se estiveres muito cansado, reduz o tempo em vez de aumentar a intensidade.',
      'Respiração confortável durante toda a sessão.',
    ],
    safetyNotesPt: [
      'Dor que não recupera entre sessões é sinal para procurar avaliação, não para fazer mais recuperação ativa.',
    ],
    tags: ['base'],
  },
];
