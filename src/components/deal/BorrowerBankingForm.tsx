import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

const FIELD_KEYS = {
  bankName: 'ach.bank_name',
  bankAddress: 'ach.bank_address',
  routingNumber: 'ach.routing_number',
  accountNumber: 'ach.account_number',
  individualId: 'ach.individual_id',
  individualName: 'ach.individual_name',
  accountType: 'ach.account_type',
  serviceStatus: 'ach.service_status',
  applyDebitAs: 'ach.apply_debit_as',
  debitFrequency: 'ach.debit_frequency',
  debitDueDay: 'ach.debit_due_day',
  nextDebitDate: 'ach.next_debit_date',
  stopDate: 'ach.stop_date',
  debitAmount: 'ach.debit_amount',
  sendConfirm: 'ach.send_confirm',
} as const;

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
  'Once Only', 'Monthly', 'Quarterly', 'Bi-Monthly', 'Bi-Weekly',
  'Weekly', 'Every 15 Days', 'Twice Per Month', '15th and EOM',
  'Semi-Yearly', 'Yearly',
];
const ACCOUNT_TYPE_OPTIONS = ['Checking', 'Savings'];

export const BorrowerBankingForm: React.FC<BorrowerBankingFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getValue = (key: keyof typeof FIELD_KEYS): string => values[FIELD_KEYS[key]] || '';
  const getBoolValue = (key: keyof typeof FIELD_KEYS): boolean => values[FIELD_KEYS[key]] === 'true';
  const handleChange = (key: keyof typeof FIELD_KEYS, value: string | boolean) => {
    onValueChange(FIELD_KEYS[key], String(value));
  };

  useEffect(() => {
    if (!getValue('serviceStatus')) handleChange('serviceStatus', 'None');
    if (!getValue('applyDebitAs')) handleChange('applyDebitAs', 'To Trust');
    if (!getValue('debitFrequency')) handleChange('debitFrequency', 'Once Only');
  }, []);

  const debitFrequency = getValue('debitFrequency') || 'Once Only';
  const isOnceOnly = debitFrequency === 'Once Only';

  const parseDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? undefined : date;
  };

  return (
    <div className="p-4 space-y-4">
      <div className="border-b border-border pb-1 mb-3">
        <span className="font-semibold text-xs text-foreground">ACH Information</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        {/* Left Column */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Bank Name</Label>
            <Input value={getValue('bankName')} onChange={(e) => handleChange('bankName', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />
          </div>
          <div className="flex items-start gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0 pt-1.5">Bank Address</Label>
            <Textarea value={getValue('bankAddress')} onChange={(e) => handleChange('bankAddress', e.target.value)} disabled={disabled} className="text-xs flex-1 min-h-[60px] min-w-0" rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Routing #</Label>
            <Input value={getValue('routingNumber')} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 9); handleChange('routingNumber', val); }} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" placeholder="•••••••••" type="password" inputMode="numeric" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Account #</Label>
            <Input value={getValue('accountNumber')} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 17); handleChange('accountNumber', val); }} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" placeholder="••••••••••••" type="password" inputMode="numeric" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Individual Id</Label>
            <Input value={getValue('individualId')} onChange={(e) => handleChange('individualId', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Individual Name</Label>
            <Input value={getValue('individualName')} onChange={(e) => handleChange('individualName', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Account Type</Label>
            <Select value={getValue('accountType') || 'Checking'} onValueChange={(val) => handleChange('accountType', val)} disabled={disabled}>
              <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent className="bg-background z-50">{ACCOUNT_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Service Status</Label>
            <Select value={getValue('serviceStatus') || 'None'} onValueChange={(val) => handleChange('serviceStatus', val)} disabled={disabled}>
              <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent className="bg-background z-50">{SERVICE_STATUS_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Apply Debit As</Label>
            <Select value={getValue('applyDebitAs') || 'To Trust'} onValueChange={(val) => handleChange('applyDebitAs', val)} disabled={disabled}>
              <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent className="bg-background z-50">{APPLY_DEBIT_AS_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Debit Frequency</Label>
            <Select value={debitFrequency} onValueChange={(val) => handleChange('debitFrequency', val)} disabled={disabled}>
              <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent className="bg-background z-50">{DEBIT_FREQUENCY_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Debit Due Day</Label>
            <Input value={getValue('debitDueDay')} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); const num = parseInt(val, 10); if (val === '' || (num >= 1 && num <= 31)) handleChange('debitDueDay', val); }} disabled={disabled || isOnceOnly} className={cn("h-7 text-xs flex-1 min-w-0", isOnceOnly && "bg-muted opacity-50")} placeholder={isOnceOnly ? "N/A" : "1-31"} inputMode="numeric" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Next Debit Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" disabled={disabled} className={cn("h-7 text-xs flex-1 min-w-0 justify-start text-left font-normal", !getValue('nextDebitDate') && "text-muted-foreground")}>
                  <CalendarIcon className="mr-1.5 h-3 w-3" />
                  {getValue('nextDebitDate') ? format(parseDate(getValue('nextDebitDate'))!, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                <Calendar mode="single" selected={parseDate(getValue('nextDebitDate'))} onSelect={(date) => handleChange('nextDebitDate', date ? format(date, 'yyyy-MM-dd') : '')} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Stop Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" disabled={disabled} className={cn("h-7 text-xs flex-1 min-w-0 justify-start text-left font-normal", !getValue('stopDate') && "text-muted-foreground")}>
                  <CalendarIcon className="mr-1.5 h-3 w-3" />
                  {getValue('stopDate') ? format(parseDate(getValue('stopDate'))!, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                <Calendar mode="single" selected={parseDate(getValue('stopDate'))} onSelect={(date) => handleChange('stopDate', date ? format(date, 'yyyy-MM-dd') : '')} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Debit Amount</Label>
            <div className="flex items-center flex-1 min-w-0 gap-1">
              <span className="text-xs text-muted-foreground">$</span>
              <Input value={getValue('debitAmount')} onChange={(e) => { const val = e.target.value.replace(/[^\d.]/g, ''); handleChange('debitAmount', val); }} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" placeholder="0.00" inputMode="decimal" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Send Confirm</Label>
            <Checkbox checked={getBoolValue('sendConfirm')} onCheckedChange={(checked) => handleChange('sendConfirm', !!checked)} disabled={disabled} className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Banking information is used for ACH payments and direct deposits. Ensure all details are accurate before submission.
        </p>
      </div>
    </div>
  );
};

export default BorrowerBankingForm;
