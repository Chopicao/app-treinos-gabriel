/**
 * Verifica que a aplicação compilada consegue mesmo atualizar-se sozinha.
 *
 * Existe porque isto já falhou: com `registerType: 'prompt'` e sem
 * `clientsClaim`, um telemóvel com a aplicação instalada ficava preso na versão
 * em cache e nunca recebia nada de novo. O código parecia bem e o servidor
 * servia a versão certa — só o utilizador é que não a via.
 *
 * Corre sobre `dist/`, não sobre o código-fonte, porque o que interessa é o que
 * chega ao telemóvel.
 *
 * Usage: node scripts/check-pwa-update.mjs [pasta]
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.resolve(ROOT, process.argv[2] ?? 'dist');

import { readdir } from 'node:fs/promises';

async function readAllScripts() {
  const assets = path.join(dist, 'assets');
  let names;
  try {
    names = (await readdir(assets)).filter((name) => name.endsWith('.js'));
  } catch {
    return '';
  }
  const parts = await Promise.all(
    names.map((name) => readFile(path.join(assets, name), 'utf8')),
  );
  return parts.join('\n');
}

const sw = await readFile(path.join(dist, 'sw.js'), 'utf8').catch(() => '');
const scripts = await readAllScripts();

const checks = [
  {
    source: sw,
    pattern: /clientsClaim/,
    ok: 'o service worker assume o controlo das páginas já abertas (clientsClaim)',
    fail:
      'falta clientsClaim: uma versão nova não assumiria o controlo de quem já tem a aplicação aberta',
  },
  {
    source: sw,
    pattern: /skipWaiting/,
    ok: 'o service worker novo ativa-se sem esperar (skipWaiting)',
    fail: 'falta skipWaiting: a versão nova ficaria à espera indefinidamente',
  },
  {
    source: scripts,
    pattern: /serviceWorker/,
    ok: 'a aplicação regista o service worker',
    fail: 'a aplicação não regista nenhum service worker: não funcionaria offline',
  },
  {
    source: scripts,
    // O modo `autoUpdate` gera código que recarrega quando o controlador muda.
    pattern: /controllerchange|location\.reload/,
    ok: 'uma versão nova é aplicada sem esperar por confirmação do utilizador',
    fail:
      'não há reinício automático: com registerType "prompt" é preciso construir a interface que pergunta ao utilizador, senão fica preso na cache',
  },
];

let failed = false;

for (const check of checks) {
  if (!check.source) {
    process.stderr.write(`FALHA  ficheiros em falta em ${dist}\n`);
    failed = true;
    continue;
  }
  if (check.pattern.test(check.source)) {
    process.stdout.write(`ok     ${check.ok}\n`);
  } else {
    process.stderr.write(`FALHA  ${check.fail}\n`);
    failed = true;
  }
}

if (failed) {
  process.stderr.write('\nA aplicação compilada não se atualiza sozinha.\n');
  process.exitCode = 1;
} else {
  process.stdout.write('\nA aplicação compilada atualiza-se sozinha.\n');
}
