import type { TimerSnapshot } from '@/domain/types';

/**
 * Countdown engine.
 *
 * The timer is a pure value that can be rebuilt from the wall clock, so it never
 * drifts, never depends on `setInterval` firing, and survives a reload or a tab
 * that was in the background:
 *
 *   elapsed   = accumulatedMs + (running ? now - startedAt : 0)
 *   remaining = max(0, targetDurationMs - elapsed)
 *
 * `setInterval` only decides *when to repaint*, never what the value is.
 */

export function createTimer(targetDurationMs: number): TimerSnapshot {
  return {
    status: 'idle',
    targetDurationMs: Math.max(0, Math.round(targetDurationMs)),
    startedAt: null,
    accumulatedMs: 0,
    completedAt: null,
  };
}

export function elapsedMs(timer: TimerSnapshot, now: number): number {
  if (timer.status === 'running' && timer.startedAt !== null) {
    return timer.accumulatedMs + Math.max(0, now - timer.startedAt);
  }
  return timer.accumulatedMs;
}

export function remainingMs(timer: TimerSnapshot, now: number): number {
  if (timer.status === 'completed') return 0;
  return Math.max(0, timer.targetDurationMs - elapsedMs(timer, now));
}

export function isExpired(timer: TimerSnapshot, now: number): boolean {
  return elapsedMs(timer, now) >= timer.targetDurationMs;
}

export function start(timer: TimerSnapshot, now: number): TimerSnapshot {
  if (timer.status === 'running') return timer;
  if (timer.status === 'completed') return timer;
  return { ...timer, status: 'running', startedAt: now };
}

export function pause(timer: TimerSnapshot, now: number): TimerSnapshot {
  if (timer.status !== 'running') return timer;
  return {
    ...timer,
    status: 'paused',
    accumulatedMs: elapsedMs(timer, now),
    startedAt: null,
  };
}

export function resume(timer: TimerSnapshot, now: number): TimerSnapshot {
  if (timer.status !== 'paused') return timer;
  return { ...timer, status: 'running', startedAt: now };
}

export function reset(timer: TimerSnapshot): TimerSnapshot {
  return createTimer(timer.targetDurationMs);
}

/**
 * Marks the countdown finished. Idempotent: calling it twice keeps the first
 * `completedAt`, so an alarm can never fire twice for the same timer.
 */
export function complete(timer: TimerSnapshot, now: number): TimerSnapshot {
  if (timer.status === 'completed') return timer;
  return {
    ...timer,
    status: 'completed',
    accumulatedMs: Math.min(elapsedMs(timer, now), timer.targetDurationMs),
    startedAt: null,
    completedAt: now,
  };
}

/**
 * Advances the state machine using the wall clock. Called on every repaint and
 * whenever the tab becomes visible again. `completedAt` is the moment the timer
 * actually expired, not the moment we noticed.
 */
export function tick(timer: TimerSnapshot, now: number): TimerSnapshot {
  if (timer.status !== 'running') return timer;
  if (!isExpired(timer, now)) return timer;
  const expiredAt =
    timer.startedAt === null
      ? now
      : Math.min(now, timer.startedAt + (timer.targetDurationMs - timer.accumulatedMs));
  return {
    ...timer,
    status: 'completed',
    accumulatedMs: timer.targetDurationMs,
    startedAt: null,
    completedAt: expiredAt,
  };
}

/**
 * The +10 s / −10 s buttons change the target, never the elapsed time.
 * The target is clamped so the countdown can never go negative.
 */
export function adjust(timer: TimerSnapshot, deltaMs: number, now: number): TimerSnapshot {
  if (timer.status === 'completed') return timer;
  const elapsed = elapsedMs(timer, now);
  const target = Math.max(elapsed, Math.max(0, timer.targetDurationMs + deltaMs));
  return { ...timer, targetDurationMs: target };
}

/** Seconds the athlete actually spent, for the log. */
export function elapsedSeconds(timer: TimerSnapshot, now: number): number {
  return Math.round(elapsedMs(timer, now) / 1000);
}

export function progressRatio(timer: TimerSnapshot, now: number): number {
  if (timer.targetDurationMs === 0) return 1;
  return Math.min(1, elapsedMs(timer, now) / timer.targetDurationMs);
}
