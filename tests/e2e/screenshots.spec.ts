import { expect, test, type Page } from '@playwright/test';

/**
 * Revisão visual. Não é um teste de regressão de imagem: serve para gerar
 * capturas dos ecrãs principais em telemóvel e desktop, guardadas em
 * `test-results/visual/`. Corre com:
 *
 *   npx playwright test tests/e2e/screenshots.spec.ts --project=mobile-360
 */
const OUT = 'test-results/visual';

async function setup(page: Page) {
  await page.clock.install({ time: new Date('2026-08-04T09:00:00.000Z') });
  await page.goto('/');
  await page.getByLabel('Primeiro dia do plano').fill('2026-08-03');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /confirmar e começar/i }).click();
  await expect(page.getByRole('heading', { name: /olá/i })).toBeVisible();
}

test('capturas dos ecrãs principais', async ({ page }, testInfo) => {
  const label = testInfo.project.name;
  const shot = async (name: string) =>
    page.screenshot({ path: `${OUT}/${label}-${name}.png`, fullPage: true });

  await page.clock.install({ time: new Date('2026-08-04T09:00:00.000Z') });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Antes de começar' })).toBeVisible();
  await shot('01-onboarding');

  await setup(page);
  await shot('02-hoje');

  await page.getByRole('link', { name: 'Calendário' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Calendário' })).toBeVisible();
  await shot('03-calendario-semana');

  await page.getByRole('tab', { name: 'Mês' }).click();
  await shot('04-calendario-mes');

  await page.getByRole('link', { name: 'Hoje' }).first().click();
  await page.getByRole('link', { name: /Ginásio A/ }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: /Ginásio A/ })).toBeVisible();
  await shot('05-detalhe-treino');

  await page.getByRole('link', { name: /iniciar treino/i }).click();
  await expect(page.getByRole('heading', { name: 'Bicicleta estacionária' })).toBeVisible();
  await shot('06-realizar-treino-tempo');

  for (let index = 0; index < 5; index += 1) {
    await page.getByRole('button', { name: 'Exercício seguinte', exact: true }).click();
    await page.waitForTimeout(120);
  }
  await expect(
    page.getByRole('heading', { name: 'Mobilização do tornozelo joelho-à-parede' }),
  ).toBeVisible();
  await page.getByText('Como executar').click();
  await page.waitForTimeout(120);
  await shot('07-realizar-treino-repeticoes');

  await page.getByRole('button', { name: /sair/i }).click();
  await page.getByRole('link', { name: 'Exercícios' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Exercícios' })).toBeVisible();
  await shot('08-biblioteca');

  await page.getByLabel('Pesquisar').fill('copenhaga');
  await page.getByRole('link', { name: /Prancha de Copenhaga curta/ }).click();
  await expect(page.getByRole('heading', { name: 'Prancha de Copenhaga curta' })).toBeVisible();
  await shot('09-exercicio');

  await page.getByRole('link', { name: 'Definições' }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: 'Definições' })).toBeVisible();
  await shot('10-definicoes');

  await page.goto('/sobre');
  await expect(page.getByRole('heading', { level: 1, name: 'Sobre o plano' })).toBeVisible();
  await shot('11-sobre-o-plano');

  await page.goto('/definicoes/videos');
  await expect(page.getByRole('heading', { level: 1, name: 'Revisão de vídeos' })).toBeVisible();
  await shot('12-revisao-videos');
});
