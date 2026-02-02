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
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (key: string) => values[`coborrower.${key}`] || '';

  const handleChange = (key: string, value: string) => {
    onValueChange(`coborrower.${key}`, value);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-lg text-foreground">Banking Information</h3>
        <p className="text-sm text-muted-foreground">
          Co-borrower bank account and payment details.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Primary Bank Account */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Primary Bank Account</h4>
            
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={getValue('bank.name')}
                onChange={(e) => handleChange('bank.name', e.target.value)}
                placeholder="Enter bank name"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={getValue('bank.account_type')}
                onValueChange={(value) => handleChange('bank.account_type', value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number</Label>
              <Input
                id="routingNumber"
                value={getValue('bank.routing_number')}
                onChange={(e) => handleChange('bank.routing_number', e.target.value)}
                placeholder="Enter routing number"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={getValue('bank.account_number')}
                onChange={(e) => handleChange('bank.account_number', e.target.value)}
                placeholder="Enter account number"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountHolder">Account Holder Name</Label>
              <Input
                id="accountHolder"
                value={getValue('bank.account_holder')}
                onChange={(e) => handleChange('bank.account_holder', e.target.value)}
                placeholder="Enter account holder name"
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Right Column - Bank Address */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Bank Address</h4>
            
            <div className="space-y-2">
              <Label htmlFor="bankStreet">Street Address</Label>
              <Input
                id="bankStreet"
                value={getValue('bank.address.street')}
                onChange={(e) => handleChange('bank.address.street', e.target.value)}
                placeholder="Enter bank street address"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankCity">City</Label>
              <Input
                id="bankCity"
                value={getValue('bank.address.city')}
                onChange={(e) => handleChange('bank.address.city', e.target.value)}
                placeholder="Enter city"
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankState">State</Label>
                <Input
                  id="bankState"
                  value={getValue('bank.address.state')}
                  onChange={(e) => handleChange('bank.address.state', e.target.value)}
                  placeholder="Enter state"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankZip">Zip Code</Label>
                <Input
                  id="bankZip"
                  value={getValue('bank.address.zip')}
                  onChange={(e) => handleChange('bank.address.zip', e.target.value)}
                  placeholder="Enter zip code"
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankPhone">Bank Phone</Label>
              <Input
                id="bankPhone"
                value={getValue('bank.phone')}
                onChange={(e) => handleChange('bank.phone', e.target.value)}
                placeholder="Enter bank phone"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoBorrowerBankingForm;
