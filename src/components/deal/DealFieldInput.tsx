import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AlertCircle, Lock, Calculator } from 'lucide-react';
import type { FieldDefinition } from '@/hooks/useDealFields';

interface DealFieldInputProps {
  field: FieldDefinition;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export const DealFieldInput: React.FC<DealFieldInputProps> = ({
  field,
  value,
  onChange,
  error = false,
  disabled = false,
}) => {
  const isDisabled = disabled || field.is_calculated;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value;

    // Apply input formatting based on data type
    switch (field.data_type) {
      case 'number':
        // Allow only numbers and decimal
        newValue = newValue.replace(/[^0-9.-]/g, '');
        break;
      case 'currency':
        // Allow only numbers and decimal, format on blur
        newValue = newValue.replace(/[^0-9.-]/g, '');
        break;
      case 'percentage':
        // Allow only numbers and decimal
        newValue = newValue.replace(/[^0-9.]/g, '');
        break;
    }

    onChange(newValue);
  };

  const handleBlur = () => {
    let formattedValue = value;

    // Format value on blur
    switch (field.data_type) {
      case 'currency':
        if (value && !isNaN(parseFloat(value))) {
          formattedValue = parseFloat(value).toFixed(2);
        }
        break;
      case 'percentage':
        if (value && !isNaN(parseFloat(value))) {
          formattedValue = parseFloat(value).toFixed(3);
        }
        break;
    }

    if (formattedValue !== value) {
      onChange(formattedValue);
    }
  };

  const getInputType = () => {
    switch (field.data_type) {
      case 'date':
        return 'date';
      case 'number':
      case 'currency':
      case 'percentage':
        return 'text'; // Use text for better formatting control
      default:
        return 'text';
    }
  };

  const getInputPrefix = () => {
    switch (field.data_type) {
      case 'currency':
        return '$';
      default:
        return null;
    }
  };

  const getInputSuffix = () => {
    switch (field.data_type) {
      case 'percentage':
        return '%';
      default:
        return null;
    }
  };

  const renderInput = () => {
    const prefix = getInputPrefix();
    const suffix = getInputSuffix();
    const inputType = getInputType();

    // Use textarea for text fields that might be longer
    if (field.data_type === 'text' && field.field_key.includes('address')) {
      return (
        <Textarea
          id={field.field_key}
          value={value || ''}
          onChange={handleChange}
          disabled={isDisabled}
          className={cn(
            'resize-none',
            error && 'border-destructive focus:ring-destructive',
            isDisabled && 'bg-muted cursor-not-allowed'
          )}
          rows={2}
          placeholder={field.description || undefined}
        />
      );
    }

    return (
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          id={field.field_key}
          type={inputType}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isDisabled}
          className={cn(
            prefix && 'pl-7',
            suffix && 'pr-8',
            error && 'border-destructive focus:ring-destructive',
            isDisabled && 'bg-muted cursor-not-allowed'
          )}
          placeholder={field.description || undefined}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {suffix}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label
          htmlFor={field.field_key}
          className={cn(
            'text-sm font-medium',
            error && 'text-destructive'
          )}
        >
          {field.label}
        {field.is_required && (
            <span className="text-destructive ml-1">*</span>
          )}
        </Label>
        {field.is_calculated && (
          <span title="Calculated field">
            <Calculator className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        )}
        {isDisabled && !field.is_calculated && (
          <span title="Read-only">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        )}
      </div>
      
      {renderInput()}
      
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          This field is required
        </p>
      )}
      
      {field.transform_rules.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Format: {field.transform_rules.join(', ')}
        </p>
      )}
    </div>
  );
};

// Helper functions for formatting
function formatPhoneNumber(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 10);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
  return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6)}`;
}

function formatSSN(value: string): string {
  const numbers = value.replace(/\D/g, '').slice(0, 9);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5)}`;
}

export default DealFieldInput;
