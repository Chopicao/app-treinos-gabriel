import { useState } from 'react';
import { ExternalLink, Play, VideoOff } from 'lucide-react';
import type { ExerciseDefinition } from '@/domain/types';
import { buildEmbedUrl, buildWatchUrl } from '@/data/videos';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Notice } from '@/components/ui/Misc';

/**
 * Vídeo de demonstração.
 *
 * Privacidade: o iframe do YouTube só é criado depois de uma ação explícita do
 * utilizador dentro do modal, e usa youtube-nocookie.com. Se a incorporação
 * estiver bloqueada, o botão "Abrir no YouTube" continua a funcionar.
 */
export function VideoButton({
  exercise,
  size = 'md',
  block = false,
}: {
  exercise: ExerciseDefinition;
  size?: 'sm' | 'md';
  block?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const video = exercise.video && !exercise.video.pendingReview ? exercise.video : null;

  if (!video) {
    return (
      <span className="text-muted inline-flex items-center gap-1.5 text-sm">
        <VideoOff aria-hidden="true" className="size-4" />
        Vídeo por verificar
      </span>
    );
  }

  return (
    <>
      <Button size={size} block={block} onClick={() => setOpen(true)}>
        <Play aria-hidden="true" className="size-4" />
        Ver vídeo
      </Button>
      <VideoModal exercise={exercise} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function VideoModal({
  exercise,
  open,
  onClose,
}: {
  exercise: ExerciseDefinition;
  open: boolean;
  onClose: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const video = exercise.video;
  if (!video) return null;

  const watchUrl = buildWatchUrl(video.videoId);

  return (
    <Modal
      open={open}
      onClose={() => {
        setLoaded(false);
        onClose();
      }}
      title={exercise.namePt}
      description={`${video.title} — ${video.channel}`}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted text-xs">
            Conteúdo externo alojado no YouTube. Verificado em {video.verifiedAt}.
          </p>
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="border-app tap inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium"
          >
            <ExternalLink aria-hidden="true" className="size-4" />
            Abrir no YouTube
          </a>
        </div>
      }
    >
      {loaded ? (
        <div className="surface-sunken aspect-video w-full overflow-hidden rounded-xl">
          <iframe
            title={`Demonstração: ${exercise.namePt}`}
            src={buildEmbedUrl(video.videoId)}
            className="size-full"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="space-y-3">
          <Notice>
            O vídeo é carregado a partir do YouTube, em modo de privacidade. Nada é pedido ao
            YouTube até carregares em <strong>Carregar vídeo</strong>.
          </Notice>
          <Button variant="primary" block size="lg" onClick={() => setLoaded(true)}>
            <Play aria-hidden="true" className="size-5" />
            Carregar vídeo
          </Button>
        </div>
      )}
    </Modal>
  );
}
