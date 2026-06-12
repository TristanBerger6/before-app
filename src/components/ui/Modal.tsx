import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div
      className="fixed inset-0 z-[100]"
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
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
        <div className="pointer-events-auto relative flex w-full max-w-md max-h-[min(85dvh,calc(100dvh-2rem))] flex-col rounded-2xl border border-border bg-surface-1 shadow-2xl animate-in my-auto">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
            <h2 id="modal-title" className="font-display text-xl text-foreground pr-2">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-foreground/90">
            {children}
          </div>
          {footer ? (
            <div className="shrink-0 flex flex-col gap-2 border-t border-border/60 px-5 py-4">
              {footer}
            </div>
          ) : (
            <div className="shrink-0 px-5 pb-5">
              <Button fullWidth onClick={onClose}>
                Fermer
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
