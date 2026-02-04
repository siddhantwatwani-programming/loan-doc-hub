import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

// Field key mapping for authorized party fields
const FIELD_KEYS = {
  // Name & Contact
  firstName: 'lender.authorized_party.first_name',
  middleName: 'lender.authorized_party.middle_name',
  lastName: 'lender.authorized_party.last_name',
  capacity: 'lender.authorized_party.capacity',
  email: 'lender.authorized_party.email',
  // Send Preferences
  sendPaymentNotification: 'lender.authorized_party.send_pref.payment_notification',
  sendLateNotice: 'lender.authorized_party.send_pref.late_notice',
  sendMaturityNotice: 'lender.authorized_party.send_pref.maturity_notice',
  sendBorrowerStatement: 'lender.authorized_party.send_pref.borrower_statement',
  // Address
  street: 'lender.authorized_party.address.street',
  city: 'lender.authorized_party.address.city',
  state: 'lender.authorized_party.address.state',
  zip: 'lender.authorized_party.address.zip',
  details: 'lender.authorized_party.address.details',
  // Phone
  phoneHome: 'lender.authorized_party.phone.home',
  phoneWork: 'lender.authorized_party.phone.work',
  phoneCell: 'lender.authorized_party.phone.cell',
  phoneFax: 'lender.authorized_party.phone.fax',
  // FORD (8 fields in 4x2 layout as per reference image)
  ford1: 'lender.authorized_party.ford.1',
  ford2: 'lender.authorized_party.ford.2',
  ford3: 'lender.authorized_party.ford.3',
  ford4: 'lender.authorized_party.ford.4',
  ford5: 'lender.authorized_party.ford.5',
  ford6: 'lender.authorized_party.ford.6',
  ford7: 'lender.authorized_party.ford.7',
  ford8: 'lender.authorized_party.ford.8',
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
              <Label className="text-sm text-muted-foreground">Capacity</Label>
              <Input
                value={getValue('capacity')}
                onChange={(e) => handleChange('capacity', e.target.value)}
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

            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Borrower Statement</Label>
              <Checkbox
                checked={getBoolValue('sendBorrowerStatement')}
                onCheckedChange={(checked) => handleChange('sendBorrowerStatement', !!checked)}
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

            <div className="grid grid-cols-2 gap-2 items-start">
              <Label className="text-sm text-muted-foreground pt-2">Details</Label>
              <Textarea
                value={getValue('details')}
                onChange={(e) => handleChange('details', e.target.value)}
                disabled={disabled}
                className="min-h-[80px]"
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

          {/* FORD Section - 4x2 layout matching reference image */}
          <div className="mt-6 space-y-2">
            <Label className="text-sm text-muted-foreground">FORD</Label>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={getValue('ford1')}
                  onChange={(e) => handleChange('ford1', e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
                <Input
                  value={getValue('ford2')}
                  onChange={(e) => handleChange('ford2', e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={getValue('ford3')}
                  onChange={(e) => handleChange('ford3', e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
                <Input
                  value={getValue('ford4')}
                  onChange={(e) => handleChange('ford4', e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={getValue('ford5')}
                  onChange={(e) => handleChange('ford5', e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
                <Input
                  value={getValue('ford6')}
                  onChange={(e) => handleChange('ford6', e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={getValue('ford7')}
                  onChange={(e) => handleChange('ford7', e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
                <Input
                  value={getValue('ford8')}
                  onChange={(e) => handleChange('ford8', e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LenderAuthorizedPartyForm;
