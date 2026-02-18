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
  type: 'property1.tax.type',
  authority: 'property1.tax.authority',
  taxTracking: 'property1.tax.tax_tracking',
  lastVerified: 'property1.tax.last_verified',
  trackingStatus: 'property1.tax.tracking_status',
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
            {/* Property (formerly Payee) */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px]">Property</Label>
              <Input
                value={getValue('payee')}
                onChange={(e) => handleChange('payee', e.target.value)}
                disabled={disabled}
                className="h-7 text-sm flex-1"
              />
            </div>

            {/* Authority */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px]">Authority</Label>
              <Input
                value={getValue('authority')}
                onChange={(e) => handleChange('authority', e.target.value)}
                disabled={disabled}
                className="h-7 text-sm flex-1"
              />
            </div>

            {/* Address (multiline) */}
            <div className="flex items-start gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px] mt-1.5">Address</Label>
              <Textarea
                value={getValue('payeeAddress')}
                onChange={(e) => handleChange('payeeAddress', e.target.value)}
                disabled={disabled}
                className="text-sm min-h-[70px] resize-none flex-1"
              />
            </div>

            {/* Type */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px]">Type</Label>
              <Select
                value={getValue('type')}
                onValueChange={(value) => handleChange('type', value)}
                disabled={disabled}
              >
                <SelectTrigger className="h-7 text-sm flex-1 bg-background">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* APN */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px]">APN</Label>
              <Input
                value={apnValue}
                disabled={true}
                className="h-7 text-sm flex-1 bg-muted/50"
              />
            </div>

            {/* Memo */}
            <div className="flex items-start gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[100px] mt-1.5">Memo</Label>
              <Textarea
                value={getValue('memo')}
                onChange={(e) => handleChange('memo', e.target.value)}
                disabled={disabled}
                className="text-sm min-h-[70px] resize-none flex-1"
              />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-3">
            {/* Next Due Date */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[110px]">Next Due</Label>
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

      {/* Info text */}
      <p className="mt-6 text-sm text-muted-foreground">
        Note: Tax Tracking is populated if Checked in Servicing.
      </p>
    </div>
  );
};

export default PropertyTaxForm;
