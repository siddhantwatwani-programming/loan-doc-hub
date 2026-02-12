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
  
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    const canonicalValue = parseToCanonical(rawValue, field.data_type);
    onChange(canonicalValue);
  };

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

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
    } else {
      onChange('');
    }
  };

  const getDisplayValue = (): string => {
    if (!value) return '';
    if (isFocused) return value;
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
              'w-full justify-start text-left font-normal h-7 text-xs',
              !value && 'text-muted-foreground',
              showError && 'border-destructive focus:ring-destructive bg-destructive/5',
              isDisabled && 'bg-muted cursor-not-allowed'
            )}
          >
            <CalendarIcon className="mr-1.5 h-3 w-3" />
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
        'resize-none transition-colors text-xs min-h-[48px]',
        showError && 'border-destructive focus:ring-destructive bg-destructive/5',
        isDisabled && 'bg-muted cursor-not-allowed'
      )}
      rows={2}
      placeholder={field.description || undefined}
    />
  );

  // Render standard input
  const renderInput = () => {
    const prefix = getInputPrefix();
    const suffix = getInputSuffix();

    return (
      <div className="relative">
        {prefix && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">
            {prefix}
          </span>
        )}
        <Input
          id={field.field_key}
          type="text"
          inputMode={['number', 'currency', 'percentage', 'decimal', 'integer'].includes(field.data_type) ? 'decimal' : 'text'}
          value={getDisplayValue()}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={isDisabled}
          className={cn(
            'transition-colors h-7 text-xs',
            prefix && 'pl-5',
            suffix && 'pr-6',
            showError && 'border-destructive focus:ring-destructive bg-destructive/5',
            isDisabled && 'bg-muted cursor-not-allowed'
          )}
          placeholder={field.description || undefined}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    );
  };

  // Render phone input
  const renderPhoneInput = () => (
    <Input
      id={field.field_key}
      type="tel"
      inputMode="tel"
      value={value || ''}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      disabled={isDisabled}
      className={cn(
        'transition-colors h-7 text-xs',
        showError && 'border-destructive focus:ring-destructive bg-destructive/5',
        isDisabled && 'bg-muted cursor-not-allowed'
      )}
      placeholder={field.description || 'Phone number'}
    />
  );

  // Render section header (non-input)
  const renderSectionHeader = () => (
    <div className="col-span-full border-b border-border pb-1.5 mt-3 first:mt-0">
      <span className="font-semibold text-xs text-foreground">{field.label}</span>
    </div>
  );

  // Render label (static text, non-input)
  const renderLabel = () => (
    <p className="text-xs text-muted-foreground italic">{field.label}</p>
  );

  // Render template button
  const renderTemplateButton = () => (
    <Button
      variant="outline"
      size="sm"
      disabled={isDisabled}
      className="justify-start text-left h-7 py-1 text-xs"
      onClick={() => {
        console.log('Template clicked:', field.field_key);
      }}
    >
      {field.label}
    </Button>
  );

  // Render action button
  const renderActionButton = () => (
    <Button
      variant="default"
      size="sm"
      disabled={isDisabled}
      className="h-7 text-xs"
      onClick={() => {
        console.log('Action clicked:', field.field_key);
      }}
    >
      {field.label}
    </Button>
  );

  // Render file input
  const renderFileInput = () => (
    <Input
      id={field.field_key}
      type="file"
      disabled={isDisabled}
      className={cn(
        'transition-colors cursor-pointer h-7 text-xs',
        showError && 'border-destructive focus:ring-destructive bg-destructive/5',
        isDisabled && 'bg-muted cursor-not-allowed'
      )}
    />
  );

  // Choose the right input based on data type
  const renderFieldInput = () => {
    if (field.data_type === 'section') return renderSectionHeader();
    if (field.data_type === 'label') return renderLabel();
    if (field.data_type === 'template') return renderTemplateButton();
    if (field.data_type === 'action') return renderActionButton();
    if (field.data_type === 'file') return renderFileInput();
    if (field.data_type === 'phone') return renderPhoneInput();
    if (field.data_type === 'date') return renderDatePicker();
    if (field.data_type === 'text' && field.field_key.includes('address')) return renderTextarea();
    return renderInput();
  };

  // For non-input types (section, label), render without the label wrapper
  const isNonInputType = ['section', 'label'].includes(field.data_type);
  
  if (isNonInputType) {
    return (
      <div id={`field-${field.field_key}`}>
        {renderFieldInput()}
      </div>
    );
  }

  return (
    <div className="space-y-0.5" id={`field-${field.field_key}`}>
      {/* Inline label + input row */}
      <div className="flex items-start gap-2">
        <div className="flex items-center gap-1 w-[140px] shrink-0 pt-1.5">
          <Label
            htmlFor={field.field_key}
            className={cn(
              'text-xs font-medium leading-tight flex items-center gap-0.5',
              showError && 'text-destructive'
            )}
          >
            {field.label}
            {field.is_required && (
              <span className="text-destructive" title="Required field">
                <Asterisk className="h-2.5 w-2.5" />
              </span>
            )}
          </Label>
          {field.is_calculated && (
            <span 
              title={isComputed ? "Calculated - value computed" : "Calculated field (waiting for dependencies)"} 
              className={cn(
                "flex items-center gap-0.5",
                isComputed ? "text-green-600" : "text-muted-foreground"
              )}
            >
              <Calculator className="h-3 w-3" />
              {isComputed && <CheckCircle2 className="h-2.5 w-2.5" />}
            </span>
          )}
          {isDisabled && !field.is_calculated && (
            <span title="Read-only" className="text-muted-foreground">
              <Lock className="h-3 w-3" />
            </span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {renderFieldInput()}
        </div>
      </div>
      
      {showError && (
        <p className="text-[10px] text-destructive flex items-center gap-0.5 animate-fade-in pl-[148px]">
          <AlertCircle className="h-2.5 w-2.5 flex-shrink-0" />
          This field is required
        </p>
      )}
      
      {hasCalculationError && (
        <p className="text-[10px] text-amber-600 flex items-center gap-0.5 pl-[148px]">
          <AlertCircle className="h-2.5 w-2.5 flex-shrink-0" />
          {calculationResult?.error}
        </p>
      )}
      
      {field.is_calculated && !isComputed && !hasCalculationError && (
        <p className="text-[10px] text-muted-foreground pl-[148px]">
          Waiting for: {field.calculation_dependencies.join(', ')}
        </p>
      )}
      
      {field.transform_rules.length > 0 && !showError && !field.is_calculated && (
        <p className="text-[10px] text-muted-foreground pl-[148px]">
          Format: {field.transform_rules.join(', ')}
        </p>
      )}
    </div>
  );
};

export default DealFieldInput;
