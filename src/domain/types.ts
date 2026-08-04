/**
 * Domain model for the training app.
 *
 * Design rules that the rest of the codebase depends on:
 * - Plan data (templates, prescriptions) is immutable seed content, versioned by `planVersion`.
 * - A `SessionLog` snapshots the prescription at the moment it is created, so changing the plan
 *   phase (or the plan itself) never rewrites history.
 * - Dates are stored as ISO strings; calendar days use `yyyy-MM-dd` in Europe/Lisbon.
 */

// ---------------------------------------------------------------------------
// Exercises
// ---------------------------------------------------------------------------

export type ExerciseMetric = 'reps' | 'time' | 'distance' | 'informational';

/** `base` = active in the plan, `alternative` = authorised swap, `later-phase` = not for the MVP. */
export type ExerciseTag = 'base' | 'alternative' | 'later-phase';

export type ExerciseCategory =
  | 'release'
  | 'ankle-foot'
  | 'hip-mobility'
  | 'posterior-mobility'
  | 'thoracic-scapular'
  | 'core-control'
  | 'squat-pattern'
  | 'knee-unilateral'
  | 'hip-hinge'
  | 'hamstrings'
  | 'hip-unilateral'
  | 'adductors'
  | 'upper-body'
  | 'carry'
  | 'power'
  | 'conditioning'
  | 'recovery';

export interface ExerciseVideo {
  /** Always `https://www.youtube.com/watch?v=<id>`. */
  canonicalUrl: string;
  videoId: string;
  title: string;
  channel: string;
  /** BCP-47-ish tag of the spoken language, e.g. `en`, `pt-PT`. */
  language: string;
  /** ISO date of the last successful availability check. */
  verifiedAt: string;
  /** `true` => never shown to the athlete, only in the review area. */
  pendingReview: boolean;
  /** Why this video was chosen (PT-PT). */
  reasonPt?: string;
}

