import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

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
  const getValue = (key: keyof typeof FIELD_KEYS): string => values[FIELD_KEYS[key]] || '';

  const handleChange = (key: keyof typeof FIELD_KEYS, value: string) => {
    onValueChange(FIELD_KEYS[key], value);
  };

  const renderField = (key: keyof typeof FIELD_KEYS, label: string) => {
    const value = getValue(key);
    const fieldDef = fields.find(f => f.field_key === FIELD_KEYS[key]);
    const isRequired = fieldDef?.is_required || false;
    const showError = showValidation && isRequired && !value.trim();

    return (
      <div key={key} className="flex items-center gap-2">
        <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">{label}</Label>
        <Input
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          disabled={disabled}
          className={`h-7 text-xs flex-1 min-w-0 max-w-sm ${showError ? 'border-destructive' : ''}`}
        />
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="border-b border-border pb-1 mb-3">
        <span className="font-semibold text-xs text-foreground">1098</span>
      </div>

      <div className="space-y-2">
        {renderField('taxIdType', 'Tax ID Type')}
        {renderField('taxId', 'TIN / SSN')}
        {renderField('filingStatus', 'Filing Status')}
        {renderField('exemptions', 'Exemptions')}
        {renderField('taxYear', 'Tax Year')}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Tax information is used for 1098 form generation and IRS reporting requirements.
        </p>
      </div>
    </div>
  );
};

export default BorrowerTaxDetailForm;
