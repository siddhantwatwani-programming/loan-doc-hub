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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Tax Payer Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Tax Payer Info</h3>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Social Security Number</Label>
            <Input
              value={getValue('ssn')}
              onChange={(e) => handleChange('ssn', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">EIN</Label>
            <Input
              value={getValue('ein')}
              onChange={(e) => handleChange('ein', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Name</Label>
            <Input
              value={getValue('name')}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Recipient Name</Label>
            <Input
              value={getValue('recipient_name')}
              onChange={(e) => handleChange('recipient_name', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Street Address</Label>
            <Input
              value={getValue('street_address')}
              onChange={(e) => handleChange('street_address', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Address 2</Label>
            <Input
              value={getValue('address_2')}
              onChange={(e) => handleChange('address_2', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">City</Label>
            <Input
              value={getValue('city')}
              onChange={(e) => handleChange('city', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">State</Label>
            <Select
              value={getValue('state')}
              onValueChange={(value) => handleChange('state', value)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select state" />
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

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Zip Code</Label>
            <Input
              value={getValue('zip_code')}
              onChange={(e) => handleChange('zip_code', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>
        </div>

        {/* Column 2: Account & Contact */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Account & Contact</h3>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Account Number</Label>
            <Input
              value={getValue('account_number')}
              onChange={(e) => handleChange('account_number', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Recipient Type</Label>
            <Select
              value={getValue('recipient_type')}
              onValueChange={(value) => handleChange('recipient_type', value)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select type" />
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

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Phone</Label>
            <Input
              type="tel"
              value={getValue('phone')}
              onChange={(e) => handleChange('phone', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Fax</Label>
            <Input
              type="tel"
              value={getValue('fax')}
              onChange={(e) => handleChange('fax', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Email</Label>
            <Input
              type="email"
              value={getValue('email')}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Contact Name</Label>
            <Input
              value={getValue('contact_name')}
              onChange={(e) => handleChange('contact_name', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          <div className="flex items-center gap-2 mt-4">
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
        </div>

        {/* Column 3: Notes */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Notes</h3>

          <Textarea
            value={getValue('notes')}
            onChange={(e) => handleChange('notes', e.target.value)}
            disabled={disabled}
            className="min-h-[200px] resize-none"
            placeholder="Enter notes..."
          />
        </div>
      </div>
    </div>
  );
};

export default LenderTaxInfoForm;
