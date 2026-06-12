import clsx from 'clsx';
import { Sparkles, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Mise en avant pour les règles spéciales piochées. */
  variant?: 'default' | 'special';
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  variant = 'default',
}: ModalProps) {
  if (!open) return null;

  const isSpecial = variant === 'special';

  return createPortal(
    <div
      className="fixed inset-0 z-[100]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className={clsx(
          'absolute inset-0 backdrop-blur-sm cursor-pointer',
          isSpecial ? 'bg-accent/25' : 'bg-black/70',
        )}
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
        <div
          className={clsx(
            'pointer-events-auto relative flex w-full max-w-md max-h-[min(85dvh,calc(100dvh-2rem))] flex-col rounded-2xl shadow-2xl animate-in my-auto',
            isSpecial
              ? 'border-2 border-accent/60 bg-gradient-to-b from-accent/20 via-surface-1 to-surface-1 glow-accent shadow-[0_0_40px_rgba(168,85,247,0.45)]'
              : 'border border-border bg-surface-1',
          )}
        >
          {isSpecial && (
            <div className="absolute -top-px left-1/2 -translate-x-1/2 h-1 w-3/4 rounded-full bg-gradient-to-r from-transparent via-accent to-transparent opacity-80" />
          )}
          <div
            className={clsx(
              'flex shrink-0 items-start justify-between gap-4 px-5 py-4',
              isSpecial ? 'border-b border-accent/30' : 'border-b border-border/60',
            )}
          >
            <div className="min-w-0 pr-2">
              {isSpecial && (
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                  <Sparkles size={14} className="shrink-0" />
                  Événement spécial
                </p>
              )}
              <h2
                id="modal-title"
                className={clsx(
                  'font-display text-xl',
                  isSpecial ? 'text-accent-foreground' : 'text-foreground',
                )}
              >
                {title}
              </h2>
            </div>
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
