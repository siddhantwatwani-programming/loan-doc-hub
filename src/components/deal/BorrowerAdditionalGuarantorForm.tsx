import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

// Field key mapping for additional guarantor fields - uses same borrower keys per spec
const FIELD_KEYS = {
  // Borrower Details (shared keys)
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
  // Primary Address
  primaryStreet: 'borrower.address.street',
  primaryCity: 'borrower.address.city',
  primaryState: 'borrower.state',
  primaryZip: 'borrower.address.zip',
  // Phone
  phoneHome: 'borrower.phone.home',
  phoneWork: 'borrower.phone.work',
  phoneCell: 'borrower.phone.mobile',
  phoneFax: 'borrower.phone.fax',
  // Preferred
  preferred: 'borrower.preferred',
  // Mailing Address
  isPrimary: 'borrower.isPrimary',
  mailingStreet: 'borrower.street',
  mailingCity: 'borrower.city',
  mailingState: 'borrower.state',
  mailingZip: 'borrower.zip',
  // Vesting & FORD
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
        <Label className="w-44 text-xs text-foreground flex-shrink-0">
          {label}
        </Label>
        <Input
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          disabled={disabled}
          className={`h-7 text-xs flex-1 ${showError ? 'border-destructive' : ''}`}
        />
      </div>
    );
  };

  const renderPhoneField = (key: keyof typeof FIELD_KEYS, label: string) => {
    const value = getValue(key);

    return (
      <div key={key} className="flex items-center gap-2">
        <Label className="w-16 text-xs text-foreground flex-shrink-0">{label}</Label>
        <Input
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          disabled={disabled}
          className="h-7 text-xs flex-1"
        />
      </div>
    );
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

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-3 gap-x-8 gap-y-0">
        {/* Column 1: Name Fields */}
        <div className="space-y-2">
          <div className="border-b border-border pb-1 mb-3">
            <span className="font-semibold text-sm text-foreground">Name</span>
          </div>
          <div className="space-y-1.5">
            {renderField('borrowerType', 'Borrower Type')}
            {renderField('borrowerId', 'Borrower ID')}
            {renderField('fullName', 'Full Name: If Entity, Use Entity')}
            {renderField('firstName', 'First: If Entity, Use Signer')}
            {renderField('middleName', 'Middle')}
            {renderField('lastName', 'Last')}
            {renderField('capacity', 'Capacity')}
            {renderField('email', 'Email')}
            {renderField('creditScore', 'Credit Score')}
            {renderField('taxIdType', 'Tax ID Type')}
            {renderField('taxId', 'TIN')}
          </div>
        </div>

        {/* Column 2: Primary Address + Phone */}
        <div className="space-y-4">
          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Primary Address</span>
            </div>
            <div className="space-y-1.5">
              {renderField('primaryStreet', 'Street')}
              {renderField('primaryCity', 'City')}
              {renderField('primaryState', 'State')}
              {renderField('primaryZip', 'ZIP')}
            </div>
          </div>

          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Phone</span>
            </div>
            <div className="space-y-1.5">
              {renderPhoneField('phoneHome', 'Home')}
              {renderPhoneField('phoneWork', 'Work')}
              {renderPhoneField('phoneCell', 'Cell')}
              {renderPhoneField('phoneFax', 'Fax')}
              <div className="flex items-center gap-2 pt-2">
                <Label className="w-16 text-xs text-foreground flex-shrink-0">Preferred</Label>
                <Input
                  value={getValue('preferred')}
                  onChange={(e) => handleChange('preferred', e.target.value)}
                  disabled={disabled}
                  className="h-7 text-xs flex-1"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="guarantor-issue1098"
                  checked={getBoolValue('issue1098')}
                  onCheckedChange={(checked) => handleChange('issue1098', !!checked)}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label htmlFor="guarantor-issue1098" className="text-xs text-foreground">Issue 1098</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Mailing Address + Vesting */}
        <div className="space-y-4">
          <div>
            <div className="border-b border-border pb-1 mb-3 flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground">Mailing Address</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="guarantor-same-as-primary"
                  checked={getBoolValue('isPrimary')}
                  onCheckedChange={handleSameAsPrimaryChange}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label htmlFor="guarantor-same-as-primary" className="text-xs text-muted-foreground">Same as Primary</Label>
              </div>
            </div>
            <div className="space-y-1.5">
              {renderField('mailingStreet', 'Street')}
              {renderField('mailingCity', 'City')}
              {renderField('mailingState', 'State')}
              {renderField('mailingZip', 'ZIP')}
            </div>
          </div>

          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Vesting</span>
            </div>
            <div className="space-y-1.5">
              <Input
                value={getValue('vesting')}
                onChange={(e) => handleChange('vesting', e.target.value)}
                disabled={disabled}
                className="h-16 text-xs flex-1"
              />
              <div className="border-b border-border pb-1 mb-2 mt-4">
                <span className="font-semibold text-sm text-foreground">FORD</span>
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
    </div>
  );
};

export default BorrowerAdditionalGuarantorForm;
