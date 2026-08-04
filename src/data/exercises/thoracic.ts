import type { ExerciseDefinition } from '@/domain/types';
import { EQUIPMENT } from './equipment';

/** Coluna torácica e cintura escapular. */
export const thoracicExercises: ExerciseDefinition[] = [
  {
    id: 'cat-cow',
    namePt: 'Gato-camelo',
    nameEn: 'Cat-cow',
    category: 'thoracic-scapular',
    equipment: [EQUIPMENT.mat],
    metric: 'reps',
    unilateral: false,
    instructionsPt: [
      'Em quatro apoios, arredonda a coluna a expirar e depois deixa-a descer suavemente a inspirar.',
      'Uma ida e volta conta como uma repetição.',
    ],
    techniqueCuesPt: [
      'Movimento segmentar: começa na bacia e sobe.',
      'Ritmo lento, acompanhado pela respiração.',
      'Sem forçar os extremos.',
    ],
    safetyNotesPt: ['Reduzir a amplitude se houver desconforto na lombar.'],
    tags: ['base'],
  },
  {
    id: 'open-book',
    namePt: 'Rotação torácica em livro aberto',
    nameEn: 'Open-book thoracic rotation',
    category: 'thoracic-scapular',
    equipment: [EQUIPMENT.mat],
    metric: 'reps',
    unilateral: true,
    instructionsPt: [
      'Deitado de lado, com os joelhos dobrados a 90 graus e os braços à frente, abre o braço de cima acompanhando com o olhar.',
      'Volta devagar. Faz 6 repetições por lado.',
    ],
    techniqueCuesPt: [
      'Os joelhos ficam encostados um ao outro durante toda a rotação.',
      'Expira ao abrir.',
      'Roda a partir do meio das costas, não da lombar.',
      'Vai até onde o ombro chega sem dor.',
    ],
    safetyNotesPt: ['Se a lombar compensar, apoia os joelhos num rolo ou almofada.'],
    tags: ['base'],
  },
  {
    id: 'quadruped-thoracic-rotation',
    namePt: 'Rotação torácica em quatro apoios',
    nameEn: 'Quadruped thoracic rotation',
    category: 'thoracic-scapular',
    equipment: [EQUIPMENT.mat],
    metric: 'reps',
    unilateral: true,
    instructionsPt: [
      'Em quatro apoios, coloca uma mão atrás da cabeça e roda o cotovelo para cima.',
      'Volta devagar levando o cotovelo na direção do braço de apoio.',
    ],
    techniqueCuesPt: [
      'Bacia estável, sem rodar.',
      'A rotação vem do meio das costas.',
      'Acompanha com o olhar.',
    ],
    safetyNotesPt: ['Sem forçar o pescoço.'],
    tags: ['alternative'],
  },
  {
    id: 'wall-slides',
    namePt: 'Deslizamentos na parede',
    nameEn: 'Wall slides',
    category: 'thoracic-scapular',
    equipment: [EQUIPMENT.wall],
    metric: 'reps',
    unilateral: false,
    instructionsPt: [
      'Encostado à parede, apoia os antebraços e as costas das mãos na parede à altura dos ombros.',
      'Desliza os braços para cima mantendo o contacto e desce devagar.',
    ],
    techniqueCuesPt: [
      'Costelas para baixo; a lombar não deve arquear.',
      'Mantém o contacto dos punhos e cotovelos com a parede.',
      'Sobe só até onde consegues manter esse contacto.',
      'Movimento lento nos dois sentidos.',
    ],
    safetyNotesPt: ['Parar perante beliscão ou dor na frente do ombro.'],
    tags: ['base'],
  },
  {
    id: 'band-pull-aparts',
    namePt: 'Afastamento de banda à frente do peito',
    nameEn: 'Band pull-aparts',
    category: 'thoracic-scapular',
    equipment: [EQUIPMENT.band],
    metric: 'reps',
    unilateral: false,
    instructionsPt: [
      'De pé, segura a banda à frente do peito com os braços quase estendidos.',
      'Afasta as mãos até a banda tocar o peito e regressa devagar.',
    ],
    techniqueCuesPt: [
      'Omoplatas juntam-se no fim do movimento.',
      'Sem arquear a lombar nem encolher os ombros.',
      'Retorno controlado em 2 segundos.',
    ],
    safetyNotesPt: ['Usar uma banda leve o suficiente para não perder a postura.'],
    tags: ['alternative'],
  },
];
