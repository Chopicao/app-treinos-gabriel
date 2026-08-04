import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Modal sobre `<dialog>` nativo: dá armadilha de foco, Escape e semântica
 * de diálogo sem depender de biblioteca externa.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      // jsdom não implementa showModal; o fallback mantém os testes utilizáveis.
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="modal-title"
      className={cn(
        'surface text-main border-app m-auto w-[calc(100vw-1.5rem)] rounded-2xl border p-0 shadow-2xl backdrop:bg-black/50',
        size === 'lg' ? 'max-w-3xl' : 'max-w-lg',
      )}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="border-app flex items-start justify-between gap-4 border-b p-4">
          <div className="min-w-0">
            <h2 id="modal-title" className="text-lg">
              {title}
            </h2>
            {description ? <p className="text-muted mt-1 text-sm">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap hover:surface-raised -m-1 grid place-items-center rounded-lg p-1"
            aria-label="Fechar"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        {footer ? <div className="border-app border-t p-4">{footer}</div> : null}
      </div>
    </dialog>
  );
}
