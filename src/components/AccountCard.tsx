import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CloudCheck, CloudAlert, CloudOff, LogOut, RefreshCw, UserRound } from 'lucide-react';
import { useAccountStore, type SyncStatus } from '@/state/useAccountStore';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Notice } from '@/components/ui/Misc';
import { formatDateTimePt } from '@/lib/dates';
import { cn } from '@/lib/cn';

const SYNC_LABEL: Record<SyncStatus, string> = {
  idle: 'Sincronizado',
  syncing: 'A sincronizar…',
  error: 'Por sincronizar',
  offline: 'Sem ligação',
};

const SYNC_ICON: Record<SyncStatus, typeof CloudCheck> = {
  idle: CloudCheck,
  syncing: RefreshCw,
  error: CloudAlert,
  offline: CloudOff,
};

/** Estado da conta e da sincronização, para as Definições. */
export function AccountCard() {
  const status = useAccountStore((state) => state.status);
  const email = useAccountStore((state) => state.email);
  const syncStatus = useAccountStore((state) => state.syncStatus);
  const lastSyncedAt = useAccountStore((state) => state.lastSyncedAt);
  const lastErrorPt = useAccountStore((state) => state.lastErrorPt);
  const accountConflict = useAccountStore((state) => state.accountConflict);
  const syncNow = useAccountStore((state) => state.syncNow);
  const signOut = useAccountStore((state) => state.signOut);
  const resolveAccountConflict = useAccountStore((state) => state.resolveAccountConflict);

  const [signOutOpen, setSignOutOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);

  if (status === 'unconfigured') {
    return (
      <Card as="section">
        <CardHeader
          title="Conta"
          subtitle="Ainda não há base de dados ligada a esta versão da aplicação."
        />
        <p className="text-muted text-sm">
          Os treinos ficam guardados apenas neste dispositivo. Continua a funcionar tudo, mas não há
          cópia na nuvem nem acesso a partir de outro telemóvel. As instruções para ligar estão no
          README.
        </p>
      </Card>
    );
  }

  if (status !== 'signed-in') {
    return (
      <Card as="section">
        <CardHeader
          title="Conta"
          subtitle="Sem conta, os treinos ficam só neste dispositivo."
        />
        <p className="text-muted mb-3 text-sm">
          Cria conta com o teu email para guardares os treinos na tua área privada e poderes entrar
          noutro telemóvel sem perder o histórico.
        </p>
        <Link
          to="/conta"
          className="bg-accent text-on-accent tap inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
        >
          <UserRound aria-hidden="true" className="size-4" />
          Criar conta ou entrar
        </Link>
      </Card>
    );
  }

  const Icon = SYNC_ICON[syncStatus];

  return (
    <Card as="section">
      <CardHeader
        title="Conta"
        subtitle={email ?? undefined}
        action={
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs',
              syncStatus === 'idle'
                ? 'border-brand-600/50 text-brand-700 dark:border-brand-300/50 dark:text-brand-300'
                : syncStatus === 'error'
                  ? 'border-warn-600/50 text-warn-600 dark:border-warn-400/50 dark:text-warn-400'
                  : 'border-app text-muted',
            )}
          >
            <Icon
              aria-hidden="true"
              className={cn('size-3.5', syncStatus === 'syncing' && 'animate-spin')}
            />
            {SYNC_LABEL[syncStatus]}
          </span>
        }
      />

      <p className="text-muted text-sm">
        {lastSyncedAt
          ? `Última sincronização: ${formatDateTimePt(lastSyncedAt)}.`
          : 'Ainda não houve nenhuma sincronização neste dispositivo.'}
      </p>

      {accountConflict ? (
        <Notice tone="warn" title="Este dispositivo tem dados de outra conta" className="mt-3">
          <p>
            Para evitar misturar treinos de pessoas diferentes, nada foi enviado. Podes substituir os
            dados deste dispositivo pelos da conta em que acabaste de entrar.
          </p>
          <Button size="sm" variant="danger" className="mt-3" onClick={() => setConflictOpen(true)}>
            Substituir dados locais
          </Button>
        </Notice>
      ) : null}

      {lastErrorPt ? (
        <Notice tone="warn" className="mt-3">
          {lastErrorPt} As alterações ficam guardadas aqui e são enviadas assim que houver ligação.
        </Notice>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void syncNow()} disabled={syncStatus === 'syncing'}>
          <RefreshCw
            aria-hidden="true"
            className={cn('size-4', syncStatus === 'syncing' && 'animate-spin')}
          />
          Sincronizar agora
        </Button>
        <Button size="sm" onClick={() => setSignOutOpen(true)}>
          <LogOut aria-hidden="true" className="size-4" />
          Terminar sessão
        </Button>
      </div>

      <Modal
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        title="Terminar sessão?"
        description="Antes de sair, tentamos enviar o que ainda não foi sincronizado."
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setSignOutOpen(false)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={() => {
                void signOut().then(() => setSignOutOpen(false));
              }}
            >
              Terminar sessão
            </Button>
          </div>
        }
      >
        <p className="text-sm">
          Os treinos guardados na conta continuam lá e voltam quando entrares outra vez. Os dados
          deste dispositivo ficam como estão — se quiseres limpá-los, usa "Repor dados".
        </p>
      </Modal>

      <Modal
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        title="Substituir os dados deste dispositivo?"
        description="Ação destrutiva e irreversível."
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setConflictOpen(false)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={() => {
                void resolveAccountConflict().then(() => setConflictOpen(false));
              }}
            >
              Substituir
            </Button>
          </div>
        }
      >
        <p className="text-sm">
          Os treinos que estão neste telemóvel e pertencem à outra conta são apagados daqui, e ficam
          os desta conta. Se ainda os quiseres, exporta-os primeiro em "Dados".
        </p>
      </Modal>
    </Card>
  );
}
