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

// Field keys for Balances & Loan Details
const FIELD_KEYS = {
  // Terms column
  loanAmount: 'loan_terms.loan_amount',
  noteRate: 'loan_terms.note_rate',
  soldRate: 'loan_terms.sold_rate',
  originatingVendor: 'loan_terms.originating_vendor',
  company: 'loan_terms.company',
  otherClient1: 'loan_terms.other_client_1',
  otherClient1Pct: 'loan_terms.other_client_1_pct',
  otherClient1Amt: 'loan_terms.other_client_1_amt',
  otherClient2: 'loan_terms.other_client_2',
  otherClient2Pct: 'loan_terms.other_client_2_pct',
  otherClient2Amt: 'loan_terms.other_client_2_amt',
  interestSplit: 'loan_terms.interest_split',
  unearnedDiscountBalance: 'loan_terms.unearned_discount_balance',
  accrualMethod: 'loan_terms.accrual_method',
  prepaidPayments: 'loan_terms.prepaid_payments',
  prepaidPaymentsMonths: 'loan_terms.prepaid_payments_months',
  impoundedPayments: 'loan_terms.impounded_payments',
  impoundedPaymentsMonths: 'loan_terms.impounded_payments_months',
  fundingHoldback: 'loan_terms.funding_holdback',
  fundingHoldbackHeldBy: 'loan_terms.funding_holdback_held_by',

  // Payments column
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

  // Balances column
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

export const LoanTermsBalancesForm: React.FC<LoanTermsBalancesFormProps> = ({
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getValue = (key: string) => values[key] || '';
  const setValue = (key: string, value: string) => onValueChange(key, value);

  return (
    <div className="p-6 space-y-8">
      {/* Three Column Layout: Terms | Payments | Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Terms Column */}
        <div className="space-y-6">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">Terms</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.loanAmount}>Loan Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.loanAmount}
                  value={getValue(FIELD_KEYS.loanAmount)}
                  onChange={(e) => setValue(FIELD_KEYS.loanAmount, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.noteRate}>Note Rate</Label>
              <div className="relative">
                <Input
                  id={FIELD_KEYS.noteRate}
                  value={getValue(FIELD_KEYS.noteRate)}
                  onChange={(e) => setValue(FIELD_KEYS.noteRate, e.target.value)}
                  disabled={disabled}
                  className="pr-8"
                  placeholder="0.000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.soldRate} className="text-primary font-medium">Sold Rate</Label>
              <div className="relative">
                <Input
                  id={FIELD_KEYS.soldRate}
                  value={getValue(FIELD_KEYS.soldRate)}
                  onChange={(e) => setValue(FIELD_KEYS.soldRate, e.target.value)}
                  disabled={disabled}
                  className="pr-8"
                  placeholder="0.000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="col-span-1 space-y-2">
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
                <Input
                  value={getValue(FIELD_KEYS.otherClient1Pct)}
                  onChange={(e) => setValue(FIELD_KEYS.otherClient1Pct, e.target.value)}
                  disabled={disabled}
                  placeholder="%"
                  className="text-center"
                />
              </div>
              <div className="relative space-y-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  value={getValue(FIELD_KEYS.otherClient1Amt)}
                  onChange={(e) => setValue(FIELD_KEYS.otherClient1Amt, e.target.value)}
                  disabled={disabled}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 items-end">
              <div className="col-span-1 space-y-2">
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
                <Input
                  value={getValue(FIELD_KEYS.otherClient2Pct)}
                  onChange={(e) => setValue(FIELD_KEYS.otherClient2Pct, e.target.value)}
                  disabled={disabled}
                  placeholder="%"
                  className="text-center"
                />
              </div>
              <div className="relative space-y-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  value={getValue(FIELD_KEYS.otherClient2Amt)}
                  onChange={(e) => setValue(FIELD_KEYS.otherClient2Amt, e.target.value)}
                  disabled={disabled}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.otherClient1}>Other - Select from Client List</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  id={FIELD_KEYS.otherClient1}
                  value={getValue(FIELD_KEYS.otherClient1)}
                  onChange={(e) => setValue(FIELD_KEYS.otherClient1, e.target.value)}
                  disabled={disabled}
                  placeholder=""
                />
                <div className="relative">
                  <Input
                    value={getValue('loan_terms.other_1_pct')}
                    onChange={(e) => setValue('loan_terms.other_1_pct', e.target.value)}
                    disabled={disabled}
                    placeholder="%"
                    className="text-center pr-6"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    value={getValue('loan_terms.other_1_amt')}
                    onChange={(e) => setValue('loan_terms.other_1_amt', e.target.value)}
                    disabled={disabled}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.otherClient2}>Other - Select from Client List</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  id={FIELD_KEYS.otherClient2}
                  value={getValue(FIELD_KEYS.otherClient2)}
                  onChange={(e) => setValue(FIELD_KEYS.otherClient2, e.target.value)}
                  disabled={disabled}
                  placeholder=""
                />
                <div className="relative">
                  <Input
                    value={getValue('loan_terms.other_2_pct')}
                    onChange={(e) => setValue('loan_terms.other_2_pct', e.target.value)}
                    disabled={disabled}
                    placeholder="%"
                    className="text-center pr-6"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    value={getValue('loan_terms.other_2_amt')}
                    onChange={(e) => setValue('loan_terms.other_2_amt', e.target.value)}
                    disabled={disabled}
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.interestSplit} className="text-primary font-medium">Interest Split</Label>
              <Input
                id={FIELD_KEYS.interestSplit}
                value={getValue(FIELD_KEYS.interestSplit)}
                onChange={(e) => setValue(FIELD_KEYS.interestSplit, e.target.value)}
                disabled={disabled}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.unearnedDiscountBalance}>Unearned Discount Balance</Label>
              <Input
                id={FIELD_KEYS.unearnedDiscountBalance}
                value={getValue(FIELD_KEYS.unearnedDiscountBalance)}
                onChange={(e) => setValue(FIELD_KEYS.unearnedDiscountBalance, e.target.value)}
                disabled={disabled}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.accrualMethod}>Accrual Method</Label>
              <Select
                value={getValue(FIELD_KEYS.accrualMethod)}
                onValueChange={(value) => setValue(FIELD_KEYS.accrualMethod, value)}
                disabled={disabled}
              >
                <SelectTrigger id={FIELD_KEYS.accrualMethod}>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {ACCRUAL_METHOD_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2 items-end">
              <div className="space-y-2">
                <Label htmlFor={FIELD_KEYS.prepaidPayments}>Prepaid Payments</Label>
                <Input
                  id={FIELD_KEYS.prepaidPayments}
                  value={getValue(FIELD_KEYS.prepaidPayments)}
                  onChange={(e) => setValue(FIELD_KEYS.prepaidPayments, e.target.value)}
                  disabled={disabled}
                  placeholder=""
                />
              </div>
              <div className="space-y-2">
                <Label>Number of Months</Label>
                <Input
                  value={getValue(FIELD_KEYS.prepaidPaymentsMonths)}
                  onChange={(e) => setValue(FIELD_KEYS.prepaidPaymentsMonths, e.target.value)}
                  disabled={disabled}
                  placeholder=""
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 items-end">
              <div className="space-y-2">
                <Label htmlFor={FIELD_KEYS.impoundedPayments}>Impounded Payments</Label>
                <Input
                  id={FIELD_KEYS.impoundedPayments}
                  value={getValue(FIELD_KEYS.impoundedPayments)}
                  onChange={(e) => setValue(FIELD_KEYS.impoundedPayments, e.target.value)}
                  disabled={disabled}
                  placeholder=""
                />
              </div>
              <div className="space-y-2">
                <Label>Number of Months</Label>
                <Input
                  value={getValue(FIELD_KEYS.impoundedPaymentsMonths)}
                  onChange={(e) => setValue(FIELD_KEYS.impoundedPaymentsMonths, e.target.value)}
                  disabled={disabled}
                  placeholder=""
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 items-end">
              <div className="space-y-2">
                <Label htmlFor={FIELD_KEYS.fundingHoldback}>Funding Holdback</Label>
                <Input
                  id={FIELD_KEYS.fundingHoldback}
                  value={getValue(FIELD_KEYS.fundingHoldback)}
                  onChange={(e) => setValue(FIELD_KEYS.fundingHoldback, e.target.value)}
                  disabled={disabled}
                  placeholder=""
                />
              </div>
              <div className="space-y-2">
                <Label>Held By</Label>
                <Select
                  value={getValue(FIELD_KEYS.fundingHoldbackHeldBy)}
                  onValueChange={(value) => setValue(FIELD_KEYS.fundingHoldbackHeldBy, value)}
                  disabled={disabled}
                >
                  <SelectTrigger>
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
        <div className="space-y-6">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">Payments</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={FIELD_KEYS.paymentFrequency}>Payment Frequency</Label>
                <Select
                  value={getValue(FIELD_KEYS.paymentFrequency)}
                  onValueChange={(value) => setValue(FIELD_KEYS.paymentFrequency, value)}
                  disabled={disabled}
                >
                  <SelectTrigger id={FIELD_KEYS.paymentFrequency}>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_FREQUENCY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.dayDue}>Day Due</Label>
              <Input
                id={FIELD_KEYS.dayDue}
                value={getValue(FIELD_KEYS.dayDue)}
                onChange={(e) => setValue(FIELD_KEYS.dayDue, e.target.value)}
                disabled={disabled}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.firstPayment}>First Payment</Label>
              <Input
                id={FIELD_KEYS.firstPayment}
                type="date"
                value={getValue(FIELD_KEYS.firstPayment)}
                onChange={(e) => setValue(FIELD_KEYS.firstPayment, e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.lastPaymentReceived}>Last Payment Received</Label>
              <Input
                id={FIELD_KEYS.lastPaymentReceived}
                type="date"
                value={getValue(FIELD_KEYS.lastPaymentReceived)}
                onChange={(e) => setValue(FIELD_KEYS.lastPaymentReceived, e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.paidTo}>Paid To</Label>
              <Input
                id={FIELD_KEYS.paidTo}
                type="date"
                value={getValue(FIELD_KEYS.paidTo)}
                onChange={(e) => setValue(FIELD_KEYS.paidTo, e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.nextPayment}>Next Payment</Label>
              <Input
                id={FIELD_KEYS.nextPayment}
                type="date"
                value={getValue(FIELD_KEYS.nextPayment)}
                onChange={(e) => setValue(FIELD_KEYS.nextPayment, e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.regularPayment}>Regular Payment</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.regularPayment}
                  value={getValue(FIELD_KEYS.regularPayment)}
                  onChange={(e) => setValue(FIELD_KEYS.regularPayment, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.additionalPrincipal}>Additional Principal</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.additionalPrincipal}
                  value={getValue(FIELD_KEYS.additionalPrincipal)}
                  onChange={(e) => setValue(FIELD_KEYS.additionalPrincipal, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.otherScheduledPayments} className="text-primary font-medium">Other Scheduled Payments</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.otherScheduledPayments}
                  value={getValue(FIELD_KEYS.otherScheduledPayments)}
                  onChange={(e) => setValue(FIELD_KEYS.otherScheduledPayments, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.toEscrowImpounds} className="text-primary font-medium">To Escrow Impounds</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.toEscrowImpounds}
                  value={getValue(FIELD_KEYS.toEscrowImpounds)}
                  onChange={(e) => setValue(FIELD_KEYS.toEscrowImpounds, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.defaultInterest}>Default Interest</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.defaultInterest}
                  value={getValue(FIELD_KEYS.defaultInterest)}
                  onChange={(e) => setValue(FIELD_KEYS.defaultInterest, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.totalPayment}>Total Payment</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.totalPayment}
                  value={getValue(FIELD_KEYS.totalPayment)}
                  onChange={(e) => setValue(FIELD_KEYS.totalPayment, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Balances Column */}
        <div className="space-y-6">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">Balances</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.principal}>Principal</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.principal}
                  value={getValue(FIELD_KEYS.principal)}
                  onChange={(e) => setValue(FIELD_KEYS.principal, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.unpaidLateCharges}>Unpaid Late Charges</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.unpaidLateCharges}
                  value={getValue(FIELD_KEYS.unpaidLateCharges)}
                  onChange={(e) => setValue(FIELD_KEYS.unpaidLateCharges, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.accruedLateCharges}>Accrued Late Charges</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.accruedLateCharges}
                  value={getValue(FIELD_KEYS.accruedLateCharges)}
                  onChange={(e) => setValue(FIELD_KEYS.accruedLateCharges, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.unpaidInterest}>Unpaid Interest</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.unpaidInterest}
                  value={getValue(FIELD_KEYS.unpaidInterest)}
                  onChange={(e) => setValue(FIELD_KEYS.unpaidInterest, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.accruedInterest}>Accrued Interest</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.accruedInterest}
                  value={getValue(FIELD_KEYS.accruedInterest)}
                  onChange={(e) => setValue(FIELD_KEYS.accruedInterest, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.interestGuarantee}>Interest Guarantee</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.interestGuarantee}
                  value={getValue(FIELD_KEYS.interestGuarantee)}
                  onChange={(e) => setValue(FIELD_KEYS.interestGuarantee, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.unpaidDefaultInterest}>Unpaid Default Interest</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.unpaidDefaultInterest}
                  value={getValue(FIELD_KEYS.unpaidDefaultInterest)}
                  onChange={(e) => setValue(FIELD_KEYS.unpaidDefaultInterest, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.accruedDefaultInterest}>Accrued Default Interest</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.accruedDefaultInterest}
                  value={getValue(FIELD_KEYS.accruedDefaultInterest)}
                  onChange={(e) => setValue(FIELD_KEYS.accruedDefaultInterest, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.chargesOwed}>Charges Owed</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.chargesOwed}
                  value={getValue(FIELD_KEYS.chargesOwed)}
                  onChange={(e) => setValue(FIELD_KEYS.chargesOwed, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.chargesInterest}>Charges Interest</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.chargesInterest}
                  value={getValue(FIELD_KEYS.chargesInterest)}
                  onChange={(e) => setValue(FIELD_KEYS.chargesInterest, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.amountToReinstate} className="text-primary font-medium">Amount to Reinstate</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.amountToReinstate}
                  value={getValue(FIELD_KEYS.amountToReinstate)}
                  onChange={(e) => setValue(FIELD_KEYS.amountToReinstate, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.reserveBalance} className="text-primary font-medium">Reserve Balance</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.reserveBalance}
                  value={getValue(FIELD_KEYS.reserveBalance)}
                  onChange={(e) => setValue(FIELD_KEYS.reserveBalance, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={FIELD_KEYS.escrowBalance} className="text-primary font-medium">Escrow Balance</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id={FIELD_KEYS.escrowBalance}
                  value={getValue(FIELD_KEYS.escrowBalance)}
                  onChange={(e) => setValue(FIELD_KEYS.escrowBalance, e.target.value)}
                  disabled={disabled}
                  className="pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanTermsBalancesForm;
