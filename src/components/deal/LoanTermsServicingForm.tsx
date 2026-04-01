import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';
import {
  numericKeyDown,
  numericPaste,
  formatCurrencyDisplay,
  unformatCurrencyDisplay,
  formatPercentageDisplay,
  unformatPercentageDisplay,
} from '@/lib/numericInputFilter';

interface LoanTermsServicingFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const SERVICE_ROWS = [
  { key: 'standard_servicing', label: 'Standard Servicing', isHeader: false },
  { key: 'high_touch', label: 'High Touch', isHeader: false },
  { key: 'default', label: 'Default', isHeader: false, isLink: true },
  { key: 'minimum_fee', label: 'Minimum Fee', isHeader: false },
  { key: 'minimum_per_lender', label: 'Minimum Per Lender', isHeader: false },
  { key: 'spacer_1', label: '', isHeader: false, isSpacer: true },
  { key: 'calfirpta', label: 'CALFIRPTA', isHeader: false },
  { key: 'escrow_impound', label: 'Escrow Impound', isHeader: false },
  { key: 'insurance_tracking', label: 'Insurance Tracking', isHeader: false },
  { key: 'tax_tracking', label: 'Tax Tracking', isHeader: false },
  { key: 'senior_lien_tracking', label: 'Senior Lien tracking', isHeader: false },
  { key: 'additional_disbursements', label: 'Additional Disbursements', isHeader: false },
  { key: 'document_storage', label: 'Document Storage', isHeader: false },
  { key: 'mail', label: 'Mail', isHeader: false },
  { key: 'reserve_pass_through', label: 'Reserve Pass: Through', isHeader: false },
  { key: 'reserve_hold_and_pay', label: 'Reserve: Hold and Pay', isHeader: false },
  { key: 'late_notice', label: 'Late Notice', isHeader: false },
  { key: 'buyer_notice', label: 'Buyer Notice', isHeader: false },
  { key: 'seller_notice', label: 'Seller Notice', isHeader: false },
  { key: 'third_party_notice', label: '3rd Party Notice', isHeader: false },
];

const GRID_COLUMNS = [
  { key: 'cost', label: 'Cost' },
  { key: 'lender_percent', label: 'Lender(s) %' },
  { key: 'lenders_split', label: 'Lenders Split' },
  { key: 'borrower_amount', label: 'Borrower $' },
  { key: 'borrower_percent', label: 'Borrower %' },
  { key: 'broker', label: 'Broker' },
];

const CURRENCY_COLS = new Set(['cost', 'borrower_amount']);
const PERCENT_COLS = new Set(['lender_percent', 'borrower_percent']);

const ServicingInput: React.FC<{
  colKey: string;
  fieldKey: string;
  value: string;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled: boolean;
}> = ({ colKey, fieldKey, value, onValueChange, disabled }) => {
  const isCurrency = CURRENCY_COLS.has(colKey);
  const isPercent = PERCENT_COLS.has(colKey);
  const [focused, setFocused] = React.useState(false);

  const displayValue = React.useMemo(() => {
    if (focused) return value;
    if (isCurrency) return formatCurrencyDisplay(value);
    if (isPercent) return formatPercentageDisplay(value);
    return value;
  }, [value, focused, isCurrency, isPercent]);

  const handleFocus = () => {
    setFocused(true);
    if (isCurrency) {
      onValueChange(fieldKey, unformatCurrencyDisplay(value));
    } else if (isPercent) {
      onValueChange(fieldKey, unformatPercentageDisplay(value));
    }
  };

  const handleBlur = () => {
    setFocused(false);
    if (isCurrency && value) {
      onValueChange(fieldKey, formatCurrencyDisplay(value));
    } else if (isPercent && value) {
      onValueChange(fieldKey, formatPercentageDisplay(value));
    }
  };

  const showDollar = isCurrency && !!displayValue;
  const showPercent = isPercent && !!displayValue && !focused;

  return (
    <div className="relative">
      {showDollar && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none z-10">$</span>
      )}
      <Input
        value={displayValue}
        onChange={(e) => onValueChange(fieldKey, e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...(colKey !== 'broker' ? {
          onKeyDown: numericKeyDown,
          onPaste: (e: React.ClipboardEvent<HTMLInputElement>) => numericPaste(e, (v) => onValueChange(fieldKey, v)),
          inputMode: 'decimal' as const,
        } : {})}
        disabled={disabled}
        className={`h-7 text-xs border-border ${isCurrency || isPercent ? 'text-right' : ''} ${showDollar ? 'pl-4' : ''} ${isPercent ? 'pr-5' : ''}`}
      />
      {showPercent && (
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none z-10">%</span>
      )}
    </div>
  );
};

