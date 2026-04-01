import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ZipInputProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * ZIP Code input – accepts digits and hyphen, max 10 characters (ZIP+4 with dash).
 * Validates US ZIP: 5 digits or 5+4 with hyphen (e.g., 10001 or 10001-1234).
 */
export const ZipInput = React.forwardRef<HTMLInputElement, ZipInputProps>(
  ({ value, onValueChange, disabled = false, readOnly = false, className, placeholder = '' }, ref) => {
    const [touched, setTouched] = React.useState(false);

    const sanitize = (raw: string): string => raw.replace(/[^0-9-]/g, '').slice(0, 10);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange(sanitize(e.target.value));
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      onValueChange(sanitize(pasted));
    };

    const handleBlur = () => {
      setTouched(true);
    };

    const isValid = !value || /^\d{5}(-\d{4})?$/.test(value);
    const showError = touched && value.length > 0 && !isValid;

    return (
      <div className="flex flex-col flex-1">
        <Input
          ref={ref}
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          onBlur={handleBlur}
          disabled={disabled}
          readOnly={readOnly}
          inputMode="numeric"
          maxLength={9}
          placeholder={placeholder}
          className={cn(className, showError && 'border-destructive')}
        />
        {showError && (
          <span className="text-[10px] text-destructive mt-0.5">
            Please enter a valid US ZIP code (e.g., 10001 or 10001-1234).
          </span>
        )}
      </div>
    );
  }
);
ZipInput.displayName = 'ZipInput';

export default ZipInput;
