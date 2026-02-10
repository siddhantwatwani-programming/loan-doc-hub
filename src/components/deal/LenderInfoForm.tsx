import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

// Issue 1099 mapping based on Lender Type (per reference document)
// Individual: Yes, Joint: Situational, Family Trust: Situational
// LLC: Situational (if Taxed as Corp = No, otherwise Yes)
// C Corp / S Corp: No, IRA / ERISA: No, 401K: No, Foreign Holder W-8: No, Non-profit: No
const LENDER_TYPE_ISSUE_1099_MAP: Record<string, 'Yes' | 'No' | 'Situational'> = {
  'Individual': 'Yes',
  'Joint': 'Situational', // If "Taxed as Corp" is selected then No, otherwise Yes
  'Family Trust': 'Situational', // If "Taxed as Corp" is selected then No, otherwise Yes
  'LLC': 'Situational', // If "Taxed as Corp" is selected then No, otherwise Yes
  'C Corp / S Corp': 'No',
  'IRA / ERISA': 'No',
  'Investment Fund': 'Situational', // If "Taxed as Corp" is selected then No, otherwise Yes
  '401k': 'No',
  'Foreign Holder W-8': 'No',
  'Non-profit': 'No',
};

// Types that are always "No" for Issue 1099 (cannot be overridden)
const ALWAYS_NO_1099_TYPES = ['C Corp / S Corp', 'IRA / ERISA', '401k', 'Foreign Holder W-8', 'Non-profit'];

// Taxed as Corporation types (when selected, Issue 1099 = No for situational types)
const TAXED_AS_CORP_OPTIONS = ['Corporation', 'C Corp', 'S Corp'];

// Field key mapping for lender info fields
const FIELD_KEYS = {
  // Lender Details
  type: 'lender.type',
  id: 'lender.id',
  lenderId: 'lender.lender_id',
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
  lpLllpLlcTaxedAsCorp: 'lender.lp_lllp_llc_taxed_as_corp',
  tinVerified: 'lender.tin_verified',
  alternateReporting: 'lender.alternate_reporting',
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
  // FORD fields (8 inputs)
  ford1: 'lender.ford.1',
  ford2: 'lender.ford.2',
  ford3: 'lender.ford.3',
  ford4: 'lender.ford.4',
  ford5: 'lender.ford.5',
  ford6: 'lender.ford.6',
  ford7: 'lender.ford.7',
  ford8: 'lender.ford.8',
  loanId: 'lender.loan_id',
  loanType: 'lender.loan_type',
} as const;

// Lender type options
const LENDER_TYPE_OPTIONS = [
  { value: 'Individual', label: 'Individual' },
  { value: 'Joint', label: 'Joint' },
  { value: 'Family Trust', label: 'Family Trust' },
  { value: 'LLC', label: 'LLC' },
  { value: 'C Corp / S Corp', label: 'C Corp / S Corp' },
  { value: 'IRA / ERISA', label: 'IRA / ERISA' },
  { value: 'Investment Fund', label: 'Investment Fund' },
  { value: '401k', label: '401k' },
  { value: 'Foreign Holder W-8', label: 'Foreign Holder W-8' },
  { value: 'Non-profit', label: 'Non-profit' },
];

// Preferred phone options with corresponding field keys
const PREFERRED_PHONE_OPTIONS = [
  { value: 'Home', label: 'Home', fieldKey: 'phoneHome' as const },
  { value: 'Work', label: 'Work', fieldKey: 'phoneWork' as const },
  { value: 'Cell', label: 'Cell', fieldKey: 'phoneCell' as const },
  { value: 'Fax', label: 'Fax', fieldKey: 'phoneFax' as const },
];

