import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAppStore } from '@/state/useAppStore';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { SelectInput, TextArea, TextInput, Toggle } from '@/components/ui/Field';
import { Notice, PageHeader } from '@/components/ui/Misc';
import { DISCLAIMER_LONG_PT, STOP_SIGNS_PT } from '@/data/safety';
import {
  DOMINANT_FOOT_OPTIONS_PT,
  OBJECTIVE_SUMMARY_PT,
  POSITION_OPTIONS_PT,
  PROFILE_HINTS_PT,
} from '@/data/profile';
import { formatFullPt, startOfWeek, todayKey } from '@/lib/dates';
import { toLines } from '@/lib/text';

export function OnboardingPage() {
  const navigate = useNavigate();
  const profile = useAppStore((state) => state.profile);
  const settings = useAppStore((state) => state.settings);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const updateSettings = useAppStore((state) => state.updateSettings);

  const [name, setName] = useState(profile.namePt);
  const [age, setAge] = useState(profile.ageYears === null ? '' : String(profile.ageYears));
  const [height, setHeight] = useState(profile.heightCm === null ? '' : String(profile.heightCm));
  const [weight, setWeight] = useState(profile.weightKg === null ? '' : String(profile.weightKg));
  const [position, setPosition] = useState(profile.positionPt);
  const [foot, setFoot] = useState(profile.dominantFootPt);
  const [injuries, setInjuries] = useState(profile.injuryHistoryPt.join('\n'));
  const [mobility, setMobility] = useState(profile.mobilityNotesPt.join('\n'));
  const [questions, setQuestions] = useState(profile.openQuestionsPt.join('\n'));
  const [supervision, setSupervision] = useState(profile.supervisionPt);
  const [startDate, setStartDate] = useState(settings.planStartDate);
  const [sound, setSound] = useState(settings.soundEnabled);
  const [vibration, setVibration] = useState(settings.vibrationEnabled);
  const [accepted, setAccepted] = useState(Boolean(settings.safetyAcknowledgedAt));
  const [saving, setSaving] = useState(false);

  const monday = startOfWeek(startDate || todayKey());
  const toNumber = (value: string) => (value.trim() === '' ? null : Number(value) || null);

  async function handleSubmit() {
    setSaving(true);
    const now = new Date().toISOString();
    await updateProfile({
      namePt: name.trim(),
      ageYears: toNumber(age),
      heightCm: toNumber(height),
      weightKg: toNumber(weight),
      positionPt: position,
      dominantFootPt: foot,
      injuryHistoryPt: toLines(injuries),
      mobilityNotesPt: toLines(mobility),
      openQuestionsPt: toLines(questions),
      supervisionPt: supervision.trim(),
    });
    await updateSettings({
      planStartDate: monday,
      soundEnabled: sound,
      vibrationEnabled: vibration,
      safetyAcknowledgedAt: now,
      onboardingCompletedAt: now,
    });
    navigate('/', { replace: true });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Antes de começar"
        subtitle="Preenche o perfil, escolhe a data de início e confirma o aviso de segurança. Podes alterar tudo mais tarde nas definições."
      />

      <Notice>
        Estes dados ficam guardados <strong>apenas neste dispositivo</strong>. A aplicação não tem
        conta nem servidor, e nada é enviado para a Internet.
      </Notice>

      <Card as="section">
        <CardHeader title="Perfil" subtitle={OBJECTIVE_SUMMARY_PT} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            label="Nome"
            value={name}
            placeholder="Como queres ser tratado"
            onChange={(event) => setName(event.target.value)}
          />
          <TextInput
            label="Idade (anos)"
            type="number"
            inputMode="numeric"
            min={10}
            max={40}
            value={age}
            onChange={(event) => setAge(event.target.value)}
          />
          <TextInput
            label="Altura (cm)"
            type="number"
            inputMode="numeric"
            min={120}
            max={220}
            value={height}
            onChange={(event) => setHeight(event.target.value)}
          />
          <TextInput
            label="Peso (kg)"
            type="number"
            inputMode="decimal"
            min={30}
            max={150}
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
          <SelectInput
            label="Posição"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
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
            value={foot}
            onChange={(event) => setFoot(event.target.value)}
          >
            <option value="">Sem indicação</option>
            {DOMINANT_FOOT_OPTIONS_PT.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectInput>
        </div>
      </Card>

      <Card as="section">
        <CardHeader
          title="Historial e mobilidade"
          subtitle="Opcional, mas ajuda a lembrar onde é preciso ter cuidado. Fica só neste dispositivo."
        />
        <div className="space-y-3">
          <TextArea
            label="Historial de lesões"
            hint={PROFILE_HINTS_PT.injuryHistory}
            value={injuries}
            onChange={(event) => setInjuries(event.target.value)}
          />
          <TextArea
            label="Notas de mobilidade"
            hint={PROFILE_HINTS_PT.mobilityNotes}
            value={mobility}
            onChange={(event) => setMobility(event.target.value)}
          />
          <TextArea
            label="Questões a esclarecer"
            hint={PROFILE_HINTS_PT.openQuestions}
            value={questions}
            onChange={(event) => setQuestions(event.target.value)}
          />
          <TextInput
            label="Supervisão"
            hint={PROFILE_HINTS_PT.supervision}
            value={supervision}
            onChange={(event) => setSupervision(event.target.value)}
          />
        </div>
      </Card>

      <Card as="section">
        <CardHeader
          title="Data de início da semana 1"
          subtitle="A semana começa à segunda-feira. Se escolheres outro dia, a aplicação usa a segunda-feira dessa semana."
        />
        <TextInput
          label="Primeiro dia do plano"
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        <p className="text-muted mt-2 text-sm">Semana 1 começa em {formatFullPt(monday)}.</p>
      </Card>

      <Card as="section">
        <CardHeader
          title="Som e vibração do temporizador"
          subtitle="Desligados por predefinição. Nada toca sem o teu consentimento."
        />
        <Toggle label="Som no fim do temporizador" checked={sound} onChange={setSound} />
        <Toggle
          label="Vibração no fim do temporizador"
          hint="Só funciona em dispositivos que suportem vibração."
          checked={vibration}
          onChange={setVibration}
        />
      </Card>

      <Card as="section">
        <CardHeader title="Aviso de segurança" />
        <div className="text-muted space-y-2 text-sm">
          {DISCLAIMER_LONG_PT.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <Notice
          tone="warn"
          title="Interrompe o exercício e procura avaliação se surgir:"
          className="mt-4"
        >
          <ul className="list-disc space-y-0.5 pl-5">
            {STOP_SIGNS_PT.map((sign) => (
              <li key={sign}>{sign}</li>
            ))}
          </ul>
        </Notice>

        <label className="mt-4 flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-1 size-5 shrink-0"
          />
          <span>
            Li e compreendi. Sei que esta aplicação acompanha um plano e não substitui avaliação
            médica, fisioterapia ou treinador certificado.
          </span>
        </label>
      </Card>

      <Button
        variant="primary"
        size="lg"
        block
        disabled={!accepted || saving}
        onClick={() => void handleSubmit()}
      >
        <ShieldCheck aria-hidden="true" className="size-5" />
        {saving ? 'A guardar…' : 'Confirmar e começar'}
      </Button>
      {!accepted ? (
        <p className="text-muted text-center text-sm">
          Confirma o aviso de segurança para continuar.
        </p>
      ) : null}
    </div>
  );
}
