/**
 * Colects real YouTube search candidates for every exercise in the library.
 *
 * It does NOT choose a video and it does NOT write into the app. It only produces
 * `scripts/.cache/candidates.json` so that the curation step works from real data
 * (real video ids, real titles, real channels) instead of guesswork.
 *
 * Usage: node scripts/search-youtube.mjs [--only=id1,id2] [--limit=12]
 */
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXERCISE_DIR = path.join(ROOT, 'src', 'data', 'exercises');
const CACHE_DIR = path.join(ROOT, 'scripts', '.cache');
const OUT_FILE = path.join(CACHE_DIR, 'candidates.json');

/** Exercises that are not demonstrable movements — no demo video is searched. */
const SKIP_IDS = new Set(['football-training', 'match-play']);

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = 'true'] = a.replace(/^--/, '').split('=');
    return [k, v];
  }),
);
const only = args.only ? new Set(String(args.only).split(',')) : null;
const LIMIT = Number(args.limit ?? 12);

/** Reads `id` + `nameEn` pairs straight out of the seed files, in declaration order. */
async function readExercises() {
  const files = (await readdir(EXERCISE_DIR)).filter(
    (f) => f.endsWith('.ts') && !['index.ts', 'equipment.ts'].includes(f),
  );
  const out = [];
  for (const file of files.sort()) {
    const source = await readFile(path.join(EXERCISE_DIR, file), 'utf8');
    const re =
      /id:\s*'([^']+)',\s*\n\s*namePt:\s*(?:'[^']*'|"[^"]*"),\s*\n\s*nameEn:\s*(?:'([^']*)'|"([^"]*)")/g;
    let match;
    while ((match = re.exec(source)) !== null) {
      out.push({ id: match[1], nameEn: match[2] ?? match[3], file });
    }
  }
  return out;
}

function buildQueries(nameEn) {
  return [`${nameEn} exercise how to`, `${nameEn} technique physical therapist`];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** `EgIQAQ%3D%3D` = filtro "Tipo: vídeo", para excluir canais e playlists. */
const VIDEO_ONLY_FILTER = 'EgIQAQ%3D%3D';

/**
 * O YouTube corta ligações quando os pedidos chegam demasiado depressa, e o
 * `fetch` do Node devolve apenas "fetch failed". Tentamos de novo com espera
 * crescente em vez de dar o exercício como perdido.
 */
async function fetchSearch(query, attempts = 4) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=${VIDEO_ONLY_FILTER}`;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          Accept: 'text/html,application/xhtml+xml',
        },
      }).finally(() => clearTimeout(timeout));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (error) {
      lastError = error;
      const detail = error.cause?.message ?? error.message;
      process.stderr.write(`  tentativa ${attempt}/${attempts} falhou (${detail})\n`);
      if (attempt < attempts) await sleep(3000 * attempt * attempt);
    }
  }
  throw lastError;
}

function extractInitialData(html) {
  const marker = 'var ytInitialData = ';
  const start = html.indexOf(marker);
  if (start === -1) return null;
  let i = start + marker.length;
  if (html[i] !== '{') return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let j = i; j < html.length; j += 1) {
    const ch = html[j];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(i, j + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function collectVideoRenderers(node, acc = []) {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) {
    for (const child of node) collectVideoRenderers(child, acc);
    return acc;
  }
  if (node.videoRenderer) acc.push(node.videoRenderer);
  for (const value of Object.values(node)) collectVideoRenderers(value, acc);
  return acc;
}

// `\s` ja cobre o espaco nao separavel que o YouTube usa nos snippets.
const clean = (value) => value.replace(/\s+/g, ' ').trim();

const text = (obj) => {
  if (!obj) return '';
  if (typeof obj.simpleText === 'string') return clean(obj.simpleText);
  if (Array.isArray(obj.runs)) return clean(obj.runs.map((r) => r.text ?? '').join(''));
  return '';
};

function toCandidate(vr) {
  const lengthText = text(vr.lengthText);
  return {
    videoId: vr.videoId,
    title: text(vr.title),
    channel: text(vr.ownerText) || text(vr.longBylineText),
    length: lengthText,
    lengthSeconds: parseLength(lengthText),
    published: text(vr.publishedTimeText),
    views: text(vr.viewCountText) || text(vr.shortViewCountText),
    snippet:
      (vr.detailedMetadataSnippets ?? [])
        .map((s) => text(s.snippetText))
        .join(' ')
        .slice(0, 320) || '',
    url: `https://www.youtube.com/watch?v=${vr.videoId}`,
  };
}

function parseLength(value) {
  if (!value) return null;
  const parts = value.split(':').map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

async function main() {
  const exercises = (await readExercises()).filter(
    (e) => !SKIP_IDS.has(e.id) && (!only || only.has(e.id)),
  );
  if (!existsSync(CACHE_DIR)) await mkdir(CACHE_DIR, { recursive: true });

  // Retoma: o que já tem candidatos não é pesquisado outra vez.
  let result = {};
  if (existsSync(OUT_FILE)) {
    try {
      result = JSON.parse(await readFile(OUT_FILE, 'utf8'));
    } catch {
      result = {};
    }
  }

  const pending = exercises.filter(
    (exercise) => (result[exercise.id]?.candidates?.length ?? 0) === 0,
  );
  process.stdout.write(`${pending.length} exercícios por pesquisar de ${exercises.length}.\n`);

  let index = 0;
  for (const exercise of pending) {
    index += 1;
    const byId = new Map();
    for (const query of buildQueries(exercise.nameEn)) {
      // A segunda pesquisa só corre se a primeira devolveu pouca coisa.
      if (byId.size >= 8) break;
      try {
        const html = await fetchSearch(query);
        const data = extractInitialData(html);
        if (!data) {
          process.stderr.write(`! sem ytInitialData: ${query}\n`);
          continue;
        }
        for (const vr of collectVideoRenderers(data)) {
          if (!vr.videoId || byId.has(vr.videoId)) continue;
          const candidate = toCandidate(vr);
          // Ignora Shorts e clipes muito curtos, que raramente explicam a técnica.
          if (candidate.lengthSeconds !== null && candidate.lengthSeconds < 25) continue;
          byId.set(vr.videoId, { ...candidate, query });
        }
      } catch (error) {
        process.stderr.write(`! erro em "${query}": ${error.message}\n`);
      }
      await sleep(1500 + Math.floor(Math.random() * 1200));
    }
    result[exercise.id] = {
      nameEn: exercise.nameEn,
      candidates: [...byId.values()].slice(0, LIMIT),
    };
    process.stdout.write(
      `[${index}/${pending.length}] ${exercise.id}: ${result[exercise.id].candidates.length} candidatos\n`,
    );
    // Grava a cada exercício: se a ligação cair, o trabalho feito não se perde.
    await writeFile(OUT_FILE, JSON.stringify(result, null, 2), 'utf8');
  }

  await writeFile(OUT_FILE, JSON.stringify(result, null, 2), 'utf8');
  process.stdout.write(`\nEscrito ${OUT_FILE}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
