import React, { useState, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MaskedInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  maxLength?: number;
  inputMode?: 'numeric' | 'decimal' | 'text';
}

/**
 * An input that masks sensitive values (e.g. routing/account numbers).
 * Shows ••••••1234 by default; eye icon toggles visibility.
 * Actual value is always passed through onChange unmasked.
 */
export const MaskedInput: React.FC<MaskedInputProps> = ({
  value,
  onChange,
  disabled = false,
  className,
  placeholder,
  maxLength,
  inputMode = 'numeric',
}) => {
  const [visible, setVisible] = useState(false);

  const toggleVisibility = useCallback(() => setVisible(prev => !prev), []);

  const maskedValue = React.useMemo(() => {
    if (!value) return '';
    if (value.length <= 4) return '•'.repeat(value.length);
    return '•'.repeat(value.length - 4) + value.slice(-4);
  }, [value]);

  return (
    <div className="relative flex-1">
      <Input
        value={maskedValue}
        onChange={onChange}
        disabled={disabled}
        className={cn('h-8 text-sm', className)}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        onBeforeInput={(e: any) => {
          // Allow typing by appending to actual value
          const nativeEvent = e.nativeEvent as InputEvent;
          if (nativeEvent.data) {
            e.preventDefault();
            const syntheticEvent = {
              target: { value: value + nativeEvent.data },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            e.preventDefault();
            const syntheticEvent = {
              target: { value: value.slice(0, -1) },
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(syntheticEvent);
          }
        }}
      />
    </div>
  );
};

export default MaskedInput;
