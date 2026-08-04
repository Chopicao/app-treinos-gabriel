/** Textos de segurança. Discretos, sem alarmismo repetido em todos os ecrãs. */

export const DISCLAIMER_SHORT_PT =
  'Esta aplicação acompanha um plano fornecido por ti. Não diagnostica, não trata e não substitui um médico, fisioterapeuta desportivo ou treinador certificado.';

export const DISCLAIMER_LONG_PT = [
  'Esta aplicação acompanha um plano fornecido pelo utilizador. Não diagnostica, não trata e não substitui a avaliação de um médico, fisioterapeuta desportivo ou treinador certificado.',
  'A progressão depende sempre de técnica correta, ausência de dor e supervisão. Não há cálculo de 1RM, séries até à falha nem sugestões automáticas de cargas máximas.',
  'As sugestões de progressão são informativas: a aplicação nunca altera a carga sozinha.',
];

/** Sinais para interromper o exercício e procurar avaliação adequada. */
export const STOP_SIGNS_PT = [
  'Dor aguda ou que aumenta durante o exercício.',
  'Estalido ou sensação de rutura.',
  'Perda súbita de força.',
  'Dor localizada nos posteriores da coxa.',
  'Dor persistente no tornozelo, joelho, calcanhar, anca ou lombar.',
  'Alteração da corrida ou da marcha.',
  'Dor que não recupera entre sessões.',
  'Sensações elétricas, ardor ou picada durante a mobilização dos posteriores.',
];

export const PAIN_SKIP_NOTICE_PT =
  'Registaste dor ou desconforto. Interrompe o exercício e procura avaliação adequada se a dor for aguda, crescente ou persistente. Não compenses com mais volume noutro exercício.';

export const RPE_SCALE_NOTICE_PT =
  'As escalas de esforço e de desconforto servem para acompanhar tendências ao longo do tempo. Não são um diagnóstico.';

export const TEMPO_EXPLANATION_PT =
  'O código de tempo indica a duração de cada fase da repetição, em segundos: primeiro a descida, depois a pausa e por fim a subida. Por exemplo, 3–1–1 significa 3 segundos a descer, 1 segundo de pausa e 1 segundo a subir.';

export const PROGRESSION_RULE_PT =
  'Só deves considerar o próximo pequeno aumento quando completares todas as repetições com boa técnica, sem dor, em duas sessões consecutivas. A sugestão é informativa e nunca altera a carga automaticamente. Não treinar até à falha.';

export const FATIGUE_RECOMMENDATION_PT =
  'Recomendação predefinida do plano para dias de fadiga: reduzir uma série dos exercícios de pernas.';

export const HEAVY_HAMSTRINGS_NOTE_PT =
  'Se os posteriores ficarem pesados na sexta-feira, a primeira adaptação prevista no plano é retirar o hamstring walkout e reduzir o peso morto para duas séries. É uma nota do plano, não uma decisão clínica automática.';

export interface PlanReference {
  titlePt: string;
  url: string;
}

/**
 * Referências gerais. Não se afirma que estas fontes validam individualmente
 * cada prescrição deste plano.
 */
export const PLAN_REFERENCES: PlanReference[] = [
  {
    titlePt: 'Declaração de posição sobre treino de força em jovens',
    url: 'https://pubmed.ncbi.nlm.nih.gov/19620931/',
  },
  {
    titlePt: 'Foam rolling comparado com alongamento estático',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38760635/',
  },
  {
    titlePt: 'Prevenção de entorse no futebol jovem',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29864071/',
  },
  {
    titlePt: 'Efeitos agudos de alongamento estático e dinâmico',
    url: 'https://pubmed.ncbi.nlm.nih.gov/21373870/',
  },
  {
    titlePt: 'Programas com Nordic e lesões dos posteriores',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27752982/',
  },
  {
    titlePt: 'Programa de fortalecimento de adutores',
    url: 'https://pubmed.ncbi.nlm.nih.gov/29891614/',
  },
  {
    titlePt: 'FIFA 11+ e prevenção de lesões',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26378030/',
  },
];

export const REFERENCES_DISCLAIMER_PT =
  'Estas referências são leitura de contexto sobre os temas do plano. Não se afirma que validam individualmente cada série, repetição ou exercício aqui prescrito, e correlação não é garantia de prevenção.';
