import clsx from 'clsx';

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Switch({ label, description, checked, onChange }: SwitchProps) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer">
      <div className="flex-1">
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {description && (
          <span className="block text-sm text-muted mt-1">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
          checked ? 'bg-accent' : 'bg-surface-3',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-foreground transition-transform duration-200',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </label>
  );
}
