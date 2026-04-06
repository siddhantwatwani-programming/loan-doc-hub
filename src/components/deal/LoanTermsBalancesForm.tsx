import React, { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar";
import { CalendarIcon } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import type { FieldDefinition } from "@/hooks/useDealFields";
import type { CalculationResult } from "@/lib/calculationEngine";
import { DirtyFieldWrapper } from "./DirtyFieldWrapper";
import { sanitizeInterestInput, normalizeInterestOnBlur } from "@/lib/interestValidation";
import { SoldRateSplitModal } from "./SoldRateSplitModal";
import { useDealNavigationOptional } from "@/contexts/DealNavigationContext";


interface LoanTermsBalancesFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

import { LOAN_TERMS_BALANCES_KEYS } from "@/lib/fieldKeyMap";

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

const LABEL_CLASS = "text-sm text-muted-foreground min-w-[160px] max-w-[160px] text-left shrink-0 whitespace-nowrap";

/** Parse a currency string to number, returns 0 for invalid */
const parseCurrency = (val: string): number => {
  if (!val) return 0;
  const num = parseFloat(val.replace(/[,$]/g, ''));
  return isNaN(num) ? 0 : num;
};

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
  const [soldRateSplitOpen, setSoldRateSplitOpen] = useState(false);
  const [otherScheduledPaymentsOpen, setOtherScheduledPaymentsOpen] = useState(false);

  const nav = useDealNavigationOptional();

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

  // ── Calculated fields (auto-updated, read-only) ──

  const totalPayment = useMemo(() => {
    const keys = [
      FIELD_KEYS.regularPayment,
      FIELD_KEYS.additionalPrincipal,
      FIELD_KEYS.servicingFees,
      FIELD_KEYS.otherScheduledPayments,
      FIELD_KEYS.toEscrowImpounds,
      FIELD_KEYS.defaultInterest,
    ];
    const sum = keys.reduce((s, k) => s + parseCurrency(getValue(k)), 0);
    return sum > 0 ? sum.toFixed(2) : '';
  }, [
    values[FIELD_KEYS.regularPayment],
    values[FIELD_KEYS.additionalPrincipal],
    values[FIELD_KEYS.servicingFees],
    values[FIELD_KEYS.otherScheduledPayments],
    values[FIELD_KEYS.toEscrowImpounds],
    values[FIELD_KEYS.defaultInterest],
  ]);

  const totalBalanceDue = useMemo(() => {
    const sum =
      parseCurrency(getValue(FIELD_KEYS.principal)) +
      parseCurrency(getValue(FIELD_KEYS.unpaidInterest)) +
      parseCurrency(getValue(FIELD_KEYS.chargesOwed)) +
      parseCurrency(getValue(FIELD_KEYS.unpaidOther));
    return sum > 0 ? sum.toFixed(2) : '';
  }, [
    values[FIELD_KEYS.principal],
    values[FIELD_KEYS.unpaidInterest],
    values[FIELD_KEYS.chargesOwed],
    values[FIELD_KEYS.unpaidOther],
  ]);

  const amountToReinstate = useMemo(() => {
    const keys = [
      FIELD_KEYS.principal,
      FIELD_KEYS.unpaidLateCharges,
      FIELD_KEYS.accruedLateCharges,
      FIELD_KEYS.unpaidInterest,
      FIELD_KEYS.accruedInterest,
      FIELD_KEYS.interestGuarantee,
      FIELD_KEYS.unpaidDefaultInterest,
      FIELD_KEYS.accruedDefaultInterest,
      FIELD_KEYS.chargesOwed,
      FIELD_KEYS.chargesInterest,
      FIELD_KEYS.unpaidOther,
    ];
    const sum = keys.reduce((s, k) => s + parseCurrency(getValue(k)), 0);
    return sum > 0 ? sum.toFixed(2) : '';
  }, [
    values[FIELD_KEYS.principal],
    values[FIELD_KEYS.unpaidLateCharges],
    values[FIELD_KEYS.accruedLateCharges],
    values[FIELD_KEYS.unpaidInterest],
    values[FIELD_KEYS.accruedInterest],
    values[FIELD_KEYS.interestGuarantee],
    values[FIELD_KEYS.unpaidDefaultInterest],
    values[FIELD_KEYS.accruedDefaultInterest],
    values[FIELD_KEYS.chargesOwed],
    values[FIELD_KEYS.chargesInterest],
    values[FIELD_KEYS.unpaidOther],
  ]);

  const estimatedBalloonPayment = useMemo(() => {
    const tbd = parseCurrency(totalBalanceDue);
    if (tbd <= 0) return '';
    // 1 month interest = principal * noteRate / 100 / 12
    const principal = parseCurrency(getValue(FIELD_KEYS.principal));
    const noteRate = parseFloat((getValue(FIELD_KEYS.noteRate) || '').replace(/,/g, ''));
    const oneMonthInterest = (!isNaN(noteRate) && principal > 0) ? (principal * noteRate / 100 / 12) : 0;
    return (tbd + oneMonthInterest).toFixed(2);
  }, [totalBalanceDue, values[FIELD_KEYS.principal], values[FIELD_KEYS.noteRate]]);

  const renderCurrencyField = (key: string, label: string, labelClassName?: string, opts?: { readOnly?: boolean; computedValue?: string; onClick?: () => void }) => {
    const isFocused = focusedCurrencyField === key;
    const isReadOnly = opts?.readOnly;
    const rawValue = opts?.computedValue ?? getValue(key);
    const displayValue = isFocused && !isReadOnly ? rawValue : formatCurrencyDisplay(rawValue);
    const isLink = !!opts?.onClick;

    return (
      <DirtyFieldWrapper fieldKey={key}>
        <div className="flex items-center gap-3">
          <Label
            className={labelClassName || LABEL_CLASS}
            onClick={opts?.onClick}
            style={isLink ? { cursor: 'pointer' } : undefined}
          >
            {label}
          </Label>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
            <Input
              id={key}
              value={displayValue}
              onChange={(e) => !isReadOnly && handleCurrencyChange(key, e.target.value)}
              onFocus={() => !isReadOnly && setFocusedCurrencyField(key)}
              onBlur={() => !isReadOnly && handleCurrencyBlur(key)}
              disabled={disabled || isReadOnly}
              readOnly={isReadOnly}
              className={cn("h-8 text-sm pl-7", isReadOnly && "bg-muted")}
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
            onChange={(e) => setValue(key, sanitizeInterestInput(e.target.value))}
            onBlur={() => { const v = normalizeInterestOnBlur(getValue(key), 2); if (v !== getValue(key)) setValue(key, v); }}
            disabled={disabled}
            className="h-8 text-sm pr-7"
            placeholder="0.00"
            inputMode="decimal"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
        </div>
      </div>
    </DirtyFieldWrapper>
  );

  const [datePickerStates, setDatePickerStates] = useState<Record<string, boolean>>({});

  const safeParseDateStr = (val: string): Date | undefined => {
    if (!val) return undefined;
    try {
      const d = parse(val, 'yyyy-MM-dd', new Date());
      return isValid(d) ? d : undefined;
    } catch { return undefined; }
  };

  const renderDateField = (key: string, label: string) => (
    <DirtyFieldWrapper fieldKey={key}>
      <div className="flex items-center gap-3">
        <Label className={LABEL_CLASS}>{label}</Label>
        <Popover open={datePickerStates[key] || false} onOpenChange={(open) => setDatePickerStates(prev => ({ ...prev, [key]: open }))}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('h-8 text-sm flex-1 justify-start text-left font-normal', !getValue(key) && 'text-muted-foreground')} disabled={disabled}>
              {getValue(key) && safeParseDateStr(getValue(key)) ? format(safeParseDateStr(getValue(key))!, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
              <CalendarIcon className="ml-auto h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[9999]" align="start">
            <EnhancedCalendar
              mode="single"
              selected={safeParseDateStr(getValue(key))}
              onSelect={(date) => { if (date) setValue(key, format(date, 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [key]: false })); }}
              onClear={() => { setValue(key, ''); setDatePickerStates(prev => ({ ...prev, [key]: false })); }}
              onToday={() => { setValue(key, format(new Date(), 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [key]: false })); }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </DirtyFieldWrapper>
  );

  const LINK_LABEL = "text-sm text-primary font-medium min-w-[160px] max-w-[160px] text-left shrink-0 whitespace-nowrap cursor-pointer hover:underline";

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
              <div className="flex items-center gap-2 min-w-[160px] max-w-[160px] shrink-0 whitespace-nowrap">
                <Checkbox
                  id={`${FIELD_KEYS.soldRateEnabled}-cb`}
                  checked={isChecked(FIELD_KEYS.soldRateEnabled)}
                  onCheckedChange={() => toggleCheck(FIELD_KEYS.soldRateEnabled)}
                  disabled={disabled}
                  className="h-3.5 w-3.5"
                />
                <Label
                  htmlFor={`${FIELD_KEYS.soldRateEnabled}-cb`}
                  className="text-sm text-primary font-medium cursor-pointer"
                  onClick={(e) => {
                    if (isChecked(FIELD_KEYS.soldRateEnabled)) {
                      e.preventDefault();
                      setSoldRateSplitOpen(true);
                    }
                  }}
                >
                  Sold Rate
                </Label>
              </div>
              <div className="relative flex-1">
                <Input
                  value={getValue(FIELD_KEYS.soldRate)}
                  onChange={(e) => setValue(FIELD_KEYS.soldRate, sanitizeInterestInput(e.target.value))}
                  onBlur={() => { const v = normalizeInterestOnBlur(getValue(FIELD_KEYS.soldRate), 2); if (v !== getValue(FIELD_KEYS.soldRate)) setValue(FIELD_KEYS.soldRate, v); }}
                  disabled={disabled || !isChecked(FIELD_KEYS.soldRateEnabled)}
                  className="h-8 text-sm pr-7"
                  placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
            </div>

            {/* Sold Rate Split button - visible only when enabled */}
            {isChecked(FIELD_KEYS.soldRateEnabled) && (
              <div className="pl-5">
                <Button
                  variant="link"
                  size="sm"
                  className="h-6 p-0 text-xs text-primary"
                  onClick={() => setSoldRateSplitOpen(true)}
                >
                  Configure Split →
                </Button>
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
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                <Input
                  value={focusedCurrencyField === FIELD_KEYS.unearnedDiscountBalance ? getValue(FIELD_KEYS.unearnedDiscountBalance) : formatCurrencyDisplay(getValue(FIELD_KEYS.unearnedDiscountBalance))}
                  onChange={(e) => handleCurrencyChange(FIELD_KEYS.unearnedDiscountBalance, e.target.value)}
                  onFocus={() => setFocusedCurrencyField(FIELD_KEYS.unearnedDiscountBalance)}
                  onBlur={() => handleCurrencyBlur(FIELD_KEYS.unearnedDiscountBalance)}
                  disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                  className="h-8 text-sm pl-7"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Accrual Method */}
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
              <div className="min-w-[160px] max-w-[160px] shrink-0">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${FIELD_KEYS.prepaidPaymentsEnabled}-cb`}
                    checked={isChecked(FIELD_KEYS.prepaidPaymentsEnabled)}
                    onCheckedChange={() => toggleCheck(FIELD_KEYS.prepaidPaymentsEnabled)}
                    disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                    className="h-3.5 w-3.5"
                  />
                  <Label htmlFor={`${FIELD_KEYS.prepaidPaymentsEnabled}-cb`} className="text-sm whitespace-nowrap">
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
              <div className="min-w-[160px] max-w-[160px] shrink-0">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${FIELD_KEYS.impoundedPaymentsEnabled}-cb`}
                    checked={isChecked(FIELD_KEYS.impoundedPaymentsEnabled)}
                    onCheckedChange={() => toggleCheck(FIELD_KEYS.impoundedPaymentsEnabled)}
                    disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                    className="h-3.5 w-3.5"
                  />
                  <Label htmlFor={`${FIELD_KEYS.impoundedPaymentsEnabled}-cb`} className="text-sm whitespace-nowrap">
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
              <div className="min-w-[160px] max-w-[160px] shrink-0">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${FIELD_KEYS.fundingHoldbackEnabled}-cb`}
                    checked={isChecked(FIELD_KEYS.fundingHoldbackEnabled)}
                    onCheckedChange={() => toggleCheck(FIELD_KEYS.fundingHoldbackEnabled)}
                    disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                    className="h-3.5 w-3.5"
                  />
                  <Label htmlFor={`${FIELD_KEYS.fundingHoldbackEnabled}-cb`} className="text-sm whitespace-nowrap">
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

            {/* Accept Short, Post-maturity, Auto-post, Override */}
            <div className="space-y-2 pt-1">
              {/* Accept Short Payments */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="min-w-[160px] max-w-[160px] shrink-0">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${FIELD_KEYS.acceptShortPaymentsEnabled}-cb`}
                        checked={isChecked(FIELD_KEYS.acceptShortPaymentsEnabled)}
                        onCheckedChange={() => toggleCheck(FIELD_KEYS.acceptShortPaymentsEnabled)}
                        disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                        className="h-3.5 w-3.5"
                      />
                      <Label htmlFor={`${FIELD_KEYS.acceptShortPaymentsEnabled}-cb`} className="text-sm whitespace-nowrap">
                        Accept Short Payments
                      </Label>
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{isChecked(FIELD_KEYS.acceptShortPaymentsOrPercent) ? '%' : '$'}</span>
                    <Input
                      value={
                        isChecked(FIELD_KEYS.acceptShortPaymentsOrPercent)
                          ? getValue(FIELD_KEYS.acceptShortPaymentsAmount)
                          : focusedCurrencyField === FIELD_KEYS.acceptShortPaymentsAmount
                            ? getValue(FIELD_KEYS.acceptShortPaymentsAmount)
                            : formatCurrencyDisplay(getValue(FIELD_KEYS.acceptShortPaymentsAmount))
                      }
                      onChange={(e) =>
                        isChecked(FIELD_KEYS.acceptShortPaymentsOrPercent)
                          ? setValue(FIELD_KEYS.acceptShortPaymentsAmount, e.target.value)
                          : handleCurrencyChange(FIELD_KEYS.acceptShortPaymentsAmount, e.target.value)
                      }
                      onFocus={() => { if (!isChecked(FIELD_KEYS.acceptShortPaymentsOrPercent)) setFocusedCurrencyField(FIELD_KEYS.acceptShortPaymentsAmount); }}
                      onBlur={() => { if (!isChecked(FIELD_KEYS.acceptShortPaymentsOrPercent)) handleCurrencyBlur(FIELD_KEYS.acceptShortPaymentsAmount); }}
                      disabled={disabled || !isChecked(FIELD_KEYS.acceptShortPaymentsEnabled)}
                      className="h-8 text-sm pl-7"
                      placeholder={isChecked(FIELD_KEYS.acceptShortPaymentsOrPercent) ? '-' : '0.00'}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-5 mt-0.5">
                  <span className="text-xs text-muted-foreground">Or</span>
                  <Checkbox
                    id={`${FIELD_KEYS.acceptShortPaymentsOrPercent}-cb`}
                    checked={isChecked(FIELD_KEYS.acceptShortPaymentsOrPercent)}
                    onCheckedChange={() => toggleCheck(FIELD_KEYS.acceptShortPaymentsOrPercent)}
                    disabled={disabled || !isChecked(FIELD_KEYS.acceptShortPaymentsEnabled)}
                    className="h-3.5 w-3.5"
                  />
                  <Label className="text-xs text-muted-foreground">Percent</Label>
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
                  className="text-sm min-w-[160px] max-w-[160px] shrink-0 whitespace-nowrap"
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
                  className="text-sm min-w-[160px] max-w-[160px] shrink-0 whitespace-nowrap"
                >
                  Auto-post Enabled
                </Label>
              </div>

              {/* Override Funds Held */}
              <div className="flex items-center gap-3">
                <div className="min-w-[160px] max-w-[160px] shrink-0">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${FIELD_KEYS.overrideFundsHeld}-cb`}
                      checked={isChecked(FIELD_KEYS.overrideFundsHeld)}
                      onCheckedChange={() => toggleCheck(FIELD_KEYS.overrideFundsHeld)}
                      disabled={disabled || !isChecked(FIELD_KEYS.interestSplitEnabled)}
                      className="h-3.5 w-3.5"
                    />
                    <Label htmlFor={`${FIELD_KEYS.overrideFundsHeld}-cb`} className="text-sm whitespace-nowrap">
                      Override Funds Held
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground pl-5">Hold Days</p>
                </div>
                <Input
                  value={getValue(FIELD_KEYS.holdDays)}
                  onChange={(e) => setValue(FIELD_KEYS.holdDays, e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (!/\d/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault(); }}
                  disabled={
                    disabled || !isChecked(FIELD_KEYS.interestSplitEnabled) || !isChecked(FIELD_KEYS.overrideFundsHeld)
                  }
                  className="h-8 text-sm flex-1"
                  inputMode="numeric"
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
                onChange={(e) => setValue(FIELD_KEYS.dayDue, e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => { if (!/\d/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault(); }}
                disabled={disabled}
                className="h-8 text-sm flex-1"
                inputMode="numeric"
              />
            </div>

            {renderDateField(FIELD_KEYS.firstPayment, "First Payment")}
            {renderDateField(FIELD_KEYS.lastPaymentReceived, "Last Pmt Received")}
            {renderDateField(FIELD_KEYS.paidTo, "Paid To")}
            {renderDateField(FIELD_KEYS.nextPayment, "Next Payment")}
            {renderCurrencyField(FIELD_KEYS.regularPayment, "Regular Payment")}
            {renderCurrencyField(FIELD_KEYS.additionalPrincipal, "Additional Principal")}

            {/* Servicing Fees - Sales Tax does NOT impact Servicing Fees */}
            {isChecked(FIELD_KEYS.salesTaxEnabled) ? (
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.servicingFees}>
                <div className="flex items-center gap-3">
                  <Label className={LABEL_CLASS}>
                    Servicing Fees
                  </Label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                    <Input
                      value={getValue(FIELD_KEYS.servicingFees)}
                      onChange={(e) => setValue(FIELD_KEYS.servicingFees, e.target.value)}
                      disabled={disabled}
                      className="h-8 text-sm pl-7"
                      placeholder="-"
                    />
                  </div>
                </div>
              </DirtyFieldWrapper>
            ) : (
              renderCurrencyField(FIELD_KEYS.servicingFees, "Servicing Fees")
            )}

            {/* Sales Tax checkbox - independent from servicing fees calculation */}
            <div className="flex items-center gap-2">
              <Label className={LABEL_CLASS}>
                Sales Tax
              </Label>
              <Checkbox
                id={`${FIELD_KEYS.salesTaxEnabled}-cb`}
                checked={isChecked(FIELD_KEYS.salesTaxEnabled)}
                onCheckedChange={() => toggleCheck(FIELD_KEYS.salesTaxEnabled)}
                disabled={disabled}
                className="h-3.5 w-3.5"
              />
              <Label htmlFor={`${FIELD_KEYS.salesTaxEnabled}-cb`} className="text-sm text-muted-foreground whitespace-nowrap">
                Percent of Servicing Fees
              </Label>
            </div>

            {/* Other Scheduled Payments - clickable link to open modal */}
            {renderCurrencyField(
              FIELD_KEYS.otherScheduledPayments,
              "Other Sched. Pmts",
              LINK_LABEL,
              { onClick: () => setOtherScheduledPaymentsOpen(true) },
            )}

            {/* To Escrow Impounds - click navigates to Loan → Escrow Impounds */}
            {renderCurrencyField(
              FIELD_KEYS.toEscrowImpounds,
              "To Escrow Impounds",
              LINK_LABEL,
              {
                onClick: () => {
                  if (nav) {
                    nav.setSubSection('loan_terms', 'escrow_impound');
                  }
                },
              },
            )}

            {renderCurrencyField(FIELD_KEYS.defaultInterest, "Default Interest")}

            {/* Total Payment - calculated, read-only */}
            {renderCurrencyField(
              FIELD_KEYS.totalPayment,
              "Total Payment",
              "text-sm font-semibold text-foreground min-w-[160px] max-w-[160px] text-left shrink-0 whitespace-nowrap",
              { readOnly: true, computedValue: totalPayment },
            )}
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

            {/* Unpaid Other - new field below Charges Interest */}
            {renderCurrencyField(FIELD_KEYS.unpaidOther, "Unpaid Other")}

            {/* Amount to Reinstate - calculated, read-only */}
            {renderCurrencyField(
              FIELD_KEYS.amountToReinstate,
              "Amount to Reinstate",
              LINK_LABEL,
              { readOnly: true, computedValue: amountToReinstate },
            )}

            {/* Reserve Balance - click navigates to Trust Account → Reserve */}
            {renderCurrencyField(
              FIELD_KEYS.reserveBalance,
              "Reserve Balance",
              LINK_LABEL,
              {
                onClick: () => {
                  if (nav) {
                    nav.setSubSection('loan_terms', 'trust_ledger');
                  }
                },
              },
            )}

            {/* Suspense Funds - new field, click navigates to Trust Account → Suspense */}
            {renderCurrencyField(
              FIELD_KEYS.suspenseFunds,
              "Suspense Funds",
              LINK_LABEL,
              {
                onClick: () => {
                  if (nav) {
                    nav.setSubSection('loan_terms', 'trust_ledger');
                  }
                },
              },
            )}

            {renderCurrencyField(
              FIELD_KEYS.escrowBalance,
              "Escrow Balance",
              LINK_LABEL,
            )}

            {/* Total Balance Due & Estimated Balloon Payment - calculated, read-only */}
            <div className="pt-2 space-y-2">
              <div>
                {renderCurrencyField(
                  FIELD_KEYS.totalBalanceDue,
                  "Total Balance Due",
                  "text-sm text-primary font-medium min-w-[160px] max-w-[160px] text-left shrink-0 whitespace-nowrap",
                  { readOnly: true, computedValue: totalBalanceDue },
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  * Does not include Close-out Fees
                </p>
              </div>
              <div>
                {renderCurrencyField(
                  FIELD_KEYS.estimatedBalloonPayment,
                  "Est. Balloon Payment",
                  "text-sm text-primary font-medium min-w-[160px] max-w-[160px] text-left shrink-0 whitespace-nowrap",
                  { readOnly: true, computedValue: estimatedBalloonPayment },
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  * Does not include Close-out Fees
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sold Rate Split Modal */}
      <SoldRateSplitModal
        open={soldRateSplitOpen}
        onOpenChange={setSoldRateSplitOpen}
        values={values}
        onValueChange={onValueChange}
        disabled={disabled}
      />

      {/* Other Scheduled Payments Modal - simple placeholder */}
      {otherScheduledPaymentsOpen && (
        <Dialog open={otherScheduledPaymentsOpen} onOpenChange={setOtherScheduledPaymentsOpen}>
          <DialogContent className="sm:max-w-md z-[9999]">
            <DialogHeader>
              <DialogTitle>Other Scheduled Payments</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.otherScheduledPayments}>
                <div className="flex items-center gap-3">
                  <Label className="text-sm text-muted-foreground min-w-[100px] shrink-0">Amount</Label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                    <Input
                      value={focusedCurrencyField === `modal_${FIELD_KEYS.otherScheduledPayments}` ? getValue(FIELD_KEYS.otherScheduledPayments) : formatCurrencyDisplay(getValue(FIELD_KEYS.otherScheduledPayments))}
                      onChange={(e) => handleCurrencyChange(FIELD_KEYS.otherScheduledPayments, e.target.value)}
                      onFocus={() => setFocusedCurrencyField(`modal_${FIELD_KEYS.otherScheduledPayments}`)}
                      onBlur={() => handleCurrencyBlur(FIELD_KEYS.otherScheduledPayments)}
                      disabled={disabled}
                      className="h-8 text-sm pl-7"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </DirtyFieldWrapper>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOtherScheduledPaymentsOpen(false)} size="sm">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default LoanTermsBalancesForm;
