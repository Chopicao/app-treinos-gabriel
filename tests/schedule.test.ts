import { describe, expect, it } from 'vitest';
import type { OccurrenceOverride, SessionLog } from '@/domain/types';
import {
  findOccurrence,
  occurrenceKey,
  occurrencesInRange,
  occurrencesOn,
  phaseForWeek,
  planWeekFor,
  type ScheduleContext,
} from '@/services/schedule';
import { addDays } from '@/lib/dates';

/** Segunda-feira. */
const START = '2026-08-03';

function context(partial: Partial<ScheduleContext> = {}): ScheduleContext {
  return { planStartDate: START, overrides: [], logs: [], ...partial };
}

describe('geração do calendário a partir da semana-tipo', () => {
  it('cria as sessões certas em cada dia da semana 1', () => {
    const week = occurrencesInRange(START, addDays(START, 6), context());
    const byDay = (offset: number) =>
      week.filter((o) => o.date === addDays(START, offset)).map((o) => o.templateId);

    expect(byDay(0)).toEqual(['football', 'mobility-daily']); // segunda
    expect(byDay(1)).toEqual(['gym-a']); // terça
    expect(byDay(2)).toEqual(['football', 'mobility-daily']); // quarta
    expect(byDay(3)).toEqual(['gym-b']); // quinta
    expect(byDay(4)).toEqual(['football', 'mobility-short']); // sexta
    expect(byDay(5)).toEqual(['match-warmup', 'match']); // sábado
    expect(byDay(6)).toEqual(['recovery', 'mobility-daily']); // domingo
  });

  it('repete a semana-tipo nas semanas seguintes', () => {
    const laterTuesday = addDays(START, 7 * 3 + 1);
    const occurrences = occurrencesOn(laterTuesday, context());
    expect(occurrences.map((o) => o.templateId)).toEqual(['gym-a']);
    expect(occurrences[0].planWeek).toBe(4);
    expect(occurrences[0].phaseId).toBe('w3-4');
  });

  it('não gera sessões antes da data de início', () => {
    expect(occurrencesOn(addDays(START, -1), context())).toEqual([]);
  });

  it('mapeia semanas para fases do bloco de seis semanas', () => {
    expect(planWeekFor(START, START)).toBe(1);
    expect(planWeekFor(addDays(START, 6), START)).toBe(1);
    expect(planWeekFor(addDays(START, 7), START)).toBe(2);
    expect(phaseForWeek(1)).toBe('w1-2');
    expect(phaseForWeek(2)).toBe('w1-2');
    expect(phaseForWeek(3)).toBe('w3-4');
    expect(phaseForWeek(5)).toBe('w5-6');
    expect(phaseForWeek(7)).toBe('w7+');
    expect(phaseForWeek(52)).toBe('w7+');
  });

  it('aceita uma data inicial a meio da semana e usa a segunda-feira dessa semana', () => {
    const wednesdayStart = '2026-08-05';
    expect(planWeekFor('2026-08-03', wednesdayStart)).toBe(1);
    expect(planWeekFor('2026-08-10', wednesdayStart)).toBe(2);
  });
});

describe('remarcação de uma ocorrência', () => {
  const key = occurrenceKey('gym-a', addDays(START, 1));
  const override: OccurrenceOverride = {
    key,
    originalDate: addDays(START, 1),
    newDate: addDays(START, 2),
    createdAt: '2026-08-03T10:00:00.000Z',
  };

  it('move apenas essa ocorrência', () => {
    const ctx = context({ overrides: [override] });
    expect(occurrencesOn(addDays(START, 1), ctx)).toEqual([]);
    const moved = occurrencesOn(addDays(START, 2), ctx);
    expect(moved.map((o) => o.templateId)).toContain('gym-a');
    expect(moved.find((o) => o.templateId === 'gym-a')?.rescheduled).toBe(true);
  });

  it('não desloca as semanas futuras', () => {
    const ctx = context({ overrides: [override] });
    const nextTuesday = addDays(START, 8);
    expect(occurrencesOn(nextTuesday, ctx).map((o) => o.templateId)).toEqual(['gym-a']);
    const thirdTuesday = addDays(START, 15);
    expect(occurrencesOn(thirdTuesday, ctx).map((o) => o.templateId)).toEqual(['gym-a']);
  });

  it('mostra a ocorrência quando ela entra no intervalo vinda de fora', () => {
    const far: OccurrenceOverride = {
      key: occurrenceKey('gym-a', addDays(START, 1)),
      originalDate: addDays(START, 1),
      newDate: addDays(START, 20),
      createdAt: '2026-08-03T10:00:00.000Z',
    };
    const ctx = context({ overrides: [far] });
    const found = occurrencesOn(addDays(START, 20), ctx);
    expect(found.map((o) => o.templateId)).toContain('gym-a');
  });

  it('repor a data original devolve a sessão ao dia de origem', () => {
    const ctx = context();
    expect(occurrencesOn(addDays(START, 1), ctx).map((o) => o.templateId)).toEqual(['gym-a']);
  });
});

describe('estado das ocorrências', () => {
  it('reflete o estado do registo associado', () => {
    const key = occurrenceKey('gym-a', addDays(START, 1));
    const log = {
      id: 'log-1',
      occurrenceKey: key,
      status: 'completed',
    } as unknown as SessionLog;

    const occurrence = findOccurrence(key, context({ logs: [log] }));
    expect(occurrence?.status).toBe('completed');
    expect(occurrence?.logId).toBe('log-1');
  });

  it('devolve `planeado` quando ainda não há registo', () => {
    const key = occurrenceKey('gym-b', addDays(START, 3));
    expect(findOccurrence(key, context())?.status).toBe('planned');
  });

  it('ignora chaves que não correspondem à semana-tipo', () => {
    // Ginásio A não existe ao domingo.
    expect(findOccurrence(occurrenceKey('gym-a', addDays(START, 6)), context())).toBeUndefined();
  });
});
