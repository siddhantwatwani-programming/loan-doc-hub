import React, { useEffect, useState } from 'react';
import { MaskedInput } from '@/components/ui/masked-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';

import { BORROWER_BANKING_KEYS } from '@/lib/fieldKeyMap';

// Use central field key map
const FIELD_KEYS = BORROWER_BANKING_KEYS;

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
const ACCOUNT_TYPE_OPTIONS = ['Personal Savings', 'Personal Checking', 'Business Savings', 'Business Checking'];

export const BorrowerBankingForm: React.FC<BorrowerBankingFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getValue = (key: keyof typeof FIELD_KEYS): string => {
    return values[FIELD_KEYS[key]] || '';
  };

  const getBoolValue = (key: keyof typeof FIELD_KEYS): boolean => {
    return values[FIELD_KEYS[key]] === 'true';
  };

  const handleChange = (key: keyof typeof FIELD_KEYS, value: string | boolean) => {
    onValueChange(FIELD_KEYS[key], String(value));
  };

  // Initialize defaults
  useEffect(() => {
    if (!getValue('serviceStatus')) {
      handleChange('serviceStatus', 'None');
    }
    if (!getValue('applyDebitAs')) {
      handleChange('applyDebitAs', 'To Trust');
    }
    if (!getValue('debitFrequency')) {
      handleChange('debitFrequency', 'Once Only');
    }
  }, []);
  
  const debitFrequency = getValue('debitFrequency') || 'Once Only';
  const isOnceOnly = debitFrequency === 'Once Only';
  const [nextDebitOpen, setNextDebitOpen] = useState(false);
  const [stopDateOpen, setStopDateOpen] = useState(false);

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
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.bankName}>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0">Bank Name</Label>
              <Input
                value={getValue('bankName')}
                onChange={(e) => handleChange('bankName', e.target.value)}
                disabled={disabled}
                className="h-8 text-sm flex-1"
              />
            </div>
          </DirtyFieldWrapper>

          {/* Bank Address */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.bankAddress}>
            <div className="flex items-start gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0 pt-2">Bank Address</Label>
              <Textarea
                value={getValue('bankAddress')}
                onChange={(e) => handleChange('bankAddress', e.target.value)}
                disabled={disabled}
                className="text-sm flex-1 min-h-[80px]"
                rows={3}
              />
            </div>
          </DirtyFieldWrapper>

          {/* Routing Number */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.routingNumber}>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0">Routing Number</Label>
              <MaskedInput
                value={getValue('routingNumber')}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 9);
                  handleChange('routingNumber', val);
                }}
                disabled={disabled}
                placeholder="•••••••••"
                maxLength={9}
                inputMode="numeric"
              />
            </div>
          </DirtyFieldWrapper>

          {/* Account Number */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.accountNumber}>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0">Account Number</Label>
              <MaskedInput
                value={getValue('accountNumber')}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 17);
                  handleChange('accountNumber', val);
                }}
                disabled={disabled}
                placeholder="••••••••••••"
                maxLength={17}
                inputMode="numeric"
              />
            </div>
          </DirtyFieldWrapper>

          {/* Individual ID */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.individualId}>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0">Individual Id</Label>
              <Input
                value={getValue('individualId')}
                onChange={(e) => handleChange('individualId', e.target.value)}
                disabled={disabled}
                className="h-8 text-sm flex-1"
              />
            </div>
          </DirtyFieldWrapper>

          {/* Individual Name */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.individualName}>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0">Individual Name</Label>
              <Input
                value={getValue('individualName')}
                onChange={(e) => handleChange('individualName', e.target.value)}
                disabled={disabled}
                className="h-8 text-sm flex-1"
              />
            </div>
          </DirtyFieldWrapper>

          {/* Account Type */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.accountType}>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0">Account Type</Label>
              <Select
                value={getValue('accountType') || 'Checking'}
                onValueChange={(val) => handleChange('accountType', val)}
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
          </DirtyFieldWrapper>

          {/* Notes */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.notes}>
            <div className="flex items-start gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0 pt-2">Notes</Label>
              <Textarea
                value={getValue('notes')}
                onChange={(e) => handleChange('notes', e.target.value)}
                disabled={disabled}
                className="text-sm flex-1 min-h-[80px]"
                rows={3}
                placeholder="Enter notes..."
              />
            </div>
          </DirtyFieldWrapper>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Service Status */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.serviceStatus}>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0">Service Status</Label>
              <Select
                value={getValue('serviceStatus') || 'None'}
                onValueChange={(val) => handleChange('serviceStatus', val)}
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
          </DirtyFieldWrapper>

          {/* Apply Debit As */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.applyDebitAs}>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0">Apply Debit As</Label>
              <Select
                value={getValue('applyDebitAs') || 'To Trust'}
                onValueChange={(val) => handleChange('applyDebitAs', val)}
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
          </DirtyFieldWrapper>

          {/* Debit Frequency */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.debitFrequency}>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0">Debit Frequency</Label>
              <Select
                value={debitFrequency}
                onValueChange={(val) => handleChange('debitFrequency', val)}
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
          </DirtyFieldWrapper>

          {/* Debit Due Day */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.debitDueDay}>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0">Debit Due Day</Label>
              <Input
                value={getValue('debitDueDay')}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  const num = parseInt(val, 10);
                  if (val === '' || (num >= 1 && num <= 31)) {
                    handleChange('debitDueDay', val);
                  }
                }}
                disabled={disabled || isOnceOnly}
                className={cn("h-8 text-sm flex-1", isOnceOnly && "bg-muted opacity-50")}
                placeholder={isOnceOnly ? "N/A" : "1-31"}
                inputMode="numeric"
              />
            </div>
          </DirtyFieldWrapper>

          {/* Next Debit Date */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.nextDebitDate}>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0">Next Debit Date</Label>
              <Popover open={nextDebitOpen} onOpenChange={setNextDebitOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                      "h-8 text-sm flex-1 justify-start text-left font-normal",
                      !getValue('nextDebitDate') && "text-muted-foreground"
                    )}
                  >
                    {getValue('nextDebitDate')
                      ? format(parseDate(getValue('nextDebitDate'))!, 'MM/dd/yyyy')
                      : 'MM/DD/YYYY'}
                    <CalendarIcon className="ml-auto h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                  <EnhancedCalendar
                    mode="single"
                    selected={parseDate(getValue('nextDebitDate'))}
                    onSelect={(date) => { handleChange('nextDebitDate', date ? format(date, 'yyyy-MM-dd') : ''); setNextDebitOpen(false); }}
                    onClear={() => { handleChange('nextDebitDate', ''); setNextDebitOpen(false); }}
                    onToday={() => { handleChange('nextDebitDate', format(new Date(), 'yyyy-MM-dd')); setNextDebitOpen(false); }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </DirtyFieldWrapper>

          {/* Stop Date */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.stopDate}>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0">Stop Date</Label>
              <Popover open={stopDateOpen} onOpenChange={setStopDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                      "h-8 text-sm flex-1 justify-start text-left font-normal",
                      !getValue('stopDate') && "text-muted-foreground"
                    )}
                  >
                    {getValue('stopDate')
                      ? format(parseDate(getValue('stopDate'))!, 'MM/dd/yyyy')
                      : 'MM/DD/YYYY'}
                    <CalendarIcon className="ml-auto h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                  <EnhancedCalendar
                    mode="single"
                    selected={parseDate(getValue('stopDate'))}
                    onSelect={(date) => { handleChange('stopDate', date ? format(date, 'yyyy-MM-dd') : ''); setStopDateOpen(false); }}
                    onClear={() => { handleChange('stopDate', ''); setStopDateOpen(false); }}
                    onToday={() => { handleChange('stopDate', format(new Date(), 'yyyy-MM-dd')); setStopDateOpen(false); }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </DirtyFieldWrapper>

          {/* Debit Amount */}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.debitAmount}>
            <div className="flex items-center gap-4">
              <Label className="w-32 text-sm text-foreground flex-shrink-0">Debit Amount</Label>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
                <Input
                  value={getValue('debitAmount')}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^\d.]/g, '');
                    handleChange('debitAmount', val);
                  }}
                  disabled={disabled}
                  className="h-8 text-sm pl-6"
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
            </div>
          </DirtyFieldWrapper>

          {/* Send Confirm + Disable Online Payment */}
          <div className="flex items-center gap-4">
            <DirtyFieldWrapper fieldKey={FIELD_KEYS.sendConfirm}>
              <div className="flex items-center gap-2">
                <Label className="w-32 text-sm text-foreground flex-shrink-0">Send Confirm</Label>
                <Checkbox
                  checked={getBoolValue('sendConfirm')}
                  onCheckedChange={(checked) => handleChange('sendConfirm', !!checked)}
                  disabled={disabled}
                  className="h-4 w-4"
                />
              </div>
            </DirtyFieldWrapper>
            <DirtyFieldWrapper fieldKey={FIELD_KEYS.disableOnlinePayment}>
              <div className="flex items-center gap-2 ml-8">
                <Label className="text-sm font-semibold text-foreground whitespace-nowrap">Disable Online Payment</Label>
                <Checkbox
                  checked={getBoolValue('disableOnlinePayment')}
                  onCheckedChange={(checked) => handleChange('disableOnlinePayment', !!checked)}
                  disabled={disabled}
                  className="h-4 w-4"
                />
              </div>
            </DirtyFieldWrapper>
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
