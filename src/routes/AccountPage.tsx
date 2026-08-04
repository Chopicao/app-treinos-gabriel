import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn, UserPlus } from 'lucide-react';
import { useAccountStore } from '@/state/useAccountStore';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { TextInput } from '@/components/ui/Field';
import { Notice, PageHeader } from '@/components/ui/Misc';
import { cn } from '@/lib/cn';

type Mode = 'signin' | 'signup' | 'reset';

const MIN_PASSWORD = 8;

export function AccountPage() {
  const navigate = useNavigate();
  const status = useAccountStore((state) => state.status);
  const signIn = useAccountStore((state) => state.signIn);
  const signUp = useAccountStore((state) => state.signUp);
  const sendPasswordReset = useAccountStore((state) => state.sendPasswordReset);

  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'info' | 'warn'; text: string } | null>(null);

  if (status === 'unconfigured') {
    return (
      <div className="space-y-4">
        <PageHeader title="Conta" />
        <Notice tone="warn" title="A base de dados ainda não está ligada">
          Esta versão da aplicação ainda não tem a conta configurada, por isso os treinos ficam
          guardados apenas neste dispositivo. Consulta{' '}
          <code>docs/supabase-setup.sql</code> e o README para ligar a base de dados.
        </Notice>
        <Button onClick={() => navigate('/definicoes')}>Voltar às definições</Button>
      </div>
    );
  }

  if (status === 'signed-in') {
    return <Navigate to="/definicoes" replace />;
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= MIN_PASSWORD;
  const canSubmit =
    mode === 'reset' ? emailValid && !busy : emailValid && passwordValid && !busy;

  async function handleSubmit() {
    setBusy(true);
    setFeedback(null);
    const result =
      mode === 'signup'
        ? await signUp(email, password)
        : mode === 'signin'
          ? await signIn(email, password)
          : await sendPasswordReset(email);
    setBusy(false);

    if (!result.ok) {
      setFeedback({ tone: 'warn', text: result.messagePt ?? 'Não foi possível concluir.' });
      return;
    }
    if (result.messagePt) setFeedback({ tone: 'info', text: result.messagePt });
    if (mode === 'signin') navigate('/', { replace: true });
  }

  return (
    <div className="space-y-5">
      <Link to="/definicoes" className="text-muted inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Definições
      </Link>

      <PageHeader
        title={mode === 'signup' ? 'Criar conta' : mode === 'signin' ? 'Entrar' : 'Recuperar acesso'}
        subtitle="Com conta, os treinos ficam guardados na tua área e aparecem em qualquer telemóvel onde entres."
      />

      <div
        className="surface-raised border-app inline-flex rounded-xl border p-1"
        role="tablist"
        aria-label="Conta"
      >
        {(
          [
            ['signup', 'Criar conta'],
            ['signin', 'Entrar'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setFeedback(null);
            }}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium',
              mode === value ? 'bg-accent text-on-accent' : 'text-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Card as="section">
        <CardHeader
          title={mode === 'reset' ? 'Recuperar palavra-passe' : 'Dados de acesso'}
          subtitle={
            mode === 'reset'
              ? 'Enviamos uma ligação para o teu email.'
              : 'Usamos o email só para entrares e recuperares o acesso.'
          }
        />

        <div className="space-y-3">
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={email.length > 0 && !emailValid ? 'Escreve um email válido.' : undefined}
          />

          {mode !== 'reset' ? (
            <TextInput
              label="Palavra-passe"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              hint={`Pelo menos ${MIN_PASSWORD} caracteres.`}
              error={
                password.length > 0 && !passwordValid
                  ? `A palavra-passe precisa de ${MIN_PASSWORD} caracteres ou mais.`
                  : undefined
              }
            />
          ) : null}
        </div>

        {feedback ? (
          <Notice tone={feedback.tone} className="mt-4">
            {feedback.text}
          </Notice>
        ) : null}

        <Button
          variant="primary"
          size="lg"
          block
          className="mt-4"
          disabled={!canSubmit}
          onClick={() => void handleSubmit()}
        >
          {mode === 'signup' ? (
            <>
              <UserPlus aria-hidden="true" className="size-5" />
              {busy ? 'A criar…' : 'Criar conta'}
            </>
          ) : mode === 'signin' ? (
            <>
              <LogIn aria-hidden="true" className="size-5" />
              {busy ? 'A entrar…' : 'Entrar'}
            </>
          ) : busy ? (
            'A enviar…'
          ) : (
            'Enviar ligação de recuperação'
          )}
        </Button>

        <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
          {mode !== 'reset' ? (
            <button
              type="button"
              className="text-accent underline"
              onClick={() => {
                setMode('reset');
                setFeedback(null);
              }}
            >
              Esqueci-me da palavra-passe
            </button>
          ) : (
            <button
              type="button"
              className="text-accent underline"
              onClick={() => {
                setMode('signin');
                setFeedback(null);
              }}
            >
              Voltar a entrar
            </button>
          )}
          <Link to="/" className="text-muted underline">
            Continuar sem conta
          </Link>
        </div>
      </Card>

      <Notice>
        Sem conta, a aplicação funciona à mesma: os treinos ficam guardados neste telemóvel. Com
        conta, ficam também na tua área privada e podes usar outro telemóvel sem perder nada. Só tu
        consegues ler os teus dados.
      </Notice>
    </div>
  );
}