export interface ExerciseDefinition {
  id: string;
  namePt: string;
  nameEn: string;
  category: ExerciseCategory;
  equipment: string[];
  metric: ExerciseMetric;
  unilateral: boolean;
  instructionsPt: string[];
  techniqueCuesPt: string[];
  safetyNotesPt: string[];
  tags: ExerciseTag[];
  video?: ExerciseVideo;
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

/** Phases of the six-week base block. `w7+` keeps the week 5–6 load and asks for a review. */
export type PhaseId = 'w1-2' | 'w3-4' | 'w5-6' | 'w7+';

export interface NumericRange {
  min: number;
  max?: number;
}

/** What the plan asks for, for one exercise, in one phase. */
export interface PrescriptionValues {
  /** Default number of logged sets. `0` means the item is not part of this phase. */
  sets: number;
  /** Upper bound when the plan writes a range like "2–3 séries". Never auto-applied. */
  setsMax?: number;
  reps?: NumericRange;
  /** Seconds per set (per side when the item is unilateral). */
  seconds?: NumericRange;
  meters?: NumericRange;
  restSeconds?: NumericRange;
  /** Eccentric–pause–concentric code, e.g. `3-1-1`. */
  tempo?: string;
  rpe?: NumericRange;
  repsInReserve?: NumericRange;
  notePt?: string;
}

export interface PlanItem {
  /** Unique inside its session template. */
  id: string;
  exerciseId: string;
  /** The prescription is executed once per side. */
  perSide: boolean;
  /** Show a load (kg) field when logging. */
  loadTracked: boolean;
  byPhase: Record<PhaseId, PrescriptionValues>;
  notesPt?: string[];
  /** Shown as "Opcional" and excluded from the completion requirement. */
  optional?: boolean;
  /** Only these swaps are offered; the app never substitutes automatically. */
  allowedAlternativeIds?: string[];
  /** Exercises presented as an either/or choice with this one (e.g. bike or rower). */
  choiceWithIds?: string[];
}

export interface PlanBlock {
  id: string;
  namePt: string;
  descriptionPt?: string;
  /** Circuit rounds. `undefined` means a straight-set block. */
  rounds?: number;
  restBetweenRoundsSeconds?: NumericRange;
  estimatedMinutes?: number;
  items: PlanItem[];
}

export type SessionKind =
  | 'mobility'
  | 'mobility-short'
  | 'match-warmup'
  | 'gym-a'
  | 'gym-b'
  | 'football'
  | 'match'
  | 'recovery';

export interface SessionTemplate {
  id: string;
  namePt: string;
  shortNamePt: string;
  kind: SessionKind;
  summaryPt: string;
  estimatedMinutes: NumericRange;
  equipmentPt: string[];
  notesPt?: string[];
  blocks: PlanBlock[];
}

export interface PhaseDefinition {
  id: PhaseId;
  labelPt: string;
  weeks: number[];
  guidancePt: string;
}

export interface WeekTemplateDay {
  /** ISO weekday: 1 = Monday … 7 = Sunday. */
  weekday: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  labelPt: string;
  sessionTemplateIds: string[];
}

export interface TrainingPlan {
  planVersion: string;
  namePt: string;
  descriptionPt: string;
  totalWeeks: number;
  phases: PhaseDefinition[];
  week: WeekTemplateDay[];
  sessions: SessionTemplate[];
}

// ---------------------------------------------------------------------------
// Scheduling
// ---------------------------------------------------------------------------

export type SessionStatus = 'planned' | 'in-progress' | 'completed' | 'partial' | 'skipped';

/** A single planned occurrence, computed from the plan + start date + overrides. */
export interface SessionOccurrence {
  /** Stable identity: `${templateId}@${originalDate}`. Survives rescheduling. */
  key: string;
  templateId: string;
  /** The date the week template originally put this session on. */
  originalDate: string;
  /** Where it currently sits in the calendar. */
  date: string;
  planWeek: number;
  phaseId: PhaseId;
  rescheduled: boolean;
  status: SessionStatus;
  logId?: string;
}

export interface OccurrenceOverride {
  key: string;
  originalDate: string;
  newDate: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

export type Side = 'left' | 'right';

export type SetStatus = 'pending' | 'done' | 'skipped';

export type EntryStatus = 'pending' | 'in-progress' | 'done' | 'skipped';

export type SkipReason = 'pain' | 'equipment' | 'fatigue' | 'time' | 'other';

export interface SetLog {
  id: string;
  /** 1-based index inside the entry. */
  index: number;
  side: Side | null;
  /** Human-readable target, snapshotted from the prescription (e.g. "10 reps", "30 s"). */
  targetLabelPt: string;
  targetReps?: NumericRange;
  targetSeconds?: NumericRange;
  targetMeters?: NumericRange;
  reps?: number | null;
  seconds?: number | null;
  meters?: number | null;
  loadKg?: number | null;
  status: SetStatus;
  completedAt?: string;
  notePt?: string;
}

export interface ExerciseLogEntry {
  /** `${blockId}::${itemId}` — unique inside the session. */
  id: string;
  blockId: string;
  blockNamePt: string;
  itemId: string;
  exerciseId: string;
  /** Snapshot: the athlete may later swap the exercise for an authorised alternative. */
  exerciseNamePt: string;
  metric: ExerciseMetric;
  perSide: boolean;
  loadTracked: boolean;
  prescription: PrescriptionValues;
  prescriptionLabelPt: string;
  /** Present when the athlete swapped for an authorised alternative. */
  substitutedFromExerciseId?: string;
  status: EntryStatus;
  skipReason?: SkipReason;
  skipNotePt?: string;
  sets: SetLog[];
  notePt?: string;
}

export interface SessionLog {
  id: string;
  occurrenceKey: string;
  templateId: string;
  templateNamePt: string;
  kind: SessionKind;
  planVersion: string;
  planWeek: number;
  phaseId: PhaseId;
  /** Calendar day the session belongs to (`yyyy-MM-dd`). */
  date: string;
  status: SessionStatus;
  startedAt?: string;
  completedAt?: string;
  plannedMinutes: NumericRange;
  /** Accumulated wall-clock seconds while the session was open. */
  activeSeconds: number;
  lastResumedAt?: string;
  /** Entry the runner should reopen on. */
  cursorEntryId?: string | null;
  entries: ExerciseLogEntry[];
  sessionRpe?: number | null;
  discomfort?: number | null;
  /** "Estou com fadiga" flag → shows the plan's default adaptation note. */
  fatigueFlag?: boolean;
  notesPt?: string;
  createdAt: string;
  updatedAt: string;
  /** Set when a completed session is edited afterwards. */
  editedAt?: string;
}

// ---------------------------------------------------------------------------
// Timer
// ---------------------------------------------------------------------------

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

/**
 * Everything needed to rebuild a countdown from the wall clock alone.
 * `remaining = targetDurationMs - (accumulatedMs + (running ? now - startedAt : 0))`
 */
export interface TimerSnapshot {
  status: TimerStatus;
  targetDurationMs: number;
  /** Epoch ms of the current running segment; `null` unless running. */
  startedAt: number | null;
  /** Elapsed ms from all previous segments. */
  accumulatedMs: number;
  completedAt: number | null;
}

export interface PersistedTimer extends TimerSnapshot {
  /** `${sessionLogId}::${key}` where key is a set id or `rest::<entryId>`. */
  id: string;
  sessionLogId: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Profile & settings
// ---------------------------------------------------------------------------

/**
 * The athlete's profile is **never** shipped in the app bundle. It starts empty
 * and is filled in during onboarding, so the published files carry no personal
 * or health data — everything the athlete types stays in this device's storage.
 * `null` / empty means "ainda por preencher".
 */
export interface AthleteProfile {
  id: 'athlete';
  namePt: string;
  ageYears: number | null;
  heightCm: number | null;
  weightKg: number | null;
  positionPt: string;
  dominantFootPt: string;
  experiencePt: string;
  gymExperiencePt: string;
  phasePt: string;
  sleepHoursPt: string;
  supervisionPt: string;
  injuryHistoryPt: string[];
  mobilityNotesPt: string[];
  goalsPt: string[];
  equipmentPt: string[];
  openQuestionsPt: string[];
  updatedAt: string;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface AppSettings {
  id: 'app';
  schemaVersion: number;
  planVersion: string;
  /** Monday of week 1 (`yyyy-MM-dd`). */
  planStartDate: string;
  onboardingCompletedAt?: string;
  safetyAcknowledgedAt?: string;
  theme: ThemePreference;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  keepScreenAwake: boolean;
  restTimerAutoStart: boolean;
  showLaterPhaseInLibrary: boolean;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Export / import
// ---------------------------------------------------------------------------

export interface ExportBundle {
  kind: 'app-treinos-export';
  formatVersion: number;
  exportedAt: string;
  planVersion: string;
  settings: AppSettings;
  profile: AthleteProfile;
  sessions: SessionLog[];
  overrides: OccurrenceOverride[];
}
