import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface BorrowerTaxDetailFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const TAX_DETAIL_FIELDS = [
  { key: 'Borrower.Tax.TaxIDType', label: 'Tax ID Type' },
  { key: 'Borrower.Tax.TIN', label: 'TIN / SSN' },
  { key: 'Borrower.Tax.FilingStatus', label: 'Filing Status' },
  { key: 'Borrower.Tax.Exemptions', label: 'Exemptions' },
  { key: 'Borrower.Tax.TaxYear', label: 'Tax Year' },
];

const TAX_CHECKBOX_OPTIONS = [
  { key: 'Borrower.Tax.Issue1098', label: 'Issue 1098' },
  { key: 'Borrower.Tax.W9Received', label: 'W-9 Received' },
  { key: 'Borrower.Tax.ForeignIndicator', label: 'Foreign Indicator' },
];

export const BorrowerTaxDetailForm: React.FC<BorrowerTaxDetailFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getFieldValue = (key: string) => values[key] || '';

  const renderField = (fieldKey: string, label: string) => {
    const value = getFieldValue(fieldKey);
    const field = fields.find(f => f.field_key === fieldKey);
    const isRequired = field?.is_required || false;
    const showError = showValidation && isRequired && !value.trim();

    return (
      <div key={fieldKey} className="flex items-center gap-4">
        <Label className="w-40 text-sm text-foreground flex-shrink-0">
          {label}
        </Label>
        <Input
          value={value}
          onChange={(e) => onValueChange(fieldKey, e.target.value)}
          disabled={disabled}
          className={`h-8 text-sm flex-1 max-w-md ${showError ? 'border-destructive' : ''}`}
        />
      </div>
    );
  };

  const renderCheckbox = (fieldKey: string, label: string) => {
    const value = getFieldValue(fieldKey);

    return (
      <div key={fieldKey} className="flex items-center gap-2">
        <Checkbox
          id={fieldKey}
          checked={value === 'true'}
          onCheckedChange={(checked) => onValueChange(fieldKey, checked ? 'true' : 'false')}
          disabled={disabled}
          className="h-4 w-4"
        />
        <Label htmlFor={fieldKey} className="text-sm text-foreground">
          {label}
        </Label>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-2 mb-4">
        <span className="font-semibold text-base text-foreground">Tax Details</span>
      </div>

      <div className="space-y-3">
        {TAX_DETAIL_FIELDS.map(({ key, label }) => renderField(key, label))}
      </div>

      <div className="pt-4">
        <div className="border-b border-border pb-2 mb-4">
          <span className="font-semibold text-sm text-foreground">Tax Options</span>
        </div>
        <div className="flex flex-wrap gap-6">
          {TAX_CHECKBOX_OPTIONS.map(({ key, label }) => renderCheckbox(key, label))}
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Tax information is used for 1098 form generation and IRS reporting requirements.
        </p>
      </div>
    </div>
  );
};

export default BorrowerTaxDetailForm;
