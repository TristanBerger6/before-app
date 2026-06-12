import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { EMAIL_OTP_LENGTH } from '../../lib/authConfig';

const OTP_LENGTH = EMAIL_OTP_LENGTH;

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  id = 'email-otp',
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(OTP_LENGTH, ' ').slice(0, OTP_LENGTH).split('');

  const prevLengthRef = useRef(0);

  useEffect(() => {
    if (value.length === OTP_LENGTH && prevLengthRef.current < OTP_LENGTH) {
      onComplete?.(value);
    }
    prevLengthRef.current = value.length;
  }, [value, onComplete]);

  const focusAt = (index: number) => {
    const clamped = Math.max(0, Math.min(OTP_LENGTH - 1, index));
    inputRefs.current[clamped]?.focus();
  };

  const updateValue = (next: string) => {
    const sanitized = next.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(sanitized);
    return sanitized;
  };

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(-1);
    const chars = value.split('');
    chars[index] = digit;
    const next = updateValue(chars.join(''));
    if (digit && index < OTP_LENGTH - 1) {
      focusAt(index + 1);
    }
    return next;
  };

  const handleKeyDown = (index: number, key: string) => {
    if (key === 'Backspace') {
      if (digits[index]?.trim()) {
        const chars = value.split('');
        chars[index] = '';
        updateValue(chars.join(''));
      } else if (index > 0) {
        const chars = value.split('');
        chars[index - 1] = '';
        updateValue(chars.join(''));
        focusAt(index - 1);
      }
      return;
    }
    if (key === 'ArrowLeft') {
      focusAt(index - 1);
      return;
    }
    if (key === 'ArrowRight') {
      focusAt(index + 1);
    }
  };

  const handlePaste = (text: string) => {
    const next = updateValue(text);
    focusAt(Math.min(next.length, OTP_LENGTH - 1));
  };

  return (
    <div
      className="flex justify-center gap-1.5 sm:gap-2"
      onPaste={(e) => {
        e.preventDefault();
        handlePaste(e.clipboardData.getData('text'));
      }}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          id={index === 0 ? id : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Chiffre ${index + 1}`}
          maxLength={1}
          value={digit.trim()}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value;
            if (next.length > 1) {
              handlePaste(next);
              return;
            }
            handleChange(index, next);
          }}
          onKeyDown={(e) => handleKeyDown(index, e.key)}
          onFocus={(e) => e.target.select()}
          className={clsx(
            'h-12 w-9 sm:h-14 sm:w-10 rounded-xl border bg-surface-2 text-center',
            'text-xl sm:text-2xl font-semibold tabular-nums text-foreground',
            'transition-colors duration-200',
            'focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20',
            digit.trim() ? 'border-accent/40' : 'border-border',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />
      ))}
    </div>
  );
}
