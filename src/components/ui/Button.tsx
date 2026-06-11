import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-active shadow-lg shadow-accent/20',
  secondary:
    'bg-surface-2/80 text-foreground border border-border hover:bg-surface-3 hover:border-border-strong',
  ghost: 'bg-transparent text-muted hover:text-foreground hover:bg-surface-2',
  danger: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
};

export function Button({
  variant = 'primary',
  fullWidth,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold',
        'transition-colors duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
