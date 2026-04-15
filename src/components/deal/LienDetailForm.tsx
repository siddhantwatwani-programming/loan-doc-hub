import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Home, CalendarIcon } from 'lucide-react';
import { sanitizeInterestInput, normalizeInterestOnBlur } from '@/lib/interestValidation';
import { numericKeyDown, numericPaste, formatCurrencyDisplay, unformatCurrencyDisplay } from '@/lib/numericInputFilter';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import type { LienData } from './LiensTableView';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';

interface LienDetailFormProps {
  lien: LienData;
  onChange: (field: keyof LienData, value: string) => void;
  disabled?: boolean;
  propertyOptions?: { id: string; label: string }[];
  loanValues?: Record<string, string>;
}

const SOURCE_OF_INFORMATION_OPTIONS = ['Borrower', 'Title / Prelim', 'Lender', 'Broker'];
const LOAN_TYPE_DROPDOWN_OPTIONS = ['Conventional', 'Private Lender', 'Judgement', 'Other'];

const getThisLoanAutofillValues = (loanValues: Record<string, string>) => ({
  account: loanValues['Terms.LoanNumber'] || loanValues['loan_terms.loan_number'] || '',
  balanceAfter: loanValues['loan_terms.loan_amount'] || '',
  regularPayment: loanValues['loan_terms.regular_payment'] || '',
});

const DIRTY_KEY_MAP: Record<string, string> = {
  property: 'lien1.property',
  priority: 'lien1.priority',
  holder: 'lien1.holder',
  account: 'lien1.account',
  contact: 'lien1.contact',
  phone: 'lien1.phone',
  fax: 'lien1.fax',
  email: 'lien1.email',
  loanType: 'lien1.loan_type',
  loanTypeDropdown: 'lien1.loan_type_dropdown',
  anticipated: 'lien1.anticipated',
  anticipatedAmount: 'lien1.anticipated_amount',
  existingRemain: 'lien1.existing_remain',
  existingPaydown: 'lien1.existing_paydown',
  existingPayoff: 'lien1.existing_payoff',
  existingPaydownAmount: 'lien1.existing_paydown_amount',
  existingPayoffAmount: 'lien1.existing_payoff_amount',
  lienPriorityNow: 'lien1.lien_priority_now',
  lienPriorityAfter: 'lien1.lien_priority_after',
  remainingNewLienPriority: 'lien1.remaining_new_lien_priority',
  newRemainingBalance: 'lien1.new_remaining_balance',
  interestRate: 'lien1.interest_rate',
  maturityDate: 'lien1.maturity_date',
  originalBalance: 'lien1.original_balance',
  balanceAfter: 'lien1.balance_after',
  currentBalance: 'lien1.current_balance',
  regularPayment: 'lien1.regular_payment',
  balloon: 'lien1.balloon',
  balloonAmount: 'lien1.balloon_amount',
  recordingNumber: 'lien1.recording_number',
  recordingNumberFlag: 'lien1.recording_number_flag',
  recordingDate: 'lien1.recording_date',
  seniorLienTracking: 'lien1.senior_lien_tracking',
  sltActive: 'lien1.slt_active',
  lastVerified: 'lien1.last_verified',
  lastChecked: 'lien1.last_checked',
  sltCurrent: 'lien1.slt_current',
  sltDelinquent: 'lien1.slt_delinquent',
  sltDelinquentDays: 'lien1.slt_delinquent_days',
  sltUnderModification: 'lien1.slt_under_modification',
  sltForeclosure: 'lien1.slt_foreclosure',
  sltForeclosureDate: 'lien1.slt_foreclosure_date',
  sltPaidOff: 'lien1.slt_paid_off',
  sltLastPaymentMade: 'lien1.slt_last_payment_made',
  sltNextPaymentDue: 'lien1.slt_next_payment_due',
  sltCurrentBalance: 'lien1.slt_current_balance',
  sltRequestSubmitted: 'lien1.slt_request_submitted',
  sltResponseReceived: 'lien1.slt_response_received',
  sltUnableToVerify: 'lien1.slt_unable_to_verify',
  sltLenderNotified: 'lien1.slt_lender_notified',
  sltLenderNotifiedDate: 'lien1.slt_lender_notified_date',
  note: 'lien1.note',
  thisLoan: 'lien1.this_loan',
  estimate: 'lien1.estimate',
  status: 'lien1.status',
  delinquencies60day: 'lien1.delinquencies_60day',
  delinquenciesHowMany: 'lien1.delinquencies_how_many',
  currentlyDelinquent: 'lien1.currently_delinquent',
  currentlyDelinquentAmount: 'lien1.currently_delinquent_amount',
  paidByLoan: 'lien1.paid_by_loan',
  sourceOfPayment: 'lien1.source_of_payment',
  sourceOfInformation: 'lien1.source_of_information',
};

