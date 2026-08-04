/**
 * Splits `candidates.json` into review batches, adding the Portuguese name and
 * the first instruction line so the curation step knows exactly which variant
 * each video has to show.
 *
 * Usage: node scripts/split-candidates.mjs [--batches=12]
 */
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXERCISE_DIR = path.join(ROOT, 'src', 'data', 'exercises');
const CACHE_DIR = path.join(ROOT, 'scripts', '.cache');
const BATCH_DIR = path.join(CACHE_DIR, 'batches');

const batches = Number(
  process.argv.find((a) => a.startsWith('--batches='))?.split('=')[1] ?? 12,
);

async function readExerciseMeta() {
  const files = (await readdir(EXERCISE_DIR)).filter(
    (f) => f.endsWith('.ts') && !['index.ts', 'equipment.ts'].includes(f),
  );
  const meta = {};
  for (const file of files.sort()) {
    const source = await readFile(path.join(EXERCISE_DIR, file), 'utf8');
    const blocks = source.split(/\n\s*\{\n/).slice(1);
    for (const block of blocks) {
      const id = /id:\s*'([^']+)'/.exec(block)?.[1];
      if (!id) continue;
      const namePt = /namePt:\s*(?:'([^']*)'|"([^"]*)")/.exec(block);
      const nameEn = /nameEn:\s*(?:'([^']*)'|"([^"]*)")/.exec(block);
      const tags = /tags:\s*\[([^\]]*)\]/.exec(block)?.[1] ?? '';
      const firstInstruction = /instructionsPt:\s*\[\s*\n\s*'([^']*)'/.exec(block)?.[1] ?? '';
      meta[id] = {
        namePt: namePt?.[1] ?? namePt?.[2] ?? '',
        nameEn: nameEn?.[1] ?? nameEn?.[2] ?? '',
        tags: tags
          .split(',')
          .map((t) => t.trim().replace(/'/g, ''))
          .filter(Boolean),
        firstInstructionPt: firstInstruction,
      };
    }
  }
  return meta;
}

async function main() {
  const candidates = JSON.parse(
    await readFile(path.join(CACHE_DIR, 'candidates.json'), 'utf8'),
  );
  const meta = await readExerciseMeta();
  if (!existsSync(BATCH_DIR)) await mkdir(BATCH_DIR, { recursive: true });

  const ids = Object.keys(candidates).sort();
  const perBatch = Math.ceil(ids.length / batches);

  for (let i = 0; i < batches; i += 1) {
    const slice = ids.slice(i * perBatch, (i + 1) * perBatch);
    if (slice.length === 0) continue;
    const payload = {};
    for (const id of slice) {
      payload[id] = {
        namePt: meta[id]?.namePt ?? '',
        nameEn: candidates[id].nameEn,
        tags: meta[id]?.tags ?? [],
        descricaoPt: meta[id]?.firstInstructionPt ?? '',
        candidates: candidates[id].candidates.map((candidate) => ({
          videoId: candidate.videoId,
          title: candidate.title,
          channel: candidate.channel,
          length: candidate.length,
          views: candidate.views,
          published: candidate.published,
          snippet: candidate.snippet,
        })),
      };
    }
    const file = path.join(BATCH_DIR, `batch-${String(i + 1).padStart(2, '0')}.json`);
    await writeFile(file, JSON.stringify(payload, null, 2), 'utf8');
    process.stdout.write(`${file}: ${slice.length} exercícios\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 1;
});
