import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

// Field key mapping for authorized party fields
const FIELD_KEYS = {
  // Name & Contact
  name: 'lender.authorized_party.name',
  firstName: 'lender.authorized_party.first_name',
  middleName: 'lender.authorized_party.middle_name',
  lastName: 'lender.authorized_party.last_name',
  relationship: 'lender.authorized_party.relationship',
  email: 'lender.authorized_party.email',
  ford: 'lender.authorized_party.ford',
  // Send Preferences
  sendPaymentNotification: 'lender.authorized_party.send_pref.payment_notification',
  sendLateNotice: 'lender.authorized_party.send_pref.late_notice',
  sendMaturityNotice: 'lender.authorized_party.send_pref.maturity_notice',
  // Address
  street: 'lender.authorized_party.address.street',
  city: 'lender.authorized_party.address.city',
  state: 'lender.authorized_party.address.state',
  zip: 'lender.authorized_party.address.zip',
  // Phone
  phoneHome: 'lender.authorized_party.phone.home',
  phoneWork: 'lender.authorized_party.phone.work',
  phoneCell: 'lender.authorized_party.phone.cell',
  phoneFax: 'lender.authorized_party.phone.fax',
} as const;

interface LenderAuthorizedPartyFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const LenderAuthorizedPartyForm: React.FC<LenderAuthorizedPartyFormProps> = ({
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

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Name Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Name</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Name</Label>
              <Input
                value={getValue('name')}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">First</Label>
              <Input
                value={getValue('firstName')}
                onChange={(e) => handleChange('firstName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Middle</Label>
              <Input
                value={getValue('middleName')}
                onChange={(e) => handleChange('middleName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Last</Label>
              <Input
                value={getValue('lastName')}
                onChange={(e) => handleChange('lastName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Relationship</Label>
              <Input
                value={getValue('relationship')}
                onChange={(e) => handleChange('relationship', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={getValue('email')}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">FORD</Label>
              <Input
                value={getValue('ford')}
                onChange={(e) => handleChange('ford', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Send:</h4>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Payment Notification</Label>
              <Checkbox
                checked={getBoolValue('sendPaymentNotification')}
                onCheckedChange={(checked) => handleChange('sendPaymentNotification', !!checked)}
                disabled={disabled}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Late Notice</Label>
              <Checkbox
                checked={getBoolValue('sendLateNotice')}
                onCheckedChange={(checked) => handleChange('sendLateNotice', !!checked)}
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Maturity Notice</Label>
              <Checkbox
                checked={getBoolValue('sendMaturityNotice')}
                onCheckedChange={(checked) => handleChange('sendMaturityNotice', !!checked)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Address</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Street</Label>
              <Input
                value={getValue('street')}
                onChange={(e) => handleChange('street', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={getValue('city')}
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">State</Label>
              <Input
                value={getValue('state')}
                onChange={(e) => handleChange('state', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">ZIP</Label>
              <Input
                value={getValue('zip')}
                onChange={(e) => handleChange('zip', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Phone Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Phone</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Home</Label>
              <Input
                type="tel"
                value={getValue('phoneHome')}
                onChange={(e) => handleChange('phoneHome', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Work</Label>
              <Input
                type="tel"
                value={getValue('phoneWork')}
                onChange={(e) => handleChange('phoneWork', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Cell</Label>
              <Input
                type="tel"
                value={getValue('phoneCell')}
                onChange={(e) => handleChange('phoneCell', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Fax</Label>
              <Input
                type="tel"
                value={getValue('phoneFax')}
                onChange={(e) => handleChange('phoneFax', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LenderAuthorizedPartyForm;
