import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AlertCircle, Lock, Calculator, Asterisk, CheckCircle2 } from 'lucide-react';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface DealFieldInputProps {
  field: FieldDefinition;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResult?: CalculationResult;
}

export const DealFieldInput: React.FC<DealFieldInputProps> = ({
  field,
  value,
  onChange,
  error = false,
  showValidation = false,
  disabled = false,
  calculationResult,
}) => {
  const isDisabled = disabled || field.is_calculated;
  const showError = error && showValidation;
  const isComputed = calculationResult?.computed === true;
  const hasCalculationError = calculationResult?.error !== undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value;

    // Apply input formatting based on data type
    switch (field.data_type) {
      case 'number':
        newValue = newValue.replace(/[^0-9.-]/g, '');
        break;
      case 'currency':
        newValue = newValue.replace(/[^0-9.-]/g, '');
        break;
      case 'percentage':
        newValue = newValue.replace(/[^0-9.]/g, '');
        break;
    }

    onChange(newValue);
  };

  const handleBlur = () => {
    let formattedValue = value;

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
        return 'text';
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

    if (field.data_type === 'text' && field.field_key.includes('address')) {
      return (
        <Textarea
          id={field.field_key}
          value={value || ''}
          onChange={handleChange}
          disabled={isDisabled}
          className={cn(
            'resize-none transition-colors',
            showError && 'border-destructive focus:ring-destructive bg-destructive/5',
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
            'transition-colors',
            prefix && 'pl-7',
            suffix && 'pr-8',
            showError && 'border-destructive focus:ring-destructive bg-destructive/5',
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
    <div className="space-y-2" id={`field-${field.field_key}`}>
      <div className="flex items-center gap-2">
        <Label
          htmlFor={field.field_key}
          className={cn(
            'text-sm font-medium flex items-center gap-1',
            showError && 'text-destructive'
          )}
        >
          {field.label}
          {field.is_required && (
            <span className="text-destructive" title="Required field">
              <Asterisk className="h-3 w-3" />
            </span>
          )}
        </Label>
        {field.is_calculated && (
          <span 
            title={isComputed ? "Calculated - value computed" : "Calculated field (waiting for dependencies)"} 
            className={cn(
              "flex items-center gap-1",
              isComputed ? "text-green-600" : "text-muted-foreground"
            )}
          >
            <Calculator className="h-3.5 w-3.5" />
            {isComputed && <CheckCircle2 className="h-3 w-3" />}
          </span>
        )}
        {isDisabled && !field.is_calculated && (
          <span title="Read-only" className="text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      
      {renderInput()}
      
      {showError && (
        <p className="text-xs text-destructive flex items-center gap-1 animate-fade-in">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          This field is required
        </p>
      )}
      
      {hasCalculationError && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {calculationResult?.error}
        </p>
      )}
      
      {field.is_calculated && !isComputed && !hasCalculationError && (
        <p className="text-xs text-muted-foreground">
          Waiting for: {field.calculation_dependencies.join(', ')}
        </p>
      )}
      
      {field.transform_rules.length > 0 && !showError && !field.is_calculated && (
        <p className="text-xs text-muted-foreground">
          Format: {field.transform_rules.join(', ')}
        </p>
      )}
    </div>
  );
};

export default DealFieldInput;
