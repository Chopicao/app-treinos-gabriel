import { describe, expect, it } from 'vitest';
import {
  formatCountdown,
  formatDurationMinutes,
  formatLoad,
  formatPrescription,
  formatRange,
  formatSeconds,
  formatSetTarget,
  formatSets,
} from '@/lib/format';

describe('formatação de prescrições', () => {
  it('escreve séries por repetições', () => {
    expect(
      formatPrescription(
        { sets: 2, reps: { min: 10 }, restSeconds: { min: 90, max: 120 }, tempo: '3-1-1' },
        { perSide: false, metric: 'reps' },
      ),
    ).toBe('2 × 10 · tempo 3–1–1 · descanso 90–120 s');
  });

  it('marca claramente o trabalho por lado', () => {
    expect(
      formatPrescription({ sets: 2, reps: { min: 8 } }, { perSide: true, metric: 'reps' }),
    ).toBe('2 × 8 por lado');
  });

  it('escreve intervalos de repetições', () => {
    expect(
      formatPrescription({ sets: 3, reps: { min: 8, max: 12 } }, { perSide: false, metric: 'reps' }),
    ).toBe('3 × 8–12');
  });

  it('escreve tempo e distância', () => {
    expect(
      formatPrescription({ sets: 1, seconds: { min: 30 } }, { perSide: true, metric: 'time' }),
    ).toBe('1 × 30 s por lado');
    expect(
      formatPrescription({ sets: 1, seconds: { min: 300 } }, { perSide: false, metric: 'time' }),
    ).toBe('1 × 5 min');
    expect(
      formatPrescription(
        { sets: 3, meters: { min: 20, max: 25 }, restSeconds: { min: 45, max: 60 } },
        { perSide: true, metric: 'distance' },
      ),
    ).toBe('3 × 20–25 m por lado · descanso 45–60 s');
  });

  it('mostra o intervalo de séries quando o plano o indica', () => {
    expect(formatSets({ sets: 2, setsMax: 3 })).toBe('2–3');
    expect(formatSets({ sets: 3 })).toBe('3');
    expect(
      formatPrescription({ sets: 2, setsMax: 3, reps: { min: 8 } }, { perSide: true, metric: 'reps' }),
    ).toBe('2–3 × 8 por lado');
  });

  it('identifica entradas informativas', () => {
    expect(formatPrescription({ sets: 1 }, { perSide: false, metric: 'informational' })).toBe(
      'Entrada informativa',
    );
  });
});

describe('formatação de valores', () => {
  it('formata intervalos', () => {
    expect(formatRange({ min: 8 })).toBe('8');
    expect(formatRange({ min: 8, max: 12 })).toBe('8–12');
    expect(formatRange({ min: 20, max: 25 }, 'm')).toBe('20–25 m');
  });

  it('formata segundos de forma legível', () => {
    expect(formatSeconds(30)).toBe('30 s');
    expect(formatSeconds(60)).toBe('1 min');
    expect(formatSeconds(90)).toBe('1 min 30 s');
  });

  it('formata a contagem decrescente com dois dígitos', () => {
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(1000)).toBe('00:01');
    expect(formatCountdown(90_000)).toBe('01:30');
    // Nunca mostra valores negativos.
    expect(formatCountdown(-5000)).toBe('00:00');
  });

  it('formata durações e cargas', () => {
    expect(formatDurationMinutes(undefined)).toBe('—');
    expect(formatDurationMinutes(0)).toBe('—');
    expect(formatDurationMinutes(2700)).toBe('45 min');
    expect(formatDurationMinutes(4500)).toBe('1 h 15 min');
    expect(formatLoad(null)).toBe('—');
    expect(formatLoad(16)).toBe('16 kg');
    expect(formatLoad(12.5)).toBe('12.5 kg');
  });

  it('descreve o alvo de cada série', () => {
    expect(formatSetTarget({ sets: 2, reps: { min: 10 } }, 'reps')).toBe('10 reps');
    expect(formatSetTarget({ sets: 2, seconds: { min: 20, max: 30 } }, 'time')).toBe('20–30 s');
    expect(formatSetTarget({ sets: 3, meters: { min: 20 } }, 'distance')).toBe('20 m');
  });
});
