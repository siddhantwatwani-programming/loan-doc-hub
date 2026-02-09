import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface LoanTermsPenaltiesFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const TRIGGERED_BY_OPTIONS = [
  { value: 'late_payment_only', label: 'Late Payment Only' },
  { value: 'late_payment_maturity', label: 'Late Payment & Maturity' },
  { value: 'maturity_only', label: 'Maturity Only' },
];

// Distribution fields component
const DistributionFields: React.FC<{
  prefix: string;
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}> = ({ prefix, values, onValueChange, disabled }) => {

  return (
    <div className="space-y-2 pt-3">
      <h4 className="font-semibold text-sm text-foreground border-b border-border pb-1">Distribution</h4>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Label className="text-sm min-w-[120px]">Lenders</Label>
          <Input
            value={values[`${prefix}.distribution.lenders`] || ''}
            onChange={(e) => onValueChange(`${prefix}.distribution.lenders`, e.target.value)}
            disabled={disabled}
            className="h-7 text-sm flex-1"
          />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm min-w-[120px]">Origination Vendors</Label>
          <Input
            value={values[`${prefix}.distribution.origination_vendors`] || ''}
            onChange={(e) => onValueChange(`${prefix}.distribution.origination_vendors`, e.target.value)}
            disabled={disabled}
            className="h-7 text-sm flex-1"
          />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm min-w-[120px]">Company</Label>
          <Input
            value={values[`${prefix}.distribution.company`] || ''}
            onChange={(e) => onValueChange(`${prefix}.distribution.company`, e.target.value)}
            disabled={disabled}
            className="h-7 text-sm flex-1"
          />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm min-w-[120px]">Other</Label>
          <Input
            value={values[`${prefix}.distribution.other`] || ''}
            onChange={(e) => onValueChange(`${prefix}.distribution.other`, e.target.value)}
            disabled={disabled}
            className="h-7 text-sm flex-1"
          />
        </div>
      </div>
    </div>
  );
};

// Field row component for consistent layout
const FieldRow: React.FC<{
  label: string;
  children: React.ReactNode;
  checkboxValue?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ label, children, checkboxValue, onCheckboxChange, disabled }) => (
  <div className="flex items-center gap-3">
    <Label className="text-sm min-w-[140px]">{label}</Label>
    {onCheckboxChange !== undefined && (
      <Checkbox
        checked={checkboxValue}
        onCheckedChange={(checked) => onCheckboxChange(!!checked)}
        disabled={disabled}
        className="h-4 w-4"
      />
    )}
    <div className="flex-1">{children}</div>
  </div>
);

// Late Fee Column (I or II)
const LateFeeColumn: React.FC<{
  title: string;
  prefix: string;
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
  percentageLabel?: string;
}> = ({ title, prefix, values, onValueChange, disabled, percentageLabel = 'Percentage of Payment' }) => {
  const isEnabled = values[`${prefix}.enabled`] === 'true';

  return (
    <div className="space-y-2 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <Checkbox
          checked={isEnabled}
          onCheckedChange={(checked) => onValueChange(`${prefix}.enabled`, checked ? 'true' : 'false')}
          disabled={disabled}
          className="h-4 w-4"
        />
      </div>

      <div className="space-y-2">
        <FieldRow label="Type">
          <Input
            value={values[`${prefix}.type`] || ''}
            onChange={(e) => onValueChange(`${prefix}.type`, e.target.value)}
            disabled={disabled || !isEnabled}
            className="h-7 text-sm"
          />
        </FieldRow>
        <FieldRow label="Grace Period">
          <Input
            value={values[`${prefix}.grace_period`] || ''}
            onChange={(e) => onValueChange(`${prefix}.grace_period`, e.target.value)}
            disabled={disabled || !isEnabled}
            className="h-7 text-sm"
          />
        </FieldRow>
        <FieldRow label="Calendar / Actual">
          <Input
            value={values[`${prefix}.calendar_actual`] || ''}
            onChange={(e) => onValueChange(`${prefix}.calendar_actual`, e.target.value)}
            disabled={disabled || !isEnabled}
            className="h-7 text-sm"
          />
        </FieldRow>
        <FieldRow label="Minimum Late Fee">
          <Input
            value={values[`${prefix}.minimum_late_fee`] || ''}
            onChange={(e) => onValueChange(`${prefix}.minimum_late_fee`, e.target.value)}
            disabled={disabled || !isEnabled}
            className="h-7 text-sm"
          />
        </FieldRow>
        <FieldRow label={percentageLabel}>
          <Input
            value={values[`${prefix}.percentage_of_payment`] || ''}
            onChange={(e) => onValueChange(`${prefix}.percentage_of_payment`, e.target.value)}
            disabled={disabled || !isEnabled}
            className="h-7 text-sm"
          />
        </FieldRow>
        <FieldRow label="Additional Daily Charge">
          <Input
            value={values[`${prefix}.additional_daily_charge`] || ''}
            onChange={(e) => onValueChange(`${prefix}.additional_daily_charge`, e.target.value)}
            disabled={disabled || !isEnabled}
            className="h-7 text-sm"
          />
        </FieldRow>
      </div>

      <DistributionFields
        prefix={prefix}
        values={values}
        onValueChange={onValueChange}
        disabled={disabled || !isEnabled}
      />
    </div>
  );
};

