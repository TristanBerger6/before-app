import clsx from 'clsx';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, id, ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx(
          'w-full min-h-28 rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground resize-y',
          'placeholder:text-muted/60 transition-colors duration-200',
          'focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20',
          className,
        )}
        {...props}
      />
    </div>
  );
}
