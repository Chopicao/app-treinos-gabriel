import { describe, expect, it } from 'vitest';
import {
  adjust,
  complete,
  createTimer,
  elapsedMs,
  elapsedSeconds,
  isExpired,
  pause,
  progressRatio,
  remainingMs,
  reset,
  resume,
  start,
  tick,
} from '@/lib/timer';

const MINUTE = 60_000;

describe('motor do temporizador', () => {
  it('começa parado com o tempo total disponível', () => {
    const timer = createTimer(90_000);
    expect(timer.status).toBe('idle');
    expect(remainingMs(timer, 1_000_000)).toBe(90_000);
    expect(elapsedMs(timer, 1_000_000)).toBe(0);
  });

  it('conta a partir do relógio real, não de intervalos', () => {
    let timer = createTimer(MINUTE);
    timer = start(timer, 1_000);
    // Nenhum "tick" aconteceu, mas passaram 20 segundos de relógio.
    expect(remainingMs(timer, 21_000)).toBe(40_000);
    expect(elapsedSeconds(timer, 21_000)).toBe(20);
  });

  it('pausa e retoma sem perder nem duplicar tempo', () => {
    let timer = createTimer(MINUTE);
    timer = start(timer, 0);
    timer = pause(timer, 10_000);
    expect(timer.status).toBe('paused');
    expect(remainingMs(timer, 10_000)).toBe(50_000);

    // Enquanto está em pausa, o relógio pode avançar à vontade.
    expect(remainingMs(timer, 5 * MINUTE)).toBe(50_000);

    timer = resume(timer, 5 * MINUTE);
    expect(remainingMs(timer, 5 * MINUTE + 15_000)).toBe(35_000);
  });

  it('separador em segundo plano: ao voltar, o valor é o correto e não reinicia', () => {
    let timer = createTimer(30_000);
    timer = start(timer, 0);
    // O separador esteve escondido 45 segundos: o intervalo nunca disparou.
    const back = 45_000;
    expect(isExpired(timer, back)).toBe(true);
    timer = tick(timer, back);
    expect(timer.status).toBe('completed');
    // O fim é registado no instante em que expirou, não quando reparámos.
    expect(timer.completedAt).toBe(30_000);
    expect(remainingMs(timer, back)).toBe(0);
  });

  it('sobrevive a um reload: o estado é reconstruído do relógio', () => {
    let timer = createTimer(MINUTE);
    timer = start(timer, 1_000);
    // Serializar e voltar a ler é o que acontece ao recarregar a página.
    const restored = JSON.parse(JSON.stringify(timer));
    expect(remainingMs(restored, 31_000)).toBe(30_000);
    expect(restored.status).toBe('running');
  });

  it('nunca fica negativo', () => {
    let timer = createTimer(10_000);
    timer = start(timer, 0);
    expect(remainingMs(timer, 999_999)).toBe(0);
    expect(progressRatio(timer, 999_999)).toBe(1);
  });

  it('concluir é idempotente, para o alarme não tocar duas vezes', () => {
    let timer = createTimer(MINUTE);
    timer = start(timer, 0);
    const first = complete(timer, 20_000);
    const second = complete(first, 25_000);
    expect(second).toBe(first);
    expect(first.completedAt).toBe(20_000);
  });

  it('um temporizador concluído não volta a arrancar sem reiniciar', () => {
    let timer = createTimer(MINUTE);
    timer = complete(start(timer, 0), 10_000);
    expect(start(timer, 20_000)).toBe(timer);
    expect(tick(timer, 20_000)).toBe(timer);

    const fresh = reset(timer);
    expect(fresh.status).toBe('idle');
    expect(remainingMs(fresh, 20_000)).toBe(MINUTE);
  });

  it('+10 s e −10 s mudam o alvo e não o tempo já decorrido', () => {
    let timer = createTimer(30_000);
    timer = start(timer, 0);
    timer = adjust(timer, 10_000, 5_000);
    expect(timer.targetDurationMs).toBe(40_000);
    expect(remainingMs(timer, 5_000)).toBe(35_000);

    timer = adjust(timer, -10_000, 5_000);
    expect(remainingMs(timer, 5_000)).toBe(25_000);
  });

  it('−10 s nunca leva o alvo abaixo do tempo já decorrido', () => {
    let timer = createTimer(30_000);
    timer = start(timer, 0);
    timer = adjust(timer, -60_000, 25_000);
    expect(timer.targetDurationMs).toBe(25_000);
    expect(remainingMs(timer, 25_000)).toBe(0);
    expect(tick(timer, 25_000).status).toBe('completed');
  });

  it('mudar de exercício deixa cada temporizador com o seu próprio estado', () => {
    const a = start(createTimer(30_000), 0);
    const b = createTimer(45_000);
    expect(remainingMs(a, 10_000)).toBe(20_000);
    expect(remainingMs(b, 10_000)).toBe(45_000);
  });
});
