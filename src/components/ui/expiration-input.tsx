import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ExpirationInputProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Auto-formatting MM/YY expiration date input.
 * Inserts "/" after the month digits automatically.
 */
export const ExpirationInput: React.FC<ExpirationInputProps> = ({
  value,
  onValueChange,
  disabled = false,
  className,
}) => {
  const formatExpiration = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + '/' + digits.slice(2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;

    // If user is deleting the slash, remove the last month digit too
    if (value.length === 4 && inputVal.length === 3 && value.charAt(2) === '/') {
      onValueChange(inputVal.slice(0, 2));
      return;
    }

    onValueChange(formatExpiration(inputVal));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    onValueChange(formatExpiration(pasted));
  };

  return (
    <Input
      value={value}
      onChange={handleChange}
      onPaste={handlePaste}
      disabled={disabled}
      placeholder="MM/YY"
      maxLength={5}
      inputMode="numeric"
      className={cn('h-8 text-sm', className)}
    />
  );
};

export default ExpirationInput;
