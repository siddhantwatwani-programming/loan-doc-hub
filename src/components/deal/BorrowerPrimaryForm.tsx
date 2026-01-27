import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface BorrowerPrimaryFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

// Field mapping for the Primary sub-section based on screenshot layout
const PRIMARY_FIELD_GROUPS = {
  name: [
    'Borrower.Type',
    'Borrower.ID',
    'Borrower.FullName',
    'Borrower.FirstName',
    'Borrower.MiddleName',
    'Borrower.LastName',
    'Borrower.Capacity',
    'Borrower.Email',
    'Borrower.CreditScore',
    'Borrower.TaxIDType',
    'Borrower.TIN',
  ],
  primaryAddress: [
    'Borrower.PrimaryAddress.Street',
    'Borrower.PrimaryAddress.City',
    'Borrower.PrimaryAddress.State',
    'Borrower.PrimaryAddress.ZIP',
  ],
  phone: [
    'Borrower.Phone.Home',
    'Borrower.Phone.Work',
    'Borrower.Phone.Cell',
    'Borrower.Phone.Fax',
    'Borrower.Issue1098',
  ],
  mailingAddress: [
    'Borrower.MailingAddress.SameAsPrimary',
    'Borrower.MailingAddress.Street',
    'Borrower.MailingAddress.City',
    'Borrower.MailingAddress.State',
    'Borrower.MailingAddress.ZIP',
  ],
  vesting: [
    'Borrower.Vesting',
    'Borrower.FORD',
  ],
};

// Labels for display
const FIELD_LABELS: Record<string, string> = {
  'Borrower.Type': 'Borrower Type',
  'Borrower.ID': 'Borrower ID',
  'Borrower.FullName': 'Full Name: If Entity, Use Entity',
  'Borrower.FirstName': 'First: If Entity, Use Signer',
  'Borrower.MiddleName': 'Middle',
  'Borrower.LastName': 'Last',
  'Borrower.Capacity': 'Capacity',
  'Borrower.Email': 'Email',
  'Borrower.CreditScore': 'Credit Score',
  'Borrower.TaxIDType': 'Tax ID Type',
  'Borrower.TIN': 'TIN',
  'Borrower.PrimaryAddress.Street': 'Street',
  'Borrower.PrimaryAddress.City': 'City',
  'Borrower.PrimaryAddress.State': 'State',
  'Borrower.PrimaryAddress.ZIP': 'ZIP',
  'Borrower.Phone.Home': 'Home',
  'Borrower.Phone.Work': 'Work',
  'Borrower.Phone.Cell': 'Cell',
  'Borrower.Phone.Fax': 'Fax',
  'Borrower.Issue1098': 'Issue 1098',
  'Borrower.MailingAddress.SameAsPrimary': 'Same as Primary',
  'Borrower.MailingAddress.Street': 'Street',
  'Borrower.MailingAddress.City': 'City',
  'Borrower.MailingAddress.State': 'State',
  'Borrower.MailingAddress.ZIP': 'ZIP',
  'Borrower.Vesting': 'Vesting',
  'Borrower.FORD': 'FORD',
};

export const BorrowerPrimaryForm: React.FC<BorrowerPrimaryFormProps> = ({
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
      {/* Main Grid Layout */}
      <div className="grid grid-cols-3 gap-x-8 gap-y-0">
        {/* Column 1: Name Fields */}
        <div className="space-y-2">
          <div className="border-b border-border pb-1 mb-3">
            <span className="font-semibold text-sm text-foreground">Name</span>
          </div>
          <div className="space-y-1.5">
            {PRIMARY_FIELD_GROUPS.name.map(key => renderField(key))}
          </div>
        </div>

        {/* Column 2: Primary Address + Phone */}
        <div className="space-y-4">
          {/* Primary Address */}
          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Primary Address</span>
            </div>
            <div className="space-y-1.5">
              {PRIMARY_FIELD_GROUPS.primaryAddress.map(key => renderField(key))}
            </div>
          </div>

          {/* Phone Section */}
          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Phone</span>
            </div>
            <div className="space-y-1.5">
              {renderPhoneField('Borrower.Phone.Home', 'Home')}
              {renderPhoneField('Borrower.Phone.Home2', 'Home')}
              {renderPhoneField('Borrower.Phone.Work', 'Work')}
              {renderPhoneField('Borrower.Phone.Cell', 'Cell')}
              {renderPhoneField('Borrower.Phone.Fax', 'Fax')}
              <div className="flex items-center gap-2">
                <Label className="w-16 text-xs text-foreground flex-shrink-0">Issue 1098</Label>
                <Input
                  value={getFieldValue('Borrower.Issue1098')}
                  onChange={(e) => onValueChange('Borrower.Issue1098', e.target.value)}
                  disabled={disabled}
                  className="h-7 text-xs w-24"
                />
                <Checkbox
                  id="issue1098-check"
                  disabled={disabled}
                  className="h-4 w-4"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Mailing Address + Vesting */}
        <div className="space-y-4">
          {/* Mailing Address */}
          <div>
            <div className="border-b border-border pb-1 mb-3 flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground">Mailing Address</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="same-as-primary"
                  checked={getFieldValue('Borrower.MailingAddress.SameAsPrimary') === 'true'}
                  onCheckedChange={(checked) => onValueChange('Borrower.MailingAddress.SameAsPrimary', checked ? 'true' : 'false')}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label htmlFor="same-as-primary" className="text-xs text-muted-foreground">Same as Primary</Label>
              </div>
            </div>
            <div className="space-y-1.5">
              {PRIMARY_FIELD_GROUPS.mailingAddress.slice(1).map(key => renderField(key))}
            </div>
          </div>

          {/* Vesting Section */}
          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Vesting</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Input
                  value={getFieldValue('Borrower.Vesting')}
                  onChange={(e) => onValueChange('Borrower.Vesting', e.target.value)}
                  disabled={disabled}
                  className="h-16 text-xs flex-1"
                />
              </div>
              <div className="border-b border-border pb-1 mb-2 mt-4">
                <span className="font-semibold text-sm text-foreground">FORD</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={getFieldValue('Borrower.FORD.1')}
                  onChange={(e) => onValueChange('Borrower.FORD.1', e.target.value)}
                  disabled={disabled}
                  className="h-7 text-xs"
                />
                <Input
                  value={getFieldValue('Borrower.FORD.2')}
                  onChange={(e) => onValueChange('Borrower.FORD.2', e.target.value)}
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

export default BorrowerPrimaryForm;
