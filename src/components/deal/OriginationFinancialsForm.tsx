import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { CalendarIcon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';
import type { CalculationResult } from '@/lib/calculationEngine';

interface OriginationFinancialsFormProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const FIELD_KEYS = {
  bank_statements_present: 'origination_app.financials.bank_statements_present',
  bank_statements_status: 'origination_app.financials.bank_statements_status',
  balance_sheet_pl_present: 'origination_app.financials.balance_sheet_pl_present',
  balance_sheet_pl_assurance: 'origination_app.financials.balance_sheet_pl_assurance',
  balance_sheet_pl_status: 'origination_app.financials.balance_sheet_pl_status',
  balance_sheet_as_of_date: 'origination_app.financials.balance_sheet_as_of_date',
  pl_period_begin: 'origination_app.financials.pl_period_begin',
  pl_period_end: 'origination_app.financials.pl_period_end',
  performed_by: 'origination_app.financials.performed_by',
  rent_rolls_leases_present: 'origination_app.financials.rent_rolls_leases_present',
  rent_rolls_leases_status: 'origination_app.financials.rent_rolls_leases_status',
};

const STATUS_OPTIONS = [
  { value: 'requested', label: 'Requested' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'received', label: 'Received' },
];

const ASSURANCE_OPTIONS = [
  { value: 'unaudited', label: 'Unaudited' },
  { value: 'audited', label: 'Audited' },
];

const PERFORMED_BY_OPTIONS = [
  { value: 'borrower', label: 'Borrower' },
  { value: 'cpa', label: 'CPA' },
  { value: 'other', label: 'Other' },
];

export const OriginationFinancialsForm: React.FC<OriginationFinancialsFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (key: string) => values[key] || '';
  const setValue = (key: string, value: string) => onValueChange(key, value);
  const getBoolValue = (key: string) => values[key] === 'true';
  const setBoolValue = (key: string, value: boolean) => onValueChange(key, String(value));
  const [datePickerStates, setDatePickerStates] = React.useState<Record<string, boolean>>({});

  const parseDate = (val: string): Date | undefined => {
    if (!val) return undefined;
    try { return parse(val, 'yyyy-MM-dd', new Date()); } catch { return undefined; }
  };

  const renderYNToggle = (label: string, key: string) => (
    <DirtyFieldWrapper fieldKey={key}>
      <div className="flex items-center gap-2">
        <Label className="w-[180px] text-sm shrink-0">{label}</Label>
        <Checkbox
          checked={getBoolValue(key)}
          onCheckedChange={(checked) => setBoolValue(key, !!checked)}
          disabled={disabled}
        />
      </div>
    </DirtyFieldWrapper>
  );

  const renderDropdown = (
    label: string,
    key: string,
    options: { value: string; label: string }[]
  ) => (
    <DirtyFieldWrapper fieldKey={key}>
      <div className="flex items-center gap-2">
        <Label className="w-[180px] text-sm shrink-0">{label}</Label>
        <Select
          value={getValue(key) || undefined}
          onValueChange={(val) => setValue(key, val)}
          disabled={disabled}
        >
          <SelectTrigger className="h-7 text-sm flex-1">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent className="z-[9999]">
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </DirtyFieldWrapper>
  );

  const renderDatePicker = (label: string, key: string) => (
    <DirtyFieldWrapper fieldKey={key}>
      <div className="flex items-center gap-2">
        <Label className="w-[180px] text-sm shrink-0">{label}</Label>
        <Popover
          open={datePickerStates[key] || false}
          onOpenChange={(open) => setDatePickerStates((prev) => ({ ...prev, [key]: open }))}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'h-7 flex-1 justify-start text-left font-normal text-sm',
                !getValue(key) && 'text-muted-foreground'
              )}
              disabled={disabled}
            >
              {getValue(key) ? format(parseDate(getValue(key))!, 'MM/dd/yyyy') : 'MM/DD/YYYY'}
              <CalendarIcon className="ml-auto h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[9999]" align="start">
            <EnhancedCalendar
              mode="single"
              selected={parseDate(getValue(key))}
              onSelect={(date) => {
                if (date) setValue(key, format(date, 'yyyy-MM-dd'));
                setDatePickerStates((prev) => ({ ...prev, [key]: false }));
              }}
              onClear={() => {
                setValue(key, '');
                setDatePickerStates((prev) => ({ ...prev, [key]: false }));
              }}
              onToday={() => {
                setValue(key, format(new Date(), 'yyyy-MM-dd'));
                setDatePickerStates((prev) => ({ ...prev, [key]: false }));
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </DirtyFieldWrapper>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
        {/* Bank Statements */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">
            Bank Statements
          </h3>
          {renderYNToggle('Bank Statements', FIELD_KEYS.bank_statements_present)}
          {renderDropdown('Status', FIELD_KEYS.bank_statements_status, STATUS_OPTIONS)}
        </div>

        {/* Rent Rolls / Leases */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">
            Rent Rolls / Leases
          </h3>
          {renderYNToggle('Rent Rolls / Leases', FIELD_KEYS.rent_rolls_leases_present)}
          {renderDropdown('Status', FIELD_KEYS.rent_rolls_leases_status, STATUS_OPTIONS)}
        </div>

        {/* Balance Sheet / P&L */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">
            Balance Sheet / P&amp;L
          </h3>
          {renderYNToggle('Balance Sheet / P&L', FIELD_KEYS.balance_sheet_pl_present)}
          {renderDropdown('Assurance Level', FIELD_KEYS.balance_sheet_pl_assurance, ASSURANCE_OPTIONS)}
          {renderDropdown('Status', FIELD_KEYS.balance_sheet_pl_status, STATUS_OPTIONS)}
          {renderDatePicker('Balance Sheet as of Date', FIELD_KEYS.balance_sheet_as_of_date)}
          {renderDatePicker('P&L Period Begin', FIELD_KEYS.pl_period_begin)}
          {renderDatePicker('P&L Period End', FIELD_KEYS.pl_period_end)}
        </div>

        {/* Performed By */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-1">
            Performed By
          </h3>
          {renderDropdown('Performed By', FIELD_KEYS.performed_by, PERFORMED_BY_OPTIONS)}
        </div>
      </div>
    </div>
  );
};

export default OriginationFinancialsForm;
