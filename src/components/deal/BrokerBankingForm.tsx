import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

// Field key mapping for broker banking fields
const FIELD_KEYS = {
  achStatus: 'broker.banking.ach_status',
  bank: 'broker.banking.bank',
  routingNumber: 'broker.banking.routing_number',
  accountNumber: 'broker.banking.account_number',
  accountType: 'broker.banking.account_type',
  accountName: 'broker.banking.account_name',
  accountId: 'broker.banking.account_id',
  furtherCreditTo: 'broker.banking.further_credit_to',
  byCheck: 'broker.banking.by_check',
  checkSameAsMailing: 'broker.banking.check_same_as_mailing',
  checkAddress: 'broker.banking.check_address',
  checkCity: 'broker.banking.check_city',
  checkZip: 'broker.banking.check_zip',
  achEmail: 'broker.banking.ach_email',
  ccName: 'broker.banking.cc_name',
  ccNumber: 'broker.banking.cc_number',
  ccSecurityCode: 'broker.banking.cc_security_code',
  ccExpiration: 'broker.banking.cc_expiration',
  ccZip: 'broker.banking.cc_zip',
} as const;

interface BrokerBankingFormProps {
  disabled?: boolean;
  values?: Record<string, string>;
  onValueChange?: (fieldKey: string, value: string) => void;
}

export const BrokerBankingForm: React.FC<BrokerBankingFormProps> = ({ 
  disabled = false,
  values = {},
  onValueChange,
}) => {
  const getValue = (key: keyof typeof FIELD_KEYS): string => {
    return values[FIELD_KEYS[key]] || '';
  };

  const getBoolValue = (key: keyof typeof FIELD_KEYS): boolean => {
    return values[FIELD_KEYS[key]] === 'true';
  };

  const handleChange = (key: keyof typeof FIELD_KEYS, value: string | boolean) => {
    if (onValueChange) {
      onValueChange(FIELD_KEYS[key], String(value));
    }
  };

  return (
    <div className="space-y-6">
      {/* Three column layout matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 - ACH Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">ACH / Banking</h3>
          
          <div className="space-y-2">
            <Label htmlFor="achStatus" className="text-sm">ACH Status</Label>
            <Input
              id="achStatus"
              value={getValue('achStatus')}
              onChange={(e) => handleChange('achStatus', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter ACH status"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank" className="text-sm">Bank</Label>
            <Input
              id="bank"
              value={getValue('bank')}
              onChange={(e) => handleChange('bank', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter bank name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routingNumber" className="text-sm">Routing Number</Label>
            <Input
              id="routingNumber"
              value={getValue('routingNumber')}
              onChange={(e) => handleChange('routingNumber', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter routing number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber" className="text-sm">Account Number</Label>
            <Input
              id="accountNumber"
              value={getValue('accountNumber')}
              onChange={(e) => handleChange('accountNumber', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter account number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountType" className="text-sm">Type</Label>
            <Input
              id="accountType"
              value={getValue('accountType')}
              onChange={(e) => handleChange('accountType', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter account type"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName" className="text-sm">Name</Label>
            <Input
              id="accountName"
              value={getValue('accountName')}
              onChange={(e) => handleChange('accountName', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter account name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountId" className="text-sm">ID</Label>
            <Input
              id="accountId"
              value={getValue('accountId')}
              onChange={(e) => handleChange('accountId', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="furtherCreditTo" className="text-sm">Further Credit To</Label>
            <Input
              id="furtherCreditTo"
              value={getValue('furtherCreditTo')}
              onChange={(e) => handleChange('furtherCreditTo', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter further credit info"
            />
          </div>
        </div>

        {/* Column 2 - Check/Mailing Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Check / Mailing</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="byCheck"
              checked={getBoolValue('byCheck')}
              onCheckedChange={(checked) => handleChange('byCheck', !!checked)}
              disabled={disabled}
            />
            <Label htmlFor="byCheck" className="text-sm font-normal cursor-pointer">
              By Check
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="checkSameAsMailing"
              checked={getBoolValue('checkSameAsMailing')}
              onCheckedChange={(checked) => handleChange('checkSameAsMailing', !!checked)}
              disabled={disabled}
            />
            <Label htmlFor="checkSameAsMailing" className="text-sm font-normal cursor-pointer">
              Same as Mailing
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkAddress" className="text-sm">Address</Label>
            <Input
              id="checkAddress"
              value={getValue('checkAddress')}
              onChange={(e) => handleChange('checkAddress', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter mailing address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkCity" className="text-sm">City</Label>
            <Input
              id="checkCity"
              value={getValue('checkCity')}
              onChange={(e) => handleChange('checkCity', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter city"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="checkZip" className="text-sm">Zip Code</Label>
            <Input
              id="checkZip"
              value={getValue('checkZip')}
              onChange={(e) => handleChange('checkZip', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter ZIP code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="achEmail" className="text-sm">Add ACH Email</Label>
            <Input
              id="achEmail"
              type="email"
              value={getValue('achEmail')}
              onChange={(e) => handleChange('achEmail', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter ACH email"
            />
          </div>
        </div>

        {/* Column 3 - Credit Card Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Credit Card</h3>
          
          <div className="space-y-2">
            <Label htmlFor="ccName" className="text-sm">Name</Label>
            <Input
              id="ccName"
              value={getValue('ccName')}
              onChange={(e) => handleChange('ccName', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter cardholder name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ccNumber" className="text-sm">Card Number</Label>
            <Input
              id="ccNumber"
              value={getValue('ccNumber')}
              onChange={(e) => handleChange('ccNumber', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter card number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ccSecurityCode" className="text-sm">Security Code</Label>
            <Input
              id="ccSecurityCode"
              value={getValue('ccSecurityCode')}
              onChange={(e) => handleChange('ccSecurityCode', e.target.value)}
              disabled={disabled}
              className="h-9"
              type="password"
              placeholder="Enter CVV"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ccExpiration" className="text-sm">Expiration</Label>
            <Input
              id="ccExpiration"
              value={getValue('ccExpiration')}
              onChange={(e) => handleChange('ccExpiration', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="MM/YY"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ccZip" className="text-sm">Zip Code</Label>
            <Input
              id="ccZip"
              value={getValue('ccZip')}
              onChange={(e) => handleChange('ccZip', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter billing ZIP"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerBankingForm;
