import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Home } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LienData } from './LiensTableView';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';

interface LienDetailFormProps {
  lien: LienData;
  onChange: (field: keyof LienData, value: string) => void;
  disabled?: boolean;
  propertyOptions?: { id: string; label: string }[];
  loanValues?: Record<string, string>;
}

const STATUS_OPTIONS = ['Current', 'Unable to Verify', '30-90', '90+', 'Foreclosure', 'Modification', 'Paid'];

const getThisLoanAutofillValues = (loanValues: Record<string, string>) => ({
  account: loanValues['Terms.LoanNumber'] || loanValues['loan_terms.loan_number'] || '',
  balanceAfter: loanValues['loan_terms.loan_amount'] || '',
  regularPayment: loanValues['loan_terms.regular_payment'] || '',
});

// Map from LienData keys to db field keys used in dirty tracking
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
  anticipated: 'lien1.anticipated',
  existingRemain: 'lien1.existing_remain',
  existingPaydown: 'lien1.existing_paydown',
  existingPayoff: 'lien1.existing_payoff',
  existingPaydownAmount: 'lien1.existing_paydown_amount',
  existingPayoffAmount: 'lien1.existing_payoff_amount',
  lienPriorityNow: 'lien1.lien_priority_now',
  lienPriorityAfter: 'lien1.lien_priority_after',
  interestRate: 'lien1.interest_rate',
  maturityDate: 'lien1.maturity_date',
  originalBalance: 'lien1.original_balance',
  balanceAfter: 'lien1.balance_after',
  currentBalance: 'lien1.current_balance',
  regularPayment: 'lien1.regular_payment',
  recordingNumber: 'lien1.recording_number',
  recordingNumberFlag: 'lien1.recording_number_flag',
  recordingDate: 'lien1.recording_date',
  seniorLienTracking: 'lien1.senior_lien_tracking',
  lastVerified: 'lien1.last_verified',
  lastChecked: 'lien1.last_checked',
  note: 'lien1.note',
  thisLoan: 'lien1.this_loan',
  estimate: 'lien1.estimate',
  status: 'lien1.status',
};

// Determine the active loan type radio value
const getLoanTypeRadio = (lien: LienData): string => {
  if (lien.anticipated === 'true') return 'anticipated';
  if (lien.existingRemain === 'true') return 'existing_remain';
  if (lien.existingPaydown === 'true') return 'existing_paydown';
  if (lien.existingPayoff === 'true') return 'existing_payoff';
  // Fallback: use the persisted loanType string if booleans aren't set
  if (lien.loanType && lien.loanType !== '') return lien.loanType;
  return '';
};

