import { expect, test, type Page } from '@playwright/test';

/**
 * Fluxo crítico ponta a ponta.
 *
 * O relógio do navegador é congelado numa terça-feira para que o dia de hoje
 * tenha sempre o Ginásio A e para que os temporizadores sejam determinísticos.
 */
const TUESDAY = '2026-08-04T09:00:00.000Z';
const MONDAY_WEEK_1 = '2026-08-03';

/** A chave da ocorrência vai no URL com o `@` codificado. */
const GYM_A_URL = /\/sessao\/gym-a%402026-08-04$/;
const GYM_A_RUNNER_URL = /\/sessao\/gym-a%402026-08-04\/treinar$/;

/**
 * Relógio virtual controlado pelo teste. `page.clock.install` volta a aplicar a
 * hora inicial a cada navegação, por isso guardamos aqui o tempo já avançado e
 * repomo-lo depois de um reload — que é exatamente o que acontece na vida real:
 * o relógio do mundo não recua quando se fecha a aplicação.
 */
class VirtualClock {
  private ms = new Date(TUESDAY).getTime();
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async install() {
    await this.page.clock.install({ time: new Date(this.ms) });
  }

  async advance(ms: number) {
    this.ms += ms;
    await this.page.clock.runFor(ms);
  }

  async reload() {
    await this.page.reload();
    await this.page.clock.setSystemTime(new Date(this.ms));
  }
}

async function bootstrap(page: Page, options: { startDate?: string } = {}) {
  const clock = new VirtualClock(page);
  await clock.install();

  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await completeOnboarding(page, options.startDate ?? MONDAY_WEEK_1);
  return { errors, clock };
}

async function completeOnboarding(page: Page, startDate: string) {
  await expect(page.getByRole('heading', { name: 'Antes de começar' })).toBeVisible();
  await page.getByLabel('Primeiro dia do plano').fill(startDate);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /confirmar e começar/i }).click();
  await expect(page.getByRole('heading', { name: /olá/i })).toBeVisible();
}

async function openTodaysGymA(page: Page) {
  await page.getByRole('link', { name: /Ginásio A/ }).first().click();
  await page.waitForURL(GYM_A_URL);
  await expect(page.getByRole('heading', { level: 1, name: /Ginásio A/ })).toBeVisible();
}

async function goToRunner(page: Page) {
  await page.getByRole('link', { name: /(iniciar|continuar) treino/i }).click();
  await page.waitForURL(GYM_A_RUNNER_URL);
}

async function goToExercise(page: Page, name: string) {
  for (let index = 0; index < 40; index += 1) {
    if (await page.getByRole('heading', { level: 2, name, exact: true }).isVisible()) return;
    await page.getByRole('button', { name: 'Exercício seguinte', exact: true }).click();
    await page.waitForTimeout(80);
  }
  throw new Error(`Não cheguei ao exercício "${name}"`);
}

