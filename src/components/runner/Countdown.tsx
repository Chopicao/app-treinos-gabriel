import { useState } from 'react';
import { Check, Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import type { TimerSnapshot } from '@/domain/types';
import { useCountdown } from '@/hooks/useCountdown';
import { useTimerStore } from '@/state/useTimerStore';
import { useAppStore } from '@/state/useAppStore';
import { playChime, vibrate } from '@/lib/alerts';
import { Button } from '@/components/ui/Button';
import { formatCountdown } from '@/lib/format';
import { createTimer, elapsedSeconds, progressRatio } from '@/lib/timer';

import { cn } from '@/lib/cn';

const STATUS_LABEL: Record<TimerSnapshot['status'], string> = {
  idle: 'Por iniciar',
  running: 'A contar',
  paused: 'Em pausa',
  completed: 'Concluído',
};

/**
 * Contagem decrescente ligada ao relógio real e persistida a cada transição.
 * Mudar de separador, bloquear o telemóvel ou recarregar a página não altera o
 * valor correto: ele é sempre recalculado a partir do relógio.
 */
export function Countdown({
  sessionLogId,
  timerId,
  targetSeconds,
  label,
  compact = false,
  onFinished,
  onSkip,
}: {
  sessionLogId: string;
  timerId: string;
  targetSeconds: number;
  label: string;
  compact?: boolean;
  onFinished?: (elapsed: number) => void;
  onSkip?: () => void;
}) {
  const stored = useTimerStore((state) => state.timers[timerId]);
  const write = useTimerStore((state) => state.write);
  const soundEnabled = useAppStore((state) => state.settings.soundEnabled);
  const vibrationEnabled = useAppStore((state) => state.settings.vibrationEnabled);

  // Lido uma única vez: a partir daqui o estado vive no hook e é persistido.
  const [initial] = useState<TimerSnapshot>(() => stored ?? createTimer(targetSeconds * 1000));

  const countdown = useCountdown({
    initial,
    onChange: (snapshot) => write(sessionLogId, timerId, snapshot),
    onComplete: (snapshot) => {
      playChime(soundEnabled);
      vibrate(vibrationEnabled);
      onFinished?.(elapsedSeconds(snapshot, snapshot.completedAt ?? 0));
    },
  });

  const { timer, remaining, now } = countdown;
  const ratio = progressRatio(timer, now);

  return (
    <div className={cn('surface-sunken border-app rounded-2xl border p-4', compact && 'p-3')}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-muted text-sm">{label}</p>
        <p className="text-muted text-xs" role="status">
          {STATUS_LABEL[timer.status]}
        </p>
      </div>

      <p
        className={cn(
          'tabular my-2 text-center font-semibold',
          compact ? 'text-4xl' : 'text-6xl',
          timer.status === 'completed' && 'text-accent',
        )}
      >
        {formatCountdown(remaining)}
      </p>
      <p className="sr-only" aria-live="polite">
        {timer.status === 'completed' ? `${label}: temporizador terminado.` : ''}
      </p>

      <div className="surface h-1.5 w-full overflow-hidden rounded-full" aria-hidden="true">
        <div className="bg-accent h-full" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button
          variant="primary"
          onClick={countdown.toggle}
          disabled={timer.status === 'completed'}
        >
          {timer.status === 'running' ? (
            <>
              <Pause aria-hidden="true" className="size-4" /> Pausar
            </>
          ) : (
            <>
              <Play aria-hidden="true" className="size-4" />
              {timer.status === 'paused' ? 'Retomar' : 'Iniciar'}
            </>
          )}
        </Button>
        <Button onClick={countdown.reset}>
          <RotateCcw aria-hidden="true" className="size-4" /> Reiniciar
        </Button>
        <Button onClick={() => countdown.addSeconds(-10)} aria-label="Reduzir 10 segundos">
          −10 s
        </Button>
        <Button onClick={() => countdown.addSeconds(10)} aria-label="Acrescentar 10 segundos">
          +10 s
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {/* `onFinished` corre sempre pelo mesmo caminho (a transição para "completed"),
            para que concluir à mão e deixar chegar ao fim tenham o mesmo efeito, uma só vez. */}
        <Button onClick={countdown.complete} disabled={timer.status === 'completed'}>
          <Check aria-hidden="true" className="size-4" /> Concluir
        </Button>
        <Button
          onClick={() => {
            if (onSkip) onSkip();
            else countdown.complete();
          }}
        >
          <SkipForward aria-hidden="true" className="size-4" /> Saltar
        </Button>
      </div>
    </div>
  );
}
