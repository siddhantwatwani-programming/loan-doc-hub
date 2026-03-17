import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MaskedInput } from '@/components/ui/masked-input';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';

import { BROKER_BANKING_KEYS } from '@/lib/fieldKeyMap';

// Use central field key map
const FIELD_KEYS = BROKER_BANKING_KEYS;

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

  const renderField = (key: keyof typeof FIELD_KEYS, label: string, props: Record<string, any> = {}) => (
    <DirtyFieldWrapper fieldKey={FIELD_KEYS[key]}>
      <div className="flex items-center gap-2">
        <Label className="text-sm text-muted-foreground min-w-[120px] max-w-[120px] text-left shrink-0">{label}</Label>
        <Input value={getValue(key)} onChange={(e) => handleChange(key, e.target.value)} disabled={disabled} className="h-8 text-sm w-[160px] 3xl:w-[200px]" {...props} />
      </div>
    </DirtyFieldWrapper>
  );

  return (
    <div className="space-y-4 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1 - ACH Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Bank / ACH</h3>
          {renderField('achStatus', 'ACH Status', { placeholder: 'Enter ACH status' })}
          {renderField('bank', 'Bank', { placeholder: 'Enter bank name' })}
          {renderField('routingNumber', 'Routing Number', { placeholder: 'Enter routing' })}
          {renderField('accountNumber', 'Account Number', { placeholder: 'Enter account' })}
          {renderField('accountType', 'Type', { placeholder: 'Enter type' })}
          {renderField('accountName', 'Name', { placeholder: 'Enter name' })}
          {renderField('accountId', 'ID', { placeholder: 'Enter ID' })}
          {renderField('furtherCreditTo', 'Further Credit To', { placeholder: 'Enter info' })}
        </div>

        {/* Column 2 - Check/Mailing Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Check / Mailing</h3>
          
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.byCheck}>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[120px] max-w-[120px] text-left shrink-0">By Check</Label>
              <div className="w-[160px] 3xl:w-[200px] flex items-center">
                <Checkbox id="byCheck" checked={getBoolValue('byCheck')} onCheckedChange={(checked) => handleChange('byCheck', !!checked)} disabled={disabled} />
              </div>
            </div>
          </DirtyFieldWrapper>

          <DirtyFieldWrapper fieldKey={FIELD_KEYS.checkSameAsMailing}>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[120px] max-w-[120px] text-left shrink-0">Same as Mailing</Label>
              <div className="w-[160px] 3xl:w-[200px] flex items-center">
                <Checkbox id="checkSameAsMailing" checked={getBoolValue('checkSameAsMailing')} onCheckedChange={(checked) => handleChange('checkSameAsMailing', !!checked)} disabled={disabled} />
              </div>
            </div>
          </DirtyFieldWrapper>

          {renderField('checkAddress', 'Address', { placeholder: 'Enter address' })}
          {renderField('checkCity', 'City', { placeholder: 'Enter city' })}
          {renderField('checkZip', 'Zip Code', { placeholder: 'Enter ZIP' })}

          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2 pt-2">ACH Notification</h3>
          {renderField('achEmail', 'ACH Email', { type: 'email', placeholder: 'Enter email' })}
        </div>

        {/* Column 3 - Credit Card Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Credit Card</h3>
          {renderField('ccName', 'Name', { placeholder: 'Enter name' })}
          {renderField('ccNumber', 'Card Number', { placeholder: 'Enter card number' })}
          {renderField('ccSecurityCode', 'Security Code', { type: 'password', placeholder: 'CVV' })}
          {renderField('ccExpiration', 'Expiration', { placeholder: 'MM/YY' })}
          {renderField('ccZip', 'Zip Code', { placeholder: 'Enter ZIP' })}
        </div>
      </div>
    </div>
  );
};

export default BrokerBankingForm;
