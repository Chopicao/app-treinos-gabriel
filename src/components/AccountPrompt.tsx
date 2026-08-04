import { Link } from 'react-router-dom';
import { CloudUpload, X } from 'lucide-react';
import { useAccountStore } from '@/state/useAccountStore';
import { useAppStore } from '@/state/useAppStore';

/**
 * Convite a criar conta, para quem já passou o onboarding antes de a base de
 * dados existir. Sem isto, essas pessoas nunca chegariam a ver que há conta:
 * o onboarding não volta a aparecer.
 */
export function AccountPrompt() {
  const accountStatus = useAccountStore((state) => state.status);
  const dismissedAt = useAppStore((state) => state.settings.accountPromptDismissedAt);
  const updateSettings = useAppStore((state) => state.updateSettings);

  if (accountStatus !== 'signed-out' || dismissedAt) return null;

  return (
    <div className="border-accent bg-accent/10 relative rounded-2xl border p-4">
      <button
        type="button"
        aria-label="Dispensar"
        onClick={() => void updateSettings({ accountPromptDismissedAt: new Date().toISOString() })}
        className="hover:surface-raised absolute top-2 right-2 grid size-8 place-items-center rounded-lg"
      >
        <X aria-hidden="true" className="size-4" />
      </button>

      <div className="flex gap-3 pr-8">
        <CloudUpload aria-hidden="true" className="text-accent mt-0.5 size-5 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium">Guarda os treinos na tua conta</p>
          <p className="text-muted mt-1 text-sm">
            Neste momento os treinos existem só neste telemóvel. Com conta, ficam também na tua área
            privada e não se perdem.
          </p>
          <Link
            to="/conta"
            className="bg-accent text-on-accent tap mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            Criar conta com email
          </Link>
        </div>
      </div>
    </div>
  );
}