export const LoanTermsServicingForm: React.FC<LoanTermsServicingFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const getFieldKey = (rowKey: string, colKey: string) => 
    `loan_terms.servicing.${rowKey}.${colKey}`;

  return (
    <div className="p-6 space-y-6">
      {/* Override and Lender Split Dropdown */}
      <div className="flex items-center justify-between gap-8">
        <DirtyFieldWrapper fieldKey="loan_terms.servicing.override">
          <div className="flex items-center gap-3">
            <Label className="text-sm font-medium">Override</Label>
            <Checkbox
              checked={values['loan_terms.servicing.override'] === 'true'}
              onCheckedChange={(checked) => 
                onValueChange('loan_terms.servicing.override', checked ? 'true' : 'false')
              }
              disabled={disabled}
            />
          </div>
        </DirtyFieldWrapper>
      </div>

      {/* Services Grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-3 py-2 font-medium text-foreground w-48">Services</th>
                <th className="text-left px-1 py-2 font-medium text-foreground w-8"></th>
                {GRID_COLUMNS.map((col) => (
                  <th key={col.key} className="text-left px-2 py-2 font-medium text-foreground min-w-24">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SERVICE_ROWS.map((row, index) => (
                <tr 
                  key={row.key} 
                  className={`border-b border-border last:border-b-0 ${
                    row.isSpacer ? 'h-6 bg-muted/20' : 'hover:bg-muted/30'
                  }`}
                >
                  <td className="px-3 py-1.5">
                    {row.isLink ? (
                      <span className="text-primary cursor-pointer hover:underline">{row.label}</span>
                    ) : (
                      <span className="text-foreground">{row.label}</span>
                    )}
                  </td>
                  <td className="px-1 py-1.5">
                    {!row.isSpacer && (
                      <DirtyFieldWrapper fieldKey={`loan_terms.servicing.${row.key}.enabled`}>
                        <Checkbox
                          checked={values[`loan_terms.servicing.${row.key}.enabled`] === 'true'}
                          onCheckedChange={(checked) => 
                            onValueChange(`loan_terms.servicing.${row.key}.enabled`, checked ? 'true' : 'false')
                          }
                          disabled={disabled}
                          className="h-4 w-4"
                        />
                      </DirtyFieldWrapper>
                    )}
                  </td>
                  {GRID_COLUMNS.map((col) => (
                    <td key={col.key} className="px-1 py-1">
                      {!row.isSpacer && (
                        <DirtyFieldWrapper fieldKey={getFieldKey(row.key, col.key)}>
                          {col.key === 'lenders_split' ? (
                            <Select
                              value={values[getFieldKey(row.key, col.key)] || ''}
                              onValueChange={(value) => onValueChange(getFieldKey(row.key, col.key), value)}
                              disabled={disabled}
                            >
                              <SelectTrigger className="h-7 text-xs border-border">
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fee_per_lender">Fee Per Lender - No Split</SelectItem>
                                <SelectItem value="pro_rata">Pro Rata</SelectItem>
                                <SelectItem value="split_50_50">Split 50/50</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <ServicingInput
                              colKey={col.key}
                              fieldKey={getFieldKey(row.key, col.key)}
                              value={values[getFieldKey(row.key, col.key)] || ''}
                              onValueChange={onValueChange}
                              disabled={disabled}
                            />
                          )}
                        </DirtyFieldWrapper>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Extra row at the bottom for custom entry */}
              <tr className="border-b border-border hover:bg-muted/30">
                <td className="px-3 py-1.5">
                  <Input
                    value={values['loan_terms.servicing.custom.label'] || ''}
                    onChange={(e) => onValueChange('loan_terms.servicing.custom.label', e.target.value)}
                    disabled={disabled}
                    placeholder="Custom service..."
                    className="h-7 text-xs border-border"
                  />
                </td>
                <td className="px-1 py-1.5">
                  <DirtyFieldWrapper fieldKey="loan_terms.servicing.custom.enabled">
                    <Checkbox
                      checked={values['loan_terms.servicing.custom.enabled'] === 'true'}
                      onCheckedChange={(checked) => 
                        onValueChange('loan_terms.servicing.custom.enabled', checked ? 'true' : 'false')
                      }
                      disabled={disabled}
                      className="h-4 w-4"
                    />
                  </DirtyFieldWrapper>
                </td>
                {GRID_COLUMNS.map((col) => (
                  <td key={col.key} className="px-1 py-1">
                    <DirtyFieldWrapper fieldKey={`loan_terms.servicing.custom.${col.key}`}>
                      {col.key === 'lenders_split' ? (
                        <Select
                          value={values[`loan_terms.servicing.custom.${col.key}`] || ''}
                          onValueChange={(value) => onValueChange(`loan_terms.servicing.custom.${col.key}`, value)}
                          disabled={disabled}
                        >
                          <SelectTrigger className="h-7 text-xs border-border">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fee_per_lender">Fee Per Lender - No Split</SelectItem>
                            <SelectItem value="pro_rata">Pro Rata</SelectItem>
                            <SelectItem value="split_50_50">Split 50/50</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <ServicingInput
                          colKey={col.key}
                          fieldKey={`loan_terms.servicing.custom.${col.key}`}
                          value={values[`loan_terms.servicing.custom.${col.key}`] || ''}
                          onValueChange={onValueChange}
                          disabled={disabled}
                        />
                      )}
                    </DirtyFieldWrapper>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoanTermsServicingForm;
