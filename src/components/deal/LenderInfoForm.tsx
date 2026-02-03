import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

// Lender types that are Corporation-based (Issue 1099 = No)
const CORPORATION_TYPES = ['LLC', 'C Corp / S Corp', 'IRA / ERISA', 'Investment Fund', 'Non-profit'];

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
  taxedAs: 'lender.taxed_as',
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
  // Preferred Contact
  preferredPhone: 'lender.preferred.phone',
  // Mailing Address
  isPrimary: 'lender.isPrimary',
  mailingStreet: 'lender.street',
  mailingCity: 'lender.city',
  mailingState: 'lender.state',
  mailingZip: 'lender.zip',
  // Care Of / Attorney Address
  careOfStreet: 'lender.care_of.street',
  careOfCity: 'lender.care_of.city',
  careOfState: 'lender.care_of.state',
  careOfZip: 'lender.care_of.zip',
  // Additional Details
  vesting: 'lender.vesting',
  ford: 'lender.ford',
  loanId: 'lender.loan_id',
  loanType: 'lender.loan_type',
} as const;

// Lender type options with Issue 1099 mapping
const LENDER_TYPE_OPTIONS = [
  { value: 'Individual', label: 'Individual', issue1099: 'Yes' },
  { value: 'Joint', label: 'Joint', issue1099: 'Yes' },
  { value: 'Family Trust', label: 'Family Trust', issue1099: 'Yes' },
  { value: 'LLC', label: 'LLC', issue1099: 'No' },
  { value: 'C Corp / S Corp', label: 'C Corp / S Corp', issue1099: 'No' },
  { value: 'IRA / ERISA', label: 'IRA / ERISA', issue1099: 'No' },
  { value: 'Investment Fund', label: 'Investment Fund', issue1099: 'No' },
  { value: '401k', label: '401k', issue1099: 'No' },
  { value: 'Pension Holder W-4', label: 'Pension Holder W-4', issue1099: 'No' },
  { value: 'Non-profit', label: 'Non-profit', issue1099: 'No' },
];

// Preferred phone options
const PREFERRED_OPTIONS = [
  { value: 'Home', label: 'Home' },
  { value: 'Work', label: 'Work' },
  { value: 'Cell', label: 'Cell' },
];

// Tax ID type options
const TAX_ID_TYPE_OPTIONS = [
  { value: '0', label: '0 - Unknown' },
  { value: '1', label: '1 - EIN' },
  { value: '2', label: '2 - SSN' },
];

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

  // Auto-derive Issue 1099 based on Lender Type
  const lenderType = getValue('type');
  const isCorporationType = CORPORATION_TYPES.includes(lenderType);
  const issue1099Derived = isCorporationType ? 'No' : (getBoolValue('issue1099') ? 'Yes' : 'No');

  // Update Issue 1099 automatically when lender type changes
  useEffect(() => {
    if (isCorporationType && getBoolValue('issue1099')) {
      handleChange('issue1099', false);
    }
  }, [lenderType]);


  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Name Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Name</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Lender Type</Label>
              <Select
                value={getValue('type')}
                onValueChange={(value) => handleChange('type', value)}
                disabled={disabled}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {LENDER_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label className="text-sm text-muted-foreground">Loan ID</Label>
              <Input
                value={getValue('loanId')}
                disabled={true}
                readOnly
                className="h-8 bg-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Loan Type</Label>
              <Input
                value={getValue('loanType')}
                onChange={(e) => handleChange('loanType', e.target.value)}
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
              <Select
                value={getValue('taxIdType')}
                onValueChange={(value) => handleChange('taxIdType', value)}
                disabled={disabled}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TAX_ID_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={isCorporationType ? false : getBoolValue('issue1099')}
                  onCheckedChange={(checked) => handleChange('issue1099', !!checked)}
                  disabled={disabled || isCorporationType}
                />
                {isCorporationType && (
                  <span className="text-xs text-muted-foreground">(Auto: No for {lenderType})</span>
                )}
              </div>
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

        {/* Primary Address Section */}
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

          {/* Mailing Address */}
          <div className="flex items-center gap-4 border-b pb-2 mt-6">
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

          {/* Care Of / Attorney Address */}
          <h3 className="text-sm font-semibold text-foreground border-b pb-2 mt-6">Care Of / Attorney Address</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Street</Label>
              <Input
                value={getValue('careOfStreet')}
                onChange={(e) => handleChange('careOfStreet', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={getValue('careOfCity')}
                onChange={(e) => handleChange('careOfCity', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">State</Label>
              <Input
                value={getValue('careOfState')}
                onChange={(e) => handleChange('careOfState', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">ZIP</Label>
              <Input
                value={getValue('careOfZip')}
                onChange={(e) => handleChange('careOfZip', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Contact Preference Section (Phone + Preferred grouped together) */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Contact Preference</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Preferred Phone</Label>
              <Select
                value={getValue('preferredPhone')}
                onValueChange={(value) => handleChange('preferredPhone', value)}
                disabled={disabled}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select preferred" />
                </SelectTrigger>
                <SelectContent>
                  {PREFERRED_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <h4 className="text-sm font-semibold text-foreground mt-4">Phone</h4>
          
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

          {/* Send Options - Grouped under Contact Preference */}
          <h4 className="text-sm font-semibold text-foreground mt-6">Send:</h4>
          
          <div className="space-y-3">
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

        {/* Vesting Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Vesting</h3>
          
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
