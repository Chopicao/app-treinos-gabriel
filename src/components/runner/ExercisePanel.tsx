import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, Plus, Repeat2, Undo2 } from 'lucide-react';
import type { ExerciseLogEntry, SessionLog, SetLog, SkipReason } from '@/domain/types';
import { getExercise } from '@/data/exercises';
import { SESSION_TEMPLATES_BY_ID } from '@/data/plan';
import { useAppStore } from '@/state/useAppStore';
import { restTimerId, setTimerId, useTimerStore } from '@/state/useTimerStore';
import { createTimer, start as startTimer } from '@/lib/timer';
import { canAppendSet } from '@/services/sessionBuilder';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SelectInput, TextArea } from '@/components/ui/Field';
import { Badge } from '@/components/ui/StatusBadge';
import { Notice } from '@/components/ui/Misc';
import { VideoButton } from '@/components/VideoModal';
import { Countdown } from './Countdown';
import { formatLoad, formatRpe, formatReserve, formatSeconds } from '@/lib/format';
import { PAIN_SKIP_NOTICE_PT, TEMPO_EXPLANATION_PT } from '@/data/safety';
import { cn } from '@/lib/cn';

const SIDE_LABEL = { left: 'Esquerdo', right: 'Direito' } as const;

const SKIP_REASONS: Array<{ value: SkipReason; labelPt: string }> = [
  { value: 'pain', labelPt: 'Dor ou desconforto' },
  { value: 'equipment', labelPt: 'Falta de material' },
  { value: 'fatigue', labelPt: 'Fadiga' },
  { value: 'time', labelPt: 'Falta de tempo' },
  { value: 'other', labelPt: 'Outro motivo' },
];

