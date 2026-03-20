import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
}

/**
 * Formats digits to US phone format: (XXX) XXX-XXXX
 */
const formatPhone = (digits: string): string => {
  const d = digits.replace(/\D/g, '').slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
};

const extractDigits = (value: string): string => value.replace(/\D/g, '').slice(0, 10);

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onValueChange,
  className,
  disabled = false,
  readOnly = false,
  placeholder = "(___) ___-____",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = extractDigits(e.target.value);
    onValueChange(digits);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const digits = extractDigits(pasted);
    onValueChange(digits);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow navigation, delete, backspace, tab, etc.
    const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
    if (allowed.includes(e.key)) return;
    // Allow Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) return;
    // Block non-digit keys
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const displayValue = formatPhone(value || '');

  return (
    <Input
      type="tel"
      value={displayValue}
      onChange={handleChange}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      className={cn(className)}
      maxLength={14} // (XXX) XXX-XXXX
      inputMode="numeric"
    />
  );
};

/**
 * Validates that a phone value (raw digits) is a valid 10-digit US number.
 * Returns true if empty (optional) or exactly 10 digits.
 */
export const isValidUSPhone = (digits: string): boolean => {
  if (!digits) return true; // empty is valid (optional field)
  const clean = digits.replace(/\D/g, '');
  return clean.length === 10;
};

export default PhoneInput;
