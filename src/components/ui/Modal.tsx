import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface-1 p-6 shadow-2xl animate-in">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 id="modal-title" className="font-display text-xl text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-foreground/90">{children}</div>
        {footer && <div className="mt-6 flex flex-col gap-2">{footer}</div>}
        {!footer && (
          <div className="mt-6">
            <Button fullWidth onClick={onClose}>
              Fermer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
