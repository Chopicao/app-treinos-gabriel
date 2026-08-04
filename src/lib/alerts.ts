/**
 * Optional end-of-timer feedback. Nothing plays without the athlete having turned
 * it on in Definições, and a browser that refuses the API just stays silent.
 */

let audioContext: AudioContext | null = null;

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  return audioContext;
}

/** Two short beeps. Generated locally — no audio files, no network. */
export function playChime(enabled: boolean): void {
  if (!enabled) return;
  const context = getAudioContext();
  if (!context) return;
  void context.resume?.();

  const now = context.currentTime;
  for (const [index, frequency] of [880, 1174].entries()) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    const startAt = now + index * 0.18;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.18);
  }
}

export function vibrate(enabled: boolean, pattern: number | number[] = [120, 60, 120]): void {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Silêncio: a vibração é opcional.
  }
}

interface WakeLockSentinelLike {
  release(): Promise<void>;
}

type NavigatorWithWakeLock = Navigator & {
  wakeLock?: { request(type: 'screen'): Promise<WakeLockSentinelLike> };
};

let wakeLock: WakeLockSentinelLike | null = null;

/** Keeps the screen awake during a session. Silent fallback when unavailable. */
export async function requestWakeLock(enabled: boolean): Promise<boolean> {
  if (!enabled || typeof navigator === 'undefined') return false;
  const api = (navigator as NavigatorWithWakeLock).wakeLock;
  if (!api) return false;
  try {
    wakeLock = await api.request('screen');
    return true;
  } catch {
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  if (!wakeLock) return;
  try {
    await wakeLock.release();
  } catch {
    // Ignorado de propósito.
  } finally {
    wakeLock = null;
  }
}
