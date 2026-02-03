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
  loanCode: 'loan_terms.loan_code',
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
  { value: 'purchase', label: 'Purchase' },
  { value: 'refinance', label: 'Refinance' },
  { value: 'cash_out', label: 'Cash Out' },
  { value: 'construction', label: 'Construction' },
  { value: 'other', label: 'Other' },
];

const RATE_STRUCTURE_OPTIONS = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'adjustable', label: 'Adjustable' },
  { value: 'hybrid', label: 'Hybrid' },
];

const AMORTIZATION_OPTIONS = [
  { value: 'fully_amortizing', label: 'Fully Amortizing' },
  { value: 'interest_only', label: 'Interest Only' },
  { value: 'balloon', label: 'Balloon' },
  { value: 'negative_amortization', label: 'Negative Amortization' },
];

const INTEREST_CALCULATION_OPTIONS = [
  { value: 'simple', label: 'Simple' },
  { value: 'compound', label: 'Compound' },
  { value: 'actual_360', label: 'Actual/360' },
  { value: 'actual_365', label: 'Actual/365' },
];

const SHORT_PAYMENTS_OPTIONS = [
  { value: 'principal', label: 'Principal' },
  { value: 'interest', label: 'Interest' },
  { value: 'fees_first', label: 'Fees First' },
  { value: 'prorated', label: 'Prorated' },
];

const PROCESSING_UNPAID_INTEREST_OPTIONS = [
  { value: 'capitalize', label: 'Capitalize' },
  { value: 'waive', label: 'Waive' },
  { value: 'collect', label: 'Collect' },
];

const CALCULATION_PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annually', label: 'Annually' },
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
              <Label htmlFor={FIELD_KEYS.loanCode}>Loan Code</Label>
              <Input
                id={FIELD_KEYS.loanCode}
                value={getValue(FIELD_KEYS.loanCode)}
                onChange={(e) => setValue(FIELD_KEYS.loanCode, e.target.value)}
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
              <Label htmlFor={FIELD_KEYS.maturity}>Maturity</Label>
              <Input
                id={FIELD_KEYS.maturity}
                value={getValue(FIELD_KEYS.maturity)}
                onChange={(e) => setValue(FIELD_KEYS.maturity, e.target.value)}
                disabled={disabled}
                placeholder=""
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
