import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flag, ShieldAlert, X } from 'lucide-react';
import type { SessionLog } from '@/domain/types';
import { useAppStore } from '@/state/useAppStore';
import { useTimerStore } from '@/state/useTimerStore';
import { useOccurrence } from '@/hooks/useSchedule';
import { getSessionTemplate } from '@/data/plan';
import { sessionProgress } from '@/services/sessionBuilder';
import { ExercisePanel } from '@/components/runner/ExercisePanel';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextArea, Toggle } from '@/components/ui/Field';
import { Notice, ProgressBar } from '@/components/ui/Misc';
import { requestWakeLock, releaseWakeLock } from '@/lib/alerts';
import { FATIGUE_RECOMMENDATION_PT, RPE_SCALE_NOTICE_PT, STOP_SIGNS_PT } from '@/data/safety';
import { cn } from '@/lib/cn';

export function RunnerPage() {
  const { occurrenceKey } = useParams<{ occurrenceKey: string }>();
  const key = occurrenceKey ? decodeURIComponent(occurrenceKey) : undefined;
  const occurrence = useOccurrence(key);
  const navigate = useNavigate();

  const sessions = useAppStore((state) => state.sessions);
  const ensureSession = useAppStore((state) => state.ensureSession);
  const startSession = useAppStore((state) => state.startSession);
  const setCursor = useAppStore((state) => state.setCursor);
  const patchSession = useAppStore((state) => state.patchSession);
  const finishSession = useAppStore((state) => state.finishSession);
  const keepScreenAwake = useAppStore((state) => state.settings.keepScreenAwake);
  const loadTimers = useTimerStore((state) => state.load);
  const timersLoadedFor = useTimerStore((state) => state.loadedSessionId);

  const [safetyOpen, setSafetyOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);

  const log = useMemo(
    () => sessions.find((session) => session.occurrenceKey === key),
    [sessions, key],
  );

  useEffect(() => {
    if (!occurrence) return;
    void ensureSession(occurrence);
  }, [occurrence, ensureSession]);

  useEffect(() => {
    if (!log) return;
    void loadTimers(log.id);
    if (log.status === 'planned') void startSession(log.id);
  }, [log, loadTimers, startSession]);

  useEffect(() => {
    if (!keepScreenAwake) return;
    void requestWakeLock(true);
    return () => {
      void releaseWakeLock();
    };
  }, [keepScreenAwake]);

  if (!occurrence || !log) {
    return (
      <p className="text-muted p-6 text-center" role="status">
        A preparar a sessão…
      </p>
    );
  }

  if (timersLoadedFor !== log.id) {
    return (
      <p className="text-muted p-6 text-center" role="status">
        A recuperar temporizadores…
      </p>
    );
  }

  const template = getSessionTemplate(log.templateId);
  const entries = log.entries;
  const currentIndex = Math.max(
    0,
    entries.findIndex((entry) => entry.id === log.cursorEntryId),
  );
  const entry = entries[currentIndex];
  const progress = sessionProgress(log);

  function goTo(index: number) {
    const next = entries[index];
    if (next) void setCursor(log!.id, next.id);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="surface border-app sticky top-0 z-30 -mx-4 mb-4 border-b px-4 pt-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/sessao/${encodeURIComponent(log.occurrenceKey)}`)}
          >
            <X aria-hidden="true" className="size-4" />
            Sair
          </Button>
          <p className="text-muted truncate text-sm">{template?.shortNamePt}</p>
          <Button size="sm" variant="ghost" onClick={() => setSafetyOpen(true)}>
            <ShieldAlert aria-hidden="true" className="size-4" />
            <span className="sr-only sm:not-sr-only">Segurança</span>
          </Button>
        </div>
        <div className="mt-2 space-y-1">
          <ProgressBar
            value={progress.ratio}
            label={`Progresso da sessão: ${progress.doneSets} de ${progress.totalSets} séries`}
          />
          <p className="text-muted flex justify-between text-xs">
            <span>
              Exercício {currentIndex + 1} de {entries.length}
            </span>
            <span className="tabular">
              {progress.doneSets}/{progress.totalSets} séries
            </span>
          </p>
        </div>
      </header>

      <div className="flex-1">
        {entry ? (
          <ExercisePanel log={log} entry={entry} />
        ) : (
          <Notice>Esta sessão não tem exercícios prescritos para a semana atual.</Notice>
        )}
      </div>

      <nav
        aria-label="Navegação entre exercícios"
        className="surface border-app safe-bottom sticky bottom-0 -mx-4 mt-6 border-t px-4 pt-3"
      >
        <div className="flex items-center gap-2">
          <Button
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            aria-label="Recuar um exercício"
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </Button>
          <Button
            variant="primary"
            block
            onClick={() =>
              currentIndex === entries.length - 1 ? setFinishOpen(true) : goTo(currentIndex + 1)
            }
          >
            {currentIndex === entries.length - 1 ? (
              <>
                <Flag aria-hidden="true" className="size-5" />
                Terminar sessão
              </>
            ) : (
              'Exercício seguinte'
            )}
          </Button>
          <Button
            onClick={() => goTo(currentIndex + 1)}
            disabled={currentIndex >= entries.length - 1}
            aria-label="Avançar um exercício"
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </Button>
        </div>
        <div className="mt-2 flex justify-center">
          <Button size="sm" variant="ghost" onClick={() => setFinishOpen(true)}>
            Terminar sessão
          </Button>
        </div>
      </nav>

      <Modal
        open={safetyOpen}
        onClose={() => setSafetyOpen(false)}
        title="Quando parar"
        description="Interrompe o exercício e procura avaliação adequada."
      >
        <ul className="text-muted list-disc space-y-1 pl-5 text-sm">
          {STOP_SIGNS_PT.map((sign) => (
            <li key={sign}>{sign}</li>
          ))}
        </ul>
      </Modal>

      <FinishDialog
        open={finishOpen}
        log={log}
        onClose={() => setFinishOpen(false)}
        onFatigueChange={(value) => void patchSession(log.id, { fatigueFlag: value })}
        onConfirm={async (summary) => {
          await finishSession(log.id, summary);
          setFinishOpen(false);
          navigate(`/historico/${log.id}`, { replace: true });
        }}
      />
    </div>
  );
}

