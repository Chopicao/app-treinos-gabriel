import type { ExerciseDefinition } from '@/domain/types';
import { EQUIPMENT } from './equipment';

/** Libertação miofascial com rolo e bola. */
export const releaseExercises: ExerciseDefinition[] = [
  {
    id: 'plantar-fascia-ball-release',
    namePt: 'Libertação da planta do pé com bola',
    nameEn: 'Plantar fascia ball release',
    category: 'release',
    equipment: [EQUIPMENT.massageBall],
    metric: 'time',
    unilateral: true,
    instructionsPt: [
      'Sentado ou de pé junto a um apoio, coloca uma bola pequena debaixo do arco do pé.',
      'Rola devagar do calcanhar até à base dos dedos, mantendo uma pressão que consegues tolerar sem crispar.',
      'Faz 30 segundos por pé e depois troca.',
    ],
    techniqueCuesPt: [
      'Pressão moderada: deves conseguir respirar normalmente.',
      'Movimento lento, cerca de um percurso completo a cada 3 a 4 segundos.',
      'Se encontrares um ponto sensível, pára aí alguns segundos em vez de esfregar com força.',
      'Mantém o resto do corpo relaxado.',
    ],
    safetyNotesPt: [
      'Não rolar diretamente sobre o calcanhar dorido nem sobre o tendão de Aquiles.',
      'O rolo e a bola podem ajudar temporariamente na amplitude e na sensação de recuperação, mas não partem nem descolam a fáscia.',
    ],
    tags: ['base'],
  },
  {
    id: 'calf-foam-roll',
    namePt: 'Rolo nos gémeos',
    nameEn: 'Calf foam roll',
    category: 'release',
    equipment: [EQUIPMENT.foamRoller],
    metric: 'time',
    unilateral: true,
    instructionsPt: [
      'Sentado no chão, coloca o rolo debaixo da barriga da perna e apoia as mãos atrás.',
      'Levanta ligeiramente a bacia e rola entre o tornozelo e a parte de trás do joelho.',
      'Faz 30 segundos por perna.',
    ],
    techniqueCuesPt: [
      'Pressão moderada; se precisares de menos, mantém a bacia no chão.',
      'Roda ligeiramente o pé para dentro e para fora para variar a zona.',
      'Respira devagar e não prendas a respiração.',
      'Evita a zona logo atrás do joelho.',
    ],
    safetyNotesPt: [
      'Não pressionar o tendão de Aquiles nem a zona posterior do joelho.',
      'Interromper se surgir formigueiro, ardor ou dormência.',
    ],
    tags: ['base'],
  },
  {
    id: 'soleus-foam-roll',
    namePt: 'Rolo no solear',
    nameEn: 'Soleus foam roll',
    category: 'release',
    equipment: [EQUIPMENT.foamRoller],
    metric: 'time',
    unilateral: true,
    instructionsPt: [
      'Coloca o rolo na zona baixa da barriga da perna, próximo do tornozelo, com o joelho ligeiramente fletido.',
      'Rola apenas o terço inferior da perna durante 30 segundos por lado.',
    ],
    techniqueCuesPt: [
      'Joelho dobrado para focar o solear em vez do gémeo.',
      'Percursos curtos e lentos.',
      'Pressão sempre tolerável.',
    ],
    safetyNotesPt: ['Não rolar sobre o tendão de Aquiles.'],
    tags: ['alternative'],
  },
  {
    id: 'quadriceps-foam-roll',
    namePt: 'Rolo no quadricípite',
    nameEn: 'Quadriceps foam roll',
    category: 'release',
    equipment: [EQUIPMENT.foamRoller],
    metric: 'time',
    unilateral: true,
    instructionsPt: [
      'Deitado de barriga para baixo, apoia a frente da coxa sobre o rolo com os antebraços no chão.',
      'Rola entre a anca e a zona acima do joelho durante 30 segundos por perna.',
    ],
    techniqueCuesPt: [
      'Mantém o abdominal ativo para não deixar a lombar cair.',
      'Não passes por cima da rótula.',
      'Movimento lento e controlado.',
      'Se for demasiado intenso, apoia mais o peso na perna contrária.',
    ],
    safetyNotesPt: [
      'Se houver uma lesão da frente da coxa ou da perna ainda por esclarecer, evitar essa zona enquanto não estiver avaliada e sem dor.',
    ],
    tags: ['base'],
  },
  {
    id: 'adductor-foam-roll',
    namePt: 'Rolo nos adutores',
    nameEn: 'Adductor foam roll',
    category: 'release',
    equipment: [EQUIPMENT.foamRoller],
    metric: 'time',
    unilateral: true,
    instructionsPt: [
      'Deitado de barriga para baixo, afasta uma perna para o lado com o joelho dobrado e apoia a face interna da coxa sobre o rolo.',
      'Rola devagar entre a virilha e a zona acima do joelho, 30 segundos por lado.',
    ],
    techniqueCuesPt: [
      'Fica na parte carnuda da coxa, longe do joelho.',
      'Controla a pressão com o peso do tronco.',
      'Respira devagar durante todo o exercício.',
    ],
    safetyNotesPt: [
      'Não rolar sobre osso nem sobre a face interna do joelho.',
      'Parar se houver dor aguda na virilha.',
    ],
    tags: ['base'],
  },
  {
    id: 'glute-foam-roll',
    namePt: 'Rolo nos glúteos',
    nameEn: 'Glute foam roll',
    category: 'release',
    equipment: [EQUIPMENT.foamRoller],
    metric: 'time',
    unilateral: true,
    instructionsPt: [
      'Sentado sobre o rolo, cruza o tornozelo de um lado sobre o joelho oposto.',
      'Inclina o peso para o lado a trabalhar e rola devagar durante 30 segundos por lado.',
    ],
    techniqueCuesPt: [
      'Apoia as mãos atrás para regular a pressão.',
      'Procura a zona carnuda do glúteo, não o osso da bacia.',
      'Percursos curtos e lentos.',
    ],
    safetyNotesPt: ['Interromper se aparecer formigueiro ou dor que desce pela perna.'],
    tags: ['base'],
  },
];
