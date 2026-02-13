import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

// Issue 1099 mapping based on Lender Type (per reference document)
const LENDER_TYPE_ISSUE_1099_MAP: Record<string, 'Yes' | 'No' | 'Situational'> = {
  'Individual': 'Yes',
  'Joint': 'Situational',
  'Family Trust': 'Situational',
  'LLC': 'Situational',
  'C Corp / S Corp': 'No',
  'IRA / ERISA': 'No',
  'Investment Fund': 'Situational',
  '401k': 'No',
  'Foreign Holder W-8': 'No',
  'Non-profit': 'No',
};

const ALWAYS_NO_1099_TYPES = ['C Corp / S Corp', 'IRA / ERISA', '401k', 'Foreign Holder W-8', 'Non-profit'];
const TAXED_AS_CORP_OPTIONS = ['Corporation', 'C Corp', 'S Corp'];

const FIELD_KEYS = {
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
  primaryStreet: 'lender.primary_address.street',
  primaryCity: 'lender.primary_address.city',
  primaryState: 'lender.primary_address.state',
  primaryZip: 'lender.primary_address.zip',
  phoneHome: 'lender.phone.home',
  phoneWork: 'lender.phone.work',
  phoneCell: 'lender.phone.cell',
  phoneFax: 'lender.phone.fax',
  sendPaymentNotification: 'lender.send_pref.payment_notification',
  sendLateNotice: 'lender.send_pref.late_notice',
  sendBorrowerStatement: 'lender.send_pref.borrower_statement',
  sendMaturityNotice: 'lender.send_pref.maturity_notice',
  preferredPhone: 'lender.preferred.phone',
  isPrimary: 'lender.isPrimary',
  mailingStreet: 'lender.street',
  mailingCity: 'lender.city',
  mailingState: 'lender.state',
  mailingZip: 'lender.zip',
  careOfStreet: 'lender.care_of.street',
  careOfCity: 'lender.care_of.city',
  careOfState: 'lender.care_of.state',
  careOfZip: 'lender.care_of.zip',
  vesting: 'lender.vesting',
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
  deliveryOnline: 'lender.delivery.online',
  deliveryMail: 'lender.delivery.mail',
  entitySignBorrower: 'lender.entity_sign.borrower',
  entitySignBy: 'lender.entity_sign.by',
  entitySignIts: 'lender.entity_sign.its',
  entitySignEntityName: 'lender.entity_sign.entity_name',
  entitySignFirstLast: 'lender.entity_sign.first_last',
  entitySignCapacity: 'lender.entity_sign.capacity',
} as const;

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

