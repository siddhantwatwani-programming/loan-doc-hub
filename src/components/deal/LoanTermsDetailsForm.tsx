import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface LoanTermsDetailsFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const FIELD_KEYS = {
  company: 'loan_terms.details_company',
  loanNumber: 'Terms.LoanNumber',
  assignedCsr: 'loan_terms.assigned_csr',
  originatingVendor: 'loan_terms.details_originating_vendor',
  origination: 'loan_terms.origination',
  boarding: 'loan_terms.boarding',
  maturity: 'loan_terms.maturity',
  maturityDate: 'loan_terms.maturity_date',
  lienPosition: 'loan_terms.lien_position',
  loanPurpose: 'loan_terms.loan_purpose',
  rateStructure: 'loan_terms.rate_structure',
  amortization: 'loan_terms.amortization',
  interestCalculation: 'loan_terms.interest_calculation',
  shortPaymentsAppliedTo: 'loan_terms.short_payments_applied_to',
  processingUnpaidInterest: 'loan_terms.processing_unpaid_interest',
  calculationPeriod: 'loan_terms.calculation_period',
  sellerCarry: 'loan_terms.seller_carry',
  aitdWrap: 'loan_terms.aitd_wrap',
  rehabConstruction: 'loan_terms.rehab_construction',
  variableArm: 'loan_terms.variable_arm',
  respa: 'loan_terms.respa',
  unsecured: 'loan_terms.unsecured',
  crossCollateral: 'loan_terms.cross_collateral',
  limitedNoDoc: 'loan_terms.limited_no_doc',
};

const LIEN_POSITION_OPTIONS = [
  { value: '1st', label: '1st' }, { value: '2nd', label: '2nd' },
  { value: '3rd', label: '3rd' }, { value: 'other', label: 'Other' },
];
const LOAN_PURPOSE_OPTIONS = [
  { value: 'consumer', label: 'Consumer' }, { value: 'business', label: 'Business' },
];
const RATE_STRUCTURE_OPTIONS = [
  { value: 'frm_fixed_rate', label: 'FRM – Fixed Rate' },
  { value: 'arm_adjustable_rate', label: 'ARM – Adjustable Rate' },
  { value: 'gtm_graduated_terms', label: 'GTM – Graduated Terms' },
  { value: 'other', label: 'Other' },
];
const AMORTIZATION_OPTIONS = [
  { value: 'fully_amortized', label: 'Fully Amortized' },
  { value: 'partially_amortized', label: 'Partially Amortized' },
  { value: 'interest_only', label: 'Interest Only' },
  { value: 'constant_amortization', label: 'Constant Amortization' },
  { value: 'add_on_interest', label: 'Add-On Interest' },
  { value: 'other', label: 'Other' },
];
const INTEREST_CALCULATION_OPTIONS = [
  { value: '360_day_period', label: '360 Day Period' },
  { value: '365_day_period', label: '365 Day Period' },
];
const SHORT_PAYMENTS_OPTIONS = [
  { value: 'principal_balance', label: 'Principal Balance' },
  { value: 'unpaid_interest', label: 'Unpaid Interest' },
];
const PROCESSING_UNPAID_INTEREST_OPTIONS = [
  { value: 'include_when_calculating_interest', label: 'Include when Calculating Interest' },
  { value: 'pay_automatically', label: 'Pay Automatically' },
  { value: 'both', label: 'Both' },
];
const CALCULATION_PERIOD_OPTIONS = [
  { value: 'regular_period', label: 'Regular Period (Due Date to Due Date)' },
  { value: 'actual_days_due_date', label: 'Actual Days (Due Date to Due Date)' },
  { value: 'actual_days_received_date', label: 'Actual Days (Received Date to Received Date)' },
];

