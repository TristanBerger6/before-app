import clsx from 'clsx';
import type { InputHTMLAttributes, KeyboardEvent } from 'react';

const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'file',
  'hidden',
  'radio',
  'reset',
  'submit',
]);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Sur mobile : Entrée ferme le clavier (défaut : true pour les champs texte). */
  dismissKeyboardOnEnter?: boolean;
}

export function Input({
  label,
  className,
  id,
  type,
  dismissKeyboardOnEnter,
  onKeyDown,
  enterKeyHint,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  const shouldDismissOnEnter =
    dismissKeyboardOnEnter ?? !NON_TEXT_INPUT_TYPES.has(type ?? 'text');

  const isEnterKey = (key: string) => key === 'Enter' || key === 'NumpadEnter';

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (shouldDismissOnEnter && isEnterKey(event.key)) {
      event.preventDefault();
      event.currentTarget.blur();
    }
    onKeyDown?.(event);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        type={type}
        enterKeyHint={shouldDismissOnEnter ? 'done' : enterKeyHint}
        onKeyDown={handleKeyDown}
        className={clsx(
          'w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground',
          'placeholder:text-muted/60 transition-colors duration-200',
          'focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20',
          className,
        )}
      />
    </div>
  );
}