export function ExercisePanel({ log, entry }: { log: SessionLog; entry: ExerciseLogEntry }) {
  const updateSet = useAppStore((state) => state.updateSet);
  const addSetRow = useAppStore((state) => state.addSetRow);
  const skipEntry = useAppStore((state) => state.skipEntry);
  const unskipEntry = useAppStore((state) => state.unskipEntry);
  const substitute = useAppStore((state) => state.substituteExercise);
  const restAutoStart = useAppStore((state) => state.settings.restTimerAutoStart);
  const writeTimer = useTimerStore((state) => state.write);

  const [cuesOpen, setCuesOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [skipReason, setSkipReason] = useState<SkipReason>('fatigue');
  const [skipNote, setSkipNote] = useState('');
  const [substituteOpen, setSubstituteOpen] = useState(false);
  const [restVisible, setRestVisible] = useState(false);
  /** Muda a cada novo descanso para o temporizador recomeçar do zero. */
  const [restRound, setRestRound] = useState(0);

  const exercise = getExercise(entry.exerciseId);
  const activeSet = useMemo(() => entry.sets.find((set) => set.status === 'pending'), [entry.sets]);

  const allowedAlternatives = useAlternatives(log, entry);
  const restSeconds = entry.prescription.restSeconds?.min ?? 0;

  if (!exercise) return null;

  async function completeSet(set: SetLog, patch: Partial<SetLog>) {
    await updateSet(log.id, entry.id, set.id, { ...patch, status: 'done' });
    if (restSeconds === 0) return;
    // O descanso arranca aqui, num manipulador de evento, e não num efeito.
    const fresh = createTimer(restSeconds * 1000);
    writeTimer(
      log.id,
      restTimerId(log.id, entry.id),
      restAutoStart ? startTimer(fresh, Date.now()) : fresh,
    );
    setRestRound((round) => round + 1);
    setRestVisible(true);
  }

  return (
    <div className="space-y-4">
      <header className="space-y-2">
        <p className="text-muted text-xs tracking-wide uppercase">{entry.blockNamePt}</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl leading-tight">{exercise.namePt}</h2>
            <p className="text-muted mt-1 text-sm">{entry.prescriptionLabelPt}</p>
            {entry.prescription.rpe || entry.prescription.repsInReserve ? (
              <p className="text-muted mt-0.5 text-xs">
                {[
                  formatRpe(entry.prescription.rpe),
                  formatReserve(entry.prescription.repsInReserve),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            ) : null}
          </div>
          <VideoButton exercise={exercise} size="sm" />
        </div>

        {entry.substitutedFromExerciseId ? (
          <Badge tone="warn">
            Substituído a partir de{' '}
            {getExercise(entry.substitutedFromExerciseId)?.namePt ??
              entry.substitutedFromExerciseId}
          </Badge>
        ) : null}

        {entry.prescription.notePt ? (
          <p className="text-muted text-sm">{entry.prescription.notePt}</p>
        ) : null}
      </header>

      <details
        className="surface-raised border-app rounded-xl border"
        open={cuesOpen}
        onToggle={(event) => setCuesOpen((event.target as HTMLDetailsElement).open)}
      >
        <summary className="tap flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
          Como executar
          <ChevronDown aria-hidden="true" className={cn('size-4', cuesOpen && 'rotate-180')} />
        </summary>
        <div className="space-y-3 px-4 pb-4 text-sm">
          <ol className="text-muted list-decimal space-y-1 pl-5">
            {exercise.instructionsPt.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div>
            <p className="mb-1 font-medium">Pontos-chave</p>
            <ul className="text-muted list-disc space-y-1 pl-5">
              {exercise.techniqueCuesPt.map((cue) => (
                <li key={cue}>{cue}</li>
              ))}
            </ul>
          </div>
          {entry.prescription.tempo ? (
            <p className="text-muted text-xs">{TEMPO_EXPLANATION_PT}</p>
          ) : null}
          <p>
            <Link to={`/exercicios/${exercise.id}`} className="text-accent underline">
              Ver ficha completa
            </Link>
          </p>
        </div>
      </details>

      {entry.status === 'skipped' ? (
        <Notice tone="warn" title="Exercício saltado">
          <p>
            Motivo:{' '}
            {SKIP_REASONS.find((reason) => reason.value === entry.skipReason)?.labelPt ??
              'não indicado'}
            .
          </p>
          {entry.skipNotePt ? <p className="mt-1">{entry.skipNotePt}</p> : null}
          {entry.skipReason === 'pain' ? <p className="mt-2">{PAIN_SKIP_NOTICE_PT}</p> : null}
          <Button size="sm" className="mt-3" onClick={() => void unskipEntry(log.id, entry.id)}>
            <Undo2 aria-hidden="true" className="size-4" /> Retomar exercício
          </Button>
        </Notice>
      ) : (
        <>
          {entry.metric === 'informational' ? (
            <InformationalRows log={log} entry={entry} onComplete={completeSet} />
          ) : (
            <ul className="space-y-2">
              {entry.sets.map((set) => (
                <li key={set.id}>
                  <SetRow
                    log={log}
                    entry={entry}
                    set={set}
                    isActive={activeSet?.id === set.id}
                    onComplete={completeSet}
                    onUndo={() =>
                      void updateSet(log.id, entry.id, set.id, {
                        status: 'pending',
                        reps: null,
                        seconds: null,
                        meters: null,
                      })
                    }
                    onSkipSet={() =>
                      void updateSet(log.id, entry.id, set.id, { status: 'skipped' })
                    }
                  />
                </li>
              ))}
            </ul>
          )}

          {canAppendSet(entry) ? (
            <Button size="sm" onClick={() => void addSetRow(log.id, entry.id)}>
              <Plus aria-hidden="true" className="size-4" />
              Acrescentar série (o plano prevê até {entry.prescription.setsMax})
            </Button>
          ) : null}

          {restSeconds > 0 && restVisible ? (
            <Countdown
              key={`${entry.id}-rest-${restRound}`}
              sessionLogId={log.id}
              timerId={restTimerId(log.id, entry.id)}
              targetSeconds={restSeconds}
              label={`Descanso sugerido (${formatSeconds(restSeconds)}) — podes ignorar ou ajustar`}
              compact
              onSkip={() => setRestVisible(false)}
            />
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setSkipOpen(true)}>
              Saltar exercício
            </Button>
            {allowedAlternatives.length > 0 ? (
              <Button size="sm" onClick={() => setSubstituteOpen(true)}>
                <Repeat2 aria-hidden="true" className="size-4" />
                Trocar por alternativa
              </Button>
            ) : null}
            {restSeconds > 0 && !restVisible ? (
              <Button size="sm" onClick={() => setRestVisible(true)}>
                Temporizador de descanso
              </Button>
            ) : null}
          </div>
        </>
      )}

      <Modal
        open={skipOpen}
        onClose={() => setSkipOpen(false)}
        title="Saltar este exercício"
        description="O motivo é opcional, mas ajuda a perceber o que ajustar."
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setSkipOpen(false)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={() => {
                void skipEntry(log.id, entry.id, skipReason, skipNote.trim() || undefined);
                setSkipOpen(false);
                setSkipNote('');
              }}
            >
              Saltar exercício
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <SelectInput
            label="Motivo"
            value={skipReason}
            onChange={(event) => setSkipReason(event.target.value as SkipReason)}
          >
            {SKIP_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.labelPt}
              </option>
            ))}
          </SelectInput>
          {skipReason === 'pain' ? <Notice tone="warn">{PAIN_SKIP_NOTICE_PT}</Notice> : null}
          <TextArea
            label="Nota (opcional)"
            value={skipNote}
            onChange={(event) => setSkipNote(event.target.value)}
          />
        </div>
      </Modal>

      <Modal
        open={substituteOpen}
        onClose={() => setSubstituteOpen(false)}
        title="Trocar por alternativa autorizada"
        description="A prescrição mantém-se. Só estas alternativas estão previstas no plano."
      >
        <ul className="space-y-2">
          {allowedAlternatives.map((alternative) => (
            <li key={alternative.id}>
              <Button
                block
                onClick={() => {
                  void substitute(log.id, entry.id, alternative.id);
                  setSubstituteOpen(false);
                }}
              >
                {alternative.namePt}
              </Button>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

function useAlternatives(log: SessionLog, entry: ExerciseLogEntry) {
  return useMemo(() => {
    const template = SESSION_TEMPLATES_BY_ID.get(log.templateId);
    const block = template?.blocks.find((candidate) => candidate.id === entry.blockId);
    const item = block?.items.find((candidate) => candidate.id === entry.itemId);
    const ids = new Set(item?.allowedAlternativeIds ?? []);
    // Voltar ao exercício original também é uma troca autorizada.
    if (entry.substitutedFromExerciseId) ids.add(entry.substitutedFromExerciseId);
    ids.delete(entry.exerciseId);
    return [...ids].map((id) => getExercise(id)).filter((value) => value !== undefined);
  }, [
    log.templateId,
    entry.blockId,
    entry.itemId,
    entry.exerciseId,
    entry.substitutedFromExerciseId,
  ]);
}

function SetRow({
  log,
  entry,
  set,
  isActive,
  onComplete,
  onUndo,
  onSkipSet,
}: {
  log: SessionLog;
  entry: ExerciseLogEntry;
  set: SetLog;
  isActive: boolean;
  onComplete: (set: SetLog, patch: Partial<SetLog>) => void | Promise<void>;
  onUndo: () => void;
  onSkipSet: () => void;
}) {
  const [reps, setReps] = useState(String(set.reps ?? set.targetReps?.min ?? ''));
  const [meters, setMeters] = useState(String(set.meters ?? set.targetMeters?.min ?? ''));
  const [load, setLoad] = useState(set.loadKg === null ? '' : String(set.loadKg));

  const done = set.status === 'done';
  const skipped = set.status === 'skipped';
  const sideLabel = set.side ? SIDE_LABEL[set.side] : null;
  const targetSeconds = set.targetSeconds?.min ?? 0;

  return (
    <div
      className={cn(
        'border-app rounded-xl border p-3',
        done && 'border-brand-500/40 bg-brand-500/5',
        skipped && 'opacity-60',
        isActive && !done && 'border-accent',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Série {set.index}
          {sideLabel ? <span className="text-muted"> · lado {sideLabel.toLowerCase()}</span> : null}
        </p>
        <p className="text-muted text-xs">Alvo: {set.targetLabelPt}</p>
      </div>

      {entry.metric === 'time' && isActive && !done ? (
        <div className="mt-3">
          <Countdown
            sessionLogId={log.id}
            timerId={setTimerId(log.id, set.id)}
            targetSeconds={targetSeconds}
            label={`${sideLabel ? `Lado ${sideLabel.toLowerCase()} — ` : ''}${set.targetLabelPt}`}
            onFinished={(elapsed) =>
              void onComplete(set, {
                seconds: elapsed || targetSeconds,
                loadKg: load === '' ? null : Number(load),
              })
            }
            onSkip={onSkipSet}
          />
        </div>
      ) : null}

      {entry.metric !== 'time' || done || !isActive ? (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          {entry.metric === 'reps' ? (
            <NumberBox
              label="Repetições"
              value={reps}
              onChange={setReps}
              disabled={done || skipped}
            />
          ) : null}
          {entry.metric === 'distance' ? (
            <NumberBox
              label="Metros"
              value={meters}
              onChange={setMeters}
              disabled={done || skipped}
            />
          ) : null}
          {entry.metric === 'time' && done ? (
            <p className="text-muted text-sm">
              Registado: {set.seconds ? formatSeconds(set.seconds) : '—'}
            </p>
          ) : null}
          {entry.loadTracked ? (
            <NumberBox
              label="Carga (kg)"
              value={load}
              onChange={setLoad}
              step="0.5"
              disabled={done || skipped}
            />
          ) : null}

          <div className="ms-auto flex gap-2">
            {done || skipped ? (
              <Button size="sm" onClick={onUndo}>
                <Undo2 aria-hidden="true" className="size-4" /> Desfazer
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  void onComplete(set, {
                    reps: entry.metric === 'reps' ? Number(reps) || 0 : null,
                    meters: entry.metric === 'distance' ? Number(meters) || 0 : null,
                    seconds: entry.metric === 'time' ? targetSeconds : null,
                    loadKg: load === '' ? null : Number(load),
                  })
                }
              >
                <Check aria-hidden="true" className="size-4" /> Concluir
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {done && entry.loadTracked ? (
        <p className="text-muted mt-2 text-xs">Carga registada: {formatLoad(set.loadKg)}</p>
      ) : null}
    </div>
  );
}

function NumberBox({
  label,
  value,
  onChange,
  step = '1',
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  step?: string;
  disabled?: boolean;
}) {
  const id = `${label}-${Math.abs(hash(label + value)).toString(36)}`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-muted text-xs">
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        min="0"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="surface border-app tabular w-24 rounded-lg border px-3 py-2 disabled:opacity-60"
      />
    </div>
  );
}

function hash(value: string): number {
  let out = 0;
  for (let i = 0; i < value.length; i += 1) out = (out * 31 + value.charCodeAt(i)) | 0;
  return out;
}

function InformationalRows({
  log,
  entry,
  onComplete,
}: {
  log: SessionLog;
  entry: ExerciseLogEntry;
  onComplete: (set: SetLog, patch: Partial<SetLog>) => void | Promise<void>;
}) {
  const updateSet = useAppStore((state) => state.updateSet);
  const set = entry.sets[0];
  if (!set) return null;
  const done = set.status === 'done';
  return (
    <div className="border-app rounded-xl border p-4">
      <p className="text-muted text-sm">
        Esta entrada é informativa. Marca-a como feita para registar que aconteceu.
      </p>
      <div className="mt-3">
        {done ? (
          <Button
            size="sm"
            onClick={() => void updateSet(log.id, entry.id, set.id, { status: 'pending' })}
          >
            <Undo2 aria-hidden="true" className="size-4" /> Desfazer
          </Button>
        ) : (
          <Button size="sm" variant="primary" onClick={() => void onComplete(set, {})}>
            <Check aria-hidden="true" className="size-4" /> Marcar como feito
          </Button>
        )}
      </div>
    </div>
  );
}
