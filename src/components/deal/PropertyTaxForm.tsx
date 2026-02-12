import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Home } from 'lucide-react';
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

const FREQUENCY_OPTIONS = [
  'Once Only',
  'Monthly',
  'Quarterly',
  'Bi-Monthly',
  'Bi-Weekly',
  'Weekly',
  'Semi-Monthly',
  'Semi-Yearly',
  'Yearly'
];

// Field key mapping as specified
const FIELD_KEYS = {
  payeeName: 'property1.payee_name',
  payeeAddress: 'property1.payee_address',
  ref: 'property1.payee_ref',
  memo: 'property1.payee_memo',
  nextDueDateFrequency: 'property1.payee_next_due_datefrequency',
  hold: 'property1.payee_hold',
  amount: 'property1.payee_amount',
  taxYear: 'property1.payee_tax_year',
} as const;

export const PropertyTaxForm: React.FC<PropertyTaxFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getFieldValue = (key: string) => values[key] || '';

  // Auto-populate Ref from APN (Legal Description page)
  const apnValue = values['property1.apn'] || '';
  
  useEffect(() => {
    // Auto-populate the Ref field from APN if APN exists and Ref is empty
    if (apnValue && !getFieldValue(FIELD_KEYS.ref)) {
      onValueChange(FIELD_KEYS.ref, apnValue);
    }
  }, [apnValue]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">Property Tax</span>
      </div>

      <div className="grid grid-cols-2 gap-8 max-w-4xl">
        {/* Left Column - Payee Section */}
        <div className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">Payee</span>
          </div>

          <div>
            <Label className="text-sm text-foreground">Payee Name</Label>
            <Input
              value={getFieldValue(FIELD_KEYS.payeeName)}
              onChange={(e) => onValueChange(FIELD_KEYS.payeeName, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="SDTAXCOLL"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Payee Address</Label>
            <Textarea
              value={getFieldValue(FIELD_KEYS.payeeAddress)}
              onChange={(e) => onValueChange(FIELD_KEYS.payeeAddress, e.target.value)}
              disabled={disabled}
              className="mt-1 min-h-[80px] text-sm"
              placeholder="Dan McAllister&#10;P.O. Box 129009&#10;San Diego CA 92112"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Ref</Label>
            <Input
              value={getFieldValue(FIELD_KEYS.ref) || apnValue}
              onChange={(e) => onValueChange(FIELD_KEYS.ref, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="APN: 578-012-76-09"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Auto-populated from APN on Legal Description page
            </p>
          </div>

          <div>
            <Label className="text-sm text-foreground">Memo</Label>
            <Input
              value={getFieldValue(FIELD_KEYS.memo)}
              onChange={(e) => onValueChange(FIELD_KEYS.memo, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="Enter memo"
            />
          </div>
        </div>

        {/* Right Column - Payment Details */}
        <div className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">Payment Details</span>
          </div>

          <div>
            <Label className="text-sm text-foreground">Next Due Date / Frequency</Label>
            <Input
              value={getFieldValue(FIELD_KEYS.nextDueDateFrequency)}
              onChange={(e) => onValueChange(FIELD_KEYS.nextDueDateFrequency, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="e.g., 2024-12-31 / Yearly"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="tax-hold"
              checked={getFieldValue(FIELD_KEYS.hold) === 'true'}
              onCheckedChange={(checked) => onValueChange(FIELD_KEYS.hold, checked ? 'true' : 'false')}
              disabled={disabled}
              className="h-4 w-4"
            />
            <Label htmlFor="tax-hold" className="text-sm text-foreground">
              Hold
            </Label>
          </div>

          <div>
            <Label className="text-sm text-foreground">Amount</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                value={getFieldValue(FIELD_KEYS.amount)}
                onChange={(e) => onValueChange(FIELD_KEYS.amount, e.target.value)}
                disabled={disabled}
                className="h-8 text-sm text-right"
                inputMode="decimal"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm text-foreground">Tax Year</Label>
            <Input
              value={getFieldValue(FIELD_KEYS.taxYear)}
              onChange={(e) => onValueChange(FIELD_KEYS.taxYear, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="2024"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Property tax information is used to track tax obligations and payment schedules for the property.
        </p>
      </div>
    </div>
  );
};

export default PropertyTaxForm;
