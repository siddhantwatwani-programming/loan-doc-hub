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

// Field keys for Details tab
const FIELD_KEYS = {
  // Details column
  company: 'loan_terms.details_company',
  loanNumber: 'Terms.LoanNumber',
  assignedCsr: 'loan_terms.assigned_csr',
  originatingVendor: 'loan_terms.details_originating_vendor',
  origination: 'loan_terms.origination',
  boarding: 'loan_terms.boarding',
  maturity: 'loan_terms.maturity',
  maturityDate: 'loan_terms.maturity_date',

  // Middle column
  lienPosition: 'loan_terms.lien_position',
  loanPurpose: 'loan_terms.loan_purpose',
  rateStructure: 'loan_terms.rate_structure',
  amortization: 'loan_terms.amortization',
  interestCalculation: 'loan_terms.interest_calculation',
  shortPaymentsAppliedTo: 'loan_terms.short_payments_applied_to',
  processingUnpaidInterest: 'loan_terms.processing_unpaid_interest',
  calculationPeriod: 'loan_terms.calculation_period',

  // Loan Type column (checkboxes)
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
  { value: '1st', label: '1st' },
  { value: '2nd', label: '2nd' },
  { value: '3rd', label: '3rd' },
  { value: 'other', label: 'Other' },
];

