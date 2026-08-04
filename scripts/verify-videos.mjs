/**
 * Re-checks every video in `src/data/videos.json` against the YouTube oEmbed
 * endpoint. The endpoint only answers for videos that are public and available,
 * and it returns the real title and channel — which is what gets written back,
 * so the seed data can never drift from reality.
 *
 * A video that stops answering is marked `pendingReview: true`, which removes it
 * from the athlete's view without deleting the record.
 *
 * Usage: node scripts/verify-videos.mjs [--write]
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VIDEOS_FILE = path.join(ROOT, 'src', 'data', 'videos.json');

const write = process.argv.includes('--write');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function lookup(videoId, attempts = 3) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    `https://www.youtube.com/watch?v=${videoId}`,
  )}&format=json`;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'Accept-Language': 'en-US,en;q=0.9' } });
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        return { ok: false, reason: `indisponível (HTTP ${res.status})` };
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { ok: true, title: data.title, channel: data.author_name };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(1500 * attempt);
    }
  }
  return { ok: false, reason: `erro de rede: ${lastError?.message ?? 'desconhecido'}` };
}

async function main() {
  const videos = JSON.parse(await readFile(VIDEOS_FILE, 'utf8'));
  const ids = Object.keys(videos);
  const today = new Date().toISOString().slice(0, 10);
  let okCount = 0;
  const problems = [];

  for (const [index, exerciseId] of ids.entries()) {
    const entry = videos[exerciseId];
    const result = await lookup(entry.videoId);
    if (result.ok) {
      okCount += 1;
      const changed = result.title !== entry.title || result.channel !== entry.channel;
      entry.title = result.title;
      entry.channel = result.channel;
      entry.verifiedAt = today;
      entry.pendingReview = false;
      process.stdout.write(
        `[${index + 1}/${ids.length}] ok   ${exerciseId} — ${result.title} (${result.channel})${changed ? ' [metadados atualizados]' : ''}\n`,
      );
    } else {
      entry.pendingReview = true;
      problems.push(`${exerciseId} (${entry.videoId}): ${result.reason}`);
      process.stdout.write(`[${index + 1}/${ids.length}] FALHA ${exerciseId}: ${result.reason}\n`);
    }
    await sleep(250);
  }

  process.stdout.write(`\n${okCount}/${ids.length} vídeos disponíveis.\n`);
  if (problems.length) {
    process.stdout.write(`\nPor rever:\n${problems.map((p) => ` - ${p}`).join('\n')}\n`);
  }

  if (write) {
    await writeFile(VIDEOS_FILE, `${JSON.stringify(videos, null, 2)}\n`, 'utf8');
    process.stdout.write(`\nEscrito ${VIDEOS_FILE}\n`);
  } else {
    process.stdout.write('\n(sem --write, o ficheiro não foi alterado)\n');
  }

  process.exitCode = problems.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('verify-videos.mjs')) {
  main().catch((error) => {
    process.stderr.write(`${error.stack}\n`);
    process.exitCode = 1;
  });
}
