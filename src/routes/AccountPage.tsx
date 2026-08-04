import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAccountStore } from '@/state/useAccountStore';
import { AccountForm } from '@/components/AccountForm';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Notice, PageHeader } from '@/components/ui/Misc';

export function AccountPage() {
  const navigate = useNavigate();
  const status = useAccountStore((state) => state.status);

  if (status === 'unconfigured') {
    return (
      <div className="space-y-4">
        <PageHeader title="Conta" />
        <Notice tone="warn" title="A base de dados ainda não está ligada">
          Esta versão da aplicação ainda não tem a conta configurada, por isso os treinos ficam
          guardados apenas neste dispositivo. As instruções para ligar estão em{' '}
          <code>docs/base-de-dados.md</code>.
        </Notice>
        <Button onClick={() => navigate('/definicoes')}>Voltar às definições</Button>
      </div>
    );
  }

  if (status === 'signed-in') {
    return <Navigate to="/definicoes" replace />;
  }

  return (
    <div className="space-y-5">
      <Link to="/definicoes" className="text-muted inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Definições
      </Link>

      <PageHeader
        title="Conta"
        subtitle="Com conta, os treinos ficam guardados na tua área e aparecem em qualquer telemóvel onde entres."
      />

      <Card as="section">
        <CardHeader
          title="Dados de acesso"
          subtitle="Usamos o email só para entrares e recuperares o acesso."
        />
        <AccountForm onSignedIn={() => navigate('/', { replace: true })} />
      </Card>

      <Notice>
        Sem conta, a aplicação funciona à mesma: os treinos ficam guardados neste telemóvel. Com
        conta, ficam também na tua área privada e podes usar outro telemóvel sem perder nada. Só tu
        consegues ler os teus dados.
      </Notice>

      <Link to="/" className="text-muted inline-block text-sm underline">
        Continuar sem conta
      </Link>
    </div>
  );
}
