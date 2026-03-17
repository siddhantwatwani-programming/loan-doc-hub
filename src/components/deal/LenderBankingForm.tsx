import React from 'react';
import { MaskedInput } from '@/components/ui/masked-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { DirtyFieldWrapper } from './DirtyFieldWrapper';

import { LENDER_BANKING_KEYS } from '@/lib/fieldKeyMap';

// Use central field key map
const FIELD_KEYS = LENDER_BANKING_KEYS;

interface LenderBankingFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const LenderBankingForm: React.FC<LenderBankingFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const getValue = (key: keyof typeof FIELD_KEYS): string => {
    return values[FIELD_KEYS[key]] || '';
  };

  const getBoolValue = (key: keyof typeof FIELD_KEYS): boolean => {
    return values[FIELD_KEYS[key]] === 'true';
  };

  const handleChange = (key: keyof typeof FIELD_KEYS, value: string | boolean) => {
    onValueChange(FIELD_KEYS[key], String(value));
  };

  const wrapField = (key: keyof typeof FIELD_KEYS, children: React.ReactNode) => (
    <DirtyFieldWrapper fieldKey={FIELD_KEYS[key]}>{children}</DirtyFieldWrapper>
  );

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ACH Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Bank / ACH</h3>
          
          <div className="space-y-3">
            {wrapField('achStatus', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">ACH Status</Label>
              <Input value={getValue('achStatus')} onChange={(e) => handleChange('achStatus', e.target.value)} disabled={disabled} className="h-8" />
            </div>)}
            
            {wrapField('bank', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Bank</Label>
              <Input value={getValue('bank')} onChange={(e) => handleChange('bank', e.target.value)} disabled={disabled} className="h-8" />
            </div>)}
            
            {wrapField('routingNumber', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Routing Number</Label>
              <MaskedInput value={getValue('routingNumber')} onChange={(e) => { const value = e.target.value.replace(/\D/g, ''); handleChange('routingNumber', value); }} disabled={disabled} maxLength={9} inputMode="numeric" />
            </div>)}
            
            {wrapField('accountNumber', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Account Number</Label>
              <MaskedInput value={getValue('accountNumber')} onChange={(e) => { const value = e.target.value.replace(/\D/g, ''); handleChange('accountNumber', value); }} disabled={disabled} inputMode="numeric" />
            </div>)}
            
            {wrapField('accountType', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Type</Label>
              <Select value={getValue('accountType')} onValueChange={(value) => handleChange('accountType', value)} disabled={disabled}>
                <SelectTrigger className="h-8"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal Banking">Personal Banking</SelectItem>
                  <SelectItem value="Business Banking">Business Banking</SelectItem>
                  <SelectItem value="Personal Checking">Personal Checking</SelectItem>
                  <SelectItem value="Business Checking">Business Checking</SelectItem>
                </SelectContent>
              </Select>
            </div>)}
            
            {wrapField('accountName', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Name</Label>
              <Input value={getValue('accountName')} onChange={(e) => handleChange('accountName', e.target.value)} disabled={disabled} className="h-8" />
            </div>)}
            
            {wrapField('accountId', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">ID</Label>
              <Input value={getValue('accountId')} onChange={(e) => handleChange('accountId', e.target.value)} disabled={disabled} className="h-8" />
            </div>)}
            
            {wrapField('furtherCreditTo', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Further Credit To</Label>
              <Input value={getValue('furtherCreditTo')} onChange={(e) => handleChange('furtherCreditTo', e.target.value)} disabled={disabled} className="h-8" />
            </div>)}
          </div>
        </div>

        {/* Check/Mailing Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Check / Mailing</h3>
          
          <div className="space-y-3">
            {wrapField('byCheck', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">By Check</Label>
              <Checkbox checked={getBoolValue('byCheck')} onCheckedChange={(checked) => handleChange('byCheck', !!checked)} disabled={disabled} />
            </div>)}
            
            {wrapField('checkSameAsMailing', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Same as Mailing</Label>
              <Checkbox checked={getBoolValue('checkSameAsMailing')} onCheckedChange={(checked) => handleChange('checkSameAsMailing', !!checked)} disabled={disabled} />
            </div>)}
            
            {wrapField('checkAddress', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Address</Label>
              <Input value={getValue('checkAddress')} onChange={(e) => handleChange('checkAddress', e.target.value)} disabled={disabled} className="h-8" />
            </div>)}
            
            {wrapField('checkCity', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input value={getValue('checkCity')} onChange={(e) => handleChange('checkCity', e.target.value)} disabled={disabled} className="h-8" />
            </div>)}
            
            {wrapField('checkZip', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Zip Code</Label>
              <Input value={getValue('checkZip')} onChange={(e) => handleChange('checkZip', e.target.value)} disabled={disabled} className="h-8" />
            </div>)}
          </div>

          <div className="space-y-3">
            {wrapField('achEmail', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Add ACH Email</Label>
              <Input type="email" value={getValue('achEmail')} onChange={(e) => handleChange('achEmail', e.target.value)} disabled={disabled} className="h-8" />
            </div>)}
            {wrapField('achEmail2', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Add ACH Email</Label>
              <Input type="email" value={getValue('achEmail2')} onChange={(e) => handleChange('achEmail2', e.target.value)} disabled={disabled} className="h-8" />
            </div>)}
          </div>
        </div>

        {/* Credit Card Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Credit Card</h3>
          
          <div className="space-y-3">
            {wrapField('ccName', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Name</Label>
              <Input value={getValue('ccName')} onChange={(e) => handleChange('ccName', e.target.value)} disabled={disabled} className="h-8" />
            </div>)}
            
            {wrapField('ccNumber', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Card Number</Label>
              <Input value={getValue('ccNumber')} onChange={(e) => { const value = e.target.value.replace(/\D/g, ''); handleChange('ccNumber', value); }} disabled={disabled} className="h-8" maxLength={16} />
            </div>)}
            
            {wrapField('ccSecurityCode', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Security Code</Label>
              <Input value={getValue('ccSecurityCode')} onChange={(e) => { const value = e.target.value.replace(/\D/g, ''); handleChange('ccSecurityCode', value); }} disabled={disabled} className="h-8" maxLength={4} type="password" />
            </div>)}
            
            {wrapField('ccExpiration', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Expiration</Label>
              <Input value={getValue('ccExpiration')} onChange={(e) => handleChange('ccExpiration', e.target.value)} disabled={disabled} className="h-8" placeholder="MM/YY" />
            </div>)}
            
            {wrapField('ccZip', <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Zip Code</Label>
              <Input value={getValue('ccZip')} onChange={(e) => handleChange('ccZip', e.target.value)} disabled={disabled} className="h-8" />
            </div>)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LenderBankingForm;
