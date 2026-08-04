/**
 * Generates `docs/youtube-video-review.md` from the verified seed data.
 * The table is derived, never hand-written, so it cannot drift from the app.
 *
 * Usage: node scripts/make-video-doc.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXERCISE_DIR = path.join(ROOT, 'src', 'data', 'exercises');
const VIDEOS_FILE = path.join(ROOT, 'src', 'data', 'videos.json');
const PICKS_FILE = path.join(ROOT, 'scripts', '.cache', 'picks.json');
const OUT_FILE = path.join(ROOT, 'docs', 'youtube-video-review.md');

const SKIPPED = {
  'football-training': 'Entrada informativa: representa o treino da equipa, não um movimento demonstrável.',
  'match-play': 'Entrada informativa: representa o jogo, não um movimento demonstrável.',
};

async function readExerciseNames() {
  const files = (await readdir(EXERCISE_DIR)).filter(
    (f) => f.endsWith('.ts') && !['index.ts', 'equipment.ts'].includes(f),
  );
  const names = {};
  for (const file of files.sort()) {
    const source = await readFile(path.join(EXERCISE_DIR, file), 'utf8');
    const re =
      /id:\s*'([^']+)',\s*\n\s*namePt:\s*(?:'([^']*)'|"([^"]*)"),\s*\n\s*nameEn:\s*(?:'([^']*)'|"([^"]*)")/g;
    let match;
    while ((match = re.exec(source)) !== null) {
      names[match[1]] = {
        namePt: match[2] ?? match[3],
        nameEn: match[4] ?? match[5],
      };
    }
  }
  return names;
}

const escape = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

async function main() {
  const videos = JSON.parse(await readFile(VIDEOS_FILE, 'utf8'));
  const names = await readExerciseNames();
  const picks = existsSync(PICKS_FILE) ? JSON.parse(await readFile(PICKS_FILE, 'utf8')) : [];
  const confidenceById = Object.fromEntries(
    picks.map((pick) => [pick.exerciseId, pick.confidence ?? '—']),
  );

  const ids = Object.keys(names).sort((a, b) =>
    (names[a].namePt ?? a).localeCompare(names[b].namePt ?? b, 'pt'),
  );

  const rows = [];
  let verified = 0;
  let pending = 0;
  let missing = 0;

  for (const id of ids) {
    const video = videos[id];
    if (!video) {
      if (SKIPPED[id]) {
        rows.push({ id, state: 'Sem vídeo (por desenho)', note: SKIPPED[id] });
      } else {
        missing += 1;
        rows.push({ id, state: 'Sem vídeo', note: 'Ainda não foi escolhido nenhum vídeo.' });
      }
      continue;
    }
    if (video.pendingReview) pending += 1;
    else verified += 1;
    rows.push({ id, video, state: video.pendingReview ? 'Por rever' : 'Verificado' });
  }

  const lines = [];
  lines.push('# Revisão dos vídeos do YouTube');
  lines.push('');
  lines.push(
    'Um vídeo de demonstração por exercício. **Este ficheiro é gerado** a partir de',
    '`src/data/videos.json` por `node scripts/make-video-doc.mjs` — não o edites à mão.',
  );
  lines.push('');
  lines.push('## Como estes vídeos foram escolhidos');
  lines.push('');
  lines.push(
    '1. `npm run search:videos` pesquisa no YouTube, por exercício, e guarda os candidatos reais',
    '   (identificador, título, canal, duração, visualizações e excerto da descrição). Nenhum URL é',
    '   escrito à mão em lado nenhum deste processo.',
    '2. A curadoria escolhe **um** candidato por exercício, obrigatoriamente vindo dessa lista, com',
    '   os critérios abaixo. Escolhas fora da lista são rejeitadas por `scripts/build-videos.mjs`.',
    '3. Cada escolha é confirmada no *endpoint* oEmbed do YouTube, que só responde para vídeos',
    '   públicos e disponíveis. O **título e o canal guardados são os que o YouTube devolveu**, não',
    '   os que alguém escreveu.',
    '4. `npm run verify:videos` repete a confirmação a qualquer momento. Um vídeo que deixe de',
    '   responder passa a `pendingReview` e desaparece da vista do atleta.',
  );
  lines.push('');
  lines.push('### Critérios, por ordem');
  lines.push('');
  lines.push(
    '1. Demonstrar exatamente a variante indicada, sem confundir variantes parecidas.',
    '2. Preferir canais credíveis: fisioterapeutas e profissionais qualificados, organizações de',
    '   força e condicionamento, hospitais e universidades, federações, ou treinadores com',
    '   credenciais claras.',
    '3. Preferir explicação curta e clara, com boa visibilidade do corpo inteiro e indicações de',
    '   execução ou erros comuns.',
    '4. Preferir português ou inglês simples. O texto da aplicação continua em PT-PT.',
    '5. Evitar compilações, vídeos motivacionais, conteúdo sensacionalista, Shorts quando existe um',
    '   vídeo normal melhor, e vídeos que prescrevam dor ou carga máxima.',
    '6. Não inferir qualidade a partir do título: o canal, a duração e a descrição também são usados.',
  );
  lines.push('');
  lines.push(
    'Os vídeos são material de demonstração técnica. **Não** alteram a prescrição do plano: quando um',
    'vídeo mostra séries ou repetições diferentes, vale sempre o que está na aplicação. As fontes de',
    'contexto do plano são outras e vivem no ecrã "Sobre o plano".',
  );
  lines.push('');
  lines.push('## Resumo');
  lines.push('');
  lines.push('| Estado | Exercícios |');
  lines.push('| --- | ---: |');
  lines.push(`| Verificados e visíveis ao atleta | ${verified} |`);
  lines.push(`| Por rever (só na área de revisão) | ${pending} |`);
  lines.push(`| Sem vídeo por desenho (entradas informativas) | ${Object.keys(SKIPPED).length} |`);
  lines.push(`| Sem vídeo | ${missing} |`);
  lines.push('');
  lines.push('## Tabela');
  lines.push('');
  lines.push('| Exercício | Nome em inglês | URL | Título | Canal | Idioma | Razão da escolha | Verificado em | Confiança | Estado |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');

  for (const row of rows) {
    const name = names[row.id] ?? { namePt: row.id, nameEn: '' };
    if (!row.video) {
      lines.push(
        `| ${escape(name.namePt)} | ${escape(name.nameEn)} | — | — | — | — | ${escape(row.note)} | — | — | ${row.state} |`,
      );
      continue;
    }
    lines.push(
      [
        '',
        escape(name.namePt),
        escape(name.nameEn),
        `<${row.video.canonicalUrl}>`,
        escape(row.video.title),
        escape(row.video.channel),
        escape(row.video.language),
        escape(row.video.reasonPt),
        escape(row.video.verifiedAt),
        escape(confidenceById[row.id] ?? '—'),
        row.state,
        '',
      ].join(' | ').replace(/^ \| /, '| ').replace(/ \| $/, ' |'),
    );
  }

  lines.push('');
  await writeFile(OUT_FILE, `${lines.join('\n')}\n`, 'utf8');
  process.stdout.write(
    `${OUT_FILE}: ${verified} verificados, ${pending} por rever, ${missing} sem vídeo\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
