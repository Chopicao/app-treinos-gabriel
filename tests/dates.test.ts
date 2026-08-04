import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  daysBetween,
  eachDay,
  endOfMonth,
  endOfWeek,
  formatFullPt,
  isoWeekday,
  monthGrid,
  startOfMonth,
  startOfWeek,
  todayKey,
} from '@/lib/dates';

describe('calendário', () => {
  it('a semana começa à segunda-feira', () => {
    // 2026-08-04 é uma terça-feira.
    expect(isoWeekday('2026-08-04')).toBe(2);
    expect(startOfWeek('2026-08-04')).toBe('2026-08-03');
    expect(endOfWeek('2026-08-04')).toBe('2026-08-09');
    // Domingo pertence à semana que começou na segunda anterior.
    expect(startOfWeek('2026-08-09')).toBe('2026-08-03');
  });

  it('soma dias sem saltar por causa da mudança de hora', () => {
    // Em Portugal a hora muda no último domingo de março e de outubro.
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(daysBetween('2026-03-01', '2026-11-01')).toBe(245);
  });

  it('calcula limites de mês', () => {
    expect(startOfMonth('2026-02-17')).toBe('2026-02-01');
    expect(endOfMonth('2026-02-17')).toBe('2026-02-28');
    expect(endOfMonth('2028-02-05')).toBe('2028-02-29');
    expect(addMonths('2026-12-10', 1)).toBe('2027-01-01');
  });

  it('a grelha do mês tem 42 dias e começa numa segunda-feira', () => {
    const grid = monthGrid('2026-08-15');
    expect(grid).toHaveLength(42);
    expect(isoWeekday(grid[0])).toBe(1);
    expect(grid).toContain('2026-08-01');
    expect(grid).toContain('2026-08-31');
  });

  it('enumera intervalos inclusivos', () => {
    expect(eachDay('2026-08-03', '2026-08-05')).toEqual([
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
    ]);
  });

  it('formata datas em português', () => {
    expect(formatFullPt('2026-08-04')).toContain('agosto');
    expect(formatFullPt('2026-08-04')).toContain('2026');
  });

  it('o dia de hoje é lido no fuso Europe/Lisbon', () => {
    // 00:30 UTC de 5 de agosto é 01:30 em Lisboa (verão): ainda dia 5.
    expect(todayKey(new Date('2026-08-05T00:30:00Z'))).toBe('2026-08-05');
    // 23:30 UTC de 4 de agosto já é dia 5 em Lisboa.
    expect(todayKey(new Date('2026-08-04T23:30:00Z'))).toBe('2026-08-05');
  });
});
