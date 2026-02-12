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
  'Single', 'Married Filing Jointly', 'Married Filing Separately',
  'Head of Household', 'Qualifying Widow(er)',
];

const TAX_ID_TYPE_OPTIONS = ['SSN', 'EIN', 'ITIN'];

export const CoBorrowerTaxDetailForm: React.FC<CoBorrowerTaxDetailFormProps> = ({
  values, onValueChange, disabled = false,
}) => {
  const getValue = (key: string) => values[`coborrower.${key}`] || '';
  const getBoolValue = (key: string) => values[`coborrower.${key}`] === 'true';
  const handleChange = (key: string, value: string) => onValueChange(`coborrower.${key}`, value);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-base text-foreground">1098</h3>
        <p className="text-xs text-muted-foreground">Co-borrower tax identification and filing information.</p>
      </div>

      <div className="form-section-header">Tax Identification</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Tax ID Type</Label>
          <Select value={getValue('tax_id_type')} onValueChange={(value) => handleChange('tax_id_type', value)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{TAX_ID_TYPE_OPTIONS.map((type) => (<SelectItem key={type} value={type}>{type}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Tax ID / SSN</Label>
          <Input value={getValue('tax_id')} onChange={(e) => handleChange('tax_id', e.target.value)} placeholder="Enter tax ID or SSN" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Filing Status</Label>
          <Select value={getValue('tax.filing_status')} onValueChange={(value) => handleChange('tax.filing_status', value)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{TAX_FILING_STATUS_OPTIONS.map((status) => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="inline-field">
          <Label className="inline-label"></Label>
          <div className="flex items-center gap-1.5 flex-1">
            <Checkbox id="taxExempt" checked={getBoolValue('tax.exempt')} onCheckedChange={(checked) => handleChange('tax.exempt', String(!!checked))} disabled={disabled} />
            <Label htmlFor="taxExempt" className="font-normal text-sm">Tax Exempt</Label>
          </div>
        </div>
      </div>

      <div className="form-section-header">Additional Tax Information</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Tax Year</Label>
          <Input value={getValue('tax.year')} onChange={(e) => handleChange('tax.year', e.target.value)} placeholder="Enter tax year" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Annual Income</Label>
          <Input type="number" value={getValue('tax.annual_income')} onChange={(e) => handleChange('tax.annual_income', e.target.value)} placeholder="Enter annual income" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Tax Bracket (%)</Label>
          <Input type="number" value={getValue('tax.bracket')} onChange={(e) => handleChange('tax.bracket', e.target.value)} placeholder="Enter %" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Notes</Label>
          <Input value={getValue('tax.notes')} onChange={(e) => handleChange('tax.notes', e.target.value)} placeholder="Enter notes" disabled={disabled} className="h-7 text-sm" />
        </div>
      </div>
    </div>
  );
};

export default CoBorrowerTaxDetailForm;
