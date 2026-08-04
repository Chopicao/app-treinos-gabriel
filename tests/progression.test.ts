import { describe, expect, it } from 'vitest';
import type { ExerciseLogEntry, SessionLog, SetLog } from '@/domain/types';
import { compareWithPrevious, performanceHistory, progressionSuggestion } from '@/services/progression';

function set(overrides: Partial<SetLog> = {}): SetLog {
  return {
    id: `set-${Math.random()}`,
    index: 1,
    side: null,
    targetLabelPt: '10 reps',
    targetReps: { min: 10 },
    reps: 10,
    loadKg: 16,
    status: 'done',
    ...overrides,
  };
}

function entry(overrides: Partial<ExerciseLogEntry> = {}): ExerciseLogEntry {
  return {
    id: 'block::item',
    blockId: 'block',
    blockNamePt: 'Bloco',
    itemId: 'item',
    exerciseId: 'goblet-squat-to-box',
    exerciseNamePt: 'Goblet squat',
    metric: 'reps',
    perSide: false,
    loadTracked: true,
    prescription: { sets: 2, reps: { min: 10 } },
    prescriptionLabelPt: '2 × 10',
    status: 'done',
    sets: [set(), set({ index: 2 })],
    ...overrides,
  };
}

function log(date: string, overrides: Partial<SessionLog> = {}): SessionLog {
  return {
    id: `log-${date}`,
    occurrenceKey: `gym-a@${date}`,
    templateId: 'gym-a',
    templateNamePt: 'Ginásio A',
    kind: 'gym-a',
    planVersion: '1.0.0',
    planWeek: 1,
    phaseId: 'w1-2',
    date,
    status: 'completed',
    plannedMinutes: { min: 75, max: 85 },
    activeSeconds: 4200,
    entries: [entry()],
    createdAt: `${date}T18:00:00.000Z`,
    updatedAt: `${date}T19:00:00.000Z`,
    ...overrides,
  };
}

describe('histórico por exercício', () => {
  it('ordena da execução mais recente para a mais antiga', () => {
    const history = performanceHistory(
      [log('2026-08-04'), log('2026-08-11'), log('2026-08-18')],
      'goblet-squat-to-box',
    );
    expect(history.map((item) => item.date)).toEqual(['2026-08-18', '2026-08-11', '2026-08-04']);
    expect(history[0].maxLoadKg).toBe(16);
  });

  it('ignora exercícios que não chegaram a ser tocados', () => {
    const untouched = log('2026-08-04', {
      entries: [entry({ status: 'pending', sets: [set({ status: 'pending', reps: null })] })],
    });
    expect(performanceHistory([untouched], 'goblet-squat-to-box')).toHaveLength(0);
  });
});

describe('sugestão de progressão', () => {
  it('não sugere nada sem duas execuções registadas', () => {
    const history = performanceHistory([log('2026-08-04')], 'goblet-squat-to-box');
    expect(progressionSuggestion(history).suggest).toBe(false);
  });

  it('sugere depois de duas sessões consecutivas completas, sem dor', () => {
    const history = performanceHistory(
      [log('2026-08-04'), log('2026-08-11')],
      'goblet-squat-to-box',
    );
    const suggestion = progressionSuggestion(history);
    expect(suggestion.suggest).toBe(true);
    expect(suggestion.detailPt).toContain('duas sessões consecutivas');
  });

  it('não sugere quando faltaram repetições', () => {
    const short = log('2026-08-11', {
      entries: [entry({ sets: [set({ reps: 7 }), set({ index: 2, reps: 6 })] })],
    });
    const history = performanceHistory([log('2026-08-04'), short], 'goblet-squat-to-box');
    expect(progressionSuggestion(history).suggest).toBe(false);
  });

  it('não sugere quando foi registada dor na sessão', () => {
    const sore = log('2026-08-11', { discomfort: 5 });
    const history = performanceHistory([log('2026-08-04'), sore], 'goblet-squat-to-box');
    expect(progressionSuggestion(history).suggest).toBe(false);
  });

  it('não sugere quando o exercício foi saltado por dor', () => {
    const skipped = log('2026-08-11', {
      entries: [entry({ status: 'skipped', skipReason: 'pain' })],
    });
    const history = performanceHistory([log('2026-08-04'), skipped], 'goblet-squat-to-box');
    expect(progressionSuggestion(history).suggest).toBe(false);
  });
});

describe('comparação com execuções anteriores', () => {
  it('mostra no máximo as duas execuções anteriores', () => {
    const logs = [log('2026-08-04'), log('2026-08-11'), log('2026-08-18'), log('2026-08-25')];
    const history = performanceHistory(logs, 'goblet-squat-to-box');
    const comparison = compareWithPrevious(history, 'log-2026-08-25');
    expect(comparison?.previous.map((item) => item.date)).toEqual(['2026-08-18', '2026-08-11']);
  });
});