test('1–2. o calendário gera a semana-tipo e a terça abre o Ginásio A com a prescrição da semana', async ({
  page,
}) => {
  await bootstrap(page);

  await page.getByRole('link', { name: 'Calendário' }).first().click();
  await page.waitForURL(/\/calendario$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Calendário' })).toBeVisible();
  await expect(page.getByText(/^Semana de segunda-feira, 3 de agosto/)).toBeVisible();

  // Segunda-feira: futebol + rotina de mobilidade.
  await page.getByRole('button', { name: /segunda-feira, 3 de agosto/i }).click();
  await expect(page.getByRole('heading', { name: 'Treino de futebol' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Rotina diária de mobilidade' })).toBeVisible();

  // Quinta-feira: Ginásio B.
  await page.getByRole('button', { name: /quinta-feira, 6 de agosto/i }).click();
  await expect(page.getByRole('heading', { name: /Ginásio B/ })).toBeVisible();

  // Sábado: aquecimento + jogo.
  await page.getByRole('button', { name: /sábado, 8 de agosto/i }).click();
  await expect(page.getByRole('heading', { name: 'Jogo', exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Aquecimento dinâmico antes do jogo' }),
  ).toBeVisible();

  // Domingo: recuperação ativa + mobilidade.
  await page.getByRole('button', { name: /domingo, 9 de agosto/i }).click();
  await expect(page.getByRole('heading', { name: 'Recuperação ativa' })).toBeVisible();

  // Terça-feira: Ginásio A, com a prescrição da semana 1.
  await page.getByRole('button', { name: /terça-feira, 4 de agosto/i }).click();
  await page.getByRole('link', { name: /Ginásio A/ }).click();
  await page.waitForURL(GYM_A_URL);

  await expect(page.getByText('Semana 1').first()).toBeVisible();
  await expect(page.getByText('Progressão — Semanas 1–2')).toBeVisible();
  await expect(page.getByText('2 × 10 · tempo 3–1–1 · descanso 90–120 s')).toBeVisible();
  await expect(page.getByText('2 × 8 por lado · tempo 3–1–1 · descanso 75–90 s')).toBeVisible();
});

test('3–7. registar séries, lados, carga, tempo e distância, retomar e concluir a sessão', async ({
  page,
}) => {
  const { errors, clock } = await bootstrap(page);
  await openTodaysGymA(page);
  await goToRunner(page);

  // --- 4. Exercício por tempo: iniciar, pausar, retomar, reload, concluir ----
  await expect(page.getByRole('heading', { name: 'Bicicleta estacionária' })).toBeVisible();
  await expect(page.getByText('05:00')).toBeVisible();

  await page.getByRole('button', { name: 'Iniciar', exact: true }).click();
  await clock.advance(60_000);
  await expect(page.getByText('04:00')).toBeVisible();

  await page.getByRole('button', { name: 'Pausar', exact: true }).click();
  await clock.advance(120_000);
  // Em pausa o tempo não corre.
  await expect(page.getByText('04:00')).toBeVisible();

  await page.getByRole('button', { name: 'Retomar', exact: true }).click();
  await clock.advance(30_000);
  await expect(page.getByText('03:30')).toBeVisible();

  // Recarregar a página retoma exatamente no mesmo ponto.
  await clock.reload();
  await expect(page.getByRole('heading', { name: 'Bicicleta estacionária' })).toBeVisible();
  await expect(page.getByText('03:30')).toBeVisible();

  await clock.advance(30_000);
  await expect(page.getByText('03:00')).toBeVisible();

  // Termina uma única vez e regista o tempo efetivo.
  await page.getByRole('button', { name: 'Concluir', exact: true }).click();
  await expect(page.getByText('Concluído')).toBeVisible();
  await expect(page.getByText('Registado: 2 min')).toBeVisible();

  // --- 6. A sessão interrompida fica "em curso" e continua no ponto certo ----
  await page.getByRole('button', { name: /sair/i }).click();
  await page.waitForURL(GYM_A_URL);
  await expect(page.getByText('Em curso')).toBeVisible();

  await page.getByRole('link', { name: 'Hoje' }).first().click();
  await page.waitForURL(/\/$/);
  await expect(page.getByText('Em curso')).toBeVisible();
  await openTodaysGymA(page);
  await goToRunner(page);
  await expect(page.getByRole('heading', { name: 'Bicicleta estacionária' })).toBeVisible();

  // --- 3. Repetições: cada lado é concluído em separado -------------------
  await goToExercise(page, 'Mobilização do tornozelo joelho-à-parede');
  await expect(page.getByText('Série 1 · lado esquerdo')).toBeVisible();
  await expect(page.getByText('Série 1 · lado direito')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Concluir', exact: true })).toHaveCount(4);

  await page.getByRole('button', { name: 'Concluir', exact: true }).first().click();
  // Só uma das quatro linhas ficou concluída: o outro lado continua por fazer.
  await expect(page.getByRole('button', { name: /desfazer/i })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Concluir', exact: true })).toHaveCount(3);

  // --- Carga opcional num exercício de força -------------------------------
  await goToExercise(page, 'Goblet squat até à caixa com kettlebell');
  await page.getByLabel('Repetições').first().fill('10');
  await page.getByLabel('Carga (kg)').first().fill('16');
  await page.getByRole('button', { name: 'Concluir', exact: true }).first().click();
  await expect(page.getByText('Carga registada: 16 kg')).toBeVisible();

  // --- 5. Distância: metros e carga ----------------------------------------
  await goToExercise(page, 'Transporte de mala (suitcase carry)');
  await page.getByLabel('Metros').first().fill('22');
  await page.getByLabel('Carga (kg)').first().fill('20');
  await page.getByRole('button', { name: 'Concluir', exact: true }).first().click();
  await expect(page.getByText('Carga registada: 20 kg')).toBeVisible();

  // --- 7. Terminar e ver o resumo com os valores registados -----------------
  await page.getByRole('button', { name: 'Terminar sessão', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Terminar sessão' })).toBeVisible();
  await page.getByRole('button', { name: /terminar mesmo assim/i }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Terminar sessão' }).click();

  await page.waitForURL(/\/historico\//);
  await expect(page.getByText('Parcial')).toBeVisible();
  await expect(page.getByText('22 m · 20 kg')).toBeVisible();
  await expect(page.getByText('10 reps · 16 kg')).toBeVisible();
  await expect(page.getByText('Registado: 2 min')).toHaveCount(0);

  // O calendário reflete o estado da sessão.
  await page.getByRole('link', { name: 'Calendário' }).first().click();
  await page.waitForURL(/\/calendario$/);
  await page.getByRole('button', { name: /terça-feira, 4 de agosto/i }).click();
  await expect(page.getByRole('link', { name: /Ginásio A/ })).toContainText('Parcial');

  expect(errors, `erros na consola: ${errors.join(' | ')}`).toEqual([]);
});

test('8. mudar de semana altera a prescrição sem tocar no histórico anterior', async ({ page }) => {
  // A semana 1 começou há duas semanas, por isso hoje é a semana 3.
  await bootstrap(page, { startDate: '2026-07-20' });

  await openTodaysGymA(page);
  await expect(page.getByText('Progressão — Semanas 3–4')).toBeVisible();
  await expect(page.getByText('3 × 8 · tempo 3–1–1 · descanso 90–120 s')).toBeVisible();

  // Regista uma série nesta semana.
  await goToRunner(page);
  await goToExercise(page, 'Goblet squat até à caixa com kettlebell');
  await expect(page.getByText('Série 3')).toBeVisible();
  await page.getByRole('button', { name: 'Concluir', exact: true }).first().click();
  await page.getByRole('button', { name: /sair/i }).click();
  await page.waitForURL(GYM_A_URL);

  // Avança a fase do plano, mudando a data inicial.
  await page.getByRole('link', { name: 'Definições' }).first().click();
  await page.waitForURL(/\/definicoes$/);
  await page.getByLabel('Início da semana 1').fill('2026-07-06');
  await page.getByRole('link', { name: 'Hoje' }).first().click();
  await page.waitForURL(/\/$/);
  await openTodaysGymA(page);
  await expect(page.getByText('Progressão — Semanas 5–6')).toBeVisible();

  // O histórico mantém a prescrição com que foi registado.
  await page.getByRole('link', { name: 'Histórico' }).first().click();
  await page.waitForURL(/\/historico$/);
  await page.getByRole('link', { name: /Ginásio A/ }).first().click();
  await page.waitForURL(/\/historico\//);
  await expect(page.getByText('semana 3')).toBeVisible();
  await expect(page.getByText('3 × 8 · tempo 3–1–1 · descanso 90–120 s')).toBeVisible();
});

test('9. remarcar uma ocorrência não desloca as semanas futuras', async ({ page }) => {
  await bootstrap(page);
  await openTodaysGymA(page);

  await page.getByRole('button', { name: 'Remarcar', exact: true }).click();
  await page.getByLabel('Nova data').fill('2026-08-05');
  await page.getByRole('dialog').getByRole('button', { name: 'Remarcar', exact: true }).click();

  await page.getByRole('link', { name: 'Calendário' }).first().click();
  await page.waitForURL(/\/calendario$/);

  // Terça já não tem Ginásio A; quarta passou a ter.
  await page.getByRole('button', { name: /terça-feira, 4 de agosto/i }).click();
  await expect(page.getByRole('heading', { name: /Ginásio A/ })).toHaveCount(0);
  await page.getByRole('button', { name: /quarta-feira, 5 de agosto/i }).click();
  await expect(page.getByRole('heading', { name: /Ginásio A/ })).toBeVisible();

  // A semana seguinte mantém-se intacta.
  await page.getByRole('button', { name: /período seguinte/i }).click();
  await page.getByRole('button', { name: /terça-feira, 11 de agosto/i }).click();
  await expect(page.getByRole('heading', { name: /Ginásio A/ })).toBeVisible();
  await page.getByRole('button', { name: /quarta-feira, 12 de agosto/i }).click();
  await expect(page.getByRole('heading', { name: /Ginásio A/ })).toHaveCount(0);

  // Repor devolve a sessão ao dia original.
  await page.getByRole('button', { name: /período anterior/i }).click();
  await page.getByRole('button', { name: /quarta-feira, 5 de agosto/i }).click();
  await page.getByRole('link', { name: /Ginásio A/ }).click();
  await page.waitForURL(GYM_A_URL);
  await page.getByRole('button', { name: /repor data original/i }).click();
  await page.getByRole('link', { name: 'Calendário' }).first().click();
  await page.waitForURL(/\/calendario$/);
  await page.getByRole('button', { name: /terça-feira, 4 de agosto/i }).click();
  await expect(page.getByRole('heading', { name: /Ginásio A/ })).toBeVisible();
});

test('10. a biblioteca separa exercícios ativos de progressões futuras e mostra o vídeo', async ({
  page,
}) => {
  await bootstrap(page);
  await page.getByRole('link', { name: 'Exercícios' }).first().click();
  await page.waitForURL(/\/exercicios$/);

  await expect(page.getByRole('heading', { name: 'Ativos no plano' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Progressões de fase posterior' })).toBeVisible();

  await page.getByLabel('Pesquisar').fill('goblet');
  await page.getByRole('link', { name: /Goblet squat até à caixa/ }).click();
  await page.waitForURL(/\/exercicios\/goblet-squat-to-box$/);

  await expect(
    page.getByRole('heading', { name: 'Goblet squat até à caixa com kettlebell' }),
  ).toBeVisible();

  await page.getByRole('button', { name: /ver vídeo/i }).click();
  // Nada é pedido ao YouTube antes de uma ação explícita.
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /abrir no youtube/i })).toBeVisible();
  await page.getByRole('button', { name: /carregar vídeo/i }).click();
  await expect(page.locator('iframe')).toHaveCount(1);
  await expect(page.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com/);
});

test('12. importar JSON inválido não apaga os dados existentes', async ({ page }) => {
  await bootstrap(page);

  // Cria histórico antes de tentar importar.
  await openTodaysGymA(page);
  await goToRunner(page);
  await page.getByRole('button', { name: /sair/i }).click();
  await page.getByRole('link', { name: 'Histórico' }).first().click();
  await page.waitForURL(/\/historico$/);
  await expect(page.getByRole('link', { name: /Ginásio A/ })).toHaveCount(1);

  await page.getByRole('link', { name: 'Definições' }).first().click();
  await page.waitForURL(/\/definicoes$/);
  await page.getByLabel('Ficheiro de importação').setInputFiles({
    name: 'invalido.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{ isto não é json válido'),
  });
  await expect(page.getByText(/não é json válido/i)).toBeVisible();

  await page.getByRole('link', { name: 'Histórico' }).first().click();
  await page.waitForURL(/\/historico$/);
  await expect(page.getByRole('link', { name: /Ginásio A/ })).toHaveCount(1);
});

test('13. o fluxo principal é navegável por teclado', async ({ page }) => {
  await bootstrap(page);

  // Numa página acabada de abrir, o primeiro tab chega à ligação de salto.
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /olá/i })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: /saltar para o conteúdo/i })).toBeFocused();

  // A navegação principal é alcançável e ativável por teclado.
  await page.getByRole('link', { name: 'Calendário' }).first().focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/calendario$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Calendário' })).toBeVisible();

  await page.getByRole('link', { name: 'Exercícios' }).first().focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/exercicios$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Exercícios' })).toBeVisible();
});

test('a página não desliza na horizontal em ecrãs estreitos', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await bootstrap(page);
  await openTodaysGymA(page);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
