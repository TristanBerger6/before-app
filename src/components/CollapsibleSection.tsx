import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  count?: number;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
  /** Scroll interne si la liste dépasse cette hauteur (ex. "16rem") */
  maxHeight?: string;
  /** Désactive le scroll interne (ex. panneau de réglages). */
  scrollable?: boolean;
}

export function CollapsibleSection({
  title,
  description,
  count,
  icon,
  defaultOpen = true,
  children,
  className,
  maxHeight = '14rem',
  scrollable = true,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section className={clsx('rounded-2xl border border-border/80 bg-surface-1/90 overflow-hidden backdrop-blur-sm', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-surface-2 transition-colors duration-200"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon && <span className="text-muted shrink-0">{icon}</span>}
            <span className="font-display text-base text-foreground">{title}</span>
            {count != null && (
              <span className="text-xs font-medium text-muted bg-surface-2 rounded-full px-2 py-0.5 shrink-0">
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted leading-relaxed mt-1.5 pr-2">{description}</p>
          )}
        </div>
        <ChevronDown
          size={18}
          className={clsx(
            'text-muted shrink-0 mt-0.5 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="border-t border-border"
        style={
          open && scrollable ? { maxHeight, overflowY: 'auto' } : undefined
        }
      >
        <div
          className={clsx(
            'flex flex-col gap-1',
            scrollable ? 'p-2' : 'px-4 py-4 gap-5',
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
