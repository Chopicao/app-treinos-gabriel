import { ButtonLink } from '@/components/ui/Button';
import { EmptyState, PageHeader } from '@/components/ui/Misc';

export function NotFoundPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Página não encontrada" />
      <EmptyState
        title="Este endereço não existe"
        description="Volta ao painel de hoje e continua a partir daí."
        action={
          <ButtonLink to="/" variant="primary">
            Ir para Hoje
          </ButtonLink>
        }
      />
    </div>
  );
}
