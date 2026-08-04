import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { useAppStore } from '@/state/useAppStore';
import { buildExportBundle, downloadBundle, parseImportBundle } from '@/services/exportImport';
import { AccountCard } from '@/components/AccountCard';
import { VersionCard } from '@/components/VersionCard';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { SelectInput, TextArea, TextInput, Toggle } from '@/components/ui/Field';
import { Notice, PageHeader } from '@/components/ui/Misc';
import { EXERCISES, hasVerifiedVideo } from '@/data/exercises';
import { DOMINANT_FOOT_OPTIONS_PT, POSITION_OPTIONS_PT, PROFILE_HINTS_PT } from '@/data/profile';
import { toLines } from '@/lib/text';
import { formatFullPt, startOfWeek } from '@/lib/dates';

export function SettingsPage() {
  const settings = useAppStore((state) => state.settings);
  const profile = useAppStore((state) => state.profile);
  const sessions = useAppStore((state) => state.sessions);
  const overrides = useAppStore((state) => state.overrides);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const importBundle = useAppStore((state) => state.importBundle);
  const resetAllData = useAppStore((state) => state.resetAllData);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importFeedback, setImportFeedback] = useState<
    { tone: 'info' | 'warn'; title: string; lines: string[] } | undefined
  >();
  const [resetOpen, setResetOpen] = useState(false);

  const pending = EXERCISES.filter((exercise) => !hasVerifiedVideo(exercise));

  const toNumber = (value: string) => (value.trim() === '' ? null : Number(value) || null);

  async function handleImportFile(file: File) {
    const raw = await file.text();
    const result = parseImportBundle(raw);
    if (!result.ok) {
      // Nada foi escrito: os dados existentes ficam intactos.
      setImportFeedback({ tone: 'warn', title: result.errorPt, lines: result.issuesPt });
      return;
    }
    await importBundle(result.bundle);
    setImportFeedback({
      tone: 'info',
      title: 'Importação concluída.',
      lines: [
        `${result.bundle.sessions.length} sessões e ${result.bundle.overrides.length} remarcações importadas.`,
        ...result.warningsPt,
      ],
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Definições" />

      <AccountCard />

      <Card as="section">
        <CardHeader
          title="Perfil"
          subtitle="Guardado apenas neste dispositivo. Nada é enviado para a Internet."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Nome"
            value={profile.namePt}
            onChange={(event) => void updateProfile({ namePt: event.target.value })}
          />
          <TextInput
            label="Peso (kg)"
            type="number"
            inputMode="decimal"
            value={profile.weightKg ?? ''}
            onChange={(event) => void updateProfile({ weightKg: toNumber(event.target.value) })}
          />
          <TextInput
            label="Altura (cm)"
            type="number"
            inputMode="numeric"
            value={profile.heightCm ?? ''}
            onChange={(event) => void updateProfile({ heightCm: toNumber(event.target.value) })}
          />
          <TextInput
            label="Idade (anos)"
            type="number"
            inputMode="numeric"
            value={profile.ageYears ?? ''}
            onChange={(event) => void updateProfile({ ageYears: toNumber(event.target.value) })}
          />
          <SelectInput
            label="Posição"
            value={profile.positionPt}
            onChange={(event) => void updateProfile({ positionPt: event.target.value })}
          >
            <option value="">Sem indicação</option>
            {POSITION_OPTIONS_PT.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            label="Pé dominante"
            value={profile.dominantFootPt}
            onChange={(event) => void updateProfile({ dominantFootPt: event.target.value })}
          >
            <option value="">Sem indicação</option>
            {DOMINANT_FOOT_OPTIONS_PT.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className="mt-3 space-y-3">
          <TextArea
            label="Historial de lesões"
            hint={PROFILE_HINTS_PT.injuryHistory}
            value={profile.injuryHistoryPt.join('\n')}
            onChange={(event) =>
              void updateProfile({ injuryHistoryPt: toLines(event.target.value) })
            }
          />
          <TextArea
            label="Notas de mobilidade"
            hint={PROFILE_HINTS_PT.mobilityNotes}
            value={profile.mobilityNotesPt.join('\n')}
            onChange={(event) =>
              void updateProfile({ mobilityNotesPt: toLines(event.target.value) })
            }
          />
          <TextArea
            label="Questões a esclarecer"
            hint={PROFILE_HINTS_PT.openQuestions}
            value={profile.openQuestionsPt.join('\n')}
            onChange={(event) =>
              void updateProfile({ openQuestionsPt: toLines(event.target.value) })
            }
          />
          <TextInput
            label="Supervisão"
            hint={PROFILE_HINTS_PT.supervision}
            value={profile.supervisionPt}
            onChange={(event) => void updateProfile({ supervisionPt: event.target.value })}
          />
        </div>

        <p className="text-muted mt-3 text-sm">
          O perfil completo é apresentado em{' '}
          <Link to="/sobre" className="underline">
            Sobre o plano
          </Link>
          .
        </p>
      </Card>

      <Card as="section">
        <CardHeader title="Plano" />
        <TextInput
          label="Início da semana 1"
          type="date"
          value={settings.planStartDate}
          onChange={(event) =>
            void updateSettings({ planStartDate: startOfWeek(event.target.value) })
          }
          hint={`A semana começa à segunda-feira. Atualmente: ${formatFullPt(settings.planStartDate)}.`}
        />
      </Card>

      <Card as="section">
        <CardHeader title="Aparência e temporizador" />
        <SelectInput
          label="Tema"
          value={settings.theme}
          onChange={(event) =>
            void updateSettings({ theme: event.target.value as typeof settings.theme })
          }
          wrapperClassName="max-w-xs"
        >
          <option value="system">Seguir o sistema</option>
          <option value="light">Claro</option>
          <option value="dark">Escuro</option>
        </SelectInput>

        <div className="mt-2">
          <Toggle
            label="Som no fim do temporizador"
            checked={settings.soundEnabled}
            onChange={(value) => void updateSettings({ soundEnabled: value })}
          />
          <Toggle
            label="Vibração no fim do temporizador"
            checked={settings.vibrationEnabled}
            onChange={(value) => void updateSettings({ vibrationEnabled: value })}
          />
          <Toggle
            label="Manter o ecrã ativo durante o treino"
            hint="Usa a Wake Lock API quando está disponível. Se o navegador não suportar, nada acontece."
            checked={settings.keepScreenAwake}
            onChange={(value) => void updateSettings({ keepScreenAwake: value })}
          />
          <Toggle
            label="Iniciar o descanso automaticamente"
            hint="O temporizador de descanso pode sempre ser ignorado ou ajustado."
            checked={settings.restTimerAutoStart}
            onChange={(value) => void updateSettings({ restTimerAutoStart: value })}
          />
          <Toggle
            label="Mostrar progressões de fase posterior na biblioteca"
            checked={settings.showLaterPhaseInLibrary}
            onChange={(value) => void updateSettings({ showLaterPhaseInLibrary: value })}
          />
        </div>
      </Card>

      <Card as="section">
        <CardHeader
          title="Dados"
          subtitle="Tudo fica guardado neste dispositivo. Exporta para teres uma cópia."
        />
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              downloadBundle(buildExportBundle({ settings, profile, sessions, overrides }))
            }
          >
            <Download aria-hidden="true" className="size-4" />
            Exportar JSON
          </Button>
          <Button onClick={() => fileRef.current?.click()}>
            <Upload aria-hidden="true" className="size-4" />
            Importar JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Ficheiro de importação"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImportFile(file);
              event.target.value = '';
            }}
          />
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Repor dados
          </Button>
        </div>

        {importFeedback ? (
          <Notice tone={importFeedback.tone} title={importFeedback.title} className="mt-3">
            <ul className="list-disc space-y-0.5 pl-5">
              {importFeedback.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Notice>
        ) : null}

        <p className="text-muted mt-3 text-xs">
          A importação valida o ficheiro antes de escrever. Se o ficheiro for inválido, nada é
          apagado.
        </p>
      </Card>

      <Card as="section">
        <CardHeader
          title="Revisão de vídeos"
          subtitle={`${pending.length} exercícios sem vídeo verificado. Esta área é de revisão e não aparece durante o treino.`}
        />
        <Link to="/definicoes/videos" className="text-accent text-sm underline">
          Abrir revisão de vídeos
        </Link>
      </Card>

      <VersionCard />

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Repor dados?"
        description="Ação destrutiva e irreversível."
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setResetOpen(false)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => {
                void resetAllData().then(() => setResetOpen(false));
              }}
            >
              Apagar tudo e repor
            </Button>
          </div>
        }
      >
        <p className="text-sm">
          Todas as sessões registadas, remarcações e definições deste dispositivo são apagadas e o
          perfil volta aos valores iniciais. Exporta os dados primeiro se quiseres guardá-los.
        </p>
      </Modal>
    </div>
  );
}
