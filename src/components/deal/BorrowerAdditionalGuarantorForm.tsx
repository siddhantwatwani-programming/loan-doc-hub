import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface BorrowerAdditionalGuarantorFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

// Labels for display - mirrors Primary form structure for Additional Guarantor
const FIELD_LABELS: Record<string, string> = {
  'AdditionalGuarantor.Type': 'Borrower Type',
  'AdditionalGuarantor.ID': 'Borrower ID',
  'AdditionalGuarantor.FullName': 'Full Name: If Entity, Use Entity',
  'AdditionalGuarantor.FirstName': 'First: If Entity, Use Signer',
  'AdditionalGuarantor.MiddleName': 'Middle',
  'AdditionalGuarantor.LastName': 'Last',
  'AdditionalGuarantor.Capacity': 'Capacity',
  'AdditionalGuarantor.Email': 'Email',
  'AdditionalGuarantor.CreditScore': 'Credit Score',
  'AdditionalGuarantor.TaxIDType': 'Tax ID Type',
  'AdditionalGuarantor.TIN': 'TIN',
};

const NAME_FIELDS = [
  'AdditionalGuarantor.Type',
  'AdditionalGuarantor.ID',
  'AdditionalGuarantor.FullName',
  'AdditionalGuarantor.FirstName',
  'AdditionalGuarantor.MiddleName',
  'AdditionalGuarantor.LastName',
  'AdditionalGuarantor.Capacity',
  'AdditionalGuarantor.Email',
  'AdditionalGuarantor.CreditScore',
  'AdditionalGuarantor.TaxIDType',
  'AdditionalGuarantor.TIN',
];

const ADDRESS_FIELDS = [
  'AdditionalGuarantor.PrimaryAddress.Street',
  'AdditionalGuarantor.PrimaryAddress.City',
  'AdditionalGuarantor.PrimaryAddress.State',
  'AdditionalGuarantor.PrimaryAddress.ZIP',
];

const MAILING_FIELDS = [
  'AdditionalGuarantor.MailingAddress.Street',
  'AdditionalGuarantor.MailingAddress.City',
  'AdditionalGuarantor.MailingAddress.State',
  'AdditionalGuarantor.MailingAddress.ZIP',
];

export const BorrowerAdditionalGuarantorForm: React.FC<BorrowerAdditionalGuarantorFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getFieldValue = (key: string) => values[key] || '';

  const renderField = (fieldKey: string, label?: string) => {
    const displayLabel = label || FIELD_LABELS[fieldKey] || fieldKey.split('.').pop() || fieldKey;
    const value = getFieldValue(fieldKey);
    const field = fields.find(f => f.field_key === fieldKey);
    const isRequired = field?.is_required || false;
    const showError = showValidation && isRequired && !value.trim();

    return (
      <div key={fieldKey} className="flex items-center gap-2">
        <Label className="w-44 text-xs text-foreground flex-shrink-0">
          {displayLabel}
        </Label>
        <Input
          value={value}
          onChange={(e) => onValueChange(fieldKey, e.target.value)}
          disabled={disabled}
          className={`h-7 text-xs flex-1 ${showError ? 'border-destructive' : ''}`}
        />
      </div>
    );
  };

  const renderPhoneField = (fieldKey: string, label: string) => {
    const value = getFieldValue(fieldKey);
    const preferredKey = `${fieldKey}.Preferred`;
    const preferredValue = getFieldValue(preferredKey);

    return (
      <div key={fieldKey} className="flex items-center gap-2">
        <Label className="w-16 text-xs text-foreground flex-shrink-0">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onValueChange(fieldKey, e.target.value)}
          disabled={disabled}
          className="h-7 text-xs w-24"
        />
        <div className="flex items-center gap-1">
          <Checkbox
            id={preferredKey}
            checked={preferredValue === 'true'}
            onCheckedChange={(checked) => onValueChange(preferredKey, checked ? 'true' : 'false')}
            disabled={disabled}
            className="h-4 w-4"
          />
          <Label htmlFor={preferredKey} className="text-xs text-muted-foreground">Preferred</Label>
        </div>
        <Input
          placeholder=""
          disabled={disabled}
          className="h-7 text-xs flex-1"
        />
      </div>
    );
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
            {NAME_FIELDS.map(key => renderField(key))}
          </div>
        </div>

        {/* Column 2: Primary Address + Phone */}
        <div className="space-y-4">
          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Primary Address</span>
            </div>
            <div className="space-y-1.5">
              {ADDRESS_FIELDS.map(key => renderField(key))}
            </div>
          </div>

          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Phone</span>
            </div>
            <div className="space-y-1.5">
              {renderPhoneField('AdditionalGuarantor.Phone.Home', 'Home')}
              {renderPhoneField('AdditionalGuarantor.Phone.Home2', 'Home')}
              {renderPhoneField('AdditionalGuarantor.Phone.Work', 'Work')}
              {renderPhoneField('AdditionalGuarantor.Phone.Cell', 'Cell')}
              {renderPhoneField('AdditionalGuarantor.Phone.Fax', 'Fax')}
              <div className="flex items-center gap-2">
                <Label className="w-16 text-xs text-foreground flex-shrink-0">Issue 1098</Label>
                <Input
                  value={getFieldValue('AdditionalGuarantor.Issue1098')}
                  onChange={(e) => onValueChange('AdditionalGuarantor.Issue1098', e.target.value)}
                  disabled={disabled}
                  className="h-7 text-xs w-24"
                />
                <Checkbox
                  id="guarantor-issue1098-check"
                  disabled={disabled}
                  className="h-4 w-4"
                />
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
                  checked={getFieldValue('AdditionalGuarantor.MailingAddress.SameAsPrimary') === 'true'}
                  onCheckedChange={(checked) => onValueChange('AdditionalGuarantor.MailingAddress.SameAsPrimary', checked ? 'true' : 'false')}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label htmlFor="guarantor-same-as-primary" className="text-xs text-muted-foreground">Same as Primary</Label>
              </div>
            </div>
            <div className="space-y-1.5">
              {MAILING_FIELDS.map(key => renderField(key))}
            </div>
          </div>

          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Vesting</span>
            </div>
            <div className="space-y-1.5">
              <Input
                value={getFieldValue('AdditionalGuarantor.Vesting')}
                onChange={(e) => onValueChange('AdditionalGuarantor.Vesting', e.target.value)}
                disabled={disabled}
                className="h-16 text-xs flex-1"
              />
              <div className="border-b border-border pb-1 mb-2 mt-4">
                <span className="font-semibold text-sm text-foreground">FORD</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={getFieldValue('AdditionalGuarantor.FORD.1')}
                  onChange={(e) => onValueChange('AdditionalGuarantor.FORD.1', e.target.value)}
                  disabled={disabled}
                  className="h-7 text-xs"
                />
                <Input
                  value={getFieldValue('AdditionalGuarantor.FORD.2')}
                  onChange={(e) => onValueChange('AdditionalGuarantor.FORD.2', e.target.value)}
                  disabled={disabled}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BorrowerAdditionalGuarantorForm;