function FinishDialog({
  open,
  log,
  onClose,
  onConfirm,
  onFatigueChange,
}: {
  open: boolean;
  log: SessionLog;
  onClose: () => void;
  onConfirm: (summary: {
    sessionRpe: number | null;
    discomfort: number | null;
    notesPt?: string;
  }) => Promise<void>;
  onFatigueChange: (value: boolean) => void;
}) {
  const [rpe, setRpe] = useState<number | null>(log.sessionRpe ?? null);
  const [discomfort, setDiscomfort] = useState<number | null>(log.discomfort ?? null);
  const [notes, setNotes] = useState(log.notesPt ?? '');
  /** Segunda confirmação, pedida apenas quando ficaram exercícios por concluir. */
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const progress = sessionProgress(log);
  const incomplete = progress.incompleteEntries.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Terminar sessão"
      description="Os campos são opcionais."
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={onClose}>Continuar treino</Button>
          <Button
            variant="primary"
            disabled={submitting}
            onClick={() => {
              if (incomplete > 0 && !confirming) {
                setConfirming(true);
                return;
              }
              setSubmitting(true);
              void onConfirm({
                sessionRpe: rpe,
                discomfort,
                notesPt: notes.trim() || undefined,
              }).catch(() => setSubmitting(false));
            }}
          >
            {incomplete > 0 && !confirming ? 'Terminar mesmo assim' : 'Terminar sessão'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {incomplete > 0 ? (
          <Notice tone="warn" title={`Ficaram ${incomplete} exercícios por concluir`}>
            {confirming
              ? 'Confirma para terminar assim mesmo. A sessão fica marcada como parcial.'
              : 'Podes voltar atrás e completá-los ou terminar assim mesmo.'}
          </Notice>
        ) : null}

        <Scale
          label="Esforço da sessão (RPE)"
          value={rpe}
          onChange={setRpe}
          hint="0 = muito fácil, 10 = máximo."
        />
        <Scale
          label="Dor ou desconforto"
          value={discomfort}
          onChange={setDiscomfort}
          hint="0 = nenhum, 10 = muito intenso."
        />
        <p className="text-muted text-xs">{RPE_SCALE_NOTICE_PT}</p>

        <Toggle
          label="Assinalar fadiga acumulada"
          hint={FATIGUE_RECOMMENDATION_PT}
          checked={Boolean(log.fatigueFlag)}
          onChange={onFatigueChange}
        />

        <TextArea
          label="Notas da sessão"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Como correu, o que sentiste, o que ajustaste."
        />
      </div>
    </Modal>
  );
}

function Scale({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  hint: string;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <p className="text-muted mb-2 text-xs">{hint}</p>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: 11 }, (_, index) => index).map((score) => (
          <button
            key={score}
            type="button"
            aria-pressed={value === score}
            onClick={() => onChange(value === score ? null : score)}
            className={cn(
              'tabular size-9 rounded-lg border text-sm',
              value === score ? 'bg-accent text-on-accent border-accent' : 'border-app',
            )}
          >
            {score}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