// Default Interest Column
const DefaultInterestColumn: React.FC<{
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}> = ({ values, onValueChange, disabled }) => {
  const prefix = 'loan_terms.penalties.default_interest';
  const isEnabled = values[`${prefix}.enabled`] === 'true';

  return (
    <div className="space-y-2 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <h3 className="font-semibold text-sm text-foreground">Default Interest</h3>
        <Checkbox
          checked={isEnabled}
          onCheckedChange={(checked) => onValueChange(`${prefix}.enabled`, checked ? 'true' : 'false')}
          disabled={disabled}
          className="h-4 w-4"
        />
      </div>

      <div className="space-y-2">
        <FieldRow label="Triggered By">
          <Select
            value={values[`${prefix}.triggered_by`] || ''}
            onValueChange={(val) => onValueChange(`${prefix}.triggered_by`, val)}
            disabled={disabled || !isEnabled}
          >
            <SelectTrigger className="h-7 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {TRIGGERED_BY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Grace Period">
          <Input
            value={values[`${prefix}.grace_period`] || ''}
            onChange={(e) => onValueChange(`${prefix}.grace_period`, e.target.value)}
            disabled={disabled || !isEnabled}
            className="h-7 text-sm"
          />
        </FieldRow>
        <FieldRow
          label="Flat Rate"
          checkboxValue={values[`${prefix}.flat_rate_enabled`] === 'true'}
          onCheckboxChange={(checked) => onValueChange(`${prefix}.flat_rate_enabled`, checked ? 'true' : 'false')}
          disabled={disabled || !isEnabled}
        >
          <Input
            value={values[`${prefix}.flat_rate`] || ''}
            onChange={(e) => onValueChange(`${prefix}.flat_rate`, e.target.value)}
            disabled={disabled || !isEnabled || values[`${prefix}.flat_rate_enabled`] !== 'true'}
            className="h-7 text-sm"
          />
        </FieldRow>
        <FieldRow
          label="Modifier"
          checkboxValue={values[`${prefix}.modifier_enabled`] === 'true'}
          onCheckboxChange={(checked) => onValueChange(`${prefix}.modifier_enabled`, checked ? 'true' : 'false')}
          disabled={disabled || !isEnabled}
        >
          <Input
            value={values[`${prefix}.modifier`] || ''}
            onChange={(e) => onValueChange(`${prefix}.modifier`, e.target.value)}
            disabled={disabled || !isEnabled || values[`${prefix}.modifier_enabled`] !== 'true'}
            className="h-7 text-sm"
          />
        </FieldRow>
        <FieldRow label="Active Until">
          <Input
            type="date"
            value={values[`${prefix}.active_until`] || ''}
            onChange={(e) => onValueChange(`${prefix}.active_until`, e.target.value)}
            disabled={disabled || !isEnabled}
            className="h-7 text-sm w-full max-w-full overflow-hidden"
          />
        </FieldRow>
        <FieldRow label="Additional Daily Charge">
          <Input
            value={values[`${prefix}.additional_daily_charge`] || ''}
            onChange={(e) => onValueChange(`${prefix}.additional_daily_charge`, e.target.value)}
            disabled={disabled || !isEnabled}
            className="h-7 text-sm"
          />
        </FieldRow>
      </div>

      <DistributionFields
        prefix={prefix}
        values={values}
        onValueChange={onValueChange}
        disabled={disabled || !isEnabled}
      />
    </div>
  );
};

