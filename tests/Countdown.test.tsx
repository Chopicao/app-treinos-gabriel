import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { Countdown } from '@/components/runner/Countdown';
import { useTimerStore } from '@/state/useTimerStore';

const SESSION = 'sess-1';
const TIMER = 'sess-1::set::abc';

function press(name: RegExp) {
  const button = screen.getByRole('button', { name });
  act(() => {
    button.click();
  });
}

function display() {
  return screen.getByText(/^\d{2}:\d{2}$/).textContent;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-08-04T18:00:00.000Z'));
  useTimerStore.setState({ loadedSessionId: SESSION, timers: {} });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('componente de contagem decrescente', () => {
  it('mostra o tempo total antes de começar', () => {
    render(
      <Countdown sessionLogId={SESSION} timerId={TIMER} targetSeconds={30} label="Isometria" />,
    );
    expect(display()).toBe('00:30');
    expect(screen.getByRole('status')).toHaveTextContent('Por iniciar');
  });

  it('conta, pausa, retoma e termina uma única vez', () => {
    const onFinished = vi.fn();
    render(
      <Countdown
        sessionLogId={SESSION}
        timerId={TIMER}
        targetSeconds={30}
        label="Isometria"
        onFinished={onFinished}
      />,
    );

    press(/^iniciar$/i);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(display()).toBe('00:20');

    press(/^pausar$/i);
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    // Em pausa o relógio não conta.
    expect(display()).toBe('00:20');

    press(/^retomar$/i);
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(display()).toBe('00:15');

    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(display()).toBe('00:00');
    expect(screen.getByRole('status')).toHaveTextContent('Concluído');
    expect(onFinished).toHaveBeenCalledTimes(1);

    // Continuar a avançar não volta a disparar o fim.
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('recarregar a página retoma no ponto certo', () => {
    const { unmount } = render(
      <Countdown sessionLogId={SESSION} timerId={TIMER} targetSeconds={60} label="Prancha" />,
    );
    press(/^iniciar$/i);
    act(() => {
      vi.advanceTimersByTime(25_000);
    });
    expect(display()).toBe('00:35');

    // Simula fechar a aplicação: o estado persistido fica na store.
    unmount();
    expect(useTimerStore.getState().timers[TIMER]?.status).toBe('running');

    // O relógio continua a andar com a aplicação fechada.
    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    render(
      <Countdown sessionLogId={SESSION} timerId={TIMER} targetSeconds={60} label="Prancha" />,
    );
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(display()).toBe('00:20');
  });

  it('separador em segundo plano: ao voltar, o temporizador já terminou', () => {
    const onFinished = vi.fn();
    render(
      <Countdown
        sessionLogId={SESSION}
        timerId={TIMER}
        targetSeconds={20}
        label="Descanso"
        onFinished={onFinished}
      />,
    );
    press(/^iniciar$/i);

    // O intervalo não dispara durante todo esse tempo, só quando voltamos.
    act(() => {
      vi.setSystemTime(new Date('2026-08-04T18:02:00.000Z'));
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(display()).toBe('00:00');
    expect(onFinished).toHaveBeenCalledTimes(1);
  });

  it('reiniciar devolve o tempo total', () => {
    render(
      <Countdown sessionLogId={SESSION} timerId={TIMER} targetSeconds={45} label="Descanso" />,
    );
    press(/^iniciar$/i);
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    press(/^reiniciar$/i);
    expect(display()).toBe('00:45');
    expect(screen.getByRole('status')).toHaveTextContent('Por iniciar');
  });

  it('+10 s e −10 s ajustam o alvo', () => {
    render(
      <Countdown sessionLogId={SESSION} timerId={TIMER} targetSeconds={30} label="Descanso" />,
    );
    press(/acrescentar 10 segundos/i);
    expect(display()).toBe('00:40');
    press(/reduzir 10 segundos/i);
    press(/reduzir 10 segundos/i);
    expect(display()).toBe('00:20');
  });
});
