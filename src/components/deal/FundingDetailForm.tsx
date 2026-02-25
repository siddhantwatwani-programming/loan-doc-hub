import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { FundingFormData } from './AddFundingModal';

interface FundingDetailFormProps {
  data: FundingFormData;
  onChange: (data: FundingFormData) => void;
}

export const FundingDetailForm: React.FC<FundingDetailFormProps> = ({
  data,
  onChange,
}) => {
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
    onChange({ ...data, fundingDate: date ? format(date, 'yyyy-MM-dd') : '' });
  }, [data, onChange]);

  const handleInterestFromDateChange = useCallback((date: Date | undefined) => {
    setInterestFromDate(date);
    onChange({ ...data, interestFrom: date ? format(date, 'yyyy-MM-dd') : '' });
  }, [data, onChange]);

  return (
    <div className="p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Loan</Label>
          <Input value={data.loan} onChange={(e) => handleChange('loan', e.target.value)} className="h-7 text-sm" />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Borrower</Label>
          <Input value={data.borrower} onChange={(e) => handleChange('borrower', e.target.value)} className="h-7 text-sm" />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Lender ID</Label>
          <div className="relative flex-1">
            <Input value={data.lenderId} onChange={(e) => handleChange('lenderId', e.target.value)} placeholder="Search" className="h-7 text-sm" />
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Funding Amount</Label>
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
            <Input
              type="text"
              inputMode="decimal"
              value={data.fundingAmount}
              onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ''); handleChange('fundingAmount', v); }}
              placeholder="0.00"
              className="h-7 text-sm pl-6"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Lender Name</Label>
          <Input value={data.lenderFullName} onChange={(e) => handleChange('lenderFullName', e.target.value)} className="h-7 text-sm" />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Funding Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-7 text-sm w-full justify-start text-left font-normal flex-1', !fundingDate && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {fundingDate ? format(fundingDate, 'MM/dd/yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={fundingDate} onSelect={handleFundingDateChange} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Lender Rate*</Label>
          <div className="relative flex-1">
            <Input
              type="text"
              inputMode="decimal"
              value={data.lenderRate}
              onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ''); handleChange('lenderRate', v); }}
              placeholder="0.000"
              className="h-7 text-sm pr-6"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Interest From</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-7 text-sm w-full justify-start text-left font-normal flex-1', !interestFromDate && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {interestFromDate ? format(interestFromDate, 'MM/dd/yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={interestFromDate} onSelect={handleInterestFromDateChange} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">* Interest Differential, Not Sold Rate</p>

      <div className="flex items-start gap-3">
        <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0 pt-2">Notes</Label>
        <Textarea value={data.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={2} className="resize-none text-sm" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-semibold text-primary">NOTE:</p>
        <p className="text-xs text-muted-foreground">If Multi-lender loan, docs should reflect "See Attached Lender Schedule"</p>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="detail-brokerParticipates" checked={data.brokerParticipates} onCheckedChange={(checked) => handleChange('brokerParticipates', !!checked)} />
        <Label htmlFor="detail-brokerParticipates" className="text-sm font-medium leading-tight cursor-pointer">Broker or family will participate in funding</Label>
      </div>
    </div>
  );
};

export default FundingDetailForm;
