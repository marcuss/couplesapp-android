/**
 * OTP-style 6-digit code input component.
 * Auto-advances between fields, supports paste, uppercase only.
 */
import React, { useRef, useCallback, useEffect } from 'react';

interface CodeInputProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

const CODE_LENGTH = 6;
const ALLOWED = /^[A-Z0-9]$/;

export const CodeInput: React.FC<CodeInputProps> = ({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}) => {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.padEnd(CODE_LENGTH, '').split('').slice(0, CODE_LENGTH);

  useEffect(() => {
    if (autoFocus && inputs.current[0]) {
      inputs.current[0].focus();
    }
  }, [autoFocus]);

  const setChar = useCallback(
    (index: number, char: string) => {
      const next = [...chars];
      next[index] = char.toUpperCase();
      onChange(next.join('').trim());
    },
    [chars, onChange],
  );

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (chars[index]) {
        setChar(index, '');
      } else if (index > 0) {
        setChar(index - 1, '');
        inputs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleInput = (index: number, e: React.FormEvent<HTMLInputElement>) => {
    const val = (e.target as HTMLInputElement).value.toUpperCase();
    if (val && ALLOWED.test(val)) {
      setChar(index, val);
      if (index < CODE_LENGTH - 1) {
        inputs.current[index + 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, CODE_LENGTH);
    if (pasted.length > 0) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
      inputs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" data-testid="code-input">
      {chars.map((char, i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="text"
          maxLength={1}
          value={char}
          disabled={disabled}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onInput={(e) => handleInput(i, e)}
          onPaste={handlePaste}
          onChange={() => {}} // controlled
          className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold
            rounded-xl border-2 border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-700 text-gray-900 dark:text-white
            focus:border-rose-500 focus:ring-2 focus:ring-rose-500 focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all uppercase"
          data-testid={`code-input-${i}`}
          aria-label={`Code digit ${i + 1}`}
        />
      ))}
    </div>
  );
};

export default CodeInput;
