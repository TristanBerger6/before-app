import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
}

export function Card({ children, interactive, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-border/80 bg-surface-1/90 p-5 backdrop-blur-sm',
        interactive &&
          'cursor-pointer transition-colors duration-200 hover:bg-surface-2 hover:border-border-strong',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
