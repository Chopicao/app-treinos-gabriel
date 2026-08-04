import { describe, expect, it } from 'vitest';
import type { SessionOccurrence } from '@/domain/types';
import { requireSessionTemplate } from '@/data/plan';
import {
  appendSet,
  buildSessionLog,
  canAppendSet,
  deriveEntryStatus,
  deriveSessionStatus,
  estimateSessionSeconds,
  itemsForPhase,
  sessionProgress,
} from '@/services/sessionBuilder';

function occurrence(templateId: string, phaseId: SessionOccurrence['phaseId'], planWeek: number) {
  return {
    key: `${templateId}@2026-08-04`,
    templateId,
    originalDate: '2026-08-04',
    date: '2026-08-04',
    planWeek,
    phaseId,
    rescheduled: false,
    status: 'planned',
  } satisfies SessionOccurrence;
}

function build(templateId: string, phaseId: SessionOccurrence['phaseId'], week = 1) {
  return buildSessionLog({
    occurrence: occurrence(templateId, phaseId, week),
    template: requireSessionTemplate(templateId),
    planVersion: 'test',
  });
}

describe('construção da sessão a partir do plano', () => {
  it('a terça-feira abre o Ginásio A com a prescrição da semana atual', () => {
    const week1 = build('gym-a', 'w1-2', 1);
    const week3 = build('gym-a', 'w3-4', 3);

    const goblet1 = week1.entries.find((entry) => entry.exerciseId === 'goblet-squat-to-box');
    const goblet3 = week3.entries.find((entry) => entry.exerciseId === 'goblet-squat-to-box');

    expect(goblet1?.prescription.sets).toBe(2);
    expect(goblet1?.prescription.reps).toEqual({ min: 10 });
    expect(goblet3?.prescription.sets).toBe(3);
    expect(goblet3?.prescription.reps).toEqual({ min: 8 });
    expect(goblet1?.sets).toHaveLength(2);
    expect(goblet3?.sets).toHaveLength(3);
  });

  it('cria uma linha por lado nos exercícios unilaterais e não as mistura', () => {
    const log = build('gym-a', 'w1-2');
    const split = log.entries.find((entry) => entry.exerciseId === 'split-squat');
    expect(split?.perSide).toBe(true);
    // 2 séries × 2 lados
    expect(split?.sets).toHaveLength(4);
    expect(split?.sets.map((set) => set.side)).toEqual(['left', 'right', 'left', 'right']);
    expect(split?.sets.map((set) => set.index)).toEqual([1, 1, 2, 2]);

    const ids = new Set(split?.sets.map((set) => set.id));
    expect(ids.size).toBe(4);
  });

  it('multiplica as séries pelo número de voltas de um circuito', () => {
    const log = build('gym-a', 'w1-2');
    const deadBug = log.entries.find(
      (entry) => entry.exerciseId === 'dead-bug' && entry.blockId === 'a-b4',
    );
    // 1 série prescrita × 2 voltas × 2 lados
    expect(deadBug?.prescription.sets).toBe(2);
    expect(deadBug?.sets).toHaveLength(4);
  });

  it('deixa de fora os exercícios que não pertencem à fase', () => {
    const week1 = build('gym-b', 'w1-2', 1);
    const week3 = build('gym-b', 'w3-4', 3);

    const ids1 = week1.entries.map((entry) => entry.exerciseId);
    const ids3 = week3.entries.map((entry) => entry.exerciseId);

    expect(ids1).toContain('isometric-heel-dig-bridge');
    expect(ids1).not.toContain('hamstring-walkout');
    expect(ids3).toContain('hamstring-walkout');
    expect(ids3).not.toContain('isometric-heel-dig-bridge');
  });

  it('guarda a prescrição no registo, para o histórico não mudar com a fase', () => {
    const week2 = build('gym-a', 'w1-2', 2);
    const snapshot = JSON.parse(JSON.stringify(week2));
    // Construir a semana 3 não pode alterar o registo já criado.
    build('gym-a', 'w3-4', 3);
    expect(week2).toEqual(snapshot);
    const goblet = week2.entries.find((entry) => entry.exerciseId === 'goblet-squat-to-box');
    expect(goblet?.prescriptionLabelPt).toContain('2 × 10');
  });

  it('a rotina de mobilidade tem os 18 exercícios pela ordem do plano', () => {
    const log = build('mobility-daily', 'w1-2');
    expect(log.entries).toHaveLength(18);
    expect(log.entries[0].exerciseId).toBe('plantar-fascia-ball-release');
    expect(log.entries[4].exerciseId).toBe('knee-to-wall');
    expect(log.entries.at(-1)?.exerciseId).toBe('dead-bug');
  });

  it('as sessões informativas têm uma linha única para marcar', () => {
    const log = build('football', 'w1-2');
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0].metric).toBe('informational');
    expect(log.entries[0].sets).toHaveLength(1);
  });
});

