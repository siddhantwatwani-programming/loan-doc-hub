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
  const apnValue = values['property1.apn'] || '';
  
  useEffect(() => {
    if (apnValue && !getFieldValue(FIELD_KEYS.ref)) {
      onValueChange(FIELD_KEYS.ref, apnValue);
    }
  }, [apnValue]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">Property Tax</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Payee Section */}
        <div className="space-y-3">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">Payee</span>
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Payee Name</Label>
            <Input value={getFieldValue(FIELD_KEYS.payeeName)} onChange={(e) => onValueChange(FIELD_KEYS.payeeName, e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="SDTAXCOLL" />
          </div>

          <div className="flex items-start gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0 pt-2">Payee Address</Label>
            <Textarea value={getFieldValue(FIELD_KEYS.payeeAddress)} onChange={(e) => onValueChange(FIELD_KEYS.payeeAddress, e.target.value)} disabled={disabled} className="min-h-[60px] text-sm" placeholder="Enter address" />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Ref</Label>
            <Input value={getFieldValue(FIELD_KEYS.ref) || apnValue} onChange={(e) => onValueChange(FIELD_KEYS.ref, e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="APN" />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Memo</Label>
            <Input value={getFieldValue(FIELD_KEYS.memo)} onChange={(e) => onValueChange(FIELD_KEYS.memo, e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter memo" />
          </div>
        </div>

        {/* Right Column - Payment Details */}
        <div className="space-y-3">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">Payment Details</span>
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Due / Frequency</Label>
            <Input value={getFieldValue(FIELD_KEYS.nextDueDateFrequency)} onChange={(e) => onValueChange(FIELD_KEYS.nextDueDateFrequency, e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="e.g., 2024-12-31 / Yearly" />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="tax-hold" checked={getFieldValue(FIELD_KEYS.hold) === 'true'} onCheckedChange={(checked) => onValueChange(FIELD_KEYS.hold, checked ? 'true' : 'false')} disabled={disabled} className="h-4 w-4" />
            <Label htmlFor="tax-hold" className="text-sm text-foreground">Hold</Label>
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Amount</Label>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input value={getFieldValue(FIELD_KEYS.amount)} onChange={(e) => onValueChange(FIELD_KEYS.amount, e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.00" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Tax Year</Label>
            <Input value={getFieldValue(FIELD_KEYS.taxYear)} onChange={(e) => onValueChange(FIELD_KEYS.taxYear, e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="2024" />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Property tax information is used to track tax obligations and payment schedules for the property.
        </p>
      </div>
    </div>
  );
};

export default PropertyTaxForm;
