import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface BorrowerBankingFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const SERVICE_STATUS_OPTIONS = ['None', 'Active', 'Cancelled', 'Hold'];
const APPLY_DEBIT_AS_OPTIONS = ['Regular Payment', 'To Trust'];
const DEBIT_FREQUENCY_OPTIONS = [
  'Once Only',
  'Monthly',
  'Quarterly',
  'Bi-Monthly',
  'Bi-Weekly',
  'Weekly',
  'Every 15 Days',
  'Twice Per Month',
  '15th and EOM',
  'Semi-Yearly',
  'Yearly',
];
const ACCOUNT_TYPE_OPTIONS = ['Checking', 'Savings'];

export const BorrowerBankingForm: React.FC<BorrowerBankingFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  // Initialize defaults
  useEffect(() => {
    if (!values['Borrower.Banking.ServiceStatus']) {
      onValueChange('Borrower.Banking.ServiceStatus', 'None');
    }
    if (!values['Borrower.Banking.ApplyDebitAs']) {
      onValueChange('Borrower.Banking.ApplyDebitAs', 'To Trust');
    }
    if (!values['Borrower.Banking.DebitFrequency']) {
      onValueChange('Borrower.Banking.DebitFrequency', 'Once Only');
    }
  }, []);

  const getFieldValue = (key: string) => values[key] || '';
  
  const debitFrequency = getFieldValue('Borrower.Banking.DebitFrequency') || 'Once Only';
  const isOnceOnly = debitFrequency === 'Once Only';

  const maskValue = (value: string) => {
    if (!value || value.length <= 4) return value;
    return '•'.repeat(value.length - 4) + value.slice(-4);
  };

  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-2 mb-4">
        <span className="font-semibold text-base text-foreground">ACH Information</span>
      </div>

      <div className="grid grid-cols-2 gap-x-12 gap-y-4">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Bank Name */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Bank Name</Label>
            <Input
              value={getFieldValue('Borrower.Banking.BankName')}
              onChange={(e) => onValueChange('Borrower.Banking.BankName', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm flex-1"
            />
          </div>

          {/* Bank Address */}
          <div className="flex items-start gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0 pt-2">Bank Address</Label>
            <Textarea
              value={getFieldValue('Borrower.Banking.BankAddress')}
              onChange={(e) => onValueChange('Borrower.Banking.BankAddress', e.target.value)}
              disabled={disabled}
              className="text-sm flex-1 min-h-[80px]"
              rows={3}
            />
          </div>

          {/* Routing Number - Masked */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Routing Number</Label>
            <Input
              value={getFieldValue('Borrower.Banking.RoutingNumber')}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                onValueChange('Borrower.Banking.RoutingNumber', val);
              }}
              disabled={disabled}
              className="h-8 text-sm flex-1"
              placeholder="•••••••••"
              type="password"
              inputMode="numeric"
            />
          </div>

          {/* Account Number - Masked */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Account Number</Label>
            <Input
              value={getFieldValue('Borrower.Banking.AccountNumber')}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 17);
                onValueChange('Borrower.Banking.AccountNumber', val);
              }}
              disabled={disabled}
              className="h-8 text-sm flex-1"
              placeholder="••••••••••••"
              type="password"
              inputMode="numeric"
            />
          </div>

          {/* Individual ID */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Individual Id</Label>
            <Input
              value={getFieldValue('Borrower.Banking.IndividualId')}
              onChange={(e) => onValueChange('Borrower.Banking.IndividualId', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm flex-1"
            />
          </div>

          {/* Individual Name */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Individual Name</Label>
            <Input
              value={getFieldValue('Borrower.Banking.IndividualName')}
              onChange={(e) => onValueChange('Borrower.Banking.IndividualName', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm flex-1"
            />
          </div>

          {/* Account Type */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Account Type</Label>
            <Select
              value={getFieldValue('Borrower.Banking.AccountType') || 'Checking'}
              onValueChange={(val) => onValueChange('Borrower.Banking.AccountType', val)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Service Status */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Service Status</Label>
            <Select
              value={getFieldValue('Borrower.Banking.ServiceStatus') || 'None'}
              onValueChange={(val) => onValueChange('Borrower.Banking.ServiceStatus', val)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {SERVICE_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Apply Debit As */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Apply Debit As</Label>
            <Select
              value={getFieldValue('Borrower.Banking.ApplyDebitAs') || 'To Trust'}
              onValueChange={(val) => onValueChange('Borrower.Banking.ApplyDebitAs', val)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue placeholder="Select option" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {APPLY_DEBIT_AS_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Debit Frequency */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Debit Frequency</Label>
            <Select
              value={debitFrequency}
              onValueChange={(val) => onValueChange('Borrower.Banking.DebitFrequency', val)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-sm flex-1">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {DEBIT_FREQUENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Debit Due Day */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Debit Due Day</Label>
            <Input
              value={getFieldValue('Borrower.Banking.DebitDueDay')}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                const num = parseInt(val, 10);
                if (val === '' || (num >= 1 && num <= 31)) {
                  onValueChange('Borrower.Banking.DebitDueDay', val);
                }
              }}
              disabled={disabled || isOnceOnly}
              className={cn("h-8 text-sm flex-1", isOnceOnly && "bg-muted opacity-50")}
              placeholder={isOnceOnly ? "N/A" : "1-31"}
              inputMode="numeric"
            />
          </div>

          {/* Next Debit Date */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Next Debit Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={disabled}
                  className={cn(
                    "h-8 text-sm flex-1 justify-start text-left font-normal",
                    !getFieldValue('Borrower.Banking.NextDebitDate') && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {getFieldValue('Borrower.Banking.NextDebitDate')
                    ? format(parseDate(getFieldValue('Borrower.Banking.NextDebitDate'))!, 'MM/dd/yyyy')
                    : 'mm/dd/yyyy'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                <Calendar
                  mode="single"
                  selected={parseDate(getFieldValue('Borrower.Banking.NextDebitDate'))}
                  onSelect={(date) => onValueChange('Borrower.Banking.NextDebitDate', date ? format(date, 'yyyy-MM-dd') : '')}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Stop Date */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Stop Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={disabled}
                  className={cn(
                    "h-8 text-sm flex-1 justify-start text-left font-normal",
                    !getFieldValue('Borrower.Banking.StopDate') && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {getFieldValue('Borrower.Banking.StopDate')
                    ? format(parseDate(getFieldValue('Borrower.Banking.StopDate'))!, 'MM/dd/yyyy')
                    : 'mm/dd/yyyy'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                <Calendar
                  mode="single"
                  selected={parseDate(getFieldValue('Borrower.Banking.StopDate'))}
                  onSelect={(date) => onValueChange('Borrower.Banking.StopDate', date ? format(date, 'yyyy-MM-dd') : '')}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Debit Amount */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Debit Amount</Label>
            <div className="flex items-center flex-1">
              <span className="text-sm text-muted-foreground mr-2">$</span>
              <Input
                value={getFieldValue('Borrower.Banking.DebitAmount')}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d.]/g, '');
                  onValueChange('Borrower.Banking.DebitAmount', val);
                }}
                disabled={disabled}
                className="h-8 text-sm flex-1"
                placeholder="0.00"
                inputMode="decimal"
              />
            </div>
          </div>

          {/* Send Confirm */}
          <div className="flex items-center gap-4">
            <Label className="w-32 text-sm text-foreground flex-shrink-0">Send Confirm</Label>
            <input
              type="checkbox"
              checked={getFieldValue('Borrower.Banking.SendConfirm') === 'true'}
              onChange={(e) => onValueChange('Borrower.Banking.SendConfirm', e.target.checked ? 'true' : 'false')}
              disabled={disabled}
              className="h-4 w-4 rounded border-input"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Banking information is used for ACH payments and direct deposits. Ensure all details are accurate before submission.
        </p>
      </div>
    </div>
  );
};

export default BorrowerBankingForm;
