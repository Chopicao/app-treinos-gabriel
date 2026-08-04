import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { EXERCISES, hasVerifiedVideo } from '@/data/exercises';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/StatusBadge';
import { EmptyState, Notice, PageHeader } from '@/components/ui/Misc';

/**
 * Área de revisão. Os vídeos por verificar existem apenas aqui — nunca são
 * mostrados ao atleta durante o treino nem na biblioteca.
 */
export function VideoReviewPage() {
  const { verified, pending, missing } = useMemo(() => {
    return {
      verified: EXERCISES.filter(hasVerifiedVideo),
      pending: EXERCISES.filter((exercise) => exercise.video?.pendingReview),
      missing: EXERCISES.filter((exercise) => !exercise.video),
    };
  }, []);

  return (
    <div className="space-y-5">
      <Link to="/definicoes" className="text-muted inline-flex items-center gap-1.5 text-sm">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Definições
      </Link>

      <PageHeader
        title="Revisão de vídeos"
        subtitle={`${verified.length} verificados · ${pending.length} por rever · ${missing.length} sem vídeo`}
      />

      <Notice>
        Esta área serve para rever a curadoria. Um exercício sem vídeo verificado nunca mostra um
        botão de vídeo ao atleta. Os links são dados estáticos em <code>src/data/videos.json</code>.
      </Notice>

      <section aria-labelledby="por-rever">
        <h2 id="por-rever" className="mb-2 text-lg">
          Por rever ou sem vídeo
        </h2>
        {pending.length + missing.length === 0 ? (
          <EmptyState
            title="Todos os exercícios têm vídeo verificado"
            description="Nada precisa de revisão neste momento."
          />
        ) : (
          <ul className="space-y-2">
            {[...pending, ...missing].map((exercise) => (
              <li key={exercise.id}>
                <Card className="p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link to={`/exercicios/${exercise.id}`} className="font-medium hover:underline">
                      {exercise.namePt}
                    </Link>
                    <Badge tone="warn">{exercise.video ? 'Vídeo pendente' : 'Sem vídeo'}</Badge>
                  </div>
                  <p className="text-muted text-sm">{exercise.nameEn}</p>
                  {exercise.video ? (
                    <p className="text-muted mt-1 text-xs break-all">
                      {exercise.video.canonicalUrl}
                    </p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="verificados">
        <h2 id="verificados" className="mb-2 text-lg">
          Verificados
        </h2>
        <ul className="space-y-2">
          {verified.map((exercise) => (
            <li key={exercise.id}>
              <Card className="p-3">
                <CardHeader
                  title={
                    <Link to={`/exercicios/${exercise.id}`} className="hover:underline">
                      {exercise.namePt}
                    </Link>
                  }
                  subtitle={`${exercise.video!.title} — ${exercise.video!.channel}`}
                  level={3}
                />
                <div className="text-muted flex flex-wrap items-center gap-3 text-xs">
                  <span>Idioma: {exercise.video!.language}</span>
                  <span>Verificado em {exercise.video!.verifiedAt}</span>
                  <a
                    href={exercise.video!.canonicalUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-accent inline-flex items-center gap-1 underline"
                  >
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                    Abrir
                  </a>
                </div>
                {exercise.video!.reasonPt ? (
                  <p className="text-muted mt-2 text-xs">{exercise.video!.reasonPt}</p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
