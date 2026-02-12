import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface CoBorrowerBankingFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const ACCOUNT_TYPE_OPTIONS = ['Checking', 'Savings', 'Money Market', 'Other'];

export const CoBorrowerBankingForm: React.FC<CoBorrowerBankingFormProps> = ({
  values, onValueChange, disabled = false,
}) => {
  const getValue = (key: string) => values[`coborrower.${key}`] || '';
  const handleChange = (key: string, value: string) => onValueChange(`coborrower.${key}`, value);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-base text-foreground">Banking Information</h3>
        <p className="text-xs text-muted-foreground">Co-borrower bank account and payment details.</p>
      </div>

      <div className="form-section-header">Primary Bank Account</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Bank Name</Label>
          <Input value={getValue('bank.name')} onChange={(e) => handleChange('bank.name', e.target.value)} placeholder="Enter bank name" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Account Type</Label>
          <Select value={getValue('bank.account_type')} onValueChange={(value) => handleChange('bank.account_type', value)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{ACCOUNT_TYPE_OPTIONS.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Routing #</Label>
          <Input value={getValue('bank.routing_number')} onChange={(e) => handleChange('bank.routing_number', e.target.value)} placeholder="Enter routing number" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Account #</Label>
          <Input value={getValue('bank.account_number')} onChange={(e) => handleChange('bank.account_number', e.target.value)} placeholder="Enter account number" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Holder Name</Label>
          <Input value={getValue('bank.account_holder')} onChange={(e) => handleChange('bank.account_holder', e.target.value)} placeholder="Enter holder name" disabled={disabled} className="h-7 text-sm" />
        </div>
      </div>

      <div className="form-section-header">Bank Address</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Street</Label>
          <Input value={getValue('bank.address.street')} onChange={(e) => handleChange('bank.address.street', e.target.value)} placeholder="Enter street" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">City</Label>
          <Input value={getValue('bank.address.city')} onChange={(e) => handleChange('bank.address.city', e.target.value)} placeholder="Enter city" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">State</Label>
          <Input value={getValue('bank.address.state')} onChange={(e) => handleChange('bank.address.state', e.target.value)} placeholder="Enter state" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Zip Code</Label>
          <Input value={getValue('bank.address.zip')} onChange={(e) => handleChange('bank.address.zip', e.target.value)} placeholder="Enter zip" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Bank Phone</Label>
          <Input value={getValue('bank.phone')} onChange={(e) => handleChange('bank.phone', e.target.value)} placeholder="Enter phone" disabled={disabled} className="h-7 text-sm" />
        </div>
      </div>
    </div>
  );
};

export default CoBorrowerBankingForm;
