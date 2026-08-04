import type { ExerciseDefinition } from '@/domain/types';
import { releaseExercises } from './release';
import { ankleFootExercises } from './ankleFoot';
import { hipMobilityExercises } from './hipMobility';
import { posteriorMobilityExercises } from './posteriorMobility';
import { thoracicExercises } from './thoracic';
import { coreControlExercises } from './coreControl';
import { squatAndKneeExercises } from './squatAndKnee';
import { hingeAndHamstringExercises } from './hingeAndHamstrings';
import { upperAndCarryExercises } from './upperAndCarries';
import { sessionMarkerExercises } from './sessionMarkers';
import { EXERCISE_VIDEOS } from '../videos';

const baseExercises: ExerciseDefinition[] = [
  ...releaseExercises,
  ...ankleFootExercises,
  ...hipMobilityExercises,
  ...posteriorMobilityExercises,
  ...thoracicExercises,
  ...coreControlExercises,
  ...squatAndKneeExercises,
  ...hingeAndHamstringExercises,
  ...upperAndCarryExercises,
  ...sessionMarkerExercises,
];

/**
 * The exercise library, with the verified video seed merged in.
 * Videos live in `src/data/videos.ts` so they can be refreshed independently of the copy.
 */
export const EXERCISES: ExerciseDefinition[] = baseExercises.map((exercise) => {
  const video = EXERCISE_VIDEOS[exercise.id];
  return video ? { ...exercise, video } : exercise;
});

export const EXERCISES_BY_ID: ReadonlyMap<string, ExerciseDefinition> = new Map(
  EXERCISES.map((exercise) => [exercise.id, exercise]),
);

export function getExercise(id: string): ExerciseDefinition | undefined {
  return EXERCISES_BY_ID.get(id);
}

/** Throws in development when the plan references an unknown exercise id. */
export function requireExercise(id: string): ExerciseDefinition {
  const exercise = EXERCISES_BY_ID.get(id);
  if (!exercise) {
    throw new Error(`Exercício desconhecido: ${id}`);
  }
  return exercise;
}

/** A video is only shown to the athlete when it exists and is not pending review. */
export function hasVerifiedVideo(exercise: ExerciseDefinition): boolean {
  return Boolean(exercise.video && !exercise.video.pendingReview);
}

export const CATEGORY_LABELS_PT: Record<ExerciseDefinition['category'], string> = {
  release: 'Libertação e rolo',
  'ankle-foot': 'Tornozelo e pé',
  'hip-mobility': 'Anca e adutores (mobilidade)',
  'posterior-mobility': 'Cadeia posterior (mobilidade)',
  'thoracic-scapular': 'Torácica e escapular',
  'core-control': 'Controlo e core',
  'squat-pattern': 'Padrão de agachamento',
  'knee-unilateral': 'Unilateral dominante de joelho',
  'hip-hinge': 'Hip hinge e extensão da anca',
  hamstrings: 'Posteriores da coxa',
  'hip-unilateral': 'Unilateral dominante de anca',
  adductors: 'Adutores',
  'upper-body': 'Tronco superior',
  carry: 'Transportes',
  power: 'Explosividade',
  conditioning: 'Condicionamento',
  recovery: 'Recuperação',
};

export const TAG_LABELS_PT: Record<ExerciseDefinition['tags'][number], string> = {
  base: 'Base',
  alternative: 'Alternativa',
  'later-phase': 'Fase posterior',
};

export const METRIC_LABELS_PT: Record<ExerciseDefinition['metric'], string> = {
  reps: 'Repetições',
  time: 'Tempo',
  distance: 'Distância',
  informational: 'Informativo',
};
