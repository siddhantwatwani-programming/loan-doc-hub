import React, { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FieldDefinition } from "@/hooks/useDealFields";
import type { CalculationResult } from "@/lib/calculationEngine";
import { DirtyFieldWrapper } from "./DirtyFieldWrapper";


interface LoanTermsBalancesFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

import { LOAN_TERMS_BALANCES_KEYS } from "@/lib/fieldKeyMap";

// Use central field key map
const FIELD_KEYS = LOAN_TERMS_BALANCES_KEYS;

const PAYMENT_FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "bi_weekly", label: "Bi-Weekly" },
  { value: "weekly", label: "Weekly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
  { value: "semi_annually", label: "Semi-Annually" },
];

const ACCRUAL_METHOD_OPTIONS = [
  { value: "30_360", label: "30/360" },
  { value: "actual_360", label: "Actual/360" },
  { value: "actual_365", label: "Actual/365" },
  { value: "actual_actual", label: "Actual/Actual" },
];

const LABEL_CLASS = "text-sm text-muted-foreground min-w-[140px] max-w-[140px] text-left shrink-0";

export const LoanTermsBalancesForm: React.FC<LoanTermsBalancesFormProps> = ({
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getValue = (key: string) => values[key] || "";
  const setValue = (key: string, value: string) => onValueChange(key, value);
  const isChecked = (key: string) => getValue(key) === "true";
  const toggleCheck = (key: string) => setValue(key, isChecked(key) ? "" : "true");

  const [focusedCurrencyField, setFocusedCurrencyField] = useState<string | null>(null);

  const formatCurrencyDisplay = useCallback((val: string) => {
    if (!val) return "";
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }, []);

  const handleCurrencyChange = useCallback((key: string, raw: string) => {
    // Strip everything except digits and decimal
    const cleaned = raw.replace(/[^0-9.]/g, "");
    setValue(key, cleaned);
  }, []);

  const handleCurrencyBlur = useCallback(
    (key: string) => {
      setFocusedCurrencyField(null);
      const val = getValue(key);
      if (!val) return;
      const num = parseFloat(val);
      if (!isNaN(num)) {
        setValue(key, num.toFixed(2));
      }
    },
    [values],
  );

  const renderCurrencyField = (key: string, label: string, labelClassName?: string) => {
    const isFocused = focusedCurrencyField === key;
    const rawValue = getValue(key);
    const displayValue = isFocused ? rawValue : formatCurrencyDisplay(rawValue);

    return (
      <DirtyFieldWrapper fieldKey={key}>
        <div className="flex items-center gap-3">
          <Label className={labelClassName || LABEL_CLASS}>{label}</Label>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
            <Input
              id={key}
              value={displayValue}
              onChange={(e) => handleCurrencyChange(key, e.target.value)}
              onFocus={() => setFocusedCurrencyField(key)}
              onBlur={() => handleCurrencyBlur(key)}
              disabled={disabled}
              className="h-8 text-sm pl-7"
              placeholder="0.00"
            />
          </div>
        </div>
      </DirtyFieldWrapper>
    );
  };

  const renderPercentField = (key: string, label: string) => (
    <DirtyFieldWrapper fieldKey={key}>
      <div className="flex items-center gap-3">
        <Label className={LABEL_CLASS}>{label}</Label>
        <div className="relative flex-1">
          <Input
            id={key}
            value={getValue(key)}
            onChange={(e) => setValue(key, e.target.value)}
            disabled={disabled}
            className="h-8 text-sm pr-7"
            placeholder="0.000"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
        </div>
      </div>
    </DirtyFieldWrapper>
  );

  const renderDateField = (key: string, label: string) => (
    <DirtyFieldWrapper fieldKey={key}>
      <div className="flex items-center gap-3">
        <Label className={LABEL_CLASS}>{label}</Label>
        <Input
          id={key}
          type="date"
          value={getValue(key)}
          onChange={(e) => setValue(key, e.target.value)}
          disabled={disabled}
          className="h-8 text-sm flex-1"
        />
      </div>
    </DirtyFieldWrapper>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terms Column */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Terms</h3>
          <div className="space-y-2">
            {renderCurrencyField(FIELD_KEYS.loanAmount, "Loan Amount")}
            {renderCurrencyField(FIELD_KEYS.originalAmount, "Original Amount")}
            {renderPercentField(FIELD_KEYS.noteRate, "Note Rate")}

            {/* Sold Rate with checkbox */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[140px] max-w-[140px] shrink-0">
                <Checkbox
                  id={`${FIELD_KEYS.soldRateEnabled}-cb`}
                  checked={isChecked(FIELD_KEYS.soldRateEnabled)}
                  onCheckedChange={() => toggleCheck(FIELD_KEYS.soldRateEnabled)}
                  disabled={disabled}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor={`${FIELD_KEYS.soldRateEnabled}-cb`} className="text-sm text-primary font-medium">
                  Sold Rate
                </Label>
              </div>
              <div className="relative flex-1">
                <Input
                  value={getValue(FIELD_KEYS.soldRate)}
                  onChange={(e) => setValue(FIELD_KEYS.soldRate, e.target.value)}
                  disabled={disabled || !isChecked(FIELD_KEYS.soldRateEnabled)}
                  className="h-8 text-sm pr-7"
                  placeholder="0.000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
            </div>

            {/* Sold Rate sub-fields - visible only when Sold Rate is checked */}
            {isChecked(FIELD_KEYS.soldRateEnabled) && (
              <div className="space-y-2 pl-5">
                <DirtyFieldWrapper fieldKey={FIELD_KEYS.soldRateCompany}>
                  <div className="flex items-center gap-3">
                    <Label className="text-sm text-muted-foreground min-w-[135px] max-w-[135px] text-left shrink-0">
                      Company
                    </Label>
                    <div className="relative flex-1">
                      <Input
                        value={getValue(FIELD_KEYS.soldRateCompany)}
                        onChange={(e) => setValue(FIELD_KEYS.soldRateCompany, e.target.value)}
                        disabled={disabled}
                        className="h-8 text-sm pr-7"
                        placeholder="%"
                      />
                    </div>
                  </div>
                </DirtyFieldWrapper>
                <DirtyFieldWrapper fieldKey={FIELD_KEYS.soldRateOtherClient1}>
                  <div className="flex items-center gap-3">
                    <Label className="text-sm text-muted-foreground min-w-[135px] max-w-[135px] text-left shrink-0">
                      Other - Client List
                    </Label>
                    <div className="relative flex-1">
                      <Input
                        value={getValue(FIELD_KEYS.soldRateOtherClient1)}
                        onChange={(e) => setValue(FIELD_KEYS.soldRateOtherClient1, e.target.value)}
                        disabled={disabled}
                        className="h-8 text-sm pr-7"
                        placeholder="%"
                      />
                    </div>
                  </div>
                </DirtyFieldWrapper>
                <DirtyFieldWrapper fieldKey={FIELD_KEYS.soldRateOtherClient2}>
                  <div className="flex items-center gap-3">
                    <Label className="text-sm text-muted-foreground min-w-[135px] max-w-[135px] text-left shrink-0">
                      Other - Client List
                    </Label>
                    <div className="relative flex-1">
                      <Input
                        value={getValue(FIELD_KEYS.soldRateOtherClient2)}
                        onChange={(e) => setValue(FIELD_KEYS.soldRateOtherClient2, e.target.value)}
                        disabled={disabled}
                        className="h-8 text-sm pr-7"
                        placeholder="%"
                      />
                    </div>
                  </div>
                </DirtyFieldWrapper>
              </div>
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
              <Label htmlFor={`${FIELD_KEYS.interestSplitEnabled}-cb`} className="text-sm text-primary font-medium">
                Interest Split
              </Label>
            </div>

            {/* Unearned Discount Balance */}
            <div className="flex items-center gap-3">
              <Label className={LABEL_CLASS}>Unearned Disc. Bal.</Label>
              <Input
                value={getValue(FIELD_KEYS.unearnedDiscountBalance)}
                onChange={(e) => setValue(FIELD_KEYS.unearnedDiscountBalance, e.target.value)}
                disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                className="h-8 text-sm flex-1"
              />
            </div>

            {/* Accrual Method - enabled only when Interest Split is checked */}
            <div className="flex items-center gap-3">
              <Label className={LABEL_CLASS}>Accrual Method</Label>
              <Select
                value={getValue(FIELD_KEYS.accrualMethod)}
                onValueChange={(value) => setValue(FIELD_KEYS.accrualMethod, value)}
                disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
              >
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {ACCRUAL_METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prepaid Payments */}
            <div className="flex items-center gap-3">
              <div className="min-w-[140px] max-w-[140px] shrink-0">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${FIELD_KEYS.prepaidPaymentsEnabled}-cb`}
                    checked={isChecked(FIELD_KEYS.prepaidPaymentsEnabled)}
                    onCheckedChange={() => toggleCheck(FIELD_KEYS.prepaidPaymentsEnabled)}
                    disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                    className="h-3.5 w-3.5"
                  />
                  <Label htmlFor={`${FIELD_KEYS.prepaidPaymentsEnabled}-cb`} className="text-sm">
                    Prepaid Payments
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-5">Months</p>
              </div>
              <Input
                value={getValue(FIELD_KEYS.prepaidPaymentsMonths)}
                onChange={(e) => setValue(FIELD_KEYS.prepaidPaymentsMonths, e.target.value)}
                disabled={
                  disabled ||
                  !isChecked(FIELD_KEYS.interestSplitEnabled) ||
                  !isChecked(FIELD_KEYS.prepaidPaymentsEnabled)
                }
                className="h-8 text-sm flex-1"
              />
            </div>

            {/* Impounded Payments */}
            <div className="flex items-center gap-3">
              <div className="min-w-[140px] max-w-[140px] shrink-0">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${FIELD_KEYS.impoundedPaymentsEnabled}-cb`}
                    checked={isChecked(FIELD_KEYS.impoundedPaymentsEnabled)}
                    onCheckedChange={() => toggleCheck(FIELD_KEYS.impoundedPaymentsEnabled)}
                    disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                    className="h-3.5 w-3.5"
                  />
                  <Label htmlFor={`${FIELD_KEYS.impoundedPaymentsEnabled}-cb`} className="text-sm">
                    Impounded Payments
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-5">Months</p>
              </div>
              <Input
                value={getValue(FIELD_KEYS.impoundedPaymentsMonths)}
                onChange={(e) => setValue(FIELD_KEYS.impoundedPaymentsMonths, e.target.value)}
                disabled={
                  disabled ||
                  !isChecked(FIELD_KEYS.interestSplitEnabled) ||
                  !isChecked(FIELD_KEYS.impoundedPaymentsEnabled)
                }
                className="h-8 text-sm flex-1"
              />
            </div>

            {/* Funding Holdback */}
            <div className="flex items-center gap-3">
              <div className="min-w-[140px] max-w-[140px] shrink-0">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${FIELD_KEYS.fundingHoldbackEnabled}-cb`}
                    checked={isChecked(FIELD_KEYS.fundingHoldbackEnabled)}
                    onCheckedChange={() => toggleCheck(FIELD_KEYS.fundingHoldbackEnabled)}
                    disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                    className="h-3.5 w-3.5"
                  />
                  <Label htmlFor={`${FIELD_KEYS.fundingHoldbackEnabled}-cb`} className="text-sm">
                    Funding Holdback
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-5">Held By</p>
              </div>
              <Select
                value={getValue(FIELD_KEYS.fundingHoldbackHeldBy)}
                onValueChange={(value) => setValue(FIELD_KEYS.fundingHoldbackHeldBy, value)}
                disabled={
                  disabled ||
                  !isChecked(FIELD_KEYS.interestSplitEnabled) ||
                  !isChecked(FIELD_KEYS.fundingHoldbackEnabled)
                }
              >
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lender">Lender</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Accept Short, Post-maturity, Auto-post, Override - part of Interest Split section */}
            <div className="space-y-2 pt-1">
              {/* Accept Short Payments */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="min-w-[140px] max-w-[140px] shrink-0">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${FIELD_KEYS.acceptShortPaymentsEnabled}-cb`}
                        checked={isChecked(FIELD_KEYS.acceptShortPaymentsEnabled)}
                        onCheckedChange={() => toggleCheck(FIELD_KEYS.acceptShortPaymentsEnabled)}
                        disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                        className="h-3.5 w-3.5"
                      />
                      <Label htmlFor={`${FIELD_KEYS.acceptShortPaymentsEnabled}-cb`} className="text-sm">
                        Accept Short Payments
                      </Label>
                    </div>
                  </div>
                  <Select
                    value={isChecked(FIELD_KEYS.acceptShortPaymentsOrPercent) ? "percent" : "amount"}
                    onValueChange={(val) => {
                      const isPercent = val === "percent";
                      setValue(FIELD_KEYS.acceptShortPaymentsOrPercent, isPercent ? "true" : "");
                      // Reset values when switching type
                      setValue(FIELD_KEYS.acceptShortPaymentsAmount, "");
                      setValue(FIELD_KEYS.acceptShortPaymentsPercent, "");
                    }}
                    disabled={disabled || !isChecked(FIELD_KEYS.acceptShortPaymentsEnabled)}
                  >
                    <SelectTrigger className="h-8 text-sm w-[110px] shrink-0">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="percent">Percent</SelectItem>
                    </SelectContent>
                  </Select>
                  {isChecked(FIELD_KEYS.acceptShortPaymentsOrPercent) ? (
                    <div className="relative flex-1">
                      <Input
                        value={getValue(FIELD_KEYS.acceptShortPaymentsPercent)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9.]/g, "");
                          // Validate: allow only 0-100 range
                          const num = parseFloat(raw);
                          if (raw === "" || raw === "." || (!isNaN(num) && num <= 100)) {
                            setValue(FIELD_KEYS.acceptShortPaymentsPercent, raw);
                          }
                        }}
                        disabled={disabled || !isChecked(FIELD_KEYS.acceptShortPaymentsEnabled)}
                        className="h-8 text-sm pr-7"
                        placeholder="0.000"
                        inputMode="decimal"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                    </div>
                  ) : (
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                      <Input
                        value={getValue(FIELD_KEYS.acceptShortPaymentsAmount)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9.]/g, "");
                          setValue(FIELD_KEYS.acceptShortPaymentsAmount, raw);
                        }}
                        disabled={disabled || !isChecked(FIELD_KEYS.acceptShortPaymentsEnabled)}
                        className="h-8 text-sm pl-7"
                        placeholder="0.00"
                        inputMode="decimal"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Accept Post-maturity */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`${FIELD_KEYS.acceptPostMaturity}-cb`}
                  checked={isChecked(FIELD_KEYS.acceptPostMaturity)}
                  onCheckedChange={() => toggleCheck(FIELD_KEYS.acceptPostMaturity)}
                  disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                  className="h-3.5 w-3.5"
                />
                <Label
                  htmlFor={`${FIELD_KEYS.acceptPostMaturity}-cb`}
                  className="text-sm min-w-[140px] max-w-[140px] shrink-0"
                >
                  Accept Post-maturity
                </Label>
              </div>

              {/* Auto-post Enabled */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`${FIELD_KEYS.autoPostEnabled}-cb`}
                  checked={isChecked(FIELD_KEYS.autoPostEnabled)}
                  onCheckedChange={() => toggleCheck(FIELD_KEYS.autoPostEnabled)}
                  disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                  className="h-3.5 w-3.5"
                />
                <Label
                  htmlFor={`${FIELD_KEYS.autoPostEnabled}-cb`}
                  className="text-sm min-w-[140px] max-w-[140px] shrink-0"
                >
                  Auto-post Enabled
                </Label>
              </div>

              {/* Override Funds Held - last in section */}
              <div className="flex items-center gap-3">
                <div className="min-w-[140px] max-w-[140px] shrink-0">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${FIELD_KEYS.overrideFundsHeld}-cb`}
                      checked={isChecked(FIELD_KEYS.overrideFundsHeld)}
                      onCheckedChange={() => toggleCheck(FIELD_KEYS.overrideFundsHeld)}
                      disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                      className="h-3.5 w-3.5"
                    />
                    <Label htmlFor={`${FIELD_KEYS.overrideFundsHeld}-cb`} className="text-sm">
                      Override Funds Held
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">Hold Days</p>
                </div>
                <Input
                  value={getValue(FIELD_KEYS.holdDays)}
                  onChange={(e) => setValue(FIELD_KEYS.holdDays, e.target.value)}
                  disabled={
                    disabled || !isChecked(FIELD_KEYS.interestSplitEnabled) || !isChecked(FIELD_KEYS.overrideFundsHeld)
                  }
                  className="h-8 text-sm flex-1"
                />
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
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
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
                className="h-8 text-sm flex-1"
              />
            </div>

            {renderDateField(FIELD_KEYS.firstPayment, "First Payment")}
            {renderDateField(FIELD_KEYS.lastPaymentReceived, "Last Pmt Received")}
            {renderDateField(FIELD_KEYS.paidTo, "Paid To")}
            {renderDateField(FIELD_KEYS.nextPayment, "Next Payment")}
            {renderCurrencyField(FIELD_KEYS.regularPayment, "Regular Payment")}
            {renderCurrencyField(FIELD_KEYS.additionalPrincipal, "Additional Principal")}

            {/* Servicing Fees */}
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] max-w-[140px] text-left shrink-0">
                Servicing Fees
              </Label>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                <Input
                  value={getValue(FIELD_KEYS.servicingFees)}
                  onChange={(e) => setValue(FIELD_KEYS.servicingFees, e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm pl-7"
                  placeholder="-"
                />
              </div>
            </div>

            {/* Sales Tax checkbox */}
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[140px] max-w-[140px] text-left shrink-0">
                Sales Tax
              </Label>
              <Checkbox
                id={`${FIELD_KEYS.salesTaxEnabled}-cb`}
                checked={isChecked(FIELD_KEYS.salesTaxEnabled)}
                onCheckedChange={() => toggleCheck(FIELD_KEYS.salesTaxEnabled)}
                disabled={disabled}
                className="h-3.5 w-3.5"
              />
              <Label htmlFor={`${FIELD_KEYS.salesTaxEnabled}-cb`} className="text-sm text-muted-foreground">
                Percent of Servicing Fees
              </Label>
            </div>

            {renderCurrencyField(
              FIELD_KEYS.otherScheduledPayments,
              "Other Sched. Pmts",
              "text-sm text-primary font-medium min-w-[140px] max-w-[140px] text-left shrink-0",
            )}
            {renderCurrencyField(
              FIELD_KEYS.toEscrowImpounds,
              "To Escrow Impounds",
              "text-sm text-primary font-medium min-w-[140px] max-w-[140px] text-left shrink-0",
            )}
            {renderCurrencyField(FIELD_KEYS.defaultInterest, "Default Interest")}
            {renderCurrencyField(FIELD_KEYS.totalPayment, "Total Payment")}
          </div>
        </div>

        {/* Balances Column */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Balances</h3>
          <div className="space-y-2">
            {renderCurrencyField(FIELD_KEYS.principal, "Principal")}
            {renderCurrencyField(FIELD_KEYS.unpaidLateCharges, "Unpaid Late Charges")}
            {renderCurrencyField(FIELD_KEYS.accruedLateCharges, "Accrued Late Charges")}
            {renderCurrencyField(FIELD_KEYS.unpaidInterest, "Unpaid Interest")}
            {renderCurrencyField(FIELD_KEYS.accruedInterest, "Accrued Interest")}
            {renderCurrencyField(FIELD_KEYS.interestGuarantee, "Interest Guarantee")}
            {renderCurrencyField(FIELD_KEYS.unpaidDefaultInterest, "Unpaid Def. Interest")}
            {renderCurrencyField(FIELD_KEYS.accruedDefaultInterest, "Accrued Def. Interest")}
            {renderCurrencyField(FIELD_KEYS.chargesOwed, "Charges Owed")}
            {renderCurrencyField(FIELD_KEYS.chargesInterest, "Charges Interest")}
            {renderCurrencyField(
              FIELD_KEYS.amountToReinstate,
              "Amount to Reinstate",
              "text-sm text-primary font-medium min-w-[140px] max-w-[140px] text-left shrink-0",
            )}
            {renderCurrencyField(
              FIELD_KEYS.reserveBalance,
              "Reserve Balance",
              "text-sm text-primary font-medium min-w-[140px] max-w-[140px] text-left shrink-0",
            )}
            {renderCurrencyField(
              FIELD_KEYS.escrowBalance,
              "Escrow Balance",
              "text-sm text-primary font-medium min-w-[140px] max-w-[140px] text-left shrink-0",
            )}

            {/* Section 6: Total Balance Due & Estimated Balloon Payment */}
            <div className="pt-2 space-y-2">
              <div>
                <div className="flex items-center gap-3">
                  <Label className="text-sm text-primary font-medium min-w-[140px] max-w-[140px] text-left shrink-0">
                    Total Balance Due
                  </Label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                    <Input
                      value={getValue(FIELD_KEYS.totalBalanceDue)}
                      onChange={(e) => setValue(FIELD_KEYS.totalBalanceDue, e.target.value)}
                      disabled={disabled}
                      className="h-8 text-sm pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ paddingLeft: "0px" }}>
                  * Does not include Close-out Fees
                </p>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <div className="min-w-[140px] max-w-[140px] text-left shrink-0">
                    <Label className="text-sm text-primary font-medium">Estimated Balloon</Label>
                    <p className="text-xs text-primary font-medium">Payment</p>
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                    <Input
                      value={getValue(FIELD_KEYS.estimatedBalloonPayment)}
                      onChange={(e) => setValue(FIELD_KEYS.estimatedBalloonPayment, e.target.value)}
                      disabled={disabled}
                      className="h-8 text-sm pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ paddingLeft: "0px" }}>
                  * Does not include Close-out Fees
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanTermsBalancesForm;