export const LienDetailForm: React.FC<LienDetailFormProps> = ({
  lien,
  onChange,
  disabled = false,
  propertyOptions = [],
  loanValues = {},
}) => {
  const isThisLoan = lien.thisLoan === 'true';
  const [datePickerStates, setDatePickerStates] = useState<Record<string, boolean>>({});

  const safeParseDateStr = (val: string): Date | undefined => {
    if (!val) return undefined;
    try {
      const d = parse(val, 'yyyy-MM-dd', new Date());
      return isValid(d) ? d : undefined;
    } catch { return undefined; }
  };

  const handleThisLoanChange = (checked: boolean) => {
    onChange('thisLoan', checked ? 'true' : 'false');
    if (checked) {
      const { account, balanceAfter, regularPayment } = getThisLoanAutofillValues(loanValues);
      onChange('account', account);
      onChange('balanceAfter', balanceAfter);
      onChange('regularPayment', regularPayment);
    }
  };

  useEffect(() => {
    if (!isThisLoan) return;
    const { account, balanceAfter, regularPayment } = getThisLoanAutofillValues(loanValues);
    if (lien.account !== account) onChange('account', account);
    if (lien.balanceAfter !== balanceAfter) onChange('balanceAfter', balanceAfter);
    if (lien.regularPayment !== regularPayment) onChange('regularPayment', regularPayment);
  }, [isThisLoan, loanValues, lien.account, lien.balanceAfter, lien.regularPayment, onChange]);

  const renderField = (field: keyof LienData, label: string, props: Record<string, any> = {}, forceDisabled = false) => {
    if (props.type === 'date') {
      const val = lien[field] || '';
      return (
        <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP[field] || `lien1.${field}`}>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">{label}</Label>
            <Popover open={datePickerStates[field] || false} onOpenChange={(open) => setDatePickerStates(prev => ({ ...prev, [field]: open }))}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('h-7 text-sm flex-1 justify-start text-left font-normal', !val && 'text-muted-foreground', forceDisabled && 'opacity-50 cursor-not-allowed')} disabled={disabled || forceDisabled}>
                  {val && safeParseDateStr(val) ? format(safeParseDateStr(val)!, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
                  <CalendarIcon className="ml-auto h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                <EnhancedCalendar mode="single" selected={safeParseDateStr(val)} onSelect={(date) => { if (date) onChange(field, format(date, 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [field]: false })); }} onClear={() => { onChange(field, ''); setDatePickerStates(prev => ({ ...prev, [field]: false })); }} onToday={() => { onChange(field, format(new Date(), 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [field]: false })); }} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </DirtyFieldWrapper>
      );
    }
    return (
      <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP[field] || `lien1.${field}`}>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">{label}</Label>
          <Input value={lien[field]} onChange={(e) => onChange(field, e.target.value)} disabled={disabled || forceDisabled} className={`h-7 text-sm flex-1 ${forceDisabled ? 'opacity-50 bg-muted cursor-not-allowed' : ''}`} {...props} />
        </div>
      </DirtyFieldWrapper>
    );
  };

  const renderCurrency = (field: keyof LienData, label: string, forceDisabled = false) => (
    <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP[field] || `lien1.${field}`}>
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">{label}</Label>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
          <Input value={lien[field]} onChange={(e) => onChange(field, unformatCurrencyDisplay(e.target.value))} onKeyDown={numericKeyDown} onPaste={(e) => numericPaste(e, (val) => onChange(field, val))} onBlur={() => { const raw = lien[field]; if (raw) onChange(field, formatCurrencyDisplay(raw)); }} onFocus={() => { const raw = lien[field]; if (raw) onChange(field, unformatCurrencyDisplay(raw)); }} disabled={disabled || forceDisabled} className={`h-7 text-sm pl-7 ${forceDisabled ? 'opacity-50 bg-muted cursor-not-allowed' : ''}`} inputMode="decimal" placeholder="0.00" />
        </div>
      </div>
    </DirtyFieldWrapper>
  );

  const renderCheckbox = (field: keyof LienData, label: string, forceDisabled = false) => (
    <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP[field] || `lien1.${field}`}>
      <div className="flex items-center gap-2">
        <Checkbox id={field} checked={lien[field] === 'true'} onCheckedChange={(checked) => onChange(field, checked ? 'true' : 'false')} disabled={disabled || forceDisabled} />
        <Label htmlFor={field} className="text-sm text-foreground">{label}</Label>
      </div>
    </DirtyFieldWrapper>
  );

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">Lien Details</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-0">
        <div className="space-y-3">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">Lien Details</span>
          </div>

          <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.sourceOfInformation}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Source of Information</Label>
              <Select value={lien.sourceOfInformation || undefined} onValueChange={(val) => onChange('sourceOfInformation', val)} disabled={disabled}>
                <SelectTrigger className="h-7 text-sm flex-1"><SelectValue placeholder="Select source" /></SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {SOURCE_OF_INFORMATION_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DirtyFieldWrapper>

          <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.property}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Related Property</Label>
              <Select value={lien.property} onValueChange={(val) => onChange('property', val)} disabled={disabled}>
                <SelectTrigger className="h-7 text-sm flex-1"><SelectValue placeholder="Select property" /></SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {propertyOptions.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DirtyFieldWrapper>

          {renderField('holder', 'Lien Holder', {}, isThisLoan)}
          {renderField('account', 'Account Number', {}, isThisLoan)}
          <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.phone}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Phone</Label>
              <PhoneInput value={lien.phone} onValueChange={(val) => onChange('phone', val)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.fax}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Fax</Label>
              <PhoneInput value={lien.fax} onValueChange={(val) => onChange('fax', val)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
          </DirtyFieldWrapper>

          {renderCheckbox('existingPayoff', 'Existing - Payoff')}
          {renderCheckbox('existingRemain', 'Existing - Remain')}
          {renderCheckbox('existingPaydown', 'Existing - Paydown')}

          {renderField('lienPriorityNow', 'Lien Priority Now', { placeholder: 'e.g. 1st' })}

          <div className="flex items-center gap-3">
            {renderCheckbox('currentlyDelinquent', 'Currently Delinquent')}
          </div>
          {lien.currentlyDelinquent === 'true' && renderCurrency('currentlyDelinquentAmount', 'Amount')}

          {renderCheckbox('paidByLoan', 'Delinquency to be Paid by This Loan')}

          {renderField('sourceOfPayment', 'If No, Provide Source')}

          <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.delinquenciesHowMany || 'lien1.delinquenciesHowMany'}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] max-w-[140px] text-left shrink-0 leading-tight">Number of 60-day<br />in 12 months</Label>
              <Input value={lien.delinquenciesHowMany} onChange={(e) => onChange('delinquenciesHowMany', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
          </DirtyFieldWrapper>
        </div>

        <div className="space-y-3">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">&nbsp;</span>
          </div>

          <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.loanTypeDropdown}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Loan Type</Label>
              <Select value={lien.loanTypeDropdown || undefined} onValueChange={(val) => onChange('loanTypeDropdown', val)} disabled={disabled}>
                <SelectTrigger className="h-7 text-sm flex-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {LOAN_TYPE_DROPDOWN_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DirtyFieldWrapper>

          <div className="flex items-center gap-3">
            {renderCheckbox('anticipated', 'Anticipated')}
          </div>
          {lien.anticipated === 'true' && renderCurrency('anticipatedAmount', 'Amount')}

          <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.remainingNewLienPriority}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0 leading-tight">Remaining / New<br />Lien Priority</Label>
              <Input value={lien.remainingNewLienPriority} onChange={(e) => onChange('remainingNewLienPriority', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
          </DirtyFieldWrapper>

          <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.newRemainingBalance}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0 leading-tight">New / Remaining<br />Balance</Label>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                <Input value={lien.newRemainingBalance} onChange={(e) => onChange('newRemainingBalance', unformatCurrencyDisplay(e.target.value))} onKeyDown={numericKeyDown} onPaste={(e) => numericPaste(e, (val) => onChange('newRemainingBalance', val))} onBlur={() => { const raw = lien.newRemainingBalance; if (raw) onChange('newRemainingBalance', formatCurrencyDisplay(raw)); }} onFocus={() => { const raw = lien.newRemainingBalance; if (raw) onChange('newRemainingBalance', unformatCurrencyDisplay(raw)); }} disabled={disabled} className="h-7 text-sm pl-7" inputMode="decimal" placeholder="0.00" />
              </div>
            </div>
          </DirtyFieldWrapper>

          {renderCurrency('originalBalance', 'Original Balance', isThisLoan)}
          {renderCurrency('currentBalance', 'Current Balance')}

          <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.interestRate}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Interest Rate</Label>
              <div className="relative flex-1">
                <Input value={lien.interestRate} onChange={(e) => onChange('interestRate', sanitizeInterestInput(e.target.value))} onBlur={() => { const v = normalizeInterestOnBlur(lien.interestRate, 3); if (v !== lien.interestRate) onChange('interestRate', v); }} disabled={disabled || isThisLoan} className={`h-7 text-sm text-right pr-6 ${isThisLoan ? 'opacity-50 bg-muted cursor-not-allowed' : ''}`} inputMode="decimal" placeholder="0.000" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
              </div>
            </div>
          </DirtyFieldWrapper>

          {renderCurrency('regularPayment', 'Regular Payment', isThisLoan)}
          {renderField('maturityDate', 'Maturity Date', { type: 'date' }, isThisLoan)}

          <div className="flex items-center gap-3">
            {renderCheckbox('balloon', 'Balloon')}
          </div>
          {lien.balloon === 'true' && renderCurrency('balloonAmount', 'Amount of Balloon')}

          {renderField('recordingDate', 'Recording Date', { type: 'date' })}
        </div>

        <div className="space-y-3">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">Senior Lien Tracking</span>
          </div>

          {renderCheckbox('sltActive', 'Active')}
          {renderField('lastVerified', 'Last Verified', { type: 'date' })}

          <div className="flex items-center gap-3">
            <Label className="text-sm font-semibold text-foreground min-w-[140px] text-left shrink-0">Status</Label>
          </div>

          {renderCheckbox('sltCurrent', 'Current')}

          <div className="flex items-center gap-3">
            <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.sltDelinquent}>
              <div className="flex items-center gap-2">
                <Checkbox id="sltDelinquent" checked={lien.sltDelinquent === 'true'} onCheckedChange={(checked) => onChange('sltDelinquent', checked ? 'true' : 'false')} disabled={disabled} />
                <Label htmlFor="sltDelinquent" className="text-sm text-foreground">Delinquent</Label>
              </div>
            </DirtyFieldWrapper>
            {lien.sltDelinquent === 'true' && (
              <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.sltDelinquentDays}>
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground"># of Days</Label>
                  <Input value={lien.sltDelinquentDays} onChange={(e) => onChange('sltDelinquentDays', e.target.value)} disabled={disabled} className="h-7 text-sm w-20" />
                </div>
              </DirtyFieldWrapper>
            )}
          </div>

          {renderCheckbox('sltUnderModification', 'Under Modification / FB Plan')}

          {renderCheckbox('sltForeclosure', 'Foreclosure')}
          {lien.sltForeclosure === 'true' && renderField('sltForeclosureDate', 'Date Filed', { type: 'date' })}

          {renderCheckbox('sltPaidOff', 'Paid Off')}

          {renderField('sltLastPaymentMade', 'Last Payment Made', { type: 'date' })}
          {renderField('sltNextPaymentDue', 'Next Payment Due', { type: 'date' })}
          {renderCurrency('sltCurrentBalance', 'Current Balance')}

          {renderField('sltRequestSubmitted', 'Request Submitted', { type: 'date' })}
          {renderField('sltResponseReceived', 'Response Received', { type: 'date' })}

          {renderCheckbox('sltUnableToVerify', 'Unable to Verify')}

          {renderCheckbox('sltLenderNotified', 'Lender Notified')}
          {renderField('sltLenderNotifiedDate', 'Lender Notified Date', { type: 'date' }, lien.sltLenderNotified !== 'true')}
        </div>
      </div>

    </div>
  );
};

export default LienDetailForm;
