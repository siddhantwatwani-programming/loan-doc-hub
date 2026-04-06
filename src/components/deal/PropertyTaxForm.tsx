import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { CalendarIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { numericKeyDown, numericPaste, formatCurrencyDisplay, unformatCurrencyDisplay } from '@/lib/numericInputFilter';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';

interface PropertyTaxFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const FREQUENCY_OPTIONS = [
  'Once Only', 'Monthly', 'Quarterly', 'Bi-Monthly', 'Bi-Weekly',
  'Weekly', 'Semi-Monthly', 'Semi-Yearly', 'Yearly',
];

const TYPE_OPTIONS = ['Current Property Tax', 'Delinquent Property Tax', 'Other'];

// Use propertytax1.* prefix for form keys (remapped by parent)
const PREFIX = 'propertytax1';

export const PropertyTaxForm: React.FC<PropertyTaxFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (field: string): string => values[`${PREFIX}.${field}`] || '';
  const getBoolValue = (field: string): boolean => values[`${PREFIX}.${field}`] === 'true';
  const handleChange = (field: string, value: string) => onValueChange(`${PREFIX}.${field}`, value);

  const [datePickerStates, setDatePickerStates] = useState<Record<string, boolean>>({});

  const safeParseDateStr = (val: string): Date | undefined => {
    if (!val) return undefined;
    try {
      const d = parse(val, 'yyyy-MM-dd', new Date());
      return isValid(d) ? d : undefined;
    } catch { return undefined; }
  };

  const renderDateField = (field: string, label: string) => {
    const val = getValue(field);
    return (
      <div className="flex items-center gap-3">
        <Label className="text-sm text-foreground whitespace-nowrap min-w-[110px]">{label}</Label>
        <Popover open={datePickerStates[field] || false} onOpenChange={(open) => setDatePickerStates(prev => ({ ...prev, [field]: open }))}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('h-7 text-sm flex-1 justify-start text-left font-normal', !val && 'text-muted-foreground')} disabled={disabled}>
              {val && safeParseDateStr(val) ? format(safeParseDateStr(val)!, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
              <CalendarIcon className="ml-auto h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[9999]" align="start">
            <EnhancedCalendar
              mode="single"
              selected={safeParseDateStr(val)}
              onSelect={(date) => { if (date) handleChange(field, format(date, 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [field]: false })); }}
              onClear={() => { handleChange(field, ''); setDatePickerStates(prev => ({ ...prev, [field]: false })); }}
              onToday={() => { handleChange(field, format(new Date(), 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [field]: false })); }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const renderCurrencyField = (field: string, label: string) => (
    <div className="flex items-center gap-3">
      <Label className="text-sm text-foreground whitespace-nowrap min-w-[110px]">{label}</Label>
      <div className="relative flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <Input
          value={getValue(field)}
          onChange={(e) => handleChange(field, e.target.value)}
          onKeyDown={numericKeyDown}
          onPaste={(e) => numericPaste(e, (v) => handleChange(field, v))}
          onFocus={(e) => { const v = unformatCurrencyDisplay(e.target.value); handleChange(field, v); }}
          onBlur={(e) => { const v = formatCurrencyDisplay(e.target.value); handleChange(field, v); }}
          disabled={disabled}
          className="h-7 text-sm flex-1 pl-5"
        />
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="border-b border-border pb-2 mb-4">
        <span className="font-semibold text-base text-foreground">Property Tax</span>
      </div>

      <div className="max-w-[800px]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {/* Left column */}
          <div className="space-y-3">
            <DirtyFieldWrapper fieldKey={`${PREFIX}.authority`}>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-foreground whitespace-nowrap min-w-[110px]">Tax Authority</Label>
                <Input value={getValue('authority')} onChange={(e) => handleChange('authority', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
              </div>
            </DirtyFieldWrapper>

            <DirtyFieldWrapper fieldKey={`${PREFIX}.type`}>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-foreground whitespace-nowrap min-w-[110px]">Type</Label>
                <Select value={getValue('type')} onValueChange={(value) => handleChange('type', value)} disabled={disabled}>
                  <SelectTrigger className="h-7 text-sm flex-1 bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </DirtyFieldWrapper>

            <DirtyFieldWrapper fieldKey={`${PREFIX}.annual_payment`}>
              {renderCurrencyField('annual_payment', 'Annual Payment (est.)')}
            </DirtyFieldWrapper>

            <DirtyFieldWrapper fieldKey={`${PREFIX}.frequency`}>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-foreground whitespace-nowrap min-w-[110px]">Frequency</Label>
                <Select value={getValue('frequency')} onValueChange={(value) => handleChange('frequency', value)} disabled={disabled}>
                  <SelectTrigger className="h-7 text-sm flex-1 bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {FREQUENCY_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </DirtyFieldWrapper>
          </div>

          {/* Right column - Tax Tracking */}
          <div className="space-y-3">
            <div className="border-b border-border pb-1 mb-2">
              <span className="font-semibold text-sm text-foreground">Tax Tracking</span>
            </div>

            <DirtyFieldWrapper fieldKey={`${PREFIX}.active`}>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={getBoolValue('active')}
                  onCheckedChange={(checked) => handleChange('active', checked === true ? 'true' : 'false')}
                  disabled={disabled}
                />
                <Label className="text-sm text-foreground whitespace-nowrap">Active</Label>
              </div>
            </DirtyFieldWrapper>

            {renderDateField('last_verified', 'Last Verified')}
            {renderDateField('lender_notified', 'Lender Notified')}

            <DirtyFieldWrapper fieldKey={`${PREFIX}.current`}>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={getBoolValue('current')}
                  onCheckedChange={(checked) => handleChange('current', checked === true ? 'true' : 'false')}
                  disabled={disabled}
                />
                <Label className="text-sm text-foreground whitespace-nowrap">Current</Label>
              </div>
            </DirtyFieldWrapper>

            <DirtyFieldWrapper fieldKey={`${PREFIX}.delinquent`}>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={getBoolValue('delinquent')}
                  onCheckedChange={(checked) => handleChange('delinquent', checked === true ? 'true' : 'false')}
                  disabled={disabled}
                />
                <Label className="text-sm text-foreground whitespace-nowrap">Delinquent</Label>
              </div>
            </DirtyFieldWrapper>

            {getBoolValue('delinquent') && (
              <DirtyFieldWrapper fieldKey={`${PREFIX}.delinquent_amount`}>
                {renderCurrencyField('delinquent_amount', 'Delinquent Amt')}
              </DirtyFieldWrapper>
            )}

            <DirtyFieldWrapper fieldKey={`${PREFIX}.borrower_notified`}>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={getBoolValue('borrower_notified')}
                  onCheckedChange={(checked) => handleChange('borrower_notified', checked === true ? 'true' : 'false')}
                  disabled={disabled}
                />
                <Label className="text-sm text-foreground whitespace-nowrap">Borrower Notified</Label>
              </div>
            </DirtyFieldWrapper>

            {getBoolValue('borrower_notified') && (
              <DirtyFieldWrapper fieldKey={`${PREFIX}.borrower_notified_date`}>
                {renderDateField('borrower_notified_date', 'Borrower Notified')}
              </DirtyFieldWrapper>
            )}

            <DirtyFieldWrapper fieldKey={`${PREFIX}.lender_notified_date`}>
              {renderDateField('lender_notified_date', 'Lender Notified')}
            </DirtyFieldWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyTaxForm;
