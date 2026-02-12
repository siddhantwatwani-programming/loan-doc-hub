import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

// Field key mapping for primary borrower fields
const FIELD_KEYS = {
  // Borrower Details
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
  // Mailing Address
  mailingSameAsPrimary: 'borrower.mailing_same_as_primary',
  mailingStreet: 'borrower.mailing.street',
  mailingCity: 'borrower.mailing.city',
  mailingState: 'borrower.mailing.state',
  mailingZip: 'borrower.mailing.zip',
  // Phone
  phoneHome: 'borrower.phone.home',
  phoneHome2: 'borrower.phone.home2',
  phoneWork: 'borrower.phone.work',
  phoneCell: 'borrower.phone.mobile',
  phoneFax: 'borrower.phone.fax',
  preferredHome: 'borrower.preferred.home',
  preferredHome2: 'borrower.preferred.home2',
  preferredWork: 'borrower.preferred.work',
  preferredCell: 'borrower.preferred.cell',
  preferredFax: 'borrower.preferred.fax',
  // Vesting & FORD
  vesting: 'borrower.vesting',
  ford1: 'borrower.ford.1',
  ford2: 'borrower.ford.2',
  ford3: 'borrower.ford.3',
  ford4: 'borrower.ford.4',
} as const;

interface BorrowerPrimaryFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const BorrowerPrimaryForm: React.FC<BorrowerPrimaryFormProps> = ({
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

  const handleSameAsPrimaryChange = (checked: boolean) => {
    handleChange('mailingSameAsPrimary', checked);
    if (checked) {
      handleChange('mailingStreet', getValue('primaryStreet'));
      handleChange('mailingCity', getValue('primaryCity'));
      handleChange('mailingState', getValue('primaryState'));
      handleChange('mailingZip', getValue('primaryZip'));
    }
  };

  const renderInlineField = (key: keyof typeof FIELD_KEYS, label: string) => (
    <div key={key} className="flex items-center gap-2">
      <Label className="w-[130px] shrink-0 text-xs text-muted-foreground">{label}</Label>
      <Input
        value={getValue(key)}
        onChange={(e) => handleChange(key, e.target.value)}
        disabled={disabled}
        className="h-7 text-xs flex-1"
      />
    </div>
  );

  const renderPhoneRow = (key: keyof typeof FIELD_KEYS, prefKey: keyof typeof FIELD_KEYS, label: string) => (
    <div key={key} className="flex items-center gap-2">
      <Label className="w-14 shrink-0 text-xs text-muted-foreground">{label}</Label>
      <Input
        value={getValue(key)}
        onChange={(e) => handleChange(key, e.target.value)}
        disabled={disabled}
        className="h-7 text-xs flex-1"
      />
      <div className="flex items-center gap-1 shrink-0">
        <Checkbox
          checked={getBoolValue(prefKey)}
          onCheckedChange={(checked) => handleChange(prefKey, !!checked)}
          disabled={disabled}
          className="h-3.5 w-3.5"
        />
        <Label className="text-[10px] text-muted-foreground">Pref</Label>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-6 gap-y-0">
        
        {/* Column 1: Name Section */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Name</h3>
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

        {/* Column 2: Addresses */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Primary Address</h3>
          {renderInlineField('primaryStreet', 'Street')}
          {renderInlineField('primaryCity', 'City')}
          {renderInlineField('primaryState', 'State')}
          {renderInlineField('primaryZip', 'ZIP')}

          <div className="flex items-center gap-2 border-b border-border pb-1 mt-4 mb-2">
            <h4 className="text-xs font-semibold text-foreground">Mailing Address</h4>
            <Checkbox
              checked={getBoolValue('mailingSameAsPrimary')}
              onCheckedChange={(checked) => handleSameAsPrimaryChange(!!checked)}
              disabled={disabled}
              className="h-3.5 w-3.5"
            />
            <Label className="text-[10px] text-muted-foreground">Same as Primary</Label>
          </div>
          {renderInlineField('mailingStreet', 'Street')}
          {renderInlineField('mailingCity', 'City')}
          {renderInlineField('mailingState', 'State')}
          {renderInlineField('mailingZip', 'ZIP')}
        </div>

        {/* Column 3: Phone Section */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Phone</h3>
          {renderPhoneRow('phoneHome', 'preferredHome', 'Home')}
          {renderPhoneRow('phoneHome2', 'preferredHome2', 'Home')}
          {renderPhoneRow('phoneWork', 'preferredWork', 'Work')}
          {renderPhoneRow('phoneCell', 'preferredCell', 'Cell')}
          {renderPhoneRow('phoneFax', 'preferredFax', 'Fax')}
        </div>

        {/* Column 4: Vesting & FORD */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Vesting</h3>
          <Textarea
            value={getValue('vesting')}
            onChange={(e) => handleChange('vesting', e.target.value)}
            disabled={disabled}
            className="min-h-[80px] text-xs"
          />

          <h4 className="text-xs font-semibold text-foreground border-b border-border pb-1 mt-4 mb-2">FORD</h4>
          <div className="grid grid-cols-2 gap-1.5">
            <Input value={getValue('ford1')} onChange={(e) => handleChange('ford1', e.target.value)} disabled={disabled} className="h-7 text-xs" />
            <Input value={getValue('ford2')} onChange={(e) => handleChange('ford2', e.target.value)} disabled={disabled} className="h-7 text-xs" />
            <Input value={getValue('ford3')} onChange={(e) => handleChange('ford3', e.target.value)} disabled={disabled} className="h-7 text-xs" />
            <Input value={getValue('ford4')} onChange={(e) => handleChange('ford4', e.target.value)} disabled={disabled} className="h-7 text-xs" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrowerPrimaryForm;
