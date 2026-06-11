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
}

export function RuleTypeBadge({ type, size = 'md' }: RuleTypeBadgeProps) {
  const { label, icon: Icon, className } = config[type];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className,
      )}
    >
      <Icon size={size === 'sm' ? 12 : 14} />
      {label}
    </span>
  );
}
