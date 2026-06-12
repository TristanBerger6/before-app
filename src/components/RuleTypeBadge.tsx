import clsx from 'clsx';
import { Clock, Sparkles, Zap } from 'lucide-react';
import type { RuleType } from '../types';

const config: Record<
  RuleType,
  { label: string; icon: typeof Zap; className: string }
> = {
  simple: {
    label: 'Simple',
    icon: Zap,
    className: 'bg-surface-3 text-foreground border-border-strong/50',
  },
  persistent: {
    label: 'Persistante',
    icon: Clock,
    className: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  },
  special: {
    label: 'Spéciale',
    icon: Sparkles,
    className: 'bg-accent/15 text-accent border-accent/35',
  },
};

interface RuleTypeBadgeProps {
  type: RuleType;
  size?: 'sm' | 'md';
  /** Icône seule (modale de pioche, listes denses). */
  iconOnly?: boolean;
  className?: string;
}

export function RuleTypeBadge({
  type,
  size = 'md',
  iconOnly = false,
  className,
}: RuleTypeBadgeProps) {
  const { label, icon: Icon, className: typeClassName } = config[type];
  const compact = iconOnly || size === 'sm';

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border font-semibold shrink-0',
        iconOnly
          ? 'p-1'
          : compact
            ? 'gap-1 px-2 py-0.5 text-[10px]'
            : 'gap-1.5 px-3 py-1 text-sm',
        typeClassName,
        className,
      )}
      aria-label={iconOnly ? `Règle ${label.toLowerCase()}` : undefined}
      title={iconOnly ? label : undefined}
    >
      <Icon size={iconOnly ? 11 : compact ? 11 : 14} />
      {!iconOnly && label}
    </span>
  );
}
