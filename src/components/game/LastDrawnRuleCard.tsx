import clsx from 'clsx';
import { RuleTypeBadge } from '../RuleTypeBadge';
import type { Player, Rule } from '../../types';

interface LastDrawnRuleCardProps {
  rule: Rule;
  drawnBy?: Player | null;
  currentPlayer?: Player | null;
}

export function LastDrawnRuleCard({
  rule,
  drawnBy,
  currentPlayer,
}: LastDrawnRuleCardProps) {
  const isStaleDraw =
    drawnBy != null &&
    currentPlayer != null &&
    drawnBy.id !== currentPlayer.id;

  return (
    <div
      className={clsx(
        'rounded-2xl border bg-surface-1 px-4 py-4 transition-opacity duration-300',
        isStaleDraw
          ? 'border-border/60 opacity-45'
          : 'border-accent/30 opacity-100',
      )}
    >
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <p
          className={clsx(
            'text-[10px] font-semibold uppercase tracking-widest',
            isStaleDraw ? 'text-muted' : 'text-accent/80',
          )}
        >
          Dernière pioche
        </p>
        {drawnBy && (
          <p className="text-xs text-muted shrink-0">
            Piochée par{' '}
            <span
              className={clsx(
                'font-medium',
                isStaleDraw ? 'text-muted' : 'text-foreground',
              )}
            >
              {drawnBy.name}
            </span>
          </p>
        )}
      </div>
      <p
        className={clsx(
          'font-display text-lg mb-2',
          isStaleDraw ? 'text-muted' : 'text-foreground',
        )}
      >
        {rule.title}
      </p>
      <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
        <RuleTypeBadge
          type={rule.type}
          iconOnly
          className="inline-flex align-middle mr-2 -mt-0.5"
        />
        {rule.description}
      </p>
    </div>
  );
}
