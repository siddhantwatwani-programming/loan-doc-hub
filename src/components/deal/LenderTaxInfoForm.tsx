import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface LenderTaxInfoFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const RECIPIENT_TYPE_OPTIONS = [
  { value: '0', label: '0 - Unknown' },
  { value: '1', label: '1 - EIN' },
  { value: '2', label: '2 - SSN' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export const LenderTaxInfoForm: React.FC<LenderTaxInfoFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (key: string): string => {
    return values[`lender.tax_payer.${key}`] || '';
  };

  const handleChange = (key: string, value: string) => {
    onValueChange(`lender.tax_payer.${key}`, value);
  };

  const handleCheckboxChange = (key: string, checked: boolean) => {
    onValueChange(`lender.tax_payer.${key}`, checked ? 'true' : 'false');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-lg font-semibold text-foreground">Tax Payer</h2>
        <span className="text-lg font-semibold text-primary underline">1099</span>
      </div>

      <div className="max-w-[700px] space-y-3">
        {/* SSN - inline label */}
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground whitespace-nowrap min-w-[220px]">TAX PAYER'S social security number</Label>
          <Input
            value={getValue('ssn')}
            onChange={(e) => handleChange('ssn', e.target.value)}
            disabled={disabled}
            className="h-8 flex-1"
          />
        </div>

        {/* Name - inline label */}
        <div className="flex items-start gap-3">
          <Label className="text-sm text-muted-foreground whitespace-nowrap min-w-[220px] mt-2">TAX PAYER'S name</Label>
          <Textarea
            value={getValue('name')}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={disabled}
            className="min-h-[60px] resize-none flex-1"
          />
        </div>

        {/* Street Address - inline label */}
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground whitespace-nowrap min-w-[220px]">Street address (including apt no.)</Label>
          <Input
            value={getValue('street_address')}
            onChange={(e) => handleChange('street_address', e.target.value)}
            disabled={disabled}
            className="h-8 flex-1"
          />
        </div>

        {/* City / State / Zip - inline labels */}
        <div className="grid grid-cols-[1fr_160px_160px] gap-3 pl-[232px]">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">City</Label>
            <Input
              value={getValue('city')}
              onChange={(e) => handleChange('city', e.target.value)}
              disabled={disabled}
              className="h-8 flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">State</Label>
            <Select
              value={getValue('state')}
              onValueChange={(value) => handleChange('state', value)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Zip</Label>
            <Input
              value={getValue('zip_code')}
              onChange={(e) => handleChange('zip_code', e.target.value)}
              disabled={disabled}
              className="h-8 flex-1"
            />
          </div>
        </div>

        {/* Account Number / Recipient Type - inline labels */}
        <div className="grid grid-cols-[1fr_1fr] gap-3">
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground whitespace-nowrap min-w-[220px]">Account number (optional)</Label>
            <Input
              value={getValue('account_number')}
              onChange={(e) => handleChange('account_number', e.target.value)}
              disabled={disabled}
              className="h-8 flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Recipient Type</Label>
            <Select
              value={getValue('recipient_type')}
              onValueChange={(value) => handleChange('recipient_type', value)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {RECIPIENT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Auto-Synchronize */}
        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="auto_synchronize"
            checked={getValue('auto_synchronize') === 'true'}
            onCheckedChange={(checked) => handleCheckboxChange('auto_synchronize', checked === true)}
            disabled={disabled}
          />
          <Label htmlFor="auto_synchronize" className="text-sm text-muted-foreground cursor-pointer">
            Auto-Synchronize
          </Label>
        </div>

        {/* Notes */}
        <div className="pt-4">
          <Label className="text-sm text-muted-foreground mb-1 block">Notes</Label>
          <Textarea
            value={getValue('notes')}
            onChange={(e) => handleChange('notes', e.target.value)}
            disabled={disabled}
            className="min-h-[100px] resize-none"
            placeholder="Enter notes..."
          />
        </div>
      </div>
    </div>
  );
};

export default LenderTaxInfoForm;