export const LoanTermsDetailsForm: React.FC<LoanTermsDetailsFormProps> = ({
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getValue = (key: string) => values[key] || '';
  const setValue = (key: string, value: string) => onValueChange(key, value);
  const getBoolValue = (key: string) => values[key] === 'true';
  const setBoolValue = (key: string, value: boolean) => onValueChange(key, String(value));

  const renderInlineField = (fieldKey: string, label: string, type: 'text' | 'date' = 'text') => (
    <div className="flex items-center gap-2">
      <Label className="w-[130px] shrink-0 text-xs">{label}</Label>
      <Input id={fieldKey} value={getValue(fieldKey)} onChange={(e) => setValue(fieldKey, e.target.value)} disabled={disabled} type={type} className="h-7 text-xs flex-1" />
    </div>
  );

  const renderInlineSelect = (fieldKey: string, label: string, options: { value: string; label: string }[], placeholder: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[130px] shrink-0 text-xs">{label}</Label>
      <Select value={getValue(fieldKey)} onValueChange={(value) => setValue(fieldKey, value)} disabled={disabled}>
        <SelectTrigger id={fieldKey} className="h-7 text-xs flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-0">
        
        {/* Details Column */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Details</h3>
          {renderInlineField(FIELD_KEYS.company, 'Company')}
          {renderInlineField(FIELD_KEYS.loanNumber, 'Loan Number')}
          {renderInlineField(FIELD_KEYS.assignedCsr, 'Assigned CSR')}
          {renderInlineField(FIELD_KEYS.originatingVendor, 'Originating Vendor')}
          {renderInlineField(FIELD_KEYS.origination, 'Origination', 'date')}
          {renderInlineField(FIELD_KEYS.boarding, 'Boarding', 'date')}
          {renderInlineField(FIELD_KEYS.maturityDate, 'Maturity Date', 'date')}
        </div>

        {/* Middle Column */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">&nbsp;</h3>
          {renderInlineSelect(FIELD_KEYS.lienPosition, 'Lien Position', LIEN_POSITION_OPTIONS, 'Select')}
          {renderInlineSelect(FIELD_KEYS.loanPurpose, 'Loan Purpose', LOAN_PURPOSE_OPTIONS, 'Select')}
          {renderInlineSelect(FIELD_KEYS.rateStructure, 'Rate Structure', RATE_STRUCTURE_OPTIONS, 'Select')}
          {renderInlineSelect(FIELD_KEYS.amortization, 'Amortization', AMORTIZATION_OPTIONS, 'Select')}
          {renderInlineSelect(FIELD_KEYS.interestCalculation, 'Interest Calc', INTEREST_CALCULATION_OPTIONS, 'Select')}
          {renderInlineSelect(FIELD_KEYS.shortPaymentsAppliedTo, 'Short Payments', SHORT_PAYMENTS_OPTIONS, 'Select')}
          {renderInlineSelect(FIELD_KEYS.processingUnpaidInterest, 'Unpaid Interest', PROCESSING_UNPAID_INTEREST_OPTIONS, 'Select')}
          {renderInlineSelect(FIELD_KEYS.calculationPeriod, 'Calc Period', CALCULATION_PERIOD_OPTIONS, 'Select')}
        </div>

        {/* Loan Type Column */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Loan Type (can be multiple)</h3>
          {[
            { key: FIELD_KEYS.sellerCarry, label: 'Seller Carry' },
            { key: FIELD_KEYS.aitdWrap, label: 'AITD / Wrap' },
            { key: FIELD_KEYS.rehabConstruction, label: 'Rehab / Construction' },
            { key: FIELD_KEYS.variableArm, label: 'Variable / ARM' },
            { key: FIELD_KEYS.respa, label: 'RESPA' },
            { key: FIELD_KEYS.unsecured, label: 'Unsecured' },
            { key: FIELD_KEYS.crossCollateral, label: 'Cross Collateral' },
            { key: FIELD_KEYS.limitedNoDoc, label: 'Limited / No Doc' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox id={key} checked={getBoolValue(key)} onCheckedChange={(checked) => setBoolValue(key, !!checked)} disabled={disabled} className="h-3.5 w-3.5" />
              <Label htmlFor={key} className="font-normal cursor-pointer text-xs">{label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoanTermsDetailsForm;
