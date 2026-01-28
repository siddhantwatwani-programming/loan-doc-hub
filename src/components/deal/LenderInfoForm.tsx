import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

// Field key mapping for lender info fields
const FIELD_KEYS = {
  // Lender Details
  type: 'lender.type',
  id: 'lender.id',
  fullName: 'lender.full_name',
  firstName: 'lender.first_name',
  middleName: 'lender.middle_name',
  lastName: 'lender.last_name',
  capacity: 'lender.capacity',
  email: 'lender.email',
  taxIdType: 'lender.tax_id_type',
  taxId: 'lender.tax_id',
  issue1099: 'lender.issue_1099',
  prepareCa881: 'lender.prepare_ca_881',
  // Primary Address
  primaryStreet: 'lender.primary_address.street',
  primaryCity: 'lender.primary_address.city',
  primaryState: 'lender.primary_address.state',
  primaryZip: 'lender.primary_address.zip',
  // Phone
  phoneHome: 'lender.phone.home',
  phoneWork: 'lender.phone.work',
  phoneCell: 'lender.phone.cell',
  phoneFax: 'lender.phone.fax',
  // Send Preferences
  sendPaymentNotification: 'lender.send_pref.payment_notification',
  sendLateNotice: 'lender.send_pref.late_notice',
  sendBorrowerStatement: 'lender.send_pref.borrower_statement',
  sendMaturityNotice: 'lender.send_pref.maturity_notice',
  // Preferred
  preferredPhone: 'lender.preferred.phone',
  // Mailing Address
  isPrimary: 'lender.isPrimary',
  mailingStreet: 'lender.street',
  mailingCity: 'lender.city',
  mailingState: 'lender.state',
  mailingZip: 'lender.zip',
  // Additional Details
  vesting: 'lender.vesting',
  ford: 'lender.ford',
} as const;

interface LenderInfoFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const LenderInfoForm: React.FC<LenderInfoFormProps> = ({
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

  const handleSameAsPrimaryChange = (checked: boolean) => {
    handleChange('isPrimary', checked);
    if (checked) {
      // Copy primary address to mailing address
      handleChange('mailingStreet', getValue('primaryStreet'));
      handleChange('mailingCity', getValue('primaryCity'));
      handleChange('mailingState', getValue('primaryState'));
      handleChange('mailingZip', getValue('primaryZip'));
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Name Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Name</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Lender Type</Label>
              <Input
                value={getValue('type')}
                onChange={(e) => handleChange('type', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Lender ID</Label>
              <Input
                value={getValue('id')}
                onChange={(e) => handleChange('id', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Full Name: If Entity, Use Entity</Label>
              <Input
                value={getValue('fullName')}
                onChange={(e) => handleChange('fullName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">First: If Entity, Use Signer</Label>
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
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Tax ID Type</Label>
              <Input
                value={getValue('taxIdType')}
                onChange={(e) => handleChange('taxIdType', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Tax ID</Label>
              <Input
                value={getValue('taxId')}
                onChange={(e) => handleChange('taxId', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Issue 1099</Label>
              <Checkbox
                checked={getBoolValue('issue1099')}
                onCheckedChange={(checked) => handleChange('issue1099', !!checked)}
                disabled={disabled}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Prepare CA 881</Label>
              <Checkbox
                checked={getBoolValue('prepareCa881')}
                onCheckedChange={(checked) => handleChange('prepareCa881', !!checked)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Primary Address & Phone Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Primary Address</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Street</Label>
              <Input
                value={getValue('primaryStreet')}
                onChange={(e) => handleChange('primaryStreet', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={getValue('primaryCity')}
                onChange={(e) => handleChange('primaryCity', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">State</Label>
              <Input
                value={getValue('primaryState')}
                onChange={(e) => handleChange('primaryState', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">ZIP</Label>
              <Input
                value={getValue('primaryZip')}
                onChange={(e) => handleChange('primaryZip', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-foreground border-b pb-2 mt-6">Phone</h3>
          
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
          </div>
        </div>

        {/* Preferred Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Preferred</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Preferred Phone</Label>
              <Input
                value={getValue('preferredPhone')}
                onChange={(e) => handleChange('preferredPhone', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Borrower Statement</Label>
              <Checkbox
                checked={getBoolValue('sendBorrowerStatement')}
                onCheckedChange={(checked) => handleChange('sendBorrowerStatement', !!checked)}
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

        {/* Mailing Address & Vesting Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 border-b pb-2">
            <h3 className="text-sm font-semibold text-foreground">Mailing Address</h3>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">(Same as Primary)</Label>
              <Checkbox
                checked={getBoolValue('isPrimary')}
                onCheckedChange={handleSameAsPrimaryChange}
                disabled={disabled}
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Street</Label>
              <Input
                value={getValue('mailingStreet')}
                onChange={(e) => handleChange('mailingStreet', e.target.value)}
                disabled={disabled || getBoolValue('isPrimary')}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={getValue('mailingCity')}
                onChange={(e) => handleChange('mailingCity', e.target.value)}
                disabled={disabled || getBoolValue('isPrimary')}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">State</Label>
              <Input
                value={getValue('mailingState')}
                onChange={(e) => handleChange('mailingState', e.target.value)}
                disabled={disabled || getBoolValue('isPrimary')}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">ZIP</Label>
              <Input
                value={getValue('mailingZip')}
                onChange={(e) => handleChange('mailingZip', e.target.value)}
                disabled={disabled || getBoolValue('isPrimary')}
                className="h-8"
              />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-foreground border-b pb-2 mt-6">Vesting</h3>
          
          <div className="space-y-3">
            <Textarea
              value={getValue('vesting')}
              onChange={(e) => handleChange('vesting', e.target.value)}
              disabled={disabled}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-foreground mb-3">FORD</h4>
            <Input
              value={getValue('ford')}
              onChange={(e) => handleChange('ford', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LenderInfoForm;
