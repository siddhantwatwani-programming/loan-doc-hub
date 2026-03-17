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
    if (value.length <= 4) return value;
    const last4 = value.slice(-4);
    const masked = '•'.repeat(value.length - 4);
    return `${masked}${last4}`;
  }, [value]);

  return (
    <div className="relative flex-1">
      <Input
        value={visible ? value : maskedValue}
        onChange={visible ? onChange : undefined}
        readOnly={!visible}
        disabled={disabled}
        className={cn('h-8 text-sm pr-8', className)}
        placeholder={placeholder}
        maxLength={visible ? maxLength : undefined}
        inputMode={visible ? inputMode : undefined}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={toggleVisibility}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
          aria-label={visible ? 'Hide value' : 'Show value'}
        >
          {visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
};

export default MaskedInput;
