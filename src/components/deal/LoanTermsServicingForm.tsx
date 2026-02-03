import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

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
        
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium">Dropdown for Lender Split</Label>
          <Select
            value={values['loan_terms.servicing.lender_split_type'] || 'fee_per_lender'}
            onValueChange={(value) => onValueChange('loan_terms.servicing.lender_split_type', value)}
            disabled={disabled}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fee_per_lender">Fee Per Lender - No Split</SelectItem>
              <SelectItem value="pro_rata">Pro Rata</SelectItem>
              <SelectItem value="split_50_50">Split 50/50</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
                      <Checkbox
                        checked={values[`loan_terms.servicing.${row.key}.enabled`] === 'true'}
                        onCheckedChange={(checked) => 
                          onValueChange(`loan_terms.servicing.${row.key}.enabled`, checked ? 'true' : 'false')
                        }
                        disabled={disabled}
                        className="h-4 w-4"
                      />
                    )}
                  </td>
                  {GRID_COLUMNS.map((col) => (
                    <td key={col.key} className="px-1 py-1">
                      {!row.isSpacer && (
                        <Input
                          value={values[getFieldKey(row.key, col.key)] || ''}
                          onChange={(e) => onValueChange(getFieldKey(row.key, col.key), e.target.value)}
                          disabled={disabled}
                          className="h-7 text-xs border-border"
                        />
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
                  <Checkbox
                    checked={values['loan_terms.servicing.custom.enabled'] === 'true'}
                    onCheckedChange={(checked) => 
                      onValueChange('loan_terms.servicing.custom.enabled', checked ? 'true' : 'false')
                    }
                    disabled={disabled}
                    className="h-4 w-4"
                  />
                </td>
                {GRID_COLUMNS.map((col) => (
                  <td key={col.key} className="px-1 py-1">
                    <Input
                      value={values[`loan_terms.servicing.custom.${col.key}`] || ''}
                      onChange={(e) => onValueChange(`loan_terms.servicing.custom.${col.key}`, e.target.value)}
                      disabled={disabled}
                      className="h-7 text-xs border-border"
                    />
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
