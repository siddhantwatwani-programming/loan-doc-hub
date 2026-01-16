import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { AlertCircle, Lock, Calculator, Asterisk, CheckCircle2, CalendarIcon } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { parseToCanonical, formatForDisplay } from '@/lib/fieldTransforms';
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
  
  // Local display value for formatted inputs
  const [isFocused, setIsFocused] = useState(false);

  // Handle text/number input changes - store canonical values
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    
    // Parse to canonical form based on data type
    const canonicalValue = parseToCanonical(rawValue, field.data_type);
    onChange(canonicalValue);
  };

  // Handle blur - validate and format
  const handleBlur = () => {
    setIsFocused(false);
    
    if (!value) return;

    let formattedValue = value;

    switch (field.data_type) {
      case 'currency':
        const currencyNum = parseFloat(value);
        if (!isNaN(currencyNum)) {
          formattedValue = currencyNum.toFixed(2);
        }
        break;
      case 'percentage':
        const pctNum = parseFloat(value);
        if (!isNaN(pctNum)) {
          formattedValue = pctNum.toFixed(3);
        }
        break;
      case 'number':
        const num = parseFloat(value);
        if (!isNaN(num)) {
          // Keep as number, no formatting changes
          formattedValue = num.toString();
        }
        break;
    }

    if (formattedValue !== value) {
      onChange(formattedValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle date picker selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Store as ISO date string (canonical format: YYYY-MM-DD)
      onChange(format(date, 'yyyy-MM-dd'));
    } else {
      onChange('');
    }
  };

  // Get display value - formatted for viewing, raw for editing
  const getDisplayValue = (): string => {
    if (!value) return '';
    
    // When focused, show raw canonical value for editing
    if (isFocused) return value;
    
    // When not focused, show formatted value
    return formatForDisplay(value, field.data_type);
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

  // Render date picker
  const renderDatePicker = () => {
    const selectedDate = value ? parseISO(value) : undefined;
    const isValidDate = selectedDate && isValid(selectedDate);

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={field.field_key}
            variant="outline"
            disabled={isDisabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
              showError && 'border-destructive focus:ring-destructive bg-destructive/5',
              isDisabled && 'bg-muted cursor-not-allowed'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {isValidDate ? format(selectedDate, 'MM/dd/yyyy') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={isValidDate ? selectedDate : undefined}
            onSelect={handleDateSelect}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    );
  };

  // Render textarea for address fields
  const renderTextarea = () => (
    <Textarea
      id={field.field_key}
      value={value || ''}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
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

  // Render standard input (text, number, currency, percentage)
  const renderInput = () => {
    const prefix = getInputPrefix();
    const suffix = getInputSuffix();

    return (
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          id={field.field_key}
          type="text"
          inputMode={['number', 'currency', 'percentage'].includes(field.data_type) ? 'decimal' : 'text'}
          value={getDisplayValue()}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
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
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    );
  };

  // Choose the right input based on data type
  const renderFieldInput = () => {
    if (field.data_type === 'date') {
      return renderDatePicker();
    }
    
    if (field.data_type === 'text' && field.field_key.includes('address')) {
      return renderTextarea();
    }
    
    return renderInput();
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
      
      {renderFieldInput()}
      
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
