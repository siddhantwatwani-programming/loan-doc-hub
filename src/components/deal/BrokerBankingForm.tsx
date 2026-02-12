import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

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
  disabled = false, values = {}, onValueChange,
}) => {
  const getValue = (key: keyof typeof FIELD_KEYS): string => values[FIELD_KEYS[key]] || '';
  const getBoolValue = (key: keyof typeof FIELD_KEYS): boolean => values[FIELD_KEYS[key]] === 'true';
  const handleChange = (key: keyof typeof FIELD_KEYS, value: string | boolean) => {
    if (onValueChange) onValueChange(FIELD_KEYS[key], String(value));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="form-section-header">ACH / Banking</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">ACH Status</Label>
          <Input value={getValue('achStatus')} onChange={(e) => handleChange('achStatus', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter ACH status" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Bank</Label>
          <Input value={getValue('bank')} onChange={(e) => handleChange('bank', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter bank name" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Routing #</Label>
          <Input value={getValue('routingNumber')} onChange={(e) => handleChange('routingNumber', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter routing number" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Account #</Label>
          <Input value={getValue('accountNumber')} onChange={(e) => handleChange('accountNumber', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter account number" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Type</Label>
          <Input value={getValue('accountType')} onChange={(e) => handleChange('accountType', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter type" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Name</Label>
          <Input value={getValue('accountName')} onChange={(e) => handleChange('accountName', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter name" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">ID</Label>
          <Input value={getValue('accountId')} onChange={(e) => handleChange('accountId', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter ID" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Further Credit</Label>
          <Input value={getValue('furtherCreditTo')} onChange={(e) => handleChange('furtherCreditTo', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter further credit info" />
        </div>
      </div>

      <div className="form-section-header">Check / Mailing</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label"></Label>
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-1.5">
              <Checkbox id="byCheck" checked={getBoolValue('byCheck')} onCheckedChange={(checked) => handleChange('byCheck', !!checked)} disabled={disabled} />
              <Label htmlFor="byCheck" className="text-sm font-normal">By Check</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox id="checkSameAsMailing" checked={getBoolValue('checkSameAsMailing')} onCheckedChange={(checked) => handleChange('checkSameAsMailing', !!checked)} disabled={disabled} />
              <Label htmlFor="checkSameAsMailing" className="text-sm font-normal">Same as Mailing</Label>
            </div>
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Address</Label>
          <Input value={getValue('checkAddress')} onChange={(e) => handleChange('checkAddress', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter mailing address" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">City</Label>
          <Input value={getValue('checkCity')} onChange={(e) => handleChange('checkCity', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter city" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Zip Code</Label>
          <Input value={getValue('checkZip')} onChange={(e) => handleChange('checkZip', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter ZIP" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">ACH Email</Label>
          <Input type="email" value={getValue('achEmail')} onChange={(e) => handleChange('achEmail', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter ACH email" />
        </div>
      </div>

      <div className="form-section-header">Credit Card</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Name</Label>
          <Input value={getValue('ccName')} onChange={(e) => handleChange('ccName', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter cardholder" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Card Number</Label>
          <Input value={getValue('ccNumber')} onChange={(e) => handleChange('ccNumber', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter card number" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Security Code</Label>
          <Input value={getValue('ccSecurityCode')} onChange={(e) => handleChange('ccSecurityCode', e.target.value)} disabled={disabled} className="h-7 text-sm" type="password" placeholder="CVV" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Expiration</Label>
          <Input value={getValue('ccExpiration')} onChange={(e) => handleChange('ccExpiration', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="MM/YY" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Zip Code</Label>
          <Input value={getValue('ccZip')} onChange={(e) => handleChange('ccZip', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Billing ZIP" />
        </div>
      </div>
    </div>
  );
};

export default BrokerBankingForm;
