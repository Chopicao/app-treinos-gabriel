import { useCallback, useEffect, useRef, useState } from 'react';
import type { TimerSnapshot } from '@/domain/types';
import {
  adjust as adjustTimer,
  complete as completeTimer,
  createTimer,
  pause as pauseTimer,
  remainingMs,
  reset as resetTimer,
  resume as resumeTimer,
  start as startTimer,
  tick as tickTimer,
} from '@/lib/timer';

const REPAINT_INTERVAL_MS = 200;

export interface CountdownController {
  timer: TimerSnapshot;
  /** Clock value the current render was computed with. */
  now: number;
  remaining: number;
  start(): void;
  pause(): void;
  resume(): void;
  toggle(): void;
  reset(): void;
  complete(): void;
  addSeconds(seconds: number): void;
  setTarget(durationMs: number): void;
}

/**
 * Drives a single countdown.
 *
 * There is exactly one interval per hook instance and it does nothing but read
 * the clock — the displayed value is always derived from `Date.now()`, so a
 * backgrounded tab, a throttled interval or a page reload all resolve to the
 * same correct remaining time. Expiry is detected from the clock as well, which
 * is why the countdown can never "miss" its end while the tab is hidden.
 */
export function useCountdown(options: {
  initial: TimerSnapshot;
  onChange?: (timer: TimerSnapshot) => void;
  onComplete?: (timer: TimerSnapshot) => void;
}): CountdownController {
  const { initial, onChange, onComplete } = options;
  const [timer, setTimer] = useState<TimerSnapshot>(initial);
  const [now, setNow] = useState<number>(() => Date.now());

  const onChangeRef = useRef(onChange);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onChangeRef.current = onChange;
    onCompleteRef.current = onComplete;
  });

  const lastNotified = useRef<TimerSnapshot | null>(null);
  const alarmFiredFor = useRef<number | null>(null);

  /** Applies a pure transition using the current wall clock. */
  const update = useCallback(
    (transition: (current: TimerSnapshot, clock: number) => TimerSnapshot) => {
      const clock = Date.now();
      setNow(clock);
      setTimer((current) => transition(current, clock));
    },
    [],
  );

  // Repaint loop. Also re-reads the clock the moment the tab comes back.
  useEffect(() => {
    if (timer.status !== 'running') return;
    const advance = () => {
      const clock = Date.now();
      setNow(clock);
      setTimer((current) => tickTimer(current, clock));
    };
    const id = window.setInterval(advance, REPAINT_INTERVAL_MS);
    document.addEventListener('visibilitychange', advance);
    window.addEventListener('focus', advance);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', advance);
      window.removeEventListener('focus', advance);
    };
  }, [timer.status]);

  // Persistence and the optional end-of-timer alert.
  useEffect(() => {
    if (lastNotified.current === timer) return;
    const first = lastNotified.current === null;
    lastNotified.current = timer;
    if (!first) onChangeRef.current?.(timer);

    if (
      timer.status === 'completed' &&
      timer.completedAt !== null &&
      alarmFiredFor.current !== timer.completedAt
    ) {
      alarmFiredFor.current = timer.completedAt;
      onCompleteRef.current?.(timer);
    }
  }, [timer]);

  return {
    timer,
    now,
    remaining: remainingMs(timer, now),
    start: () => update(startTimer),
    pause: () => update(pauseTimer),
    resume: () => update(resumeTimer),
    toggle: () =>
      update((current, clock) => {
        if (current.status === 'running') return pauseTimer(current, clock);
        if (current.status === 'paused') return resumeTimer(current, clock);
        if (current.status === 'idle') return startTimer(current, clock);
        return current;
      }),
    reset: () => {
      alarmFiredFor.current = null;
      update((current) => resetTimer(current));
    },
    complete: () => update(completeTimer),
    addSeconds: (seconds) =>
      update((current, clock) => adjustTimer(current, seconds * 1000, clock)),
    setTarget: (durationMs) => {
      alarmFiredFor.current = null;
      update(() => createTimer(durationMs));
    },
  };
}
