import React from 'react';
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
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface PropertyTaxFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const FIELD_KEYS = {
  payee: 'property1.tax.payee',
  payeeAddress: 'property1.tax.payee_address',
  nextDueDate: 'property1.tax.next_due_date',
  frequency: 'property1.tax.frequency',
  hold: 'property1.tax.hold',
  ref: 'property1.tax.ref',
  memo: 'property1.tax.memo',
} as const;

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

  // Auto-populate Ref from APN (Legal Description tab)
  const apnValue = values['property1.apn'] || '';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="border-b border-border pb-2 mb-4">
        <span className="font-semibold text-base text-foreground">Property Tax</span>
      </div>

      <div className="max-w-[800px]">
        {/* Row 1: Payee + Next Due Date */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className="space-y-3">
            {/* Payee */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px]">Payee</Label>
              <Input
                value={getValue('payee')}
                onChange={(e) => handleChange('payee', e.target.value)}
                disabled={disabled}
                className="h-7 text-sm flex-1"
              />
            </div>

            {/* Payee Address (multiline) */}
            <div className="flex items-start gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px] mt-1.5">Address</Label>
              <Textarea
                value={getValue('payeeAddress')}
                onChange={(e) => handleChange('payeeAddress', e.target.value)}
                disabled={disabled}
                className="text-sm min-h-[70px] resize-none flex-1"
              />
            </div>
          </div>

          <div className="space-y-3">
            {/* Next Due Date */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[110px]">Next Due Date</Label>
              <Input
                type="date"
                value={getValue('nextDueDate')}
                onChange={(e) => handleChange('nextDueDate', e.target.value)}
                disabled={disabled}
                className="h-7 text-sm flex-1"
              />
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

            {/* Hold */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[110px]">Hold</Label>
              <Checkbox
                checked={getValue('hold') === 'true'}
                onCheckedChange={(checked) => handleChange('hold', checked === true ? 'true' : 'false')}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Ref - auto-populated from APN */}
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px]">Ref</Label>
            <Input
              value={apnValue ? `APN: ${apnValue}` : getValue('ref')}
              disabled={true}
              className="h-7 text-sm flex-1 max-w-[300px] bg-muted/50"
            />
          </div>

          {/* Memo */}
          <div className="flex items-start gap-3">
            <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px] mt-1.5">Memo</Label>
            <Textarea
              value={getValue('memo')}
              onChange={(e) => handleChange('memo', e.target.value)}
              disabled={disabled}
              className="text-sm min-h-[70px] resize-none flex-1 max-w-[500px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyTaxForm;
