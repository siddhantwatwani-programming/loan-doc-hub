import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AddFundingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanNumber?: string;
  borrowerName?: string;
  onSubmit: (data: FundingFormData) => void;
}

export interface FundingFormData {
  loan: string;
  borrower: string;
  lenderId: string;
  lenderFullName: string;
  lenderRate: string;
  fundingAmount: string;
  fundingDate: string;
  interestFrom: string;
  notes: string;
  brokerParticipates: boolean;
}

export const AddFundingModal: React.FC<AddFundingModalProps> = ({
  open,
  onOpenChange,
  loanNumber = '',
  borrowerName = '',
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FundingFormData>({
    loan: loanNumber, borrower: borrowerName, lenderId: '', lenderFullName: '',
    lenderRate: '', fundingAmount: '', fundingDate: '', interestFrom: '', notes: '', brokerParticipates: false,
  });

  const [fundingDate, setFundingDate] = useState<Date | undefined>();
  const [interestFromDate, setInterestFromDate] = useState<Date | undefined>();

  const handleChange = (field: keyof FundingFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      loan: loanNumber || formData.loan,
      borrower: borrowerName || formData.borrower,
      fundingDate: fundingDate ? format(fundingDate, 'yyyy-MM-dd') : '',
      interestFrom: interestFromDate ? format(interestFromDate, 'yyyy-MM-dd') : '',
    });
    setFormData({ loan: loanNumber, borrower: borrowerName, lenderId: '', lenderFullName: '', lenderRate: '', fundingAmount: '', fundingDate: '', interestFrom: '', notes: '', brokerParticipates: false });
    setFundingDate(undefined);
    setInterestFromDate(undefined);
    onOpenChange(false);
  };

  const handleCancel = () => { onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Funding</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-3">
          <div className="lg:col-span-2 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Loan</Label>
                <Input value={loanNumber || formData.loan} disabled className="h-7 text-sm bg-muted/50" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Borrower</Label>
                <Input value={borrowerName || formData.borrower} disabled className="h-7 text-sm bg-muted/50" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Lender ID</Label>
                <div className="relative flex-1">
                  <Input value={formData.lenderId} onChange={(e) => handleChange('lenderId', e.target.value)} placeholder="Search" className="h-7 text-sm" />
                  <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Funding Amount</Label>
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-sm font-medium">$</span>
                  <Input type="text" inputMode="decimal" value={formData.fundingAmount} onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ''); handleChange('fundingAmount', v); }} placeholder="0.00" className="h-7 text-sm" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Lender Name</Label>
                <Input value={formData.lenderFullName} onChange={(e) => handleChange('lenderFullName', e.target.value)} className="h-7 text-sm" />
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
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={fundingDate} onSelect={setFundingDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Lender Rate*</Label>
                <div className="flex items-center gap-1 flex-1">
                  <Input type="text" inputMode="decimal" value={formData.lenderRate} onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ''); handleChange('lenderRate', v); }} placeholder="0.000" className="h-7 text-sm" />
                  <span className="text-sm font-medium">%</span>
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
                  <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={interestFromDate} onSelect={setInterestFromDate} initialFocus /></PopoverContent>
                </Popover>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">* Interest Differential, Not Sold Rate</p>

            <div className="flex items-start gap-3">
              <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0 pt-2">Notes</Label>
              <Textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={2} className="resize-none text-sm" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 border rounded-lg bg-muted/20">
              <Checkbox id="brokerParticipates" checked={formData.brokerParticipates} onCheckedChange={(checked) => handleChange('brokerParticipates', !!checked)} />
              <Label htmlFor="brokerParticipates" className="text-sm font-medium leading-tight cursor-pointer">Broker or family will participate in funding</Label>
            </div>
            <div className="space-y-2 p-3 border rounded-lg bg-muted/10">
              <p className="text-sm font-semibold text-primary">NOTE:</p>
              <p className="text-xs text-muted-foreground">If Multi-lender loan, docs should reflect "See Attached Lender Schedule"</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit}>Save Funding</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFundingModal;