const PHONE_FIELDS = [
  { label: 'Home', fieldKey: 'phoneHome' as const },
  { label: 'Work', fieldKey: 'phoneWork' as const },
  { label: 'Cell', fieldKey: 'phoneCell' as const },
  { label: 'Fax', fieldKey: 'phoneFax' as const },
];

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
      handleChange('mailingStreet', getValue('primaryStreet'));
      handleChange('mailingCity', getValue('primaryCity'));
      handleChange('mailingState', getValue('primaryState'));
      handleChange('mailingZip', getValue('primaryZip'));
    }
  };

  const lenderType = getValue('type');
  const taxedAs = getValue('taxedAs');
  const preferredPhone = getValue('preferredPhone');
  
  const issue1099Mapping = LENDER_TYPE_ISSUE_1099_MAP[lenderType] || 'Yes';
  const isAlwaysNo1099 = ALWAYS_NO_1099_TYPES.includes(lenderType);
  const isTaxedAsCorp = TAXED_AS_CORP_OPTIONS.includes(taxedAs);
  const shouldForceNo1099 = isAlwaysNo1099 || (issue1099Mapping === 'Situational' && isTaxedAsCorp);

  useEffect(() => {
    if (shouldForceNo1099 && getBoolValue('issue1099')) {
      handleChange('issue1099', false);
    } else if (!shouldForceNo1099 && issue1099Mapping === 'Yes' && !getBoolValue('issue1099')) {
      handleChange('issue1099', true);
    }
  }, [lenderType, taxedAs]);

  return (
    <div className="p-6">
      {/* 4-column layout: Name | Primary Address | Phone + Preferred + Send | Mailing Address + Vesting + FORD */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Column 1: Name */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Name</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Lender Type</Label>
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

            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Lender ID</Label>
              <Input
                value={getValue('lenderId')}
                onChange={(e) => handleChange('lenderId', e.target.value)}
                disabled={disabled}
                className="h-8"
                placeholder="Enter lender ID"
              />
            </div>

            <div className="flex items-start gap-3">
              <div className="min-w-[140px] shrink-0 pt-1">
                <Label className="text-sm text-muted-foreground text-left">Full Name:</Label>
                <p className="text-[10px] text-muted-foreground/70 leading-tight">If Entity, Use Entity</p>
              </div>
              <Input
                value={getValue('fullName')}
                onChange={(e) => handleChange('fullName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="flex items-start gap-3">
              <div className="min-w-[140px] shrink-0 pt-1">
                <Label className="text-sm text-muted-foreground text-left">First:</Label>
                <p className="text-[10px] text-muted-foreground/70 leading-tight">If Entity, Use Signer</p>
              </div>
              <Input
                value={getValue('firstName')}
                onChange={(e) => handleChange('firstName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Middle</Label>
              <Input
                value={getValue('middleName')}
                onChange={(e) => handleChange('middleName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Last</Label>
              <Input
                value={getValue('lastName')}
                onChange={(e) => handleChange('lastName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Capacity</Label>
              <Input
                value={getValue('capacity')}
                onChange={(e) => handleChange('capacity', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Email</Label>
              <Input
                type="email"
                value={getValue('email')}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Tax ID Type</Label>
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
            
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Tax ID</Label>
              <Input
                value={getValue('taxId')}
                onChange={(e) => handleChange('taxId', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">LP/LLLP/LLC Taxed as Corp</Label>
              <Checkbox
                checked={getBoolValue('lpLllpLlcTaxedAsCorp')}
                onCheckedChange={(checked) => handleChange('lpLllpLlcTaxedAsCorp', !!checked)}
                disabled={disabled}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Issue 1099</Label>
              <Checkbox
                checked={shouldForceNo1099 ? false : getBoolValue('issue1099')}
                onCheckedChange={(checked) => handleChange('issue1099', !!checked)}
                disabled={disabled || shouldForceNo1099}
              />
              {shouldForceNo1099 && (
                <span className="text-xs text-muted-foreground">
                  (Auto: No{isAlwaysNo1099 ? ` for ${lenderType}` : ' - Taxed as Corp'})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">TIN Verified</Label>
              <Checkbox
                checked={getBoolValue('tinVerified')}
                onCheckedChange={(checked) => handleChange('tinVerified', !!checked)}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Alternate Reporting</Label>
              <Checkbox
                checked={getBoolValue('alternateReporting')}
                onCheckedChange={(checked) => handleChange('alternateReporting', !!checked)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Column 2: Primary Address */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Primary Address</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[60px] text-left shrink-0">Street</Label>
              <Input value={getValue('primaryStreet')} onChange={(e) => handleChange('primaryStreet', e.target.value)} disabled={disabled} className="h-8" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[60px] text-left shrink-0">City</Label>
              <Input value={getValue('primaryCity')} onChange={(e) => handleChange('primaryCity', e.target.value)} disabled={disabled} className="h-8" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[60px] text-left shrink-0">State</Label>
              <Input value={getValue('primaryState')} onChange={(e) => handleChange('primaryState', e.target.value)} disabled={disabled} className="h-8" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[60px] text-left shrink-0">ZIP</Label>
              <Input value={getValue('primaryZip')} onChange={(e) => handleChange('primaryZip', e.target.value)} disabled={disabled} className="h-8" />
            </div>
          </div>
        </div>

        {/* Column 3: Phone + Preferred + Send */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Phone</h3>
          <div className="space-y-3">
            {PHONE_FIELDS.map((phone) => (
              <div key={phone.label} className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[50px] text-left shrink-0">{phone.label}</Label>
                <Input
                  type="tel"
                  value={getValue(phone.fieldKey)}
                  onChange={(e) => handleChange(phone.fieldKey, e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
              </div>
            ))}
          </div>

          {/* Preferred section */}
          <h4 className="text-sm font-semibold text-foreground mt-4 border-b pb-1">Preferred</h4>
          <div className="space-y-2">
            {PHONE_FIELDS.map((phone) => (
              <div key={phone.label} className="flex items-center gap-2">
                <Checkbox
                  checked={preferredPhone === phone.label}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      handleChange('preferredPhone', phone.label);
                    } else if (preferredPhone === phone.label) {
                      handleChange('preferredPhone', '');
                    }
                  }}
                  disabled={disabled}
                />
                <Label className="text-sm text-muted-foreground">{phone.label}</Label>
              </div>
            ))}
          </div>

          {/* Send Options */}
          <h4 className="text-sm font-semibold text-foreground mt-4 border-b pb-1">Send:</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Payment Notification</Label>
              <Checkbox
                checked={getBoolValue('sendPaymentNotification')}
                onCheckedChange={(checked) => handleChange('sendPaymentNotification', !!checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Borrower Statement</Label>
              <Checkbox
                checked={getBoolValue('sendBorrowerStatement')}
                onCheckedChange={(checked) => handleChange('sendBorrowerStatement', !!checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Late Notice</Label>
              <Checkbox
                checked={getBoolValue('sendLateNotice')}
                onCheckedChange={(checked) => handleChange('sendLateNotice', !!checked)}
                disabled={disabled}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Maturity Notice</Label>
              <Checkbox
                checked={getBoolValue('sendMaturityNotice')}
                onCheckedChange={(checked) => handleChange('sendMaturityNotice', !!checked)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Column 4: Mailing Address + Vesting + FORD */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <h3 className="text-sm font-semibold text-foreground">Mailing Address</h3>
            <Checkbox
              checked={getBoolValue('isPrimary')}
              onCheckedChange={handleSameAsPrimaryChange}
              disabled={disabled}
            />
            <Label className="text-xs text-muted-foreground">(Same as Primary)</Label>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[60px] text-left shrink-0">Street</Label>
              <Input value={getValue('mailingStreet')} onChange={(e) => handleChange('mailingStreet', e.target.value)} disabled={disabled || getBoolValue('isPrimary')} className="h-8" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[60px] text-left shrink-0">City</Label>
              <Input value={getValue('mailingCity')} onChange={(e) => handleChange('mailingCity', e.target.value)} disabled={disabled || getBoolValue('isPrimary')} className="h-8" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[60px] text-left shrink-0">State</Label>
              <Input value={getValue('mailingState')} onChange={(e) => handleChange('mailingState', e.target.value)} disabled={disabled || getBoolValue('isPrimary')} className="h-8" />
            </div>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[60px] text-left shrink-0">ZIP</Label>
              <Input value={getValue('mailingZip')} onChange={(e) => handleChange('mailingZip', e.target.value)} disabled={disabled || getBoolValue('isPrimary')} className="h-8" />
            </div>
          </div>

          {/* Vesting */}
          <h4 className="text-sm font-semibold text-foreground border-b pb-2 mt-6">Vesting</h4>
          <Textarea
            value={getValue('vesting')}
            onChange={(e) => handleChange('vesting', e.target.value)}
            disabled={disabled}
            rows={3}
            className="resize-none w-full"
          />

          {/* FORD */}
          <h4 className="text-sm font-semibold text-foreground mt-4 mb-2">FORD</h4>
          <div className="grid grid-cols-2 gap-2">
            <Input value={getValue('ford1')} onChange={(e) => handleChange('ford1', e.target.value)} disabled={disabled} className="h-8" />
            <Input value={getValue('ford2')} onChange={(e) => handleChange('ford2', e.target.value)} disabled={disabled} className="h-8" />
            <Input value={getValue('ford3')} onChange={(e) => handleChange('ford3', e.target.value)} disabled={disabled} className="h-8" />
            <Input value={getValue('ford4')} onChange={(e) => handleChange('ford4', e.target.value)} disabled={disabled} className="h-8" />
            <Input value={getValue('ford5')} onChange={(e) => handleChange('ford5', e.target.value)} disabled={disabled} className="h-8" />
            <Input value={getValue('ford6')} onChange={(e) => handleChange('ford6', e.target.value)} disabled={disabled} className="h-8" />
            <Input value={getValue('ford7')} onChange={(e) => handleChange('ford7', e.target.value)} disabled={disabled} className="h-8" />
            <Input value={getValue('ford8')} onChange={(e) => handleChange('ford8', e.target.value)} disabled={disabled} className="h-8" />
          </div>
        </div>
      </div>

      {/* Delivery Section */}
      <div className="mt-6 border-t pt-4">
        <h3 className="text-sm font-semibold text-destructive mb-3">Delivery</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Online</Label>
            <Checkbox
              checked={getBoolValue('deliveryOnline')}
              onCheckedChange={(checked) => handleChange('deliveryOnline', !!checked)}
              disabled={disabled}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Mail</Label>
            <Checkbox
              checked={getBoolValue('deliveryMail')}
              onCheckedChange={(checked) => handleChange('deliveryMail', !!checked)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* If Entity, sig line should be: */}
      <div className="mt-6 border-t pt-4">
        <h3 className="text-sm font-semibold text-destructive mb-3">If Entity, sig line should be:</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground min-w-[80px] shrink-0">Borrower:</Label>
            <Input value={getValue('entitySignBorrower')} onChange={(e) => handleChange('entitySignBorrower', e.target.value)} disabled={disabled} className="h-8" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground min-w-[80px] shrink-0">Entity Name</Label>
            <Input value={getValue('entitySignEntityName')} onChange={(e) => handleChange('entitySignEntityName', e.target.value)} disabled={disabled} className="h-8" />
          </div>
          <div className="lg:col-start-1 flex items-center gap-2">
            <Label className="text-xs text-muted-foreground min-w-[80px] shrink-0">By:</Label>
            <Input value={getValue('entitySignBy')} onChange={(e) => handleChange('entitySignBy', e.target.value)} disabled={disabled} className="h-8" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground min-w-[80px] shrink-0">First, Last</Label>
            <Input value={getValue('entitySignFirstLast')} onChange={(e) => handleChange('entitySignFirstLast', e.target.value)} disabled={disabled} className="h-8" />
          </div>
          <div className="lg:col-start-1 flex items-center gap-2">
            <Label className="text-xs text-muted-foreground min-w-[80px] shrink-0">Its:</Label>
            <Input value={getValue('entitySignIts')} onChange={(e) => handleChange('entitySignIts', e.target.value)} disabled={disabled} className="h-8" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground min-w-[80px] shrink-0">Capacity</Label>
            <Input value={getValue('entitySignCapacity')} onChange={(e) => handleChange('entitySignCapacity', e.target.value)} disabled={disabled} className="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LenderInfoForm;
