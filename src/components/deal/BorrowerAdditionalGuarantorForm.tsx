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

  const renderInlineField = (key: keyof typeof FIELD_KEYS, label: string) => (
    <div key={key} className="flex items-center gap-2">
      <Label className="w-[120px] shrink-0 text-xs text-foreground">{label}</Label>
      <Input
        value={getValue(key)}
        onChange={(e) => handleChange(key, e.target.value)}
        disabled={disabled}
        className="h-7 text-xs flex-1"
      />
    </div>
  );

  const renderPhoneField = (key: keyof typeof FIELD_KEYS, label: string) => (
    <div key={key} className="flex items-center gap-2">
      <Label className="w-14 shrink-0 text-xs text-foreground">{label}</Label>
      <Input
        value={getValue(key)}
        onChange={(e) => handleChange(key, e.target.value)}
        disabled={disabled}
        className="h-7 text-xs flex-1"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-0">
        {/* Column 1: Name Fields */}
        <div className="space-y-1.5">
          <div className="border-b border-border pb-1 mb-2">
            <span className="font-semibold text-xs text-foreground">Name</span>
          </div>
          {renderInlineField('borrowerType', 'Borrower Type')}
          {renderInlineField('borrowerId', 'Borrower ID')}
          {renderInlineField('fullName', 'Full Name')}
          {renderInlineField('firstName', 'First')}
          {renderInlineField('middleName', 'Middle')}
          {renderInlineField('lastName', 'Last')}
          {renderInlineField('capacity', 'Capacity')}
          {renderInlineField('email', 'Email')}
          {renderInlineField('creditScore', 'Credit Score')}
          {renderInlineField('taxIdType', 'Tax ID Type')}
          {renderInlineField('taxId', 'TIN')}
        </div>

        {/* Column 2: Primary Address + Phone */}
        <div className="space-y-1.5">
          <div className="border-b border-border pb-1 mb-2">
            <span className="font-semibold text-xs text-foreground">Primary Address</span>
          </div>
          {renderInlineField('primaryStreet', 'Street')}
          {renderInlineField('primaryCity', 'City')}
          {renderInlineField('primaryState', 'State')}
          {renderInlineField('primaryZip', 'ZIP')}

          <div className="border-b border-border pb-1 mt-4 mb-2">
            <span className="font-semibold text-xs text-foreground">Phone</span>
          </div>
          {renderPhoneField('phoneHome', 'Home')}
          {renderPhoneField('phoneWork', 'Work')}
          {renderPhoneField('phoneCell', 'Cell')}
          {renderPhoneField('phoneFax', 'Fax')}
          <div className="flex items-center gap-2 pt-1">
            <Label className="w-14 shrink-0 text-xs text-foreground">Preferred</Label>
            <Input
              value={getValue('preferred')}
              onChange={(e) => handleChange('preferred', e.target.value)}
              disabled={disabled}
              className="h-7 text-xs flex-1"
            />
          </div>
        </div>

        {/* Column 3: Mailing Address + Vesting */}
        <div className="space-y-1.5">
          <div className="border-b border-border pb-1 mb-2 flex items-center justify-between">
            <span className="font-semibold text-xs text-foreground">Mailing Address</span>
            <div className="flex items-center gap-1">
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
          {renderInlineField('mailingStreet', 'Street')}
          {renderInlineField('mailingCity', 'City')}
          {renderInlineField('mailingState', 'State')}
          {renderInlineField('mailingZip', 'ZIP')}

          <div className="border-b border-border pb-1 mt-4 mb-2">
            <span className="font-semibold text-xs text-foreground">Vesting</span>
          </div>
          <Input
            value={getValue('vesting')}
            onChange={(e) => handleChange('vesting', e.target.value)}
            disabled={disabled}
            className="h-14 text-xs"
          />
          <div className="border-b border-border pb-1 mt-3 mb-2">
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
  );
};

export default BorrowerAdditionalGuarantorForm;
