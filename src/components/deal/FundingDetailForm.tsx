import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { numericKeyDown, numericPaste, formatCurrencyDisplay, unformatCurrencyDisplay } from '@/lib/numericInputFilter';

/** Strip commas/$ before parseFloat so formatted values parse correctly */
const safeParseFloat = (v: string | undefined): number => {
  if (!v) return 0;
  return parseFloat((v || '').replace(/[$,]/g, '')) || 0;
};
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { FundingFormData } from './AddFundingModal';
import { LenderIdSearch } from './LenderIdSearch';

interface FundingDetailFormProps {
  data: FundingFormData;
  onChange: (data: FundingFormData) => void;
  totalPayment?: string;
  loanAmount?: string;
}

export const FundingDetailForm: React.FC<FundingDetailFormProps> = ({
  data,
  onChange,
  totalPayment = '',
  loanAmount = '',
}) => {
  const [fundingDateOpen, setFundingDateOpen] = useState(false);
  const [interestFromOpen, setInterestFromOpen] = useState(false);
  const [fundingDate, setFundingDate] = useState<Date | undefined>(
    data.fundingDate ? new Date(data.fundingDate) : undefined
  );
  const [interestFromDate, setInterestFromDate] = useState<Date | undefined>(
    data.interestFrom ? new Date(data.interestFrom) : undefined
  );

  const handleChange = useCallback((field: keyof FundingFormData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  }, [data, onChange]);

  const handleFundingDateChange = useCallback((date: Date | undefined) => {
    setFundingDate(date);
    setFundingDateOpen(false);
    onChange({ ...data, fundingDate: date ? format(date, 'yyyy-MM-dd') : '' });
  }, [data, onChange]);

  const handleInterestFromDateChange = useCallback((date: Date | undefined) => {
    setInterestFromDate(date);
    setInterestFromOpen(false);
    onChange({ ...data, interestFrom: date ? format(date, 'yyyy-MM-dd') : '' });
  }, [data, onChange]);

  // Auto-compute Percent Owned = Funding Amount / Loan Amount * 100 (no cap – show error)
  React.useEffect(() => {
    const fa = safeParseFloat(data.fundingAmount);
    const la = safeParseFloat(loanAmount);
    if (la > 0 && fa > 0) {
      const computed = (fa / la * 100).toFixed(3);
      if (computed !== data.percentOwned) {
        onChange({ ...data, percentOwned: computed });
      }
    }
  }, [data.fundingAmount, loanAmount]);

  // Regular Payment = Loan Amount × Rate / 12 (always based on TOTAL LOAN)
  React.useEffect(() => {
    const la = parseFloat(loanAmount) || 0;
    let rate = 0;
    if (data.rateSelection === 'note_rate') rate = parseFloat(data.rateNoteValue || '') || 0;
    else if (data.rateSelection === 'sold_rate') rate = parseFloat(data.rateSoldValue || '') || 0;
    else if (data.rateSelection === 'lender_rate') rate = parseFloat(data.rateLenderValue || '') || 0;

    const payment = la > 0 && rate > 0 ? (la * (rate / 100) / 12).toFixed(2) : '';
    if (payment !== data.regularPayment) {
      onChange({ ...data, regularPayment: payment });
    }
  }, [loanAmount, data.rateSelection, data.rateNoteValue, data.rateSoldValue, data.rateLenderValue]);

  const percentOwnedNum = parseFloat(data.percentOwned) || 0;
  const percentOwnedError = percentOwnedNum > 100;


  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Loan Account</Label>
          <Input value={data.loan} onChange={(e) => handleChange('loan', e.target.value)} className="h-7 text-sm" />
        </div>
        <div className="flex items-start gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0 mt-1">Borrower</Label>
          <textarea
            value={data.borrower}
            onChange={(e) => handleChange('borrower', e.target.value)}
            className="flex w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm resize-none min-h-[48px]"
            rows={2}
          />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Lender ID</Label>
          <LenderIdSearch
            value={data.lenderId}
            onChange={(lenderId, lenderFullName) => {
              onChange({
                ...data,
                lenderId,
                ...(lenderFullName ? { lenderFullName } : {}),
              });
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Funding Amount</Label>
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
            <Input
              type="text"
              inputMode="decimal"
              value={data.fundingAmount}
              onChange={(e) => { const v = unformatCurrencyDisplay(e.target.value).replace(/[^0-9.]/g, ''); handleChange('fundingAmount', v); }}
              onKeyDown={numericKeyDown}
              onPaste={(e) => numericPaste(e, (val) => handleChange('fundingAmount', val))}
              onBlur={() => { if (data.fundingAmount) handleChange('fundingAmount', formatCurrencyDisplay(data.fundingAmount)); }}
              onFocus={() => { if (data.fundingAmount) handleChange('fundingAmount', unformatCurrencyDisplay(data.fundingAmount)); }}
              placeholder="0.00"
              className="h-7 text-sm pl-6"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Lender Name</Label>
          <Input value={data.lenderFullName} readOnly disabled className="h-7 text-sm bg-muted" />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Funding Date</Label>
          <Popover open={fundingDateOpen} onOpenChange={setFundingDateOpen} modal={false}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-7 text-sm w-full justify-start text-left font-normal flex-1', !fundingDate && 'text-muted-foreground')}>
                {fundingDate ? format(fundingDate, 'MM/dd/yyyy') : 'Select date'}
                <CalendarIcon className="ml-auto h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999]" align="start">
              <EnhancedCalendar mode="single" selected={fundingDate} onSelect={handleFundingDateChange} onClear={() => handleFundingDateChange(undefined)} onToday={() => handleFundingDateChange(new Date())} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Interest From</Label>
          <Popover open={interestFromOpen} onOpenChange={setInterestFromOpen} modal={false}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-7 text-sm w-full justify-start text-left font-normal flex-1', !interestFromDate && 'text-muted-foreground')}>
                {interestFromDate ? format(interestFromDate, 'MM/dd/yyyy') : 'Select date'}
                <CalendarIcon className="ml-auto h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999]" align="start">
              <EnhancedCalendar mode="single" selected={interestFromDate} onSelect={handleInterestFromDateChange} onClear={() => handleInterestFromDateChange(undefined)} onToday={() => handleInterestFromDateChange(new Date())} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Rate Selection - hidden from UI, kept for calculation logic */}
      <div className="hidden">
        <RadioGroup value={data.rateSelection || 'note_rate'} onValueChange={(val) => handleChange('rateSelection', val)}>
          <RadioGroupItem value="note_rate" id="detail-rate-note" />
          <RadioGroupItem value="sold_rate" id="detail-rate-sold" />
          <RadioGroupItem value="lender_rate" id="detail-rate-lender" />
        </RadioGroup>
      </div>

      <div className="flex items-center gap-6 flex-wrap mt-1">
        <div className="flex items-center gap-2">
          <Label className={cn("text-sm shrink-0", percentOwnedError ? "text-destructive font-medium" : "text-muted-foreground")}>Percent Owned</Label>
          <div className="relative w-28">
            <Input type="text" inputMode="decimal" value={data.percentOwned || ''} disabled className={cn("h-7 text-sm pr-6 opacity-50 bg-muted", percentOwnedError && "border-destructive")} placeholder="0.000" />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
          </div>
        </div>
        {percentOwnedError && (
          <span className="text-xs text-destructive font-medium">Percent Owned cannot exceed 100%</span>
        )}
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground shrink-0">Regular Payment</Label>
          <div className="relative w-28">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
            <Input type="text" inputMode="decimal" value={data.regularPayment || ''} disabled className="h-7 text-sm pl-6 opacity-50 bg-muted" placeholder="0.00" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="detail-brokerParticipates" checked={data.brokerParticipates} onCheckedChange={(checked) => handleChange('brokerParticipates', !!checked)} />
        <Label htmlFor="detail-brokerParticipates" className="text-sm font-medium leading-tight cursor-pointer">Lender is: The Broker, Employee or Family of Broker</Label>
      </div>
    </div>
  );
};

export default FundingDetailForm;
