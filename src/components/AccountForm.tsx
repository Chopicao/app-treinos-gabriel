import { useState } from 'react';
import { LogIn, UserPlus } from 'lucide-react';
import { useAccountStore } from '@/state/useAccountStore';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/Field';
import { Notice } from '@/components/ui/Misc';
import { cn } from '@/lib/cn';

export type AccountFormMode = 'signup' | 'signin' | 'reset';

export const MIN_PASSWORD = 8;

/**
 * Formulário de conta. Vive num componente próprio porque é pedido em dois
 * sítios — no onboarding e no ecrã da conta — e duplicar autenticação é a
 * melhor forma de os dois sítios divergirem sem ninguém dar por isso.
 */
export function AccountForm({
  onSignedIn,
  compact = false,
}: {
  /** Chamado depois de entrar com sucesso (não depois de criar conta por confirmar). */
  onSignedIn?: () => void;
  compact?: boolean;
}) {
  const signIn = useAccountStore((state) => state.signIn);
  const signUp = useAccountStore((state) => state.signUp);
  const sendPasswordReset = useAccountStore((state) => state.sendPasswordReset);

  const [mode, setMode] = useState<AccountFormMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'info' | 'warn'; text: string } | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const passwordValid = password.length >= MIN_PASSWORD;
  const canSubmit = mode === 'reset' ? emailValid && !busy : emailValid && passwordValid && !busy;

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
    if (mode === 'signin') onSignedIn?.();
  }

  return (
    <div>
      <div
        className="surface-raised border-app mb-3 inline-flex rounded-xl border p-1"
        role="tablist"
        aria-label="Conta"
      >
        {(
          [
            ['signup', 'Criar conta'],
            ['signin', 'Já tenho conta'],
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

      <div className="space-y-3">
        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="nome@exemplo.com"
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
            hint={mode === 'signup' ? `Pelo menos ${MIN_PASSWORD} caracteres.` : undefined}
            error={
              password.length > 0 && !passwordValid
                ? `A palavra-passe precisa de ${MIN_PASSWORD} caracteres ou mais.`
                : undefined
            }
          />
        ) : null}
      </div>

      {feedback ? (
        <Notice tone={feedback.tone} className="mt-3">
          {feedback.text}
        </Notice>
      ) : null}

      <Button
        variant="primary"
        size={compact ? 'md' : 'lg'}
        block
        className="mt-3"
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

      <div className="mt-3 text-sm">
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
      </div>
    </div>
  );
}
