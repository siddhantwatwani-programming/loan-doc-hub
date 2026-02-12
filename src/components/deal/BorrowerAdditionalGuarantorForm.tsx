import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

// Field key mapping for additional guarantor fields - uses same borrower keys per spec
const FIELD_KEYS = {
  borrowerType: 'borrower.borrower_type',
  borrowerId: 'borrower.borrower_id',
  fullName: 'borrower.full_name',
  firstName: 'borrower.first_name',
  middleName: 'borrower.middle_initial',
  lastName: 'borrower.last_name',
  capacity: 'borrower.capacity',
  email: 'borrower.email',
  creditScore: 'borrower.credit_score',
  taxIdType: 'borrower.tax_id_type',
  taxId: 'borrower.tax_id',
  issue1098: 'borrower.issue_1098',
  primaryStreet: 'borrower.address.street',
  primaryCity: 'borrower.address.city',
  primaryState: 'borrower.state',
  primaryZip: 'borrower.address.zip',
  phoneHome: 'borrower.phone.home',
  phoneWork: 'borrower.phone.work',
  phoneCell: 'borrower.phone.mobile',
  phoneFax: 'borrower.phone.fax',
  preferred: 'borrower.preferred',
  isPrimary: 'borrower.isPrimary',
  mailingStreet: 'borrower.mailing_street',
  mailingCity: 'borrower.mailing_city',
  mailingState: 'borrower.mailing_state',
  mailingZip: 'borrower.mailing_zip',
  vesting: 'borrower.vesting',
  ford: 'borrower.ford',
} as const;

interface BorrowerAdditionalGuarantorFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const BorrowerAdditionalGuarantorForm: React.FC<BorrowerAdditionalGuarantorFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
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

  const renderField = (key: keyof typeof FIELD_KEYS, label: string) => {
    const value = getValue(key);
    const fieldDef = fields.find(f => f.field_key === FIELD_KEYS[key]);
    const isRequired = fieldDef?.is_required || false;
    const showError = showValidation && isRequired && !value.trim();

    return (
      <div key={key} className="flex items-center gap-2">
        <Label className="w-32 min-w-[8rem] text-xs text-muted-foreground flex-shrink-0 truncate">{label}</Label>
        <Input
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          disabled={disabled}
          className={`h-7 text-xs flex-1 min-w-0 ${showError ? 'border-destructive' : ''}`}
        />
      </div>
    );
  };

  const renderPhoneField = (key: keyof typeof FIELD_KEYS, label: string) => (
    <div key={key} className="flex items-center gap-2">
      <Label className="w-12 min-w-[3rem] text-xs text-muted-foreground flex-shrink-0">{label}</Label>
      <Input
        value={getValue(key)}
        onChange={(e) => handleChange(key, e.target.value)}
        disabled={disabled}
        className="h-7 text-xs flex-1 min-w-0"
      />
    </div>
  );

  const handleSameAsPrimaryChange = (checked: boolean) => {
    handleChange('isPrimary', checked);
    if (checked) {
      handleChange('mailingStreet', getValue('primaryStreet'));
      handleChange('mailingCity', getValue('primaryCity'));
      handleChange('mailingState', getValue('primaryState'));
      handleChange('mailingZip', getValue('primaryZip'));
    }
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
        {/* Column 1: Name Fields */}
        <div className="space-y-1.5">
          <div className="border-b border-border pb-1 mb-2">
            <span className="font-semibold text-xs text-foreground">Name</span>
          </div>
          {renderField('borrowerType', 'Borrower Type')}
          {renderField('borrowerId', 'Borrower ID')}
          {renderField('fullName', 'Full Name')}
          {renderField('firstName', 'First Name')}
          {renderField('middleName', 'Middle')}
          {renderField('lastName', 'Last')}
          {renderField('capacity', 'Capacity')}
          {renderField('email', 'Email')}
          {renderField('creditScore', 'Credit Score')}
          {renderField('taxIdType', 'Tax ID Type')}
          {renderField('taxId', 'TIN')}
        </div>

        {/* Column 2: Primary Address + Phone */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="border-b border-border pb-1 mb-2">
              <span className="font-semibold text-xs text-foreground">Primary Address</span>
            </div>
            {renderField('primaryStreet', 'Street')}
            {renderField('primaryCity', 'City')}
            {renderField('primaryState', 'State')}
            {renderField('primaryZip', 'ZIP')}
          </div>

          <div className="space-y-1.5">
            <div className="border-b border-border pb-1 mb-2">
              <span className="font-semibold text-xs text-foreground">Phone</span>
            </div>
            {renderPhoneField('phoneHome', 'Home')}
            {renderPhoneField('phoneWork', 'Work')}
            {renderPhoneField('phoneCell', 'Cell')}
            {renderPhoneField('phoneFax', 'Fax')}
            <div className="flex items-center gap-2 pt-1">
              <Label className="w-12 min-w-[3rem] text-xs text-muted-foreground flex-shrink-0">Pref</Label>
              <Input
                value={getValue('preferred')}
                onChange={(e) => handleChange('preferred', e.target.value)}
                disabled={disabled}
                className="h-7 text-xs flex-1 min-w-0"
              />
            </div>
          </div>
        </div>

        {/* Column 3: Mailing Address + Vesting */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="border-b border-border pb-1 mb-2 flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground">Mailing Address</span>
              <div className="flex items-center gap-1.5">
                <Checkbox
                  id="guarantor-same-as-primary"
                  checked={getBoolValue('isPrimary')}
                  onCheckedChange={handleSameAsPrimaryChange}
                  disabled={disabled}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="guarantor-same-as-primary" className="text-[10px] text-muted-foreground">Same as Primary</Label>
              </div>
            </div>
            {renderField('mailingStreet', 'Street')}
            {renderField('mailingCity', 'City')}
            {renderField('mailingState', 'State')}
            {renderField('mailingZip', 'ZIP')}
          </div>

          <div className="space-y-1.5">
            <div className="border-b border-border pb-1 mb-2">
              <span className="font-semibold text-xs text-foreground">Vesting</span>
            </div>
            <Input
              value={getValue('vesting')}
              onChange={(e) => handleChange('vesting', e.target.value)}
              disabled={disabled}
              className="h-14 text-xs"
            />
            <div className="border-b border-border pb-1 mb-2 mt-3">
              <span className="font-semibold text-xs text-foreground">FORD</span>
            </div>
            <Input
              value={getValue('ford')}
              onChange={(e) => handleChange('ford', e.target.value)}
              disabled={disabled}
              className="h-7 text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrowerAdditionalGuarantorForm;
