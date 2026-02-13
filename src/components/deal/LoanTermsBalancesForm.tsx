import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface LoanTermsBalancesFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const FIELD_KEYS = {
  loanAmount: 'loan_terms.loan_amount',
  originalAmount: 'loan.original_amount',
  noteRate: 'loan_terms.note_rate',
  soldRate: 'loan_terms.sold_rate',
  soldRateEnabled: 'loan_terms.sold_rate_enabled',
  originatingVendor: 'loan_terms.originating_vendor',
  originatingVendorEnabled: 'loan_terms.originating_vendor_enabled',
  company: 'loan_terms.company',
  companyEnabled: 'loan_terms.company_enabled',
  otherClient1: 'loan_terms.other_client_1',
  otherClient1Enabled: 'loan_terms.other_client_1_enabled',
  otherClient1Pct: 'loan_terms.other_client_1_pct',
  otherClient1Amt: 'loan_terms.other_client_1_amt',
  otherClient2: 'loan_terms.other_client_2',
  otherClient2Enabled: 'loan_terms.other_client_2_enabled',
  otherClient2Pct: 'loan_terms.other_client_2_pct',
  otherClient2Amt: 'loan_terms.other_client_2_amt',
  interestSplit: 'loan_terms.interest_split',
  interestSplitEnabled: 'loan_terms.interest_split_enabled',
  originatingVendorPct: 'loan_terms.originating_vendor_pct',
  originatingVendorAmt: 'loan_terms.originating_vendor_amt',
  companyPct: 'loan_terms.company_pct',
  companyAmt: 'loan_terms.company_amt',
  unearnedDiscountBalance: 'loan_terms.unearned_discount_balance',
  accrualMethod: 'loan_terms.accrual_method',
  prepaidPayments: 'loan_terms.prepaid_payments',
  prepaidPaymentsEnabled: 'loan_terms.prepaid_payments_enabled',
  prepaidPaymentsMonths: 'loan_terms.prepaid_payments_months',
  impoundedPayments: 'loan_terms.impounded_payments',
  impoundedPaymentsEnabled: 'loan_terms.impounded_payments_enabled',
  impoundedPaymentsMonths: 'loan_terms.impounded_payments_months',
  fundingHoldback: 'loan_terms.funding_holdback',
  fundingHoldbackEnabled: 'loan_terms.funding_holdback_enabled',
  fundingHoldbackHeldBy: 'loan_terms.funding_holdback_held_by',
  paymentFrequency: 'loan_terms.payment_frequency',
  dayDue: 'loan_terms.day_due',
  firstPayment: 'loan_terms.first_payment',
  lastPaymentReceived: 'loan_terms.last_payment_received',
  paidTo: 'loan_terms.paid_to',
  nextPayment: 'loan_terms.next_payment',
  regularPayment: 'loan_terms.regular_payment',
  additionalPrincipal: 'loan_terms.additional_principal',
  otherScheduledPayments: 'loan_terms.other_scheduled_payments',
  toEscrowImpounds: 'loan_terms.to_escrow_impounds',
  defaultInterest: 'loan_terms.default_interest',
  totalPayment: 'loan_terms.total_payment',
  principal: 'loan_terms.principal',
  unpaidLateCharges: 'loan_terms.unpaid_late_charges',
  accruedLateCharges: 'loan_terms.accrued_late_charges',
  unpaidInterest: 'loan_terms.unpaid_interest',
  accruedInterest: 'loan_terms.accrued_interest',
  interestGuarantee: 'loan_terms.interest_guarantee',
  unpaidDefaultInterest: 'loan_terms.unpaid_default_interest',
  accruedDefaultInterest: 'loan_terms.accrued_default_interest',
  chargesOwed: 'loan_terms.charges_owed',
  chargesInterest: 'loan_terms.charges_interest',
  amountToReinstate: 'loan_terms.amount_to_reinstate',
  reserveBalance: 'loan_terms.reserve_balance',
  escrowBalance: 'loan_terms.escrow_balance',
};

const PAYMENT_FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'bi_weekly', label: 'Bi-Weekly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'semi_annually', label: 'Semi-Annually' },
];

const ACCRUAL_METHOD_OPTIONS = [
  { value: '30_360', label: '30/360' },
  { value: 'actual_360', label: 'Actual/360' },
  { value: 'actual_365', label: 'Actual/365' },
  { value: 'actual_actual', label: 'Actual/Actual' },
];

const LABEL_CLASS = "text-sm text-muted-foreground min-w-[130px] text-left shrink-0";

export const LoanTermsBalancesForm: React.FC<LoanTermsBalancesFormProps> = ({
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getValue = (key: string) => values[key] || '';
  const setValue = (key: string, value: string) => onValueChange(key, value);
  const isChecked = (key: string) => getValue(key) === 'true';
  const toggleCheck = (key: string) => setValue(key, isChecked(key) ? '' : 'true');

  const renderCurrencyField = (key: string, label: string, labelClassName?: string) => (
    <div className="flex items-center gap-3">
      <Label className={labelClassName || LABEL_CLASS}>{label}</Label>
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
        <Input
          id={key}
          value={getValue(key)}
          onChange={(e) => setValue(key, e.target.value)}
          disabled={disabled}
          className="h-7 text-sm pl-7"
          placeholder="0.00"
        />
      </div>
    </div>
  );

  const renderPercentField = (key: string, label: string) => (
    <div className="flex items-center gap-3">
      <Label className={LABEL_CLASS}>{label}</Label>
      <div className="relative flex-1">
        <Input
          id={key}
          value={getValue(key)}
          onChange={(e) => setValue(key, e.target.value)}
          disabled={disabled}
          className="h-7 text-sm pr-7"
          placeholder="0.000"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
      </div>
    </div>
  );

  const renderDateField = (key: string, label: string) => (
    <div className="flex items-center gap-3">
      <Label className={LABEL_CLASS}>{label}</Label>
      <Input
        id={key}
        type="date"
        value={getValue(key)}
        onChange={(e) => setValue(key, e.target.value)}
        disabled={disabled}
        className="h-7 text-sm flex-1"
      />
    </div>
  );

  const renderCheckboxPercentAmount = (
    enabledKey: string,
    label: string,
    pctKey: string,
    amtKey: string,
  ) => (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${enabledKey}-cb`}
          checked={isChecked(enabledKey)}
          onCheckedChange={() => toggleCheck(enabledKey)}
          disabled={disabled}
          className="h-3.5 w-3.5"
        />
        <Label htmlFor={`${enabledKey}-cb`} className="text-sm">{label}</Label>
      </div>
      <div className="flex items-center gap-2 pl-5">
        <div className="relative flex-1">
          <Input
            value={getValue(pctKey)}
            onChange={(e) => setValue(pctKey, e.target.value)}
            disabled={disabled || !isChecked(enabledKey)}
            className="h-7 text-sm text-center pr-6"
            placeholder=""
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
        </div>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
          <Input
            value={getValue(amtKey)}
            onChange={(e) => setValue(amtKey, e.target.value)}
            disabled={disabled || !isChecked(enabledKey)}
            className="h-7 text-sm pl-7"
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terms Column */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Terms</h3>
          <div className="space-y-2">
            {renderCurrencyField(FIELD_KEYS.loanAmount, 'Loan Amount')}
            {renderCurrencyField(FIELD_KEYS.originalAmount, 'Original Amount')}
            {renderPercentField(FIELD_KEYS.noteRate, 'Note Rate')}

            {/* Sold Rate with checkbox */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`${FIELD_KEYS.soldRateEnabled}-cb`}
                  checked={isChecked(FIELD_KEYS.soldRateEnabled)}
                  onCheckedChange={() => toggleCheck(FIELD_KEYS.soldRateEnabled)}
                  disabled={disabled}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor={`${FIELD_KEYS.soldRateEnabled}-cb`} className="text-sm text-primary font-medium">Sold Rate</Label>
              </div>
              <div className="flex items-center gap-3 pl-5">
                <div className="relative flex-1">
                  <Input
                    value={getValue(FIELD_KEYS.soldRate)}
                    onChange={(e) => setValue(FIELD_KEYS.soldRate, e.target.value)}
                    disabled={disabled || !isChecked(FIELD_KEYS.soldRateEnabled)}
                    className="h-7 text-sm pr-7"
                    placeholder="0.000"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                </div>
              </div>
            </div>

            {renderCheckboxPercentAmount(
              FIELD_KEYS.originatingVendorEnabled, 'Originating Vendor',
              FIELD_KEYS.originatingVendorPct, FIELD_KEYS.originatingVendorAmt,
            )}
            {renderCheckboxPercentAmount(
              FIELD_KEYS.companyEnabled, 'Company',
              FIELD_KEYS.companyPct, FIELD_KEYS.companyAmt,
            )}
            {renderCheckboxPercentAmount(
              FIELD_KEYS.otherClient1Enabled, 'Other - Client List',
              'loan_terms.other_1_pct', 'loan_terms.other_1_amt',
            )}
            {renderCheckboxPercentAmount(
              FIELD_KEYS.otherClient2Enabled, 'Other - Client List',
              'loan_terms.other_2_pct', 'loan_terms.other_2_amt',
            )}

            {/* Interest Split */}
            <div className="flex items-center gap-2 py-1">
              <Checkbox
                id={`${FIELD_KEYS.interestSplitEnabled}-cb`}
                checked={isChecked(FIELD_KEYS.interestSplitEnabled)}
                onCheckedChange={() => toggleCheck(FIELD_KEYS.interestSplitEnabled)}
                disabled={disabled}
                className="h-3.5 w-3.5"
              />
              <Label htmlFor={`${FIELD_KEYS.interestSplitEnabled}-cb`} className="text-sm text-primary font-medium">Interest Split</Label>
            </div>

            {/* Unearned Discount Balance */}
            <div className="flex items-center gap-3">
              <Label className={LABEL_CLASS}>Unearned Disc. Bal.</Label>
              <Input
                value={getValue(FIELD_KEYS.unearnedDiscountBalance)}
                onChange={(e) => setValue(FIELD_KEYS.unearnedDiscountBalance, e.target.value)}
                disabled={disabled}
                className="h-7 text-sm flex-1"
              />
            </div>

            {/* Accrual Method */}
            <div className="flex items-center gap-3">
              <Label className={LABEL_CLASS}>Accrual Method</Label>
              <Select
                value={getValue(FIELD_KEYS.accrualMethod)}
                onValueChange={(value) => setValue(FIELD_KEYS.accrualMethod, value)}
                disabled={disabled}
              >
                <SelectTrigger className="h-7 text-sm flex-1">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {ACCRUAL_METHOD_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prepaid Payments */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[130px] shrink-0">
                <Checkbox
                  id={`${FIELD_KEYS.prepaidPaymentsEnabled}-cb`}
                  checked={isChecked(FIELD_KEYS.prepaidPaymentsEnabled)}
                  onCheckedChange={() => toggleCheck(FIELD_KEYS.prepaidPaymentsEnabled)}
                  disabled={disabled}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor={`${FIELD_KEYS.prepaidPaymentsEnabled}-cb`} className="text-sm">Prepaid Payments</Label>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-xs text-muted-foreground shrink-0">Months</Label>
                <Input
                  value={getValue(FIELD_KEYS.prepaidPaymentsMonths)}
                  onChange={(e) => setValue(FIELD_KEYS.prepaidPaymentsMonths, e.target.value)}
                  disabled={disabled || !isChecked(FIELD_KEYS.prepaidPaymentsEnabled)}
                  className="h-7 text-sm flex-1"
                />
              </div>
            </div>

            {/* Impounded Payments */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[130px] shrink-0">
                <Checkbox
                  id={`${FIELD_KEYS.impoundedPaymentsEnabled}-cb`}
                  checked={isChecked(FIELD_KEYS.impoundedPaymentsEnabled)}
                  onCheckedChange={() => toggleCheck(FIELD_KEYS.impoundedPaymentsEnabled)}
                  disabled={disabled}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor={`${FIELD_KEYS.impoundedPaymentsEnabled}-cb`} className="text-sm">Impounded Payments</Label>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-xs text-muted-foreground shrink-0">Months</Label>
                <Input
                  value={getValue(FIELD_KEYS.impoundedPaymentsMonths)}
                  onChange={(e) => setValue(FIELD_KEYS.impoundedPaymentsMonths, e.target.value)}
                  disabled={disabled || !isChecked(FIELD_KEYS.impoundedPaymentsEnabled)}
                  className="h-7 text-sm flex-1"
                />
              </div>
            </div>

            {/* Funding Holdback */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[130px] shrink-0">
                <Checkbox
                  id={`${FIELD_KEYS.fundingHoldbackEnabled}-cb`}
                  checked={isChecked(FIELD_KEYS.fundingHoldbackEnabled)}
                  onCheckedChange={() => toggleCheck(FIELD_KEYS.fundingHoldbackEnabled)}
                  disabled={disabled}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor={`${FIELD_KEYS.fundingHoldbackEnabled}-cb`} className="text-sm">Funding Holdback</Label>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-xs text-muted-foreground shrink-0">Held By</Label>
                <Select
                  value={getValue(FIELD_KEYS.fundingHoldbackHeldBy)}
                  onValueChange={(value) => setValue(FIELD_KEYS.fundingHoldbackHeldBy, value)}
                  disabled={disabled || !isChecked(FIELD_KEYS.fundingHoldbackEnabled)}
                >
                  <SelectTrigger className="h-7 text-sm flex-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lender">Lender</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Payments Column */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Payments</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Label className={LABEL_CLASS}>Payment Frequency</Label>
              <Select
                value={getValue(FIELD_KEYS.paymentFrequency)}
                onValueChange={(value) => setValue(FIELD_KEYS.paymentFrequency, value)}
                disabled={disabled}
              >
                <SelectTrigger className="h-7 text-sm flex-1">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_FREQUENCY_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Label className={LABEL_CLASS}>Day Due</Label>
              <Input
                value={getValue(FIELD_KEYS.dayDue)}
                onChange={(e) => setValue(FIELD_KEYS.dayDue, e.target.value)}
                disabled={disabled}
                className="h-7 text-sm flex-1"
              />
            </div>

            {renderDateField(FIELD_KEYS.firstPayment, 'First Payment')}
            {renderDateField(FIELD_KEYS.lastPaymentReceived, 'Last Pmt Received')}
            {renderDateField(FIELD_KEYS.paidTo, 'Paid To')}
            {renderDateField(FIELD_KEYS.nextPayment, 'Next Payment')}
            {renderCurrencyField(FIELD_KEYS.regularPayment, 'Regular Payment')}
            {renderCurrencyField(FIELD_KEYS.additionalPrincipal, 'Additional Principal')}
            {renderCurrencyField(FIELD_KEYS.otherScheduledPayments, 'Other Sched. Pmts',
              "text-sm text-primary font-medium min-w-[130px] text-left shrink-0")}
            {renderCurrencyField(FIELD_KEYS.toEscrowImpounds, 'To Escrow Impounds',
              "text-sm text-primary font-medium min-w-[130px] text-left shrink-0")}
            {renderCurrencyField(FIELD_KEYS.defaultInterest, 'Default Interest')}
            {renderCurrencyField(FIELD_KEYS.totalPayment, 'Total Payment')}
          </div>
        </div>

        {/* Balances Column */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Balances</h3>
          <div className="space-y-2">
            {renderCurrencyField(FIELD_KEYS.principal, 'Principal')}
            {renderCurrencyField(FIELD_KEYS.unpaidLateCharges, 'Unpaid Late Charges')}
            {renderCurrencyField(FIELD_KEYS.accruedLateCharges, 'Accrued Late Charges')}
            {renderCurrencyField(FIELD_KEYS.unpaidInterest, 'Unpaid Interest')}
            {renderCurrencyField(FIELD_KEYS.accruedInterest, 'Accrued Interest')}
            {renderCurrencyField(FIELD_KEYS.interestGuarantee, 'Interest Guarantee')}
            {renderCurrencyField(FIELD_KEYS.unpaidDefaultInterest, 'Unpaid Def. Interest')}
            {renderCurrencyField(FIELD_KEYS.accruedDefaultInterest, 'Accrued Def. Interest')}
            {renderCurrencyField(FIELD_KEYS.chargesOwed, 'Charges Owed')}
            {renderCurrencyField(FIELD_KEYS.chargesInterest, 'Charges Interest')}
            {renderCurrencyField(FIELD_KEYS.amountToReinstate, 'Amount to Reinstate',
              "text-sm text-primary font-medium min-w-[130px] text-left shrink-0")}
            {renderCurrencyField(FIELD_KEYS.reserveBalance, 'Reserve Balance',
              "text-sm text-primary font-medium min-w-[130px] text-left shrink-0")}
            {renderCurrencyField(FIELD_KEYS.escrowBalance, 'Escrow Balance',
              "text-sm text-primary font-medium min-w-[130px] text-left shrink-0")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanTermsBalancesForm;
