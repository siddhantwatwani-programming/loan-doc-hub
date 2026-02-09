import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface CoBorrowerTaxDetailFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const TAX_FILING_STATUS_OPTIONS = [
  'Single',
  'Married Filing Jointly',
  'Married Filing Separately',
  'Head of Household',
  'Qualifying Widow(er)',
];

const TAX_ID_TYPE_OPTIONS = ['SSN', 'EIN', 'ITIN'];

export const CoBorrowerTaxDetailForm: React.FC<CoBorrowerTaxDetailFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (key: string) => values[`coborrower.${key}`] || '';
  const getBoolValue = (key: string) => values[`coborrower.${key}`] === 'true';

  const handleChange = (key: string, value: string) => {
    onValueChange(`coborrower.${key}`, value);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-lg text-foreground">1098</h3>
        <p className="text-sm text-muted-foreground">
          Co-borrower tax identification and filing information.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Tax Identification */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Tax Identification</h4>
            
            <div className="space-y-2">
              <Label htmlFor="taxIdType">Tax ID Type</Label>
              <Select
                value={getValue('tax_id_type')}
                onValueChange={(value) => handleChange('tax_id_type', value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tax ID type" />
                </SelectTrigger>
                <SelectContent>
                  {TAX_ID_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / SSN</Label>
              <Input
                id="taxId"
                value={getValue('tax_id')}
                onChange={(e) => handleChange('tax_id', e.target.value)}
                placeholder="Enter tax ID or SSN"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filingStatus">Filing Status</Label>
              <Select
                value={getValue('tax.filing_status')}
                onValueChange={(value) => handleChange('tax.filing_status', value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select filing status" />
                </SelectTrigger>
                <SelectContent>
                  {TAX_FILING_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="taxExempt"
                checked={getBoolValue('tax.exempt')}
                onCheckedChange={(checked) => handleChange('tax.exempt', String(!!checked))}
                disabled={disabled}
              />
              <Label htmlFor="taxExempt" className="font-normal">Tax Exempt</Label>
            </div>
          </div>
        </div>

        {/* Right Column - Additional Tax Info */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Additional Tax Information</h4>
            
            <div className="space-y-2">
              <Label htmlFor="taxYear">Tax Year</Label>
              <Input
                id="taxYear"
                value={getValue('tax.year')}
                onChange={(e) => handleChange('tax.year', e.target.value)}
                placeholder="Enter tax year"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualIncome">Annual Income</Label>
              <Input
                id="annualIncome"
                type="number"
                value={getValue('tax.annual_income')}
                onChange={(e) => handleChange('tax.annual_income', e.target.value)}
                placeholder="Enter annual income"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxBracket">Tax Bracket (%)</Label>
              <Input
                id="taxBracket"
                type="number"
                value={getValue('tax.bracket')}
                onChange={(e) => handleChange('tax.bracket', e.target.value)}
                placeholder="Enter tax bracket percentage"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxNotes">Notes</Label>
              <Input
                id="taxNotes"
                value={getValue('tax.notes')}
                onChange={(e) => handleChange('tax.notes', e.target.value)}
                placeholder="Enter any tax-related notes"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoBorrowerTaxDetailForm;
