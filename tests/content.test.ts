import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { EXERCISES, EXERCISES_BY_ID, hasVerifiedVideo } from '@/data/exercises';
import { DEFAULT_PROFILE } from '@/data/profile';
import { SESSION_TEMPLATES, TRAINING_PLAN } from '@/data/plan';
import { exerciseDefinitionSchema, trainingPlanSchema } from '@/domain/schemas';
import { itemsForPhase } from '@/services/sessionBuilder';

const PHASES = ['w1-2', 'w3-4', 'w5-6', 'w7+'] as const;

describe('validação dos dados seed', () => {
  it('todos os exercícios cumprem o schema e têm os campos mínimos', () => {
    for (const exercise of EXERCISES) {
      const result = exerciseDefinitionSchema.safeParse(exercise);
      if (!result.success) {
        throw new Error(
          `${exercise.id}: ${result.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`,
        );
      }
    }
  });

  it('o plano cumpre o schema', () => {
    const result = trainingPlanSchema.safeParse(TRAINING_PLAN);
    expect(result.success, JSON.stringify(result.error?.issues?.slice(0, 5))).toBe(true);
  });

  it('os identificadores dos exercícios são únicos', () => {
    expect(EXERCISES_BY_ID.size).toBe(EXERCISES.length);
  });

  it('todos os exercícios referidos pelo plano existem na biblioteca', () => {
    for (const template of SESSION_TEMPLATES) {
      for (const block of template.blocks) {
        for (const item of block.items) {
          expect(EXERCISES_BY_ID.has(item.exerciseId), `${template.id}/${item.exerciseId}`).toBe(
            true,
          );
          for (const alternative of item.allowedAlternativeIds ?? []) {
            expect(EXERCISES_BY_ID.has(alternative), `alternativa ${alternative}`).toBe(true);
          }
        }
      }
    }
  });

  it('os identificadores dos itens são únicos dentro de cada sessão', () => {
    for (const template of SESSION_TEMPLATES) {
      const ids = template.blocks.flatMap((block) => block.items.map((item) => item.id));
      expect(new Set(ids).size, template.id).toBe(ids.length);
    }
  });

  it('cada item tem prescrição definida para todas as fases', () => {
    for (const template of SESSION_TEMPLATES) {
      for (const block of template.blocks) {
        for (const item of block.items) {
          for (const phase of PHASES) {
            expect(item.byPhase[phase], `${template.id}/${item.id}/${phase}`).toBeDefined();
          }
        }
      }
    }
  });

  it('nenhuma sessão fica vazia em nenhuma fase', () => {
    for (const template of SESSION_TEMPLATES) {
      for (const phase of PHASES) {
        expect(itemsForPhase(template, phase).length, `${template.id}/${phase}`).toBeGreaterThan(0);
      }
    }
  });

  it('as progressões de fase posterior não estão programadas como treino ativo', () => {
    const activeIds = new Set(
      SESSION_TEMPLATES.flatMap((template) =>
        template.blocks.flatMap((block) => block.items.map((item) => item.exerciseId)),
      ),
    );
    for (const id of activeIds) {
      const exercise = EXERCISES_BY_ID.get(id)!;
      expect(exercise.tags.includes('later-phase'), `${id} está ativo mas é de fase posterior`).toBe(
        false,
      );
    }
  });

  it('o Nordic completo e o trabalho explosivo continuam fora do plano ativo', () => {
    const activeIds = new Set(
      SESSION_TEMPLATES.flatMap((template) =>
        template.blocks.flatMap((block) => block.items.map((item) => item.exerciseId)),
      ),
    );
    for (const forbidden of [
      'nordic-hamstring-curl',
      'assisted-nordic',
      'kettlebell-swing',
      'box-jump',
      'depth-jump',
      'barbell-back-squat',
      'tire-resisted-sprint',
    ]) {
      expect(activeIds.has(forbidden), forbidden).toBe(false);
    }
  });
});

describe('regras de conteúdo obrigatórias', () => {
  const roots = ['src', 'scripts', 'docs', 'tests', 'public'];

  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name === '.cache' || name === 'node_modules') continue;
        out.push(...walk(full));
      } else {
        out.push(full);
      }
    }
    return out;
  }

  it('não existe qualquer link da rede social proibida no código nem nos dados', () => {
    // Montada a partir de pedaços para o próprio teste não ser um falso positivo
    // nem disparar a regra de ESLint que proíbe esses links.
    const forbidden = new RegExp(['tik', 'tok'].join(''), 'i');
    const offenders: string[] = [];

    for (const root of roots) {
      let files: string[];
      try {
        files = walk(root);
      } catch {
        continue;
      }
      for (const file of files) {
        if (file.endsWith('.png') || file.endsWith('.ico')) continue;
        if (forbidden.test(readFileSync(file, 'utf8'))) offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('todos os vídeos apontam para URLs canónicos do YouTube', () => {
    for (const exercise of EXERCISES) {
      if (!exercise.video) continue;
      expect(exercise.video.canonicalUrl).toBe(
        `https://www.youtube.com/watch?v=${exercise.video.videoId}`,
      );
    }
  });

  it('nenhum dado pessoal é distribuído com a aplicação', () => {
    // O perfil começa vazio: idade, altura, peso, posição, historial de lesões e
    // notas de mobilidade são preenchidos no onboarding e ficam só no dispositivo.
    expect(DEFAULT_PROFILE.namePt).toBe('');
    expect(DEFAULT_PROFILE.ageYears).toBeNull();
    expect(DEFAULT_PROFILE.heightCm).toBeNull();
    expect(DEFAULT_PROFILE.weightKg).toBeNull();
    expect(DEFAULT_PROFILE.positionPt).toBe('');
    expect(DEFAULT_PROFILE.dominantFootPt).toBe('');
    expect(DEFAULT_PROFILE.supervisionPt).toBe('');
    expect(DEFAULT_PROFILE.injuryHistoryPt).toEqual([]);
    expect(DEFAULT_PROFILE.mobilityNotesPt).toEqual([]);
    expect(DEFAULT_PROFILE.openQuestionsPt).toEqual([]);
  });

  it('o conteúdo do plano não descreve o historial clínico de uma pessoa concreta', () => {
    // As notas de segurança têm de valer para qualquer utilizador: condicionais
    // ("se houver historial de…"), nunca um registo sobre alguém.
    const personal = [
      /\bo atleta (?:ainda )?(?:não|tem|teve)/i,
      /tornozelo direito/i,
      /dado o historial/i,
      /para este atleta/i,
    ];
    const texts = EXERCISES.flatMap((exercise) => [
      ...exercise.instructionsPt,
      ...exercise.techniqueCuesPt,
      ...exercise.safetyNotesPt,
    ]);

    const offenders = texts.filter((text) => personal.some((pattern) => pattern.test(text)));
    expect(offenders).toEqual([]);
  });

  it('os exercícios visíveis ao atleta têm vídeo verificado', () => {
    // Entradas informativas (treino da equipa e jogo) não são movimentos demonstráveis.
    const exempt = new Set(['football-training', 'match-play']);
    const missing = EXERCISES.filter(
      (exercise) => !exempt.has(exercise.id) && !hasVerifiedVideo(exercise),
    ).map((exercise) => exercise.id);

    expect(missing, `sem vídeo verificado: ${missing.join(', ')}`).toEqual([]);
  });
});
