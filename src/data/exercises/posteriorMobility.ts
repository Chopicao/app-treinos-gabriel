import type { ExerciseDefinition } from '@/domain/types';
import { EQUIPMENT } from './equipment';

/** Mobilidade da cadeia posterior. Zona sensível quando há historial de lesão nos posteriores. */
export const posteriorMobilityExercises: ExerciseDefinition[] = [
  {
    id: 'supine-active-slr',
    namePt: 'Elevação ativa da perna estendida em decúbito dorsal',
    nameEn: 'Supine active straight-leg raise',
    category: 'posterior-mobility',
    equipment: [EQUIPMENT.mat],
    metric: 'reps',
    unilateral: true,
    instructionsPt: [
      'Deitado de costas, com as duas pernas esticadas, levanta uma perna esticada o mais alto que conseguires sem dobrar o joelho.',
      'Baixa devagar e repete. A outra perna fica no chão.',
    ],
    techniqueCuesPt: [
      'A perna de baixo mantém-se em contacto com o chão.',
      'Lombar apoiada; sem levantar a bacia para ganhar amplitude.',
      'Sobe pelo teu próprio esforço, sem puxar com as mãos.',
      'Amplitude sem dor; melhora ao longo das semanas.',
    ],
    safetyNotesPt: [
      'Sensações elétricas, ardor ou picada nos posteriores são sinal para parar.',
      'Com pouca flexibilidade é normal a amplitude ser pequena no início; a progressão é gradual.',
    ],
    tags: ['base'],
  },
  {
    id: 'banded-hamstring-floss',
    namePt: 'Deslizamento neural dos posteriores com banda',
    nameEn: 'Banded hamstring floss',
    category: 'posterior-mobility',
    equipment: [EQUIPMENT.band, EQUIPMENT.mat],
    metric: 'reps',
    unilateral: true,
    instructionsPt: [
      'Deitado de costas, passa a banda pela planta do pé e segura as pontas.',
      'Com a anca fletida, estica e dobra o joelho devagar, sem forçar o fim da amplitude.',
      'Faz 8 repetições lentas por lado.',
    ],
    techniqueCuesPt: [
      'Movimento lento: cerca de 3 segundos por repetição.',
      'A banda guia, não puxa com força.',
      'Para antes da sensação de estiramento máximo.',
      'Se surgir formigueiro, reduz imediatamente a amplitude.',
    ],
    safetyNotesPt: [
      'Nunca forçar. Sensações elétricas, ardor ou picada durante a mobilização dos posteriores são sinal para parar.',
    ],
    tags: ['base'],
  },
  {
    id: 'elephant-walk',
    namePt: 'Caminhada do elefante',
    nameEn: 'Elephant walk',
    category: 'posterior-mobility',
    equipment: [EQUIPMENT.space],
    metric: 'reps',
    unilateral: true,
    instructionsPt: [
      'De pé, dobra-te à frente e apoia as mãos no chão ou nas canelas com os joelhos ligeiramente fletidos.',
      'Alterna a extensão de um joelho de cada vez, mantendo o outro dobrado.',
    ],
    techniqueCuesPt: [
      'Movimento alternado e ritmado.',
      'Costas longas, sem arredondar em força.',
      'Amplitude confortável.',
    ],
    safetyNotesPt: ['Não usar como alongamento estático prolongado antes do jogo.'],
    tags: ['alternative'],
  },
  {
    id: 'single-leg-hamstring-hinge-reach',
    namePt: 'Alcance em dobradiça numa perna',
    nameEn: 'Single-leg hamstring hinge reach',
    category: 'posterior-mobility',
    equipment: [EQUIPMENT.bodyweight],
    metric: 'reps',
    unilateral: true,
    instructionsPt: [
      'Em apoio numa perna, com o joelho ligeiramente fletido, dobra-te à frente a partir da anca e alcança à frente com a mão oposta.',
      'Regressa devagar à vertical.',
    ],
    techniqueCuesPt: [
      'Costas neutras do início ao fim.',
      'A anca vai atrás enquanto o tronco vai à frente.',
      'Perna de trás alinhada com o tronco.',
      'Sem rodar a bacia.',
    ],
    safetyNotesPt: ['Parar perante qualquer dor localizada nos posteriores.'],
    tags: ['alternative'],
  },
];
