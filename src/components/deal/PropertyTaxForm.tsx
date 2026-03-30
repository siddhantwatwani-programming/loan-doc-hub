import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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

import { PROPERTY_TAX_KEYS } from '@/lib/fieldKeyMap';

// Use central field key map
const FIELD_KEYS = PROPERTY_TAX_KEYS;

const FREQUENCY_OPTIONS = [
  'Once Only',
  'Monthly',
  'Quarterly',
  'Bi-Monthly',
  'Bi-Weekly',
  'Weekly',
  'Semi-Monthly',
  'Semi-Yearly',
  'Yearly',
];

const TYPE_OPTIONS = ['Property Tax', 'Other'];

const TRACKING_STATUS_OPTIONS = ['Current', 'Delinquent'];

export const PropertyTaxForm: React.FC<PropertyTaxFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (key: keyof typeof FIELD_KEYS): string => {
    return values[FIELD_KEYS[key]] || '';
  };

  const handleChange = (key: keyof typeof FIELD_KEYS, value: string) => {
    onValueChange(FIELD_KEYS[key], value);
  };

  const [datePickerStates, setDatePickerStates] = useState<Record<string, boolean>>({});

  const safeParseDateStr = (val: string): Date | undefined => {
    if (!val) return undefined;
    try {
      const d = parse(val, 'yyyy-MM-dd', new Date());
      return isValid(d) ? d : undefined;
    } catch { return undefined; }
  };

  // Auto-populate Ref from APN (Legal Description tab)
  const apnValue = values['property1.apn'] || '';

  const taxTrackingEnabled = getValue('taxTracking') === 'true';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="border-b border-border pb-2 mb-4">
        <span className="font-semibold text-base text-foreground">Property Tax</span>
      </div>

      <div className="max-w-[800px]">
        {/* Two column layout */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {/* Left column */}
          <div className="space-y-3">
            <DirtyFieldWrapper fieldKey={FIELD_KEYS.payee}>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px]">Property</Label>
                <Input value={getValue('payee')} onChange={(e) => handleChange('payee', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
              </div>
            </DirtyFieldWrapper>

            <DirtyFieldWrapper fieldKey={FIELD_KEYS.authority}>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px]">Authority</Label>
                <Input value={getValue('authority')} onChange={(e) => handleChange('authority', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
              </div>
            </DirtyFieldWrapper>

            <DirtyFieldWrapper fieldKey={FIELD_KEYS.payeeAddress}>
              <div className="flex items-start gap-3">
                <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px] mt-1.5">Address</Label>
                <Textarea value={getValue('payeeAddress')} onChange={(e) => handleChange('payeeAddress', e.target.value)} disabled={disabled} className="text-sm min-h-[70px] resize-none flex-1" />
              </div>
            </DirtyFieldWrapper>

            <DirtyFieldWrapper fieldKey={FIELD_KEYS.type}>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px]">Type</Label>
                <Select value={getValue('type')} onValueChange={(value) => handleChange('type', value)} disabled={disabled}>
                  <SelectTrigger className="h-7 text-sm flex-1 bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </DirtyFieldWrapper>

            {/* APN */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px]">APN</Label>
              <Input
                value={apnValue}
                disabled={true}
                className="h-7 text-sm flex-1 bg-muted/50"
              />
            </div>

            <DirtyFieldWrapper fieldKey={FIELD_KEYS.memo}>
              <div className="flex items-start gap-3">
                <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px] mt-1.5">Memo</Label>
                <Textarea value={getValue('memo')} onChange={(e) => handleChange('memo', e.target.value)} disabled={disabled} className="text-sm min-h-[70px] resize-none flex-1" />
              </div>
            </DirtyFieldWrapper>
          </div>

          {/* Right column */}
          <div className="space-y-3">
            {/* Next Due Date */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[110px]">Next Due</Label>
              <Popover open={datePickerStates['nextDueDate'] || false} onOpenChange={(open) => setDatePickerStates(prev => ({ ...prev, nextDueDate: open }))}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('h-7 text-sm flex-1 justify-start text-left font-normal', !getValue('nextDueDate') && 'text-muted-foreground')} disabled={disabled}>
                    {getValue('nextDueDate') && safeParseDateStr(getValue('nextDueDate')) ? format(safeParseDateStr(getValue('nextDueDate'))!, 'dd-MM-yyyy') : 'dd-mm-yyyy'}
                    <CalendarIcon className="ml-auto h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                  <EnhancedCalendar
                    mode="single"
                    selected={safeParseDateStr(getValue('nextDueDate'))}
                    onSelect={(date) => { if (date) handleChange('nextDueDate', format(date, 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, nextDueDate: false })); }}
                    onClear={() => { handleChange('nextDueDate', ''); setDatePickerStates(prev => ({ ...prev, nextDueDate: false })); }}
                    onToday={() => { handleChange('nextDueDate', format(new Date(), 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, nextDueDate: false })); }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Frequency */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[110px]">Frequency</Label>
              <Select
                value={getValue('frequency')}
                onValueChange={(value) => handleChange('frequency', value)}
                disabled={disabled}
              >
                <SelectTrigger className="h-7 text-sm flex-1 bg-background">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Separator */}
            <div className="border-b border-border my-2" />

            {/* Tax Tracking */}
            <div className="flex items-center gap-3">
              <Checkbox
                checked={taxTrackingEnabled}
                onCheckedChange={(checked) => handleChange('taxTracking', checked === true ? 'true' : 'false')}
                disabled={disabled}
              />
              <Label className="text-sm text-foreground whitespace-nowrap">Tax Tracking</Label>
            </div>

            {/* Conditional fields when Tax Tracking is enabled */}
            {taxTrackingEnabled && (
              <>
                {/* Last Verified */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm text-foreground whitespace-nowrap min-w-[110px]">Last Verified</Label>
                  <Input
                    type="date"
                    value={getValue('lastVerified')}
                    onChange={(e) => handleChange('lastVerified', e.target.value)}
                    disabled={disabled}
                    className="h-7 text-sm flex-1"
                  />
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <Label className="text-sm text-foreground whitespace-nowrap min-w-[110px]">Status</Label>
                  <Select
                    value={getValue('trackingStatus')}
                    onValueChange={(value) => handleChange('trackingStatus', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-7 text-sm flex-1 bg-background">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {TRACKING_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PropertyTaxForm;
