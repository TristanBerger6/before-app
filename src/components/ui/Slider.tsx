import clsx from 'clsx';

interface SliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function Slider({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  unit = '',
  disabled,
  onChange,
}: SliderProps) {
  return (
    <div className={clsx('flex flex-col gap-3', disabled && 'opacity-60')}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-foreground">{label}</span>
          {description && (
            <span className="block text-sm text-muted mt-1">{description}</span>
          )}
        </div>
        <span className="shrink-0 text-sm font-semibold text-accent tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={clsx(
          'w-full h-2 rounded-full appearance-none cursor-pointer',
          'bg-surface-3 accent-accent',
          'disabled:cursor-not-allowed',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5',
          '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent',
          '[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer',
          'disabled:[&::-webkit-slider-thumb]:cursor-not-allowed',
        )}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}