export const LienDetailForm: React.FC<LienDetailFormProps> = ({
  lien,
  onChange,
  disabled = false,
  propertyOptions = [],
  loanValues = {},
}) => {
  const isThisLoan = lien.thisLoan === 'true';
  const isAnticipated = lien.anticipated === 'true';
  const isPayoff = lien.existingPayoff === 'true';
  const isPaydown = lien.existingPaydown === 'true';
  const isSeniorTracking = lien.seniorLienTracking === 'true';

  // Handle "This Loan" checkbox — auto-populate from Loan data
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
  }, [
    isThisLoan,
    loanValues,
    lien.account,
    lien.balanceAfter,
    lien.regularPayment,
    onChange,
  ]);

  // Handle loan type radio change — clear all, set selected
  const handleLoanTypeChange = (value: string) => {
    onChange('anticipated', value === 'anticipated' ? 'true' : 'false');
    onChange('existingRemain', value === 'existing_remain' ? 'true' : 'false');
    onChange('existingPaydown', value === 'existing_paydown' ? 'true' : 'false');
    onChange('existingPayoff', value === 'existing_payoff' ? 'true' : 'false');

    // If payoff selected, set balance after to 0
    if (value === 'existing_payoff') {
      onChange('balanceAfter', '0.00');
    }
    // If anticipated, clear original/current balance
    if (value === 'anticipated') {
      onChange('originalBalance', '');
      onChange('currentBalance', '');
    }
  };

  const renderField = (field: keyof LienData, label: string, props: Record<string, any> = {}, forceDisabled = false) => (
    <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP[field] || `lien1.${field}`}>
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">{label}</Label>
        <Input value={lien[field]} onChange={(e) => onChange(field, e.target.value)} disabled={disabled || forceDisabled} className={`h-7 text-sm flex-1 ${forceDisabled ? 'opacity-50 bg-muted cursor-not-allowed' : ''}`} {...props} />
      </div>
    </DirtyFieldWrapper>
  );

  const renderCurrency = (field: keyof LienData, label: string, forceDisabled = false) => (
    <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP[field] || `lien1.${field}`}>
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">{label}</Label>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
          <Input value={lien[field]} onChange={(e) => onChange(field, e.target.value)} disabled={disabled || forceDisabled} className={`h-7 text-sm pl-7 ${forceDisabled ? 'opacity-50 bg-muted cursor-not-allowed' : ''}`} inputMode="decimal" placeholder="0.00" />
        </div>
      </div>
    </DirtyFieldWrapper>
  );

  const loanTypeRadio = getLoanTypeRadio(lien);

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">Lien Details</span>
      </div>

      {/* Property Lien Information */}
      <div className="space-y-3">
        <div className="border-b border-border pb-2">
          <span className="font-semibold text-sm text-primary">Property Lien Information</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {/* Related Property — dropdown */}
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

          {renderField('lienPriorityNow', 'Lien Priority Now', { placeholder: 'Enter priority' })}

          {/* This Loan checkbox */}
          <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.thisLoan}>
            <div className="flex items-center gap-2">
              <Checkbox id="thisLoan" checked={isThisLoan} onCheckedChange={(checked) => handleThisLoanChange(!!checked)} disabled={disabled} />
              <Label htmlFor="thisLoan" className="text-sm text-foreground font-medium">This Loan</Label>
            </div>
          </DirtyFieldWrapper>

          {renderField('lienPriorityAfter', 'Lien Priority After', { placeholder: 'Enter priority' })}

          {renderField('holder', 'Lien Holder', {}, isThisLoan)}

          {/* Interest Rate */}
          <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.interestRate}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Interest Rate</Label>
              <div className="relative flex-1">
                <Input value={lien.interestRate} onChange={(e) => onChange('interestRate', e.target.value.replace(/-/g, ''))} disabled={disabled || isThisLoan} className={`h-7 text-sm text-right pr-6 ${isThisLoan ? 'opacity-50 bg-muted cursor-not-allowed' : ''}`} inputMode="decimal" placeholder="0.000" />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
              </div>
            </div>
          </DirtyFieldWrapper>

          {renderField('account', 'Account Number', {}, isThisLoan)}
          {renderField('maturityDate', 'Maturity Date', { type: 'date' }, isThisLoan)}

          {renderField('contact', 'Contact', {})}
          {renderField('phone', 'Phone', {})}
          {renderField('fax', 'Fax', {})}
          {renderField('email', 'Email', {})}
        </div>
      </div>

      {/* Loan Type Section */}
      <div className="space-y-3">
        <div className="border-b border-border pb-2">
          <span className="font-semibold text-sm text-primary">Loan Type</span>
        </div>

        <RadioGroup value={loanTypeRadio} onValueChange={handleLoanTypeChange} disabled={disabled} className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="anticipated" id="radio-anticipated" />
            <Label htmlFor="radio-anticipated" className="text-sm text-foreground">Anticipated</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="existing_remain" id="radio-existing-remain" />
            <Label htmlFor="radio-existing-remain" className="text-sm text-foreground">Existing – Remain</Label>
          </div>
          <div className="flex items-center gap-2 min-w-[200px]">
            <RadioGroupItem value="existing_paydown" id="radio-existing-paydown" />
            <Label htmlFor="radio-existing-paydown" className="text-sm text-foreground">Existing – Paydown</Label>
            {isPaydown && (
              <div className="flex items-center gap-1 ml-2">
                <span className="text-sm text-muted-foreground">$</span>
                <Input value={lien.existingPaydownAmount} onChange={(e) => onChange('existingPaydownAmount', e.target.value)} disabled={disabled} className="h-7 text-sm text-right w-28" inputMode="decimal" placeholder="0.00" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 min-w-[200px]">
            <RadioGroupItem value="existing_payoff" id="radio-existing-payoff" />
            <Label htmlFor="radio-existing-payoff" className="text-sm text-foreground">Existing – Payoff</Label>
            {isPayoff && (
              <>
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input value={lien.existingPayoffAmount} onChange={(e) => onChange('existingPayoffAmount', e.target.value)} disabled={disabled} className="h-7 text-sm text-right w-28" inputMode="decimal" placeholder="0.00" />
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Checkbox id="estimate" checked={lien.estimate === 'true'} onCheckedChange={(checked) => onChange('estimate', checked ? 'true' : 'false')} disabled={disabled} />
                  <Label htmlFor="estimate" className="text-sm text-foreground">Estimate</Label>
                </div>
              </>
            )}
          </div>
        </RadioGroup>
      </div>

      {/* Balance & Payment Fields */}
      <div className="space-y-3">
        <div className="border-b border-border pb-2">
          <span className="font-semibold text-sm text-primary">Balance & Payment</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          {renderCurrency('originalBalance', 'Original Balance', isThisLoan || isAnticipated)}
          {renderCurrency('currentBalance', 'Current Balance', isAnticipated)}
          {renderCurrency('balanceAfter', 'Balance After', isThisLoan || isPayoff)}
          {renderCurrency('regularPayment', 'Regular Payment', isThisLoan)}
        </div>
      </div>

      {/* Recording & Tracking */}
      <div className="space-y-3">
        <div className="border-b border-border pb-2">
          <span className="font-semibold text-sm text-primary">Recording & Tracking</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.recordingNumber}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Recording Number</Label>
              <div className="flex items-center gap-2 flex-1">
                <Input value={lien.recordingNumber} onChange={(e) => onChange('recordingNumber', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
                <Checkbox id="recordingNumberFlag" checked={lien.recordingNumberFlag === 'true'} onCheckedChange={(checked) => onChange('recordingNumberFlag', checked ? 'true' : 'false')} disabled={disabled} />
              </div>
            </div>
          </DirtyFieldWrapper>

          {renderField('recordingDate', 'Recording Date', { type: 'date' })}

          {/* Senior Lien Tracking */}
          <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.seniorLienTracking}>
            <div className="flex items-center gap-2">
              <Checkbox id="seniorLienTracking" checked={isSeniorTracking} onCheckedChange={(checked) => onChange('seniorLienTracking', checked ? 'true' : 'false')} disabled={disabled} />
              <Label htmlFor="seniorLienTracking" className="text-sm text-foreground font-medium">Senior Lien Tracking</Label>
            </div>
          </DirtyFieldWrapper>
          <div /> {/* spacer */}

          {/* Conditionally visible fields */}
          {isSeniorTracking && (
            <>
              {renderField('lastVerified', 'Last Verified', { type: 'date' })}
              <DirtyFieldWrapper fieldKey={DIRTY_KEY_MAP.status}>
                <div className="flex items-center gap-3">
                  <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Status</Label>
                  <Select value={lien.status} onValueChange={(val) => onChange('status', val)} disabled={disabled}>
                    <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {STATUS_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </DirtyFieldWrapper>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LienDetailForm;
