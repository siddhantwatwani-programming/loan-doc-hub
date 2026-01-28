import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

// Field key mapping for tax detail fields
const FIELD_KEYS = {
  taxIdType: 'borrower.tax_id_type',
  taxId: 'borrower.tax_id',
  filingStatus: 'borrower.tax_filing_status',
  exemptions: 'borrower.tax_exemptions',
  taxYear: 'borrower.tax_year',
} as const;

interface BorrowerTaxDetailFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const BorrowerTaxDetailForm: React.FC<BorrowerTaxDetailFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getValue = (key: keyof typeof FIELD_KEYS): string => {
    return values[FIELD_KEYS[key]] || '';
  };

  const handleChange = (key: keyof typeof FIELD_KEYS, value: string) => {
    onValueChange(FIELD_KEYS[key], value);
  };

  const renderField = (key: keyof typeof FIELD_KEYS, label: string) => {
    const value = getValue(key);
    const fieldDef = fields.find(f => f.field_key === FIELD_KEYS[key]);
    const isRequired = fieldDef?.is_required || false;
    const showError = showValidation && isRequired && !value.trim();

    return (
      <div key={key} className="flex items-center gap-4">
        <Label className="w-40 text-sm text-foreground flex-shrink-0">
          {label}
        </Label>
        <Input
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          disabled={disabled}
          className={`h-8 text-sm flex-1 max-w-md ${showError ? 'border-destructive' : ''}`}
        />
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-2 mb-4">
        <span className="font-semibold text-base text-foreground">Tax Details</span>
      </div>

      <div className="space-y-3">
        {renderField('taxIdType', 'Tax ID Type')}
        {renderField('taxId', 'TIN / SSN')}
        {renderField('filingStatus', 'Filing Status')}
        {renderField('exemptions', 'Exemptions')}
        {renderField('taxYear', 'Tax Year')}
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
