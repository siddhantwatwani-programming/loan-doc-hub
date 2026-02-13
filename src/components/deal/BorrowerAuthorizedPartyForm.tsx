import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

const FIELD_KEYS = {
  // Name & Contact
  firstName: 'borrower.authorized_party.first_name',
  middleName: 'borrower.authorized_party.middle_name',
  lastName: 'borrower.authorized_party.last_name',
  capacity: 'borrower.authorized_party.capacity',
  email: 'borrower.authorized_party.email',
  // Address
  street: 'borrower.authorized_party.address.street',
  city: 'borrower.authorized_party.address.city',
  state: 'borrower.authorized_party.address.state',
  zip: 'borrower.authorized_party.address.zip',
  // Phone
  phoneHome: 'borrower.authorized_party.phone.home',
  phoneWork: 'borrower.authorized_party.phone.work',
  phoneCell: 'borrower.authorized_party.phone.cell',
  phoneFax: 'borrower.authorized_party.phone.fax',
  // Send Preferences
  sendPaymentNotification: 'borrower.authorized_party.send_pref.payment_notification',
  sendLateNotice: 'borrower.authorized_party.send_pref.late_notice',
  sendBorrowerStatement: 'borrower.authorized_party.send_pref.borrower_statement',
  sendMaturityNotice: 'borrower.authorized_party.send_pref.maturity_notice',
  // Delivery
  deliveryOnline: 'borrower.authorized_party.delivery.online',
  deliveryMail: 'borrower.authorized_party.delivery.mail',
  // Details
  details: 'borrower.authorized_party.details',
} as const;

interface BorrowerAuthorizedPartyFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const BorrowerAuthorizedPartyForm: React.FC<BorrowerAuthorizedPartyFormProps> = ({
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

  const renderInlineField = (key: keyof typeof FIELD_KEYS, label: string, type?: string) => (
    <div key={key} className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={getValue(key)}
        onChange={(e) => handleChange(key, e.target.value)}
        disabled={disabled}
        className="h-7 text-xs flex-1"
      />
    </div>
  );

  return (
    <div className="p-4">
      {/* Row 1: Name, Address, Phone - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-0">
        {/* Column 1: Name */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Name</h3>
          {renderInlineField('firstName', 'First')}
          {renderInlineField('middleName', 'Middle')}
          {renderInlineField('lastName', 'Last')}
          {renderInlineField('capacity', 'Capacity')}
          {renderInlineField('email', 'Email', 'email')}
        </div>

        {/* Column 2: Address */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Address</h3>
          {renderInlineField('street', 'Street')}
          {renderInlineField('city', 'City')}
          {renderInlineField('state', 'State')}
          {renderInlineField('zip', 'ZIP')}
        </div>

        {/* Column 3: Phone */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Phone</h3>
          {renderInlineField('phoneHome', 'Home', 'tel')}
          {renderInlineField('phoneWork', 'Work', 'tel')}
          {renderInlineField('phoneCell', 'Cell', 'tel')}
          {renderInlineField('phoneFax', 'Fax', 'tel')}
        </div>
      </div>

      {/* Row 2: Send, Delivery, Details - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-0 mt-6">
        {/* Column 1: Send */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Send:</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground flex-1">Payment Notification</Label>
              <Checkbox
                checked={getBoolValue('sendPaymentNotification')}
                onCheckedChange={(checked) => handleChange('sendPaymentNotification', !!checked)}
                disabled={disabled}
                className="h-3.5 w-3.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground flex-1">Borrower Statement</Label>
              <Checkbox
                checked={getBoolValue('sendBorrowerStatement')}
                onCheckedChange={(checked) => handleChange('sendBorrowerStatement', !!checked)}
                disabled={disabled}
                className="h-3.5 w-3.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground flex-1">Late Notice</Label>
              <Checkbox
                checked={getBoolValue('sendLateNotice')}
                onCheckedChange={(checked) => handleChange('sendLateNotice', !!checked)}
                disabled={disabled}
                className="h-3.5 w-3.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground flex-1">Maturity Notice</Label>
              <Checkbox
                checked={getBoolValue('sendMaturityNotice')}
                onCheckedChange={(checked) => handleChange('sendMaturityNotice', !!checked)}
                disabled={disabled}
                className="h-3.5 w-3.5"
              />
            </div>
          </div>
        </div>

        {/* Column 2: Delivery */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Delivery</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground flex-1">Online</Label>
              <Checkbox
                checked={getBoolValue('deliveryOnline')}
                onCheckedChange={(checked) => handleChange('deliveryOnline', !!checked)}
                disabled={disabled}
                className="h-3.5 w-3.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground flex-1">Mail</Label>
              <Checkbox
                checked={getBoolValue('deliveryMail')}
                onCheckedChange={(checked) => handleChange('deliveryMail', !!checked)}
                disabled={disabled}
                className="h-3.5 w-3.5"
              />
            </div>
          </div>
        </div>

        {/* Column 3: Details */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Details</h3>
          <Textarea
            value={getValue('details')}
            onChange={(e) => handleChange('details', e.target.value)}
            disabled={disabled}
            className="min-h-[80px] text-xs"
          />
        </div>
      </div>
    </div>
  );
};

export default BorrowerAuthorizedPartyForm;
