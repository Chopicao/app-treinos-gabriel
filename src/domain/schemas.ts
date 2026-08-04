/**
 * Runtime validation for anything that crosses a trust boundary:
 * imported JSON files and the seed data itself (validated once in dev/tests).
 */
import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD');
const isoDateTime = z.string().min(10);

export const numericRangeSchema = z.object({
  min: z.number(),
  max: z.number().optional(),
});

export const exerciseMetricSchema = z.enum(['reps', 'time', 'distance', 'informational']);
export const exerciseTagSchema = z.enum(['base', 'alternative', 'later-phase']);
export const exerciseCategorySchema = z.enum([
  'release',
  'ankle-foot',
  'hip-mobility',
  'posterior-mobility',
  'thoracic-scapular',
  'core-control',
  'squat-pattern',
  'knee-unilateral',
  'hip-hinge',
  'hamstrings',
  'hip-unilateral',
  'adductors',
  'upper-body',
  'carry',
  'power',
  'conditioning',
  'recovery',
]);

export const exerciseVideoSchema = z.object({
  canonicalUrl: z
    .string()
    .regex(
      /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/,
      'O URL tem de ser canónico: https://www.youtube.com/watch?v=...',
    ),
  videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  title: z.string().min(1),
  channel: z.string().min(1),
  language: z.string().min(2),
  verifiedAt: isoDate,
  pendingReview: z.boolean(),
  reasonPt: z.string().optional(),
});

export const exerciseDefinitionSchema = z.object({
  id: z.string().min(1),
  namePt: z.string().min(1),
  nameEn: z.string().min(1),
  category: exerciseCategorySchema,
  equipment: z.array(z.string()),
  metric: exerciseMetricSchema,
  unilateral: z.boolean(),
  instructionsPt: z.array(z.string().min(1)).min(1),
  techniqueCuesPt: z.array(z.string().min(1)).min(3).max(6),
  safetyNotesPt: z.array(z.string().min(1)).min(1),
  tags: z.array(exerciseTagSchema).min(1),
  video: exerciseVideoSchema.optional(),
});

export const phaseIdSchema = z.enum(['w1-2', 'w3-4', 'w5-6', 'w7+']);

export const prescriptionValuesSchema = z.object({
  sets: z.number().int().min(0),
  setsMax: z.number().int().min(1).optional(),
  reps: numericRangeSchema.optional(),
  seconds: numericRangeSchema.optional(),
  meters: numericRangeSchema.optional(),
  restSeconds: numericRangeSchema.optional(),
  tempo: z.string().optional(),
  rpe: numericRangeSchema.optional(),
  repsInReserve: numericRangeSchema.optional(),
  notePt: z.string().optional(),
});

export const planItemSchema = z.object({
  id: z.string().min(1),
  exerciseId: z.string().min(1),
  perSide: z.boolean(),
  loadTracked: z.boolean(),
  byPhase: z.record(phaseIdSchema, prescriptionValuesSchema),
  notesPt: z.array(z.string()).optional(),
  optional: z.boolean().optional(),
  allowedAlternativeIds: z.array(z.string()).optional(),
  choiceWithIds: z.array(z.string()).optional(),
});

export const planBlockSchema = z.object({
  id: z.string().min(1),
  namePt: z.string().min(1),
  descriptionPt: z.string().optional(),
  rounds: z.number().int().min(1).optional(),
  restBetweenRoundsSeconds: numericRangeSchema.optional(),
  estimatedMinutes: z.number().optional(),
  items: z.array(planItemSchema).min(1),
});

export const sessionKindSchema = z.enum([
  'mobility',
  'mobility-short',
  'match-warmup',
  'gym-a',
  'gym-b',
  'football',
  'match',
  'recovery',
]);

export const sessionTemplateSchema = z.object({
  id: z.string().min(1),
  namePt: z.string().min(1),
  shortNamePt: z.string().min(1),
  kind: sessionKindSchema,
  summaryPt: z.string().min(1),
  estimatedMinutes: numericRangeSchema,
  equipmentPt: z.array(z.string()),
  notesPt: z.array(z.string()).optional(),
  blocks: z.array(planBlockSchema).min(1),
});

export const trainingPlanSchema = z.object({
  planVersion: z.string().min(1),
  namePt: z.string().min(1),
  descriptionPt: z.string().min(1),
  totalWeeks: z.number().int().min(1),
  phases: z
    .array(
      z.object({
        id: phaseIdSchema,
        labelPt: z.string().min(1),
        weeks: z.array(z.number().int().min(1)),
        guidancePt: z.string().min(1),
      }),
    )
    .min(1),
  week: z
    .array(
      z.object({
        weekday: z.union([
          z.literal(1),
          z.literal(2),
          z.literal(3),
          z.literal(4),
          z.literal(5),
          z.literal(6),
          z.literal(7),
        ]),
        labelPt: z.string().min(1),
        sessionTemplateIds: z.array(z.string()),
      }),
    )
    .length(7),
  sessions: z.array(sessionTemplateSchema).min(1),
});

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

