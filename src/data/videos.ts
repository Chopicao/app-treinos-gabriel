import type { ExerciseVideo } from '@/domain/types';
import videosJson from './videos.json';

/**
 * Verified YouTube demonstrations, keyed by exercise id.
 *
 * This is static seed data on purpose: no YouTube API key, no client-side API calls.
 * To refresh it, run `npm run search:videos` (collects real candidates) and
 * `npm run verify:videos` (re-checks availability and rewrites `verifiedAt`).
 *
 * `pendingReview: true` means the entry is NEVER shown to the athlete — only in
 * Definições → Revisão de vídeos.
 */
export const EXERCISE_VIDEOS: Record<string, ExerciseVideo> = videosJson as Record<
  string,
  ExerciseVideo
>;

export function buildEmbedUrl(videoId: string): string {
  // Modo de privacidade: só carregado depois de o utilizador carregar em "Ver vídeo".
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
}

export function buildWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}
