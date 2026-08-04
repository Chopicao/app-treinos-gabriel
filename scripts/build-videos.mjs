/**
 * Turns curated picks into `src/data/videos.json`.
 *
 * Input: `scripts/.cache/picks.json` — an array of
 *   { exerciseId, videoId, language, reasonPt }
 *
 * For every pick the script asks YouTube's oEmbed endpoint for the real title
 * and channel. Only videos that actually answer are written as verified; the
 * rest are written with `pendingReview: true` so the app hides them from the
 * athlete and shows them in the review area instead.
 *
 * Usage: node scripts/build-videos.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lookup } from './verify-videos.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PICKS_FILE = path.join(ROOT, 'scripts', '.cache', 'picks.json');
const CANDIDATES_FILE = path.join(ROOT, 'scripts', '.cache', 'candidates.json');
const VIDEOS_FILE = path.join(ROOT, 'src', 'data', 'videos.json');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

async function main() {
  const picks = JSON.parse(await readFile(PICKS_FILE, 'utf8'));
  const candidates = JSON.parse(await readFile(CANDIDATES_FILE, 'utf8'));
  const today = new Date().toISOString().slice(0, 10);

  const videos = {};
  const problems = [];
  const seen = new Set();

  for (const [index, pick] of picks.entries()) {
    const { exerciseId, videoId } = pick;
    if (seen.has(exerciseId)) {
      problems.push(`${exerciseId}: escolha duplicada, a segunda foi ignorada`);
      continue;
    }
    seen.add(exerciseId);

    if (!VIDEO_ID.test(videoId ?? '')) {
      problems.push(`${exerciseId}: identificador de vídeo inválido (${videoId})`);
      continue;
    }

    // O vídeo escolhido tem de vir mesmo dos resultados de pesquisa recolhidos.
    const pool = candidates[exerciseId]?.candidates ?? [];
    if (pool.length > 0 && !pool.some((candidate) => candidate.videoId === videoId)) {
      problems.push(`${exerciseId}: ${videoId} não está entre os candidatos pesquisados`);
      continue;
    }

    const result = await lookup(videoId);
    videos[exerciseId] = {
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      videoId,
      title: result.ok ? result.title : (pick.title ?? 'Título por confirmar'),
      channel: result.ok ? result.channel : (pick.channel ?? 'Canal por confirmar'),
      language: pick.language ?? 'en',
      verifiedAt: today,
      pendingReview: !result.ok,
      reasonPt: pick.reasonPt ?? '',
    };
    if (!result.ok) problems.push(`${exerciseId}: ${result.reason}`);

    process.stdout.write(
      `[${index + 1}/${picks.length}] ${result.ok ? 'ok   ' : 'FALHA'} ${exerciseId} — ${videos[exerciseId].title}\n`,
    );
    await sleep(250);
  }

  const sorted = Object.fromEntries(Object.entries(videos).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(VIDEOS_FILE, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8');

  process.stdout.write(`\n${Object.keys(sorted).length} entradas escritas em ${VIDEOS_FILE}\n`);
  if (problems.length) {
    process.stdout.write(`\nProblemas:\n${problems.map((p) => ` - ${p}`).join('\n')}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