export const sessionStatusSchema = z.enum([
  'planned',
  'in-progress',
  'completed',
  'partial',
  'skipped',
]);

export const setLogSchema = z.object({
  id: z.string().min(1),
  index: z.number().int().min(1),
  side: z.enum(['left', 'right']).nullable(),
  targetLabelPt: z.string(),
  targetReps: numericRangeSchema.optional(),
  targetSeconds: numericRangeSchema.optional(),
  targetMeters: numericRangeSchema.optional(),
  reps: z.number().nullable().optional(),
  seconds: z.number().nullable().optional(),
  meters: z.number().nullable().optional(),
  loadKg: z.number().nullable().optional(),
  status: z.enum(['pending', 'done', 'skipped']),
  completedAt: isoDateTime.optional(),
  notePt: z.string().optional(),
});

export const exerciseLogEntrySchema = z.object({
  id: z.string().min(1),
  blockId: z.string().min(1),
  blockNamePt: z.string(),
  itemId: z.string().min(1),
  exerciseId: z.string().min(1),
  exerciseNamePt: z.string(),
  metric: exerciseMetricSchema,
  perSide: z.boolean(),
  loadTracked: z.boolean(),
  prescription: prescriptionValuesSchema,
  prescriptionLabelPt: z.string(),
  substitutedFromExerciseId: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'done', 'skipped']),
  skipReason: z.enum(['pain', 'equipment', 'fatigue', 'time', 'other']).optional(),
  skipNotePt: z.string().optional(),
  sets: z.array(setLogSchema),
  notePt: z.string().optional(),
});

export const sessionLogSchema = z.object({
  id: z.string().min(1),
  occurrenceKey: z.string().min(1),
  templateId: z.string().min(1),
  templateNamePt: z.string(),
  kind: sessionKindSchema,
  planVersion: z.string(),
  planWeek: z.number().int(),
  phaseId: phaseIdSchema,
  date: isoDate,
  status: sessionStatusSchema,
  startedAt: isoDateTime.optional(),
  completedAt: isoDateTime.optional(),
  plannedMinutes: numericRangeSchema,
  activeSeconds: z.number().min(0),
  lastResumedAt: isoDateTime.optional(),
  cursorEntryId: z.string().nullable().optional(),
  entries: z.array(exerciseLogEntrySchema),
  sessionRpe: z.number().min(0).max(10).nullable().optional(),
  discomfort: z.number().min(0).max(10).nullable().optional(),
  fatigueFlag: z.boolean().optional(),
  notesPt: z.string().optional(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  editedAt: isoDateTime.optional(),
});

export const occurrenceOverrideSchema = z.object({
  key: z.string().min(1),
  originalDate: isoDate,
  newDate: isoDate,
  createdAt: isoDateTime,
});

export const athleteProfileSchema = z.object({
  id: z.literal('athlete'),
  namePt: z.string(),
  // `null` = ainda por preencher. Estes campos nunca vêm nos dados seed.
  ageYears: z.number().int().min(5).max(60).nullable(),
  heightCm: z.number().min(100).max(230).nullable(),
  weightKg: z.number().min(30).max(200).nullable(),
  positionPt: z.string(),
  dominantFootPt: z.string(),
  experiencePt: z.string(),
  gymExperiencePt: z.string(),
  phasePt: z.string(),
  sleepHoursPt: z.string(),
  supervisionPt: z.string(),
  injuryHistoryPt: z.array(z.string()),
  mobilityNotesPt: z.array(z.string()),
  goalsPt: z.array(z.string()),
  equipmentPt: z.array(z.string()),
  openQuestionsPt: z.array(z.string()),
  updatedAt: isoDateTime,
});

export const appSettingsSchema = z.object({
  id: z.literal('app'),
  schemaVersion: z.number().int().min(1),
  planVersion: z.string(),
  planStartDate: isoDate,
  onboardingCompletedAt: isoDateTime.optional(),
  safetyAcknowledgedAt: isoDateTime.optional(),
  accountPromptDismissedAt: isoDateTime.optional(),
  theme: z.enum(['light', 'dark', 'system']),
  soundEnabled: z.boolean(),
  vibrationEnabled: z.boolean(),
  keepScreenAwake: z.boolean(),
  restTimerAutoStart: z.boolean(),
  showLaterPhaseInLibrary: z.boolean(),
  updatedAt: isoDateTime,
});

export const exportBundleSchema = z.object({
  kind: z.literal('app-treinos-export'),
  formatVersion: z.number().int().min(1),
  exportedAt: isoDateTime,
  planVersion: z.string(),
  settings: appSettingsSchema,
  profile: athleteProfileSchema,
  sessions: z.array(sessionLogSchema),
  overrides: z.array(occurrenceOverrideSchema),
});

export type ExportBundleInput = z.infer<typeof exportBundleSchema>;
