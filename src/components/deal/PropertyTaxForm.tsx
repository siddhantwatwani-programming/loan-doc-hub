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
  'Once Only', 'Monthly', 'Quarterly', 'Bi-Monthly', 'Bi-Weekly',
  'Weekly', 'Semi-Monthly', 'Semi-Yearly', 'Yearly'
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
  fields, values, onValueChange, showValidation = false, disabled = false,
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
        <span className="font-semibold text-base text-foreground">Property Tax</span>
      </div>

      <div className="form-section-header">Payee</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Payee Name</Label>
          <Input value={getFieldValue(FIELD_KEYS.payeeName)} onChange={(e) => onValueChange(FIELD_KEYS.payeeName, e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="SDTAXCOLL" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Ref</Label>
          <div className="flex-1">
            <Input value={getFieldValue(FIELD_KEYS.ref) || apnValue} onChange={(e) => onValueChange(FIELD_KEYS.ref, e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="APN: 578-012-76-09" />
            <p className="text-xs text-muted-foreground mt-0.5">Auto-populated from APN</p>
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Memo</Label>
          <Input value={getFieldValue(FIELD_KEYS.memo)} onChange={(e) => onValueChange(FIELD_KEYS.memo, e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter memo" />
        </div>
        <div className="inline-field col-span-full md:col-span-2">
          <Label className="inline-label">Payee Address</Label>
          <Textarea value={getFieldValue(FIELD_KEYS.payeeAddress)} onChange={(e) => onValueChange(FIELD_KEYS.payeeAddress, e.target.value)} disabled={disabled} className="min-h-[60px] text-sm" placeholder="Dan McAllister&#10;P.O. Box 129009&#10;San Diego CA 92112" />
        </div>
      </div>

      <div className="form-section-header">Payment Details</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Due / Frequency</Label>
          <Input value={getFieldValue(FIELD_KEYS.nextDueDateFrequency)} onChange={(e) => onValueChange(FIELD_KEYS.nextDueDateFrequency, e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="e.g., 2024-12-31 / Yearly" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Amount</Label>
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input value={getFieldValue(FIELD_KEYS.amount)} onChange={(e) => onValueChange(FIELD_KEYS.amount, e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.00" />
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Tax Year</Label>
          <Input value={getFieldValue(FIELD_KEYS.taxYear)} onChange={(e) => onValueChange(FIELD_KEYS.taxYear, e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="2024" />
        </div>
        <div className="inline-field">
          <Label className="inline-label"></Label>
          <div className="flex items-center gap-1.5 flex-1">
            <Checkbox id="tax-hold" checked={getFieldValue(FIELD_KEYS.hold) === 'true'} onCheckedChange={(checked) => onValueChange(FIELD_KEYS.hold, checked ? 'true' : 'false')} disabled={disabled} className="h-4 w-4" />
            <Label htmlFor="tax-hold" className="text-sm">Hold</Label>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Property tax information is used to track tax obligations and payment schedules.</p>
      </div>
    </div>
  );
};

export default PropertyTaxForm;
