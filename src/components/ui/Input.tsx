import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground',
          'placeholder:text-muted/60 transition-colors duration-200',
          'focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20',
          className,
        )}
        {...props}
      />
    </div>
  );
}
