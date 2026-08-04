import type { AthleteProfile } from '@/domain/types';

/**
 * Perfil vazio.
 *
 * Nenhum dado pessoal ou de saúde é distribuído com a aplicação: idade, altura,
 * peso, posição e historial de lesões são preenchidos no onboarding e ficam
 * guardados apenas neste dispositivo. Assim, os ficheiros publicados não contêm
 * informação sobre ninguém.
 */
export const DEFAULT_PROFILE: Omit<AthleteProfile, 'updatedAt'> = {
  id: 'athlete',
  namePt: '',
  ageYears: null,
  heightCm: null,
  weightKg: null,
  positionPt: '',
  dominantFootPt: '',
  experiencePt: '',
  gymExperiencePt: '',
  phasePt: '',
  sleepHoursPt: '',
  supervisionPt: '',
  injuryHistoryPt: [],
  mobilityNotesPt: [],
  goalsPt: [],
  equipmentPt: [],
  openQuestionsPt: [],
};

/** Sugestões oferecidas no onboarding. São opções genéricas, não dados de ninguém. */
export const POSITION_OPTIONS_PT = [
  'Guarda-redes',
  'Defesa central',
  'Lateral',
  'Médio-defensivo',
  'Médio-centro',
  'Médio-ofensivo',
  'Extremo',
  'Avançado',
];

export const DOMINANT_FOOT_OPTIONS_PT = ['Direito', 'Esquerdo', 'Ambos'];

/** Prioridades do plano. Descrevem o programa, não o atleta. */
export const PLAN_GOALS_PT = [
  'Prevenção de lesões',
  'Mobilidade e flexibilidade',
  'Força da cadeia posterior',
  'Força do tronco superior',
  'Explosividade',
  'Força unilateral',
  'Mudanças de direção',
  'Resistência e condicionamento',
  'Salto',
  'Aceleração',
  'Velocidade máxima',
  'Massa muscular',
];

/** Material que o plano assume existir no ginásio. */
export const PLAN_EQUIPMENT_PT = [
  'Barra olímpica e discos',
  'Rack',
  'Kettlebells',
  'BOSU',
  'Caixa/banco',
  'Bandas elásticas',
  'Cabo/polia',
  'Bola medicinal',
  'Foam roller',
  'Bolas de massagem',
  'Bicicleta',
  'Remo',
  'Passadeira',
  'Pneus com cordas',
];

export const OBJECTIVE_SUMMARY_PT =
  'Objetivo funcional principal: melhorar mobilidade e robustez física e ficar mais forte nos duelos.';

/** Texto de ajuda do onboarding, para quem não sabe o que escrever. */
export const PROFILE_HINTS_PT = {
  injuryHistory:
    'Uma lesão por linha. Serve para te lembrares de onde tens de ter cuidado; fica só neste dispositivo.',
  mobilityNotes: 'Uma nota por linha. Por exemplo: "não chego aos pés com os joelhos esticados".',
  openQuestions:
    'Uma questão por linha. Por exemplo: "confirmar com o fisioterapeuta qual foi a estrutura lesionada".',
  supervision: 'Quem acompanha os treinos e com que experiência.',
};