// Lender ID options (primary, secondary, etc.)
const LENDER_ID_OPTIONS = [
  { value: 'Primary', label: 'Primary' },
  { value: 'Secondary', label: 'Secondary' },
  { value: 'Tertiary', label: 'Tertiary' },
  { value: 'Quaternary', label: 'Quaternary' },
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

  // Auto-derive Issue 1099 based on Lender Type and Taxed As
  const lenderType = getValue('type');
  const taxedAs = getValue('taxedAs');
  const preferredPhone = getValue('preferredPhone');
  
  // Get the Issue 1099 mapping for this lender type
  const issue1099Mapping = LENDER_TYPE_ISSUE_1099_MAP[lenderType] || 'Yes';
  
  // Determine if 1099 should be forced to No
  const isAlwaysNo1099 = ALWAYS_NO_1099_TYPES.includes(lenderType);
  const isTaxedAsCorp = TAXED_AS_CORP_OPTIONS.includes(taxedAs);
  
  // For situational types, check if taxed as corp
  const shouldForceNo1099 = isAlwaysNo1099 || (issue1099Mapping === 'Situational' && isTaxedAsCorp);
  
  // Get the selected preferred phone option
  const selectedPhoneOption = PREFERRED_PHONE_OPTIONS.find(opt => opt.value === preferredPhone);

  // Update Issue 1099 automatically when lender type or taxed as changes
  useEffect(() => {
    if (shouldForceNo1099 && getBoolValue('issue1099')) {
      handleChange('issue1099', false);
    } else if (!shouldForceNo1099 && issue1099Mapping === 'Yes' && !getBoolValue('issue1099')) {
      // Auto-set to Yes for Individual type
      handleChange('issue1099', true);
    }
  }, [lenderType, taxedAs]);


  return (
    <div className="p-6">
      {/* Horizontal layout: Name | Primary Address | Contact Preference | Vesting */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Name Section */}
        {/* Name Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Name</h3>
          
          <div className="space-y-3">
            {/* Lender ID - moved above Lender Type */}
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Lender ID</Label>
              <Select
                value={getValue('lenderId')}
                onValueChange={(value) => handleChange('lenderId', value)}
                disabled={disabled}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select lender" />
                </SelectTrigger>
                <SelectContent>
                  {LENDER_ID_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
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

            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Loan ID</Label>
              <Input
                value={getValue('loanId')}
                onChange={(e) => handleChange('loanId', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Loan Type</Label>
              <Input
                value={getValue('loanType')}
                onChange={(e) => handleChange('loanType', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Full Name: If Entity, Use Entity</Label>
              <Input
                value={getValue('fullName')}
                onChange={(e) => handleChange('fullName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">First: If Entity, Use Signer</Label>
              <Input
                value={getValue('firstName')}
                onChange={(e) => handleChange('firstName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Middle</Label>
              <Input
                value={getValue('middleName')}
                onChange={(e) => handleChange('middleName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Last</Label>
              <Input
                value={getValue('lastName')}
                onChange={(e) => handleChange('lastName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Capacity</Label>
              <Input
                value={getValue('capacity')}
                onChange={(e) => handleChange('capacity', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={getValue('email')}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
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
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Tax ID</Label>
              <Input
                value={getValue('taxId')}
                onChange={(e) => handleChange('taxId', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={getBoolValue('lpLllpLlcTaxedAsCorp')}
                onCheckedChange={(checked) => handleChange('lpLllpLlcTaxedAsCorp', !!checked)}
                disabled={disabled}
              />
              <Label className="text-sm text-muted-foreground">LP/LLLP/LLC Taxed as Corp</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                checked={shouldForceNo1099 ? false : getBoolValue('issue1099')}
                onCheckedChange={(checked) => handleChange('issue1099', !!checked)}
                disabled={disabled || shouldForceNo1099}
              />
              <Label className="text-sm text-muted-foreground">Issue 1099</Label>
              {shouldForceNo1099 && (
                <span className="text-xs text-muted-foreground">
                  (Auto: No{isAlwaysNo1099 ? ` for ${lenderType}` : ' - Taxed as Corp'})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={getBoolValue('tinVerified')}
                onCheckedChange={(checked) => handleChange('tinVerified', !!checked)}
                disabled={disabled}
              />
              <Label className="text-sm text-muted-foreground">TIN Verified</Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={getBoolValue('alternateReporting')}
                onCheckedChange={(checked) => handleChange('alternateReporting', !!checked)}
                disabled={disabled}
              />
              <Label className="text-sm text-muted-foreground">Alternate Reporting</Label>
            </div>
            
          </div>
        </div>

        {/* Primary Address Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Primary Address</h3>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Street</Label>
              <Input
                value={getValue('primaryStreet')}
                onChange={(e) => handleChange('primaryStreet', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={getValue('primaryCity')}
                onChange={(e) => handleChange('primaryCity', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">State</Label>
              <Input
                value={getValue('primaryState')}
                onChange={(e) => handleChange('primaryState', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
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
          <div className="flex items-center gap-2 border-b pb-2 mt-6">
            <h4 className="text-sm font-semibold text-foreground">Mailing Address</h4>
            <Checkbox
              checked={getBoolValue('isPrimary')}
              onCheckedChange={handleSameAsPrimaryChange}
              disabled={disabled}
            />
            <Label className="text-xs text-muted-foreground">(Same as Primary)</Label>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Street</Label>
              <Input
                value={getValue('mailingStreet')}
                onChange={(e) => handleChange('mailingStreet', e.target.value)}
                disabled={disabled || getBoolValue('isPrimary')}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={getValue('mailingCity')}
                onChange={(e) => handleChange('mailingCity', e.target.value)}
                disabled={disabled || getBoolValue('isPrimary')}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">State</Label>
              <Input
                value={getValue('mailingState')}
                onChange={(e) => handleChange('mailingState', e.target.value)}
                disabled={disabled || getBoolValue('isPrimary')}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
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
          <h4 className="text-sm font-semibold text-foreground border-b pb-2 mt-6">Care Of / Attorney Address</h4>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Street</Label>
              <Input
                value={getValue('careOfStreet')}
                onChange={(e) => handleChange('careOfStreet', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={getValue('careOfCity')}
                onChange={(e) => handleChange('careOfCity', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">State</Label>
              <Input
                value={getValue('careOfState')}
                onChange={(e) => handleChange('careOfState', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
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

        {/* Contact Preference Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Contact Preference</h3>
          
          <div className="space-y-3">
            <div className="space-y-1">
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
                  {PREFERRED_PHONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show only the selected phone input */}
            {selectedPhoneOption && (
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">{selectedPhoneOption.label} Phone</Label>
                <Input
                  type="tel"
                  value={getValue(selectedPhoneOption.fieldKey)}
                  onChange={(e) => handleChange(selectedPhoneOption.fieldKey, e.target.value)}
                  disabled={disabled}
                  className="h-8"
                  placeholder={`Enter ${selectedPhoneOption.label.toLowerCase()} phone`}
                />
              </div>
            )}

            {/* Show placeholder if no preferred selected */}
            {!preferredPhone && (
              <p className="text-xs text-muted-foreground italic">Select a preferred phone type to enter the number</p>
            )}
          </div>

          {/* Send Options */}
          <h4 className="text-sm font-semibold text-foreground mt-6">Send:</h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={getBoolValue('sendPaymentNotification')}
                onCheckedChange={(checked) => handleChange('sendPaymentNotification', !!checked)}
                disabled={disabled}
              />
              <Label className="text-sm text-muted-foreground">Payment Notification</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                checked={getBoolValue('sendLateNotice')}
                onCheckedChange={(checked) => handleChange('sendLateNotice', !!checked)}
                disabled={disabled}
              />
              <Label className="text-sm text-muted-foreground">Late Notice</Label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                checked={getBoolValue('sendBorrowerStatement')}
                onCheckedChange={(checked) => handleChange('sendBorrowerStatement', !!checked)}
                disabled={disabled}
              />
              <Label className="text-sm text-muted-foreground">Borrower Statement</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                checked={getBoolValue('sendMaturityNotice')}
                onCheckedChange={(checked) => handleChange('sendMaturityNotice', !!checked)}
                disabled={disabled}
              />
              <Label className="text-sm text-muted-foreground">Maturity Notice</Label>
            </div>
          </div>
        </div>

        {/* Vesting Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Vesting</h3>
          
          <Textarea
            value={getValue('vesting')}
            onChange={(e) => handleChange('vesting', e.target.value)}
            disabled={disabled}
            rows={4}
            className="resize-none w-full"
          />

          {/* FORD Section with 8 Inputs */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-foreground mb-3">FORD</h4>
            <div className="space-y-2">
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
  );
};

export default LenderInfoForm;