// Interest Guarantee Section
const InterestGuaranteeSection: React.FC<{
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}> = ({ values, onValueChange, disabled }) => {
  const prefix = 'loan_terms.penalties.interest_guarantee';
  const isEnabled = values[`${prefix}.enabled`] === 'true';

  return (
    <div className="space-y-2 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <h3 className="font-semibold text-sm text-foreground">Interest Guarantee</h3>
        <Checkbox
          checked={isEnabled}
          onCheckedChange={(checked) => onValueChange(`${prefix}.enabled`, checked ? 'true' : 'false')}
          disabled={disabled}
          className="h-4 w-4"
        />
      </div>

      <div className="space-y-2">
        <FieldRow
          label="Months"
          checkboxValue={values[`${prefix}.months_enabled`] === 'true'}
          onCheckboxChange={(checked) => onValueChange(`${prefix}.months_enabled`, checked ? 'true' : 'false')}
          disabled={disabled || !isEnabled}
        >
          <Input
            value={values[`${prefix}.months`] || ''}
            onChange={(e) => onValueChange(`${prefix}.months`, e.target.value)}
            disabled={disabled || !isEnabled || values[`${prefix}.months_enabled`] !== 'true'}
            className="h-7 text-sm"
          />
        </FieldRow>
        <FieldRow
          label="Include Odd Days Interest"
          checkboxValue={values[`${prefix}.include_odd_days`] === 'true'}
          onCheckboxChange={(checked) => onValueChange(`${prefix}.include_odd_days`, checked ? 'true' : 'false')}
          disabled={disabled || !isEnabled}
        >
          <span />
        </FieldRow>
        <FieldRow
          label="Amount"
          checkboxValue={values[`${prefix}.amount_enabled`] === 'true'}
          onCheckboxChange={(checked) => onValueChange(`${prefix}.amount_enabled`, checked ? 'true' : 'false')}
          disabled={disabled || !isEnabled}
        >
          <Input
            value={values[`${prefix}.amount`] || ''}
            onChange={(e) => onValueChange(`${prefix}.amount`, e.target.value)}
            disabled={disabled || !isEnabled || values[`${prefix}.amount_enabled`] !== 'true'}
            className="h-7 text-sm"
          />
        </FieldRow>
      </div>

      <DistributionFields
        prefix={prefix}
        values={values}
        onValueChange={onValueChange}
        disabled={disabled || !isEnabled}
      />
    </div>
  );
};

// Pre-payment Penalty Section
const PrepaymentPenaltySection: React.FC<{
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}> = ({ values, onValueChange, disabled }) => {
  const prefix = 'loan_terms.penalties.prepayment';
  const isEnabled = values[`${prefix}.enabled`] === 'true';

  return (
    <div className="space-y-2 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <h3 className="font-semibold text-sm text-foreground">Pre-payment Penalty</h3>
        <Checkbox
          checked={isEnabled}
          onCheckedChange={(checked) => onValueChange(`${prefix}.enabled`, checked ? 'true' : 'false')}
          disabled={disabled}
          className="h-4 w-4"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-1 flex-wrap text-sm text-foreground">
          <span>A Principal paydown in the first</span>
          <Input
            value={values[`${prefix}.first_years`] || ''}
            onChange={(e) => onValueChange(`${prefix}.first_years`, e.target.value)}
            disabled={disabled || !isEnabled}
            className="h-7 text-sm w-14 inline-block"
          />
          <span>years, greater than</span>
          <Input
            value={values[`${prefix}.greater_than`] || ''}
            onChange={(e) => onValueChange(`${prefix}.greater_than`, e.target.value)}
            disabled={disabled || !isEnabled}
            className="h-7 text-sm w-14 inline-block"
          />
          <span>of the</span>
          <Select
            value={values[`${prefix}.of_the`] || ''}
            onValueChange={(val) => onValueChange(`${prefix}.of_the`, val)}
            disabled={disabled || !isEnabled}
          >
            <SelectTrigger className="h-7 text-sm w-28 inline-flex">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="original">Original</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 flex-wrap text-sm text-foreground">
          <span>will result in a penalty of</span>
          <Input
            value={values[`${prefix}.penalty_months`] || ''}
            onChange={(e) => onValueChange(`${prefix}.penalty_months`, e.target.value)}
            disabled={disabled || !isEnabled}
            className="h-7 text-sm w-14 inline-block"
          />
          <span>months of interest at note rate.</span>
        </div>
      </div>

      <DistributionFields
        prefix={prefix}
        values={values}
        onValueChange={onValueChange}
        disabled={disabled || !isEnabled}
      />
    </div>
  );
};

