import clsx from 'clsx';
import { Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PersistentScope } from '../types';

interface RuleListItemProps {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  /** Badge d'exemplaires (ex. ×3) */
  copies?: number;
  /** Portée persistante : joueur ou tout le monde */
  persistentScope?: PersistentScope;
  /** Durée persistante (ex. « 3 tours », « ∞ ») */
  durationBadge?: string;
  /** Incluse dans le pool de pioche */
  enabled?: boolean;
  onToggleEnabled?: (enabled: boolean) => void;
  onClick?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
}

const scopeLabels: Record<PersistentScope, string> = {
  drawer: 'Perso',
  everyone: 'Tous',
};

export function RuleListItem({
  title,
  subtitle,
  meta,
  copies,
  persistentScope,
  durationBadge,
  enabled = true,
  onToggleEnabled,
  onClick,
  onDelete,
  deleteLabel = 'Supprimer',
}: RuleListItemProps) {
  const interactive = !!onClick;

  return (
    <div
      className={clsx(
        'flex items-center gap-2 rounded-xl px-3 py-2.5 min-h-[2.75rem]',
        !enabled && 'opacity-50',
        interactive && enabled && 'cursor-pointer hover:bg-surface-2 transition-colors duration-200',
      )}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{title}</p>
          {copies != null && copies > 1 && (
            <span className="shrink-0 text-[10px] font-bold text-accent bg-accent/15 border border-accent/30 rounded-md px-1.5 py-0.5">
              ×{copies}
            </span>
          )}
        </div>
        {(durationBadge || persistentScope) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            {durationBadge && (
              <span className="shrink-0 text-[10px] font-bold text-amber-200/90 bg-amber-500/15 border border-amber-500/30 rounded-md px-1.5 py-0.5">
                {durationBadge}
              </span>
            )}
            {persistentScope && (
              <span
                className={clsx(
                  'shrink-0 text-[10px] font-bold rounded-md px-1.5 py-0.5 border',
                  persistentScope === 'everyone'
                    ? 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30'
                    : 'text-muted bg-surface-2 border-border',
                )}
              >
                {scopeLabels[persistentScope]}
              </span>
            )}
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-muted truncate mt-0.5">{subtitle}</p>
        )}
      </div>
      {meta && <div className="shrink-0 text-xs text-accent font-medium">{meta}</div>}
      {onToggleEnabled && (
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={enabled ? 'Désactiver la règle' : 'Activer la règle'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleEnabled(!enabled);
          }}
          className={clsx(
            'relative h-3.5 w-6 shrink-0 rounded-full border transition-colors duration-200 cursor-pointer',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40',
            enabled
              ? 'border-accent/35 bg-accent/20'
              : 'border-border/60 bg-surface-2',
          )}
        >
          <span
            className={clsx(
              'absolute top-1/2 -translate-y-1/2 left-0.5 h-2 w-2 rounded-full transition-transform duration-200',
              enabled ? 'translate-x-2.5 bg-accent' : 'bg-muted/50',
            )}
          />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer shrink-0"
          aria-label={deleteLabel}
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
