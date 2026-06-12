import clsx from 'clsx';
import type { InputEvent, KeyboardEvent, TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  /** Sur mobile : Entrée ferme le clavier au lieu d'insérer un saut de ligne. */
  dismissKeyboardOnEnter?: boolean;
}

export function Textarea({
  label,
  className,
  id,
  dismissKeyboardOnEnter = true,
  onKeyDown,
  onBeforeInput,
  enterKeyHint,
  ...props
}: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  const isEnterKey = (key: string) => key === 'Enter' || key === 'NumpadEnter';

  const dismissKeyboard = (element: HTMLTextAreaElement) => {
    element.blur();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (dismissKeyboardOnEnter && isEnterKey(event.key) && !event.shiftKey) {
      event.preventDefault();
      dismissKeyboard(event.currentTarget);
    }
    onKeyDown?.(event);
  };

  const handleBeforeInput = (event: InputEvent<HTMLTextAreaElement>) => {
    if (dismissKeyboardOnEnter && event.nativeEvent.inputType === 'insertLineBreak') {
      event.preventDefault();
      dismissKeyboard(event.currentTarget);
    }
    onBeforeInput?.(event);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <textarea
        {...props}
        id={inputId}
        enterKeyHint={dismissKeyboardOnEnter ? 'done' : enterKeyHint}
        onKeyDown={handleKeyDown}
        onBeforeInput={handleBeforeInput}
        className={clsx(
          'w-full min-h-28 rounded-xl border border-border bg-surface-2 px-4 py-3 text-foreground resize-y',
          'placeholder:text-muted/60 transition-colors duration-200',
          'focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20',
          className,
        )}
      />
    </div>
  );
}