// Maturity Section
const MaturitySection: React.FC<{
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}> = ({ values, onValueChange, disabled }) => {
  const prefix = 'loan_terms.penalties.maturity';
  const isEnabled = values[`${prefix}.enabled`] === 'true';

  return (
    <div className="space-y-2 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <h3 className="font-semibold text-sm text-foreground">Maturity</h3>
        <Checkbox
          checked={isEnabled}
          onCheckedChange={(checked) => onValueChange(`${prefix}.enabled`, checked ? 'true' : 'false')}
          disabled={disabled}
          className="h-4 w-4"
        />
      </div>

      <div className="space-y-2">
        <FieldRow label="Grace Period (Days)">
          <Input
            value={values[`${prefix}.grace_period_days`] || ''}
            onChange={(e) => onValueChange(`${prefix}.grace_period_days`, e.target.value)}
            disabled={disabled || !isEnabled}
            className="h-7 text-sm"
          />
        </FieldRow>
        <FieldRow
          label="Standard 10% of Payment Only"
          checkboxValue={values[`${prefix}.standard_10_percent`] === 'true'}
          onCheckboxChange={(checked) => onValueChange(`${prefix}.standard_10_percent`, checked ? 'true' : 'false')}
          disabled={disabled || !isEnabled}
        >
          <span />
        </FieldRow>
        <FieldRow
          label="Additional Flat Fee"
          checkboxValue={values[`${prefix}.additional_flat_fee_enabled`] === 'true'}
          onCheckboxChange={(checked) => onValueChange(`${prefix}.additional_flat_fee_enabled`, checked ? 'true' : 'false')}
          disabled={disabled || !isEnabled}
        >
          <Input
            value={values[`${prefix}.additional_flat_fee`] || ''}
            onChange={(e) => onValueChange(`${prefix}.additional_flat_fee`, e.target.value)}
            disabled={disabled || !isEnabled || values[`${prefix}.additional_flat_fee_enabled`] !== 'true'}
            className="h-7 text-sm"
          />
        </FieldRow>
      </div>

      <DistributionFields
        prefix={prefix}
        values={values}
        onValueChange={onValueChange}
        disabled={disabled || !isEnabled}
      />
    </div>
  );
};

export const LoanTermsPenaltiesForm: React.FC<LoanTermsPenaltiesFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  return (
    <div className="p-6 space-y-6">
      {/* Top Row - 3 columns: Late Fee I, Late Fee II, Default Interest */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <LateFeeColumn
          title="Late Fee I"
          prefix="loan_terms.penalties.late_charge_1"
          values={values}
          onValueChange={onValueChange}
          disabled={disabled}
          percentageLabel="Percentage of Payment"
        />
        <LateFeeColumn
          title="Late Fee II"
          prefix="loan_terms.penalties.late_charge_2"
          values={values}
          onValueChange={onValueChange}
          disabled={disabled}
          percentageLabel="Percentage of"
        />
        <DefaultInterestColumn
          values={values}
          onValueChange={onValueChange}
          disabled={disabled}
        />
      </div>

      {/* Bottom Row - 3 columns: Interest Guarantee, Pre-payment Penalty, Maturity */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <InterestGuaranteeSection
          values={values}
          onValueChange={onValueChange}
          disabled={disabled}
        />
        <PrepaymentPenaltySection
          values={values}
          onValueChange={onValueChange}
          disabled={disabled}
        />
        <MaturitySection
          values={values}
          onValueChange={onValueChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default LoanTermsPenaltiesForm;
