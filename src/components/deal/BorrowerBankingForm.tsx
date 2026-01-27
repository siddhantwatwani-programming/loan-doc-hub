import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface BorrowerBankingFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const BANKING_FIELDS = [
  { key: 'Borrower.Banking.BankName', label: 'Bank Name' },
  { key: 'Borrower.Banking.AccountType', label: 'Account Type' },
  { key: 'Borrower.Banking.RoutingNumber', label: 'Routing Number' },
  { key: 'Borrower.Banking.AccountNumber', label: 'Account Number' },
  { key: 'Borrower.Banking.AccountHolderName', label: 'Account Holder Name' },
];

export const BorrowerBankingForm: React.FC<BorrowerBankingFormProps> = ({
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

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-2 mb-4">
        <span className="font-semibold text-base text-foreground">Banking Information</span>
      </div>

      <div className="space-y-3">
        {BANKING_FIELDS.map(({ key, label }) => renderField(key, label))}
      </div>

      <div className="pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Banking information is used for ACH payments and direct deposits. Ensure all details are accurate before submission.
        </p>
      </div>
    </div>
  );
};

export default BorrowerBankingForm;
