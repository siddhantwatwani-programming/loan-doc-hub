import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { validateEmail } from '@/lib/emailValidation';
import { cn } from '@/lib/utils';

interface EmailInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  value: string;
  onValueChange: (value: string) => void;
}

export const EmailInput = React.forwardRef<HTMLInputElement, EmailInputProps>(
  ({ value, onValueChange, className, onBlur, ...props }, ref) => {
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        setTouched(true);
        setError(validateEmail(e.target.value));
        onBlur?.(e);
      },
      [onBlur],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange(e.target.value);
        if (touched) setError(validateEmail(e.target.value));
      },
      [onValueChange, touched],
    );

    return (
      <div className="flex flex-col flex-1">
        <Input
          ref={ref}
          type="email"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(className, touched && error && 'border-destructive')}
          {...props}
        />
        {touched && error && (
          <span className="text-[10px] text-destructive mt-0.5 leading-tight">{error}</span>
        )}
      </div>
    );
  },
);
EmailInput.displayName = 'EmailInput';
