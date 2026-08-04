/**
 * Smoke test do build publicado num subdiretório (GitHub Pages).
 *
 * Um erro no caminho base ou no `basename` do router só se nota depois de
 * publicar, por isso vale a pena verificar antes: carrega a aplicação a partir
 * do subdiretório, navega, e falha se houver erros na consola.
 *
 * Aceita um URL completo (para verificar o site já publicado) ou um caminho base
 * e uma porta (para verificar o `vite preview` local).
 *
 * Usage:
 *   node scripts/check-subpath.mjs https://utilizador.github.io/repo/
 *   node scripts/check-subpath.mjs /repo/ 4174
 */
import { chromium } from '@playwright/test';

const first = process.argv[2] ?? '/app-treinos-gabriel/';
const port = process.argv[3] ?? '4174';
const url = first.startsWith('http')
  ? first.endsWith('/')
    ? first
    : `${first}/`
  : `http://127.0.0.1:${port}${first}`;
const base = new URL(url).pathname;

const browser = await chromium.launch();
const page = await browser.newPage();

const errors = [];
const failedAssets = [];

page.on('pageerror', (error) => errors.push(error.message));
page.on('response', (response) => {
  if (response.status() < 400) return;
  // O GitHub Pages não reescreve rotas: uma ligação direta é servida pelo
  // 404.html, que devolve o estado 404 mas rende a aplicação na mesma. Isso é
  // esperado. Qualquer outro recurso em falha é que seria um problema.
  const isNavigationFallback = response.request().resourceType() === 'document';
  if (isNavigationFallback) return;
  failedAssets.push(`${response.status()} ${response.url()}`);
});
page.on('console', (message) => {
  if (message.type() !== 'error') return;
  if (message.text().includes('Failed to load resource')) return;
  errors.push(message.text());
});

let failed = false;
try {
  const response = await page.goto(url, { waitUntil: 'networkidle' });
  if (!response?.ok()) throw new Error(`HTTP ${response?.status()} em ${url}`);

  await page.getByRole('heading', { name: 'Antes de começar' }).waitFor({ timeout: 15_000 });
  process.stdout.write(`ok  onboarding carregou em ${url}\n`);

  await page.getByLabel('Primeiro dia do plano').fill('2026-08-03');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /confirmar e começar/i }).click();
  await page.getByRole('heading', { name: /olá/i }).waitFor({ timeout: 15_000 });
  process.stdout.write('ok  onboarding concluído\n');

  await page.getByRole('link', { name: 'Calendário' }).first().click();
  await page.waitForURL(new RegExp(`${base}calendario$`));
  await page.getByRole('heading', { level: 1, name: 'Calendário' }).waitFor({ timeout: 15_000 });
  process.stdout.write(`ok  rota interna funciona: ${page.url()}\n`);

  // Ligação direta a uma rota profunda: depende do 404.html copiado no build.
  await page.goto(`${url}exercicios`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { level: 1, name: 'Exercícios' }).waitFor({ timeout: 15_000 });
  process.stdout.write('ok  ligação direta a uma rota profunda funciona\n');

  if (failedAssets.length) throw new Error(`recursos em falta: ${failedAssets.join(' | ')}`);
  if (errors.length) throw new Error(`erros na consola: ${errors.join(' | ')}`);
  process.stdout.write('\nTudo certo: nenhum recurso em falta e nenhum erro de aplicação.\n');
} catch (error) {
  failed = true;
  process.stderr.write(`FALHOU: ${error.message}\n`);
} finally {
  await browser.close();
  process.exitCode = failed ? 1 : 0;
}
