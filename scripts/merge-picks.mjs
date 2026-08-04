/**
 * Merges the per-batch curation files into `scripts/.cache/picks.json`.
 * Usage: node scripts/merge-picks.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PICKS_DIR = path.join(ROOT, 'scripts', '.cache', 'picks');
const OUT_FILE = path.join(ROOT, 'scripts', '.cache', 'picks.json');
const CANDIDATES_FILE = path.join(ROOT, 'scripts', '.cache', 'candidates.json');

async function main() {
  const files = (await readdir(PICKS_DIR)).filter((f) => f.endsWith('.json')).sort();
  const candidates = JSON.parse(await readFile(CANDIDATES_FILE, 'utf8'));

  const merged = [];
  const seen = new Set();
  const problems = [];

  for (const file of files) {
    const raw = JSON.parse(await readFile(path.join(PICKS_DIR, file), 'utf8'));
    const picks = Array.isArray(raw) ? raw : (raw.picks ?? []);
    for (const pick of picks) {
      if (seen.has(pick.exerciseId)) {
        problems.push(`${pick.exerciseId}: repetido em ${file}`);
        continue;
      }
      const pool = candidates[pick.exerciseId]?.candidates ?? [];
      if (!pool.some((candidate) => candidate.videoId === pick.videoId)) {
        problems.push(`${pick.exerciseId}: ${pick.videoId} não veio da pesquisa`);
        continue;
      }
      seen.add(pick.exerciseId);
      merged.push(pick);
    }
  }

  const missing = Object.keys(candidates).filter((id) => !seen.has(id));

  merged.sort((a, b) => a.exerciseId.localeCompare(b.exerciseId));
  await writeFile(OUT_FILE, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');

  process.stdout.write(`${merged.length} escolhas de ${files.length} lotes → ${OUT_FILE}\n`);
  if (missing.length) process.stdout.write(`\nSem escolha (${missing.length}): ${missing.join(', ')}\n`);
  if (problems.length) process.stdout.write(`\nProblemas:\n${problems.map((p) => ` - ${p}`).join('\n')}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
