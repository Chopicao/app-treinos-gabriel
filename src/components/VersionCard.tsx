import { useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Notice } from '@/components/ui/Misc';
import { PLAN_VERSION } from '@/data/plan';
import { SCHEMA_VERSION } from '@/services/db';

const BUILD_ID = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'desenvolvimento';

/**
 * Que versão está mesmo a correr, e como forçar a mais recente.
 *
 * Uma aplicação instalada é servida a partir da cache do service worker, por
 * isso pode estar a correr uma versão antiga sem que nada o indique. Mostrar a
 * compilação torna isso diagnosticável em vez de misterioso.
 */
export function VersionCard() {
  const [status, setStatus] = useState<'idle' | 'checking' | 'unsupported'>('idle');

  async function checkForUpdate() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return;
    }
    setStatus('checking');
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.update()));
    } catch {
      // Sem rede não há atualização a procurar; recarregar não faz mal.
    }
    window.location.reload();
  }

  return (
    <Card as="section">
      <CardHeader
        title="Versão"
        subtitle="Se a aplicação parecer desatualizada, procura aqui uma versão nova."
      />

      <dl className="text-muted space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Compilação</dt>
          <dd className="tabular text-right font-medium">{BUILD_ID}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Plano</dt>
          <dd className="text-right font-medium">{PLAN_VERSION}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Base local</dt>
          <dd className="text-right font-medium">v{SCHEMA_VERSION}</dd>
        </div>
      </dl>

      <Button size="sm" className="mt-4" onClick={() => void checkForUpdate()}>
        <RefreshCcw aria-hidden="true" className="size-4" />
        {status === 'checking' ? 'A procurar…' : 'Procurar atualização'}
      </Button>

      {status === 'unsupported' ? (
        <Notice className="mt-3">
          Este navegador não suporta instalação offline, por isso está sempre a usar a versão mais
          recente.
        </Notice>
      ) : null}
    </Card>
  );
}