describe('séries adicionais quando o plano indica um intervalo', () => {
  it('permite acrescentar até ao limite e não além dele', () => {
    const log = build('gym-a', 'w3-4', 3);
    const stepDown = log.entries.find((entry) => entry.exerciseId === 'low-step-down')!;
    expect(stepDown.prescription.sets).toBe(2);
    expect(stepDown.prescription.setsMax).toBe(3);
    expect(canAppendSet(stepDown)).toBe(true);

    const withExtra = appendSet(stepDown);
    expect(withExtra.sets).toHaveLength(6); // 3 séries × 2 lados
    expect(canAppendSet(withExtra)).toBe(false);
    expect(appendSet(withExtra)).toBe(withExtra);
  });
});

describe('estados derivados', () => {
  it('um exercício fica concluído quando todas as séries estão resolvidas', () => {
    const log = build('gym-a', 'w1-2');
    const entry = log.entries.find((candidate) => candidate.sets.length > 1)!;
    expect(deriveEntryStatus(entry)).toBe('pending');

    const half = {
      ...entry,
      sets: entry.sets.map((set, i) => (i === 0 ? { ...set, status: 'done' as const } : set)),
    };
    expect(deriveEntryStatus(half)).toBe('in-progress');

    const all = { ...entry, sets: entry.sets.map((set) => ({ ...set, status: 'done' as const })) };
    expect(deriveEntryStatus(all)).toBe('done');
  });

  it('a sessão fica parcial quando fica algo por fazer', () => {
    const log = build('football', 'w1-2');
    expect(deriveSessionStatus(log)).toBe('partial');

    const done = {
      ...log,
      entries: log.entries.map((entry) => ({
        ...entry,
        status: 'done' as const,
        sets: entry.sets.map((set) => ({ ...set, status: 'done' as const })),
      })),
    };
    expect(deriveSessionStatus(done)).toBe('completed');
    expect(sessionProgress(done).ratio).toBe(1);
  });
});

describe('duração estimada', () => {
  it('a rotina diária sem os opcionais fica dentro dos 20 a 25 minutos anunciados', () => {
    const template = requireSessionTemplate('mobility-daily');
    const core = estimateSessionSeconds(template, 'w1-2', { includeOptional: false }) / 60;
    expect(core).toBeGreaterThan(18);
    expect(core).toBeLessThanOrEqual(25);
  });

  it('com todos os exercícios a rotina passa dos 25 minutos, por isso há opcionais marcados', () => {
    const template = requireSessionTemplate('mobility-daily');
    const full = estimateSessionSeconds(template, 'w1-2') / 60;
    expect(full).toBeGreaterThan(25);
    const optionalCount = template.blocks
      .flatMap((block) => block.items)
      .filter((item) => item.optional).length;
    expect(optionalCount).toBeGreaterThanOrEqual(3);
  });

  it('as sessões de ginásio ficam perto do intervalo anunciado', () => {
    const gymA = estimateSessionSeconds(requireSessionTemplate('gym-a'), 'w3-4') / 60;
    const gymB = estimateSessionSeconds(requireSessionTemplate('gym-b'), 'w3-4') / 60;
    expect(gymA).toBeGreaterThan(50);
    expect(gymA).toBeLessThan(95);
    expect(gymB).toBeGreaterThan(45);
    expect(gymB).toBeLessThan(85);
  });

  it('a rotina curta de sexta é claramente mais leve do que a completa', () => {
    const short = estimateSessionSeconds(requireSessionTemplate('mobility-short'), 'w1-2');
    const full = estimateSessionSeconds(requireSessionTemplate('mobility-daily'), 'w1-2');
    expect(short).toBeLessThan(full / 2);
  });
});

describe('itemsForPhase', () => {
  it('devolve os itens na ordem dos blocos', () => {
    const items = itemsForPhase(requireSessionTemplate('gym-b'), 'w1-2');
    const blockIds = [...new Set(items.map((entry) => entry.block.id))];
    expect(blockIds[0]).toBe('b-b1');
    expect(blockIds.at(-1)).toBe('b-b9');
  });
});