const LOAN_PURPOSE_OPTIONS = [
  { value: 'consumer', label: 'Consumer' },
  { value: 'business', label: 'Business' },
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

  return (
    <div className="p-6 space-y-8">
      {/* Three Column Layout: Details | Middle | Loan Type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Details Column */}
        <div className="space-y-6">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">Details</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.company}>Company</Label>
              <Input
                id={FIELD_KEYS.company}
                value={getValue(FIELD_KEYS.company)}
                onChange={(e) => setValue(FIELD_KEYS.company, e.target.value)}
                disabled={disabled}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.loanNumber}>Loan Number</Label>
              <Input
                id={FIELD_KEYS.loanNumber}
                value={getValue(FIELD_KEYS.loanNumber)}
                onChange={(e) => setValue(FIELD_KEYS.loanNumber, e.target.value)}
                disabled={disabled}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.assignedCsr}>Assigned CSR</Label>
              <Input
                id={FIELD_KEYS.assignedCsr}
                value={getValue(FIELD_KEYS.assignedCsr)}
                onChange={(e) => setValue(FIELD_KEYS.assignedCsr, e.target.value)}
                disabled={disabled}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.originatingVendor}>Originating Vendor</Label>
              <Input
                id={FIELD_KEYS.originatingVendor}
                value={getValue(FIELD_KEYS.originatingVendor)}
                onChange={(e) => setValue(FIELD_KEYS.originatingVendor, e.target.value)}
                disabled={disabled}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.origination}>Origination</Label>
              <Input
                id={FIELD_KEYS.origination}
                type="date"
                value={getValue(FIELD_KEYS.origination)}
                onChange={(e) => setValue(FIELD_KEYS.origination, e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.boarding}>Boarding</Label>
              <Input
                id={FIELD_KEYS.boarding}
                type="date"
                value={getValue(FIELD_KEYS.boarding)}
                onChange={(e) => setValue(FIELD_KEYS.boarding, e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.maturityDate}>Maturity Date</Label>
              <Input
                id={FIELD_KEYS.maturityDate}
                type="date"
                value={getValue(FIELD_KEYS.maturityDate)}
                onChange={(e) => setValue(FIELD_KEYS.maturityDate, e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Middle Column */}
        <div className="space-y-6">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">&nbsp;</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.lienPosition}>Lien Position</Label>
              <Select
                value={getValue(FIELD_KEYS.lienPosition)}
                onValueChange={(value) => setValue(FIELD_KEYS.lienPosition, value)}
                disabled={disabled}
              >
                <SelectTrigger id={FIELD_KEYS.lienPosition}>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {LIEN_POSITION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.loanPurpose}>Loan Purpose</Label>
              <Select
                value={getValue(FIELD_KEYS.loanPurpose)}
                onValueChange={(value) => setValue(FIELD_KEYS.loanPurpose, value)}
                disabled={disabled}
              >
                <SelectTrigger id={FIELD_KEYS.loanPurpose}>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {LOAN_PURPOSE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.rateStructure}>Rate Structure</Label>
              <Select
                value={getValue(FIELD_KEYS.rateStructure)}
                onValueChange={(value) => setValue(FIELD_KEYS.rateStructure, value)}
                disabled={disabled}
              >
                <SelectTrigger id={FIELD_KEYS.rateStructure}>
                  <SelectValue placeholder="Select structure" />
                </SelectTrigger>
                <SelectContent>
                  {RATE_STRUCTURE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.amortization}>Amortization</Label>
              <Select
                value={getValue(FIELD_KEYS.amortization)}
                onValueChange={(value) => setValue(FIELD_KEYS.amortization, value)}
                disabled={disabled}
              >
                <SelectTrigger id={FIELD_KEYS.amortization}>
                  <SelectValue placeholder="Select amortization" />
                </SelectTrigger>
                <SelectContent>
                  {AMORTIZATION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.interestCalculation}>Interest Calculation</Label>
              <Select
                value={getValue(FIELD_KEYS.interestCalculation)}
                onValueChange={(value) => setValue(FIELD_KEYS.interestCalculation, value)}
                disabled={disabled}
              >
                <SelectTrigger id={FIELD_KEYS.interestCalculation}>
                  <SelectValue placeholder="Select calculation" />
                </SelectTrigger>
                <SelectContent>
                  {INTEREST_CALCULATION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.shortPaymentsAppliedTo}>Short Payments Applied To</Label>
              <Select
                value={getValue(FIELD_KEYS.shortPaymentsAppliedTo)}
                onValueChange={(value) => setValue(FIELD_KEYS.shortPaymentsAppliedTo, value)}
                disabled={disabled}
              >
                <SelectTrigger id={FIELD_KEYS.shortPaymentsAppliedTo}>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {SHORT_PAYMENTS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.processingUnpaidInterest}>Processing Unpaid Interest</Label>
              <Select
                value={getValue(FIELD_KEYS.processingUnpaidInterest)}
                onValueChange={(value) => setValue(FIELD_KEYS.processingUnpaidInterest, value)}
                disabled={disabled}
              >
                <SelectTrigger id={FIELD_KEYS.processingUnpaidInterest}>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  {PROCESSING_UNPAID_INTEREST_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.calculationPeriod}>Calculation Period</Label>
              <Select
                value={getValue(FIELD_KEYS.calculationPeriod)}
                onValueChange={(value) => setValue(FIELD_KEYS.calculationPeriod, value)}
                disabled={disabled}
              >
                <SelectTrigger id={FIELD_KEYS.calculationPeriod}>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {CALCULATION_PERIOD_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loan Type Column (Checkboxes) */}
        <div className="space-y-6">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">Loan Type (can be multiple)</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id={FIELD_KEYS.sellerCarry}
                checked={getBoolValue(FIELD_KEYS.sellerCarry)}
                onCheckedChange={(checked) => setBoolValue(FIELD_KEYS.sellerCarry, !!checked)}
                disabled={disabled}
              />
              <Label htmlFor={FIELD_KEYS.sellerCarry} className="font-normal cursor-pointer">
                Seller Carry
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id={FIELD_KEYS.aitdWrap}
                checked={getBoolValue(FIELD_KEYS.aitdWrap)}
                onCheckedChange={(checked) => setBoolValue(FIELD_KEYS.aitdWrap, !!checked)}
                disabled={disabled}
              />
              <Label htmlFor={FIELD_KEYS.aitdWrap} className="font-normal cursor-pointer">
                AITD / Wrap
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id={FIELD_KEYS.rehabConstruction}
                checked={getBoolValue(FIELD_KEYS.rehabConstruction)}
                onCheckedChange={(checked) => setBoolValue(FIELD_KEYS.rehabConstruction, !!checked)}
                disabled={disabled}
              />
              <Label htmlFor={FIELD_KEYS.rehabConstruction} className="font-normal cursor-pointer">
                Rehab / Construction
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id={FIELD_KEYS.variableArm}
                checked={getBoolValue(FIELD_KEYS.variableArm)}
                onCheckedChange={(checked) => setBoolValue(FIELD_KEYS.variableArm, !!checked)}
                disabled={disabled}
              />
              <Label htmlFor={FIELD_KEYS.variableArm} className="font-normal cursor-pointer">
                Variable / ARM
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id={FIELD_KEYS.respa}
                checked={getBoolValue(FIELD_KEYS.respa)}
                onCheckedChange={(checked) => setBoolValue(FIELD_KEYS.respa, !!checked)}
                disabled={disabled}
              />
              <Label htmlFor={FIELD_KEYS.respa} className="font-normal cursor-pointer">
                RESPA
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id={FIELD_KEYS.unsecured}
                checked={getBoolValue(FIELD_KEYS.unsecured)}
                onCheckedChange={(checked) => setBoolValue(FIELD_KEYS.unsecured, !!checked)}
                disabled={disabled}
              />
              <Label htmlFor={FIELD_KEYS.unsecured} className="font-normal cursor-pointer">
                Unsecured
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id={FIELD_KEYS.crossCollateral}
                checked={getBoolValue(FIELD_KEYS.crossCollateral)}
                onCheckedChange={(checked) => setBoolValue(FIELD_KEYS.crossCollateral, !!checked)}
                disabled={disabled}
              />
              <Label htmlFor={FIELD_KEYS.crossCollateral} className="font-normal cursor-pointer">
                Cross Collateral
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id={FIELD_KEYS.limitedNoDoc}
                checked={getBoolValue(FIELD_KEYS.limitedNoDoc)}
                onCheckedChange={(checked) => setBoolValue(FIELD_KEYS.limitedNoDoc, !!checked)}
                disabled={disabled}
              />
              <Label htmlFor={FIELD_KEYS.limitedNoDoc} className="font-normal cursor-pointer">
                Limited / No Documentation
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanTermsDetailsForm;
