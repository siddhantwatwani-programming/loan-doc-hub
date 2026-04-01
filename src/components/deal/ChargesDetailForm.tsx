import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';
import { sanitizeInterestInput, normalizeInterestOnBlur } from '@/lib/interestValidation';
import { numericKeyDown, numericPaste, formatCurrencyDisplay, unformatCurrencyDisplay } from '@/lib/numericInputFilter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { CalendarIcon } from 'lucide-react';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

interface ChargesDetailFormProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}

import { CHARGES_DETAIL_KEYS } from '@/lib/fieldKeyMap';

// Use central field key map
const FIELD_KEYS = CHARGES_DETAIL_KEYS;

const renderInlineField = (key: string, label: string, values: Record<string, string>, onValueChange: (k: string, v: string) => void, disabled: boolean, props: Record<string, any> = {}, datePickerStates?: Record<string, boolean>, setDatePickerStates?: React.Dispatch<React.SetStateAction<Record<string, boolean>>>) => {
  if (props.type === 'date' && setDatePickerStates && datePickerStates) {
    const val = values[key] || '';
    const safeParse = (v: string): Date | undefined => { if (!v) return undefined; try { const d = parse(v, 'yyyy-MM-dd', new Date()); return isValid(d) ? d : undefined; } catch { return undefined; } };
    return (
      <DirtyFieldWrapper fieldKey={key}>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">{label}</Label>
          <Popover open={datePickerStates[key] || false} onOpenChange={(open) => setDatePickerStates(prev => ({ ...prev, [key]: open }))}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-7 text-sm flex-1 justify-start text-left font-normal', !val && 'text-muted-foreground')} disabled={disabled}>
                {val && safeParse(val) ? format(safeParse(val)!, 'dd-MM-yyyy') : 'dd-mm-yyyy'}
                <CalendarIcon className="ml-auto h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999]" align="start">
              <EnhancedCalendar mode="single" selected={safeParse(val)} onSelect={(date) => { if (date) onValueChange(key, format(date, 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [key]: false })); }} onClear={() => { onValueChange(key, ''); setDatePickerStates(prev => ({ ...prev, [key]: false })); }} onToday={() => { onValueChange(key, format(new Date(), 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [key]: false })); }} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </DirtyFieldWrapper>
    );
  }
  return (
    <DirtyFieldWrapper fieldKey={key}>
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">{label}</Label>
        <Input value={values[key] || ''} onChange={(e) => onValueChange(key, e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" {...props} />
      </div>
    </DirtyFieldWrapper>
  );
};

const renderCurrencyField = (key: string, label: string, values: Record<string, string>, onValueChange: (k: string, v: string) => void, disabled: boolean) => (
  <DirtyFieldWrapper fieldKey={key}>
    <div className="flex items-center gap-3">
      <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">{label}</Label>
      <div className="relative flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
        <Input type="number" step="0.01" value={values[key] || ''} onChange={(e) => onValueChange(key, e.target.value)} disabled={disabled} className="h-7 text-sm pl-6" placeholder="0.00" />
      </div>
    </div>
  </DirtyFieldWrapper>
);

export const ChargesDetailForm: React.FC<ChargesDetailFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const [datePickerStates, setDatePickerStates] = useState<Record<string, boolean>>({});
  return (
    <div className="space-y-4">
      {/* Loan Information */}
      <div>
        <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
          <span className="font-semibold text-sm text-primary">Loan Information</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 px-1">
          {renderInlineField(FIELD_KEYS.account, 'Account', values, onValueChange, disabled, { placeholder: 'Enter account' })}
          {renderInlineField(FIELD_KEYS.borrowerFullName, 'Borrower Name', values, onValueChange, disabled, { placeholder: 'Enter name' })}
        </div>
      </div>

      {/* Charge Information */}
      <div>
        <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
          <span className="font-semibold text-sm text-primary">Charge Information</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 px-1">
          {renderInlineField(FIELD_KEYS.dateOfCharge, 'Date of Charge', values, onValueChange, disabled, { type: 'date' }, datePickerStates, setDatePickerStates)}
          {renderInlineField(FIELD_KEYS.interestFrom, 'Interest From', values, onValueChange, disabled, { type: 'date' }, datePickerStates, setDatePickerStates)}
          {renderInlineField(FIELD_KEYS.reference, 'Reference', values, onValueChange, disabled, { placeholder: 'Enter reference' })}
          {renderInlineField(FIELD_KEYS.chargeType, 'Charge Type', values, onValueChange, disabled, { placeholder: 'Enter type' })}
          {renderCurrencyField(FIELD_KEYS.originalAmount, 'Original Amount', values, onValueChange, disabled)}
          {renderInlineField(FIELD_KEYS.description, 'Description', values, onValueChange, disabled, { placeholder: 'Enter description' })}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.interestRate}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Interest Rate</Label>
              <div className="relative flex-1">
                <Input inputMode="decimal" value={values[FIELD_KEYS.interestRate] || ''} onChange={(e) => onValueChange(FIELD_KEYS.interestRate, sanitizeInterestInput(e.target.value))} onBlur={() => { const v = normalizeInterestOnBlur(values[FIELD_KEYS.interestRate] || '', 2); if (v !== (values[FIELD_KEYS.interestRate] || '')) onValueChange(FIELD_KEYS.interestRate, v); }} disabled={disabled} className="h-7 text-sm pr-6" placeholder="0.00" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </DirtyFieldWrapper>
          {renderCurrencyField(FIELD_KEYS.unpaidBalance, 'Unpaid Balance', values, onValueChange, disabled)}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.notes}>
            <div className="flex items-start gap-3">
              <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0 pt-2">Notes</Label>
              <Textarea value={values[FIELD_KEYS.notes] || ''} onChange={(e) => onValueChange(FIELD_KEYS.notes, e.target.value)} disabled={disabled} className="text-sm min-h-[50px] flex-1" placeholder="Enter notes" />
            </div>
          </DirtyFieldWrapper>
        </div>
        <DirtyFieldWrapper fieldKey={FIELD_KEYS.deferred}>
          <div className="flex items-center gap-2 px-1 pt-2">
            <Checkbox
              id="deferred-cb"
              checked={values[FIELD_KEYS.deferred] === 'true'}
              onCheckedChange={(checked) => onValueChange(FIELD_KEYS.deferred, checked ? 'true' : 'false')}
              disabled={disabled}
              className="h-3.5 w-3.5"
            />
            <Label htmlFor="deferred-cb" className="text-sm text-foreground cursor-pointer">Deferred</Label>
          </div>
        </DirtyFieldWrapper>
      </div>

      {/* Distribution Section - keep existing table structure */}
      <div>
        <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
          <span className="font-semibold text-sm text-primary">Distribution</span>
        </div>
        <div className="px-1">
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] bg-muted/50 border-b border-border">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground"></div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">ACCOUNT ID</div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">NAME</div>
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">AMOUNT</div>
            </div>
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] border-b border-border items-center">
              <div className="px-3 py-2 text-sm font-medium text-foreground">Advanced By</div>
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.advancedByAccount}><div className="px-2 py-1.5"><Input value={values[FIELD_KEYS.advancedByAccount] || ''} onChange={(e) => onValueChange(FIELD_KEYS.advancedByAccount, e.target.value)} disabled={disabled} className="h-7 text-sm" /></div></DirtyFieldWrapper>
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.advancedByLenderName}><div className="px-2 py-1.5"><Input value={values[FIELD_KEYS.advancedByLenderName] || ''} onChange={(e) => onValueChange(FIELD_KEYS.advancedByLenderName, e.target.value)} disabled={disabled} className="h-7 text-sm" /></div></DirtyFieldWrapper>
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.advancedByAmount}><div className="px-2 py-1.5"><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span><Input type="number" step="0.01" value={values[FIELD_KEYS.advancedByAmount] || ''} onChange={(e) => onValueChange(FIELD_KEYS.advancedByAmount, e.target.value)} disabled={disabled} className="h-7 text-sm pl-6" placeholder="0.00" /></div></div></DirtyFieldWrapper>
            </div>
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] border-b border-border items-center">
              <div className="px-3 py-2 text-sm font-medium text-foreground">On Behalf Of</div>
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.onBehalfOfAccount}><div className="px-2 py-1.5"><Input value={values[FIELD_KEYS.onBehalfOfAccount] || ''} onChange={(e) => onValueChange(FIELD_KEYS.onBehalfOfAccount, e.target.value)} disabled={disabled} className="h-7 text-sm" /></div></DirtyFieldWrapper>
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.onBehalfOfLenderName}><div className="px-2 py-1.5"><Input value={values[FIELD_KEYS.onBehalfOfLenderName] || ''} onChange={(e) => onValueChange(FIELD_KEYS.onBehalfOfLenderName, e.target.value)} disabled={disabled} className="h-7 text-sm" /></div></DirtyFieldWrapper>
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.onBehalfOfAmount}><div className="px-2 py-1.5"><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span><Input type="number" step="0.01" value={values[FIELD_KEYS.onBehalfOfAmount] || ''} onChange={(e) => onValueChange(FIELD_KEYS.onBehalfOfAmount, e.target.value)} disabled={disabled} className="h-7 text-sm pl-6" placeholder="0.00" /></div></div></DirtyFieldWrapper>
            </div>
            <div className="grid grid-cols-[140px_1fr_1fr_1fr] items-center">
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.distributeBetweenAllLenders}>
                <div className="px-3 py-2 flex items-center gap-2">
                  <button type="button" disabled={disabled} onClick={() => onValueChange(FIELD_KEYS.distributeBetweenAllLenders, values[FIELD_KEYS.distributeBetweenAllLenders] === 'true' ? 'false' : 'true')} className="aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center">
                    {values[FIELD_KEYS.distributeBetweenAllLenders] === 'true' && <span className="h-2.5 w-2.5 rounded-full bg-current block" />}
                  </button>
                  <Label className="text-sm font-medium text-foreground cursor-pointer whitespace-nowrap" onClick={() => !disabled && onValueChange(FIELD_KEYS.distributeBetweenAllLenders, values[FIELD_KEYS.distributeBetweenAllLenders] === 'true' ? 'false' : 'true')}>Distribute Between All Lenders</Label>
                </div>
              </DirtyFieldWrapper>
              <div className="px-3 py-2 text-sm font-medium text-foreground col-span-2 text-right pr-4">Amount Advanced:</div>
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.amountOwedByBorrower}><div className="px-2 py-1.5"><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span><Input type="number" step="0.01" value={values[FIELD_KEYS.amountOwedByBorrower] || ''} onChange={(e) => onValueChange(FIELD_KEYS.amountOwedByBorrower, e.target.value)} disabled={disabled} className="h-7 text-sm pl-6" placeholder="0.00" /></div></div></DirtyFieldWrapper>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargesDetailForm;
