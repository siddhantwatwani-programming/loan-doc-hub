import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CalculationResult } from '@/lib/calculationEngine';

interface OriginationApplicationFormProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const FIELD_KEYS = {
  // Borrower
  dob: 'origination_app.borrower.dob',
  occupation: 'origination_app.borrower.occupation',
  employer: 'origination_app.borrower.employer',
  employed_since: 'origination_app.borrower.employed_since',
  contact: 'origination_app.borrower.contact',
  phone: 'origination_app.borrower.phone',
  email: 'origination_app.borrower.email',
  filed_bankruptcy: 'origination_app.borrower.filed_bankruptcy',
  discharged: 'origination_app.borrower.discharged',
  credit_score: 'origination_app.borrower.credit_score',

  // Gross Monthly Income
  income_salary: 'origination_app.income.salary',
  income_interest: 'origination_app.income.interest',
  income_dividend: 'origination_app.income.dividend',
  income_rental: 'origination_app.income.rental',
  income_other: 'origination_app.income.other',

  // Gross Monthly Expenses
  expense_credit_card: 'origination_app.expense.credit_card',
  expense_mortgage: 'origination_app.expense.mortgage',
  expense_spousal_child_support: 'origination_app.expense.spousal_child_support',
  expense_insurance: 'origination_app.expense.insurance',
  expense_automobile: 'origination_app.expense.automobile',
  expense_other: 'origination_app.expense.other',

  // Document Request
  doc_balance_sheet: 'origination_app.doc.balance_sheet_received',
  doc_balance_sheet_2: 'origination_app.doc.balance_sheet_reviewed',
  doc_income_statement: 'origination_app.doc.income_statement_received',
  doc_income_statement_2: 'origination_app.doc.income_statement_reviewed',
  doc_audited_financials: 'origination_app.doc.audited_financials',
  doc_audited_financials_2: 'origination_app.doc.audited_financials_reviewed',
  doc_periods_reviewed: 'origination_app.doc.periods_reviewed',
  doc_periods_reviewed_2: 'origination_app.doc.periods_reviewed_checked',
  doc_additional_info: 'origination_app.doc.additional_info_attached',
  doc_additional_info_2: 'origination_app.doc.additional_info_reviewed',
};

export const OriginationApplicationForm: React.FC<OriginationApplicationFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (key: string) => values[key] || '';
  const setValue = (key: string, value: string) => onValueChange(key, value);
  const getBoolValue = (key: string) => values[key] === 'true';
  const setBoolValue = (key: string, value: boolean) => onValueChange(key, String(value));

  const parseDate = (val: string): Date | undefined => {
    if (!val) return undefined;
    try { return parse(val, 'yyyy-MM-dd', new Date()); } catch { return undefined; }
  };

  const renderDatePicker = (label: string, key: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[140px] text-sm shrink-0">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn('h-7 w-full justify-start text-left font-normal text-sm', !getValue(key) && 'text-muted-foreground')}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {getValue(key) ? format(parseDate(getValue(key))!, 'MM/dd/yyyy') : 'Date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={parseDate(getValue(key))}
            onSelect={(date) => date && setValue(key, format(date, 'yyyy-MM-dd'))}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>
    </div>
  );

  const renderTextField = (label: string, key: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[140px] text-sm shrink-0">{label}</Label>
      <Input
        value={getValue(key)}
        onChange={(e) => setValue(key, e.target.value)}
        disabled={disabled}
        className="h-7 text-sm"
      />
    </div>
  );

  const renderCurrencyField = (label: string, key: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[140px] text-sm shrink-0">{label}</Label>
      <div className="relative flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
        <Input
          type="text"
          inputMode="decimal"
          value={getValue(key)}
          onChange={(e) => setValue(key, e.target.value)}
          disabled={disabled}
          placeholder="0.00"
          className="h-7 text-sm pl-6 text-right"
        />
      </div>
    </div>
  );

  const renderCheckboxField = (label: string, key: string) => (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={getBoolValue(key)}
        onCheckedChange={(checked) => setBoolValue(key, !!checked)}
        disabled={disabled}
      />
      <Label className="text-sm cursor-pointer">{label}</Label>
    </div>
  );

  const renderDualCheckboxField = (label: string, key1: string, key2: string) => (
    <div className="flex items-center gap-2">
      <Label className="text-sm shrink-0 flex-1">{label}</Label>
      <Checkbox
        checked={getBoolValue(key1)}
        onCheckedChange={(checked) => setBoolValue(key1, !!checked)}
        disabled={disabled}
      />
      <Checkbox
        checked={getBoolValue(key2)}
        onCheckedChange={(checked) => setBoolValue(key2, !!checked)}
        disabled={disabled}
      />
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-6">
        {/* Column 1: Borrower */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Borrower</h3>
          {renderDatePicker('DOB', FIELD_KEYS.dob)}
          {renderTextField('Occupation', FIELD_KEYS.occupation)}
          {renderTextField('Employer', FIELD_KEYS.employer)}
          {renderDatePicker('Employed Since', FIELD_KEYS.employed_since)}
          {renderTextField('Contact', FIELD_KEYS.contact)}
          {renderTextField('Phone', FIELD_KEYS.phone)}
          {renderTextField('Email', FIELD_KEYS.email)}
          <div className="pt-1 space-y-2">
            {renderCheckboxField('Filed for Bankruptcy (12 Months)', FIELD_KEYS.filed_bankruptcy)}
            {renderCheckboxField('Discharged?', FIELD_KEYS.discharged)}
          </div>
          {renderTextField('Credit Score', FIELD_KEYS.credit_score)}
        </div>

        {/* Column 2: Income & Expenses */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Gross Monthly Income</h3>
            {renderCurrencyField('Salary', FIELD_KEYS.income_salary)}
            {renderCurrencyField('Interest', FIELD_KEYS.income_interest)}
            {renderCurrencyField('Dividend', FIELD_KEYS.income_dividend)}
            {renderCurrencyField('Rental', FIELD_KEYS.income_rental)}
            {renderCurrencyField('Other', FIELD_KEYS.income_other)}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Gross Monthly Expenses</h3>
            {renderCurrencyField('Credit Card', FIELD_KEYS.expense_credit_card)}
            {renderCurrencyField('Mortgage', FIELD_KEYS.expense_mortgage)}
            {renderCurrencyField('Spousal / Child Support', FIELD_KEYS.expense_spousal_child_support)}
            {renderCurrencyField('Insurance', FIELD_KEYS.expense_insurance)}
            {renderCurrencyField('Automobile', FIELD_KEYS.expense_automobile)}
            {renderCurrencyField('Other', FIELD_KEYS.expense_other)}
          </div>
        </div>

        {/* Column 3: Document Request */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">Document Request</h3>
          {renderDualCheckboxField('Balance Sheet Received', FIELD_KEYS.doc_balance_sheet, FIELD_KEYS.doc_balance_sheet_2)}
          {renderDualCheckboxField('Income Statement Received', FIELD_KEYS.doc_income_statement, FIELD_KEYS.doc_income_statement_2)}
          {renderDualCheckboxField('Audited Financials', FIELD_KEYS.doc_audited_financials, FIELD_KEYS.doc_audited_financials_2)}
          {renderDualCheckboxField('Periods Reviewed', FIELD_KEYS.doc_periods_reviewed, FIELD_KEYS.doc_periods_reviewed_2)}
          {renderDualCheckboxField('Additional Information Attached', FIELD_KEYS.doc_additional_info, FIELD_KEYS.doc_additional_info_2)}
        </div>
      </div>
    </div>
  );
};

export default OriginationApplicationForm;
