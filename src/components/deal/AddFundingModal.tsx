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
    loan: loanNumber,
    borrower: borrowerName,
    lenderId: '',
    lenderFullName: '',
    lenderRate: '',
    fundingAmount: '',
    fundingDate: '',
    interestFrom: '',
    notes: '',
    brokerParticipates: false,
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
    // Reset form
    setFormData({
      loan: loanNumber,
      borrower: borrowerName,
      lenderId: '',
      lenderFullName: '',
      lenderRate: '',
      fundingAmount: '',
      fundingDate: '',
      interestFrom: '',
      notes: '',
      brokerParticipates: false,
    });
    setFundingDate(undefined);
    setInterestFromDate(undefined);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Funding</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
          {/* Left Column - Form Fields */}
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Loan */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Loan</Label>
                <Input
                  value={loanNumber || formData.loan}
                  disabled
                  className="bg-muted/50"
                  placeholder="Auto-populate"
                />
              </div>

              {/* Borrower */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Borrower</Label>
                <Input
                  value={borrowerName || formData.borrower}
                  disabled
                  className="bg-muted/50"
                  placeholder="Auto-populate"
                />
              </div>

              {/* Lender ID */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Lender ID</Label>
                <div className="relative">
                  <Input
                    value={formData.lenderId}
                    onChange={(e) => handleChange('lenderId', e.target.value)}
                    placeholder="Search"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Funding Amount */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Funding Amount</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">$</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={formData.fundingAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      handleChange('fundingAmount', value);
                    }}
                    placeholder="0.00"
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Lender Full Name */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Lender Full Name</Label>
                <Input
                  value={formData.lenderFullName}
                  onChange={(e) => handleChange('lenderFullName', e.target.value)}
                />
              </div>

              {/* Funding Date */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Funding Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !fundingDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fundingDate ? format(fundingDate, 'MM/dd/yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fundingDate}
                      onSelect={setFundingDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Lender Rate */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Lender Rate*</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={formData.lenderRate}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      handleChange('lenderRate', value);
                    }}
                    placeholder="0.000"
                    className="flex-1"
                  />
                  <span className="text-sm font-medium">%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  * This is for Interest Differential, Not Sold Rate
                </p>
              </div>

              {/* Interest From */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Interest From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !interestFromDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {interestFromDate ? format(interestFromDate, 'MM/dd/yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={interestFromDate}
                      onSelect={setInterestFromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Notes:</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Right Column - Checkbox and Notes */}
          <div className="space-y-4">
            {/* Broker Participates Checkbox */}
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/20">
              <Checkbox
                id="brokerParticipates"
                checked={formData.brokerParticipates}
                onCheckedChange={(checked) => handleChange('brokerParticipates', !!checked)}
              />
              <Label
                htmlFor="brokerParticipates"
                className="text-sm font-medium leading-tight cursor-pointer"
              >
                Broker or family will participate in funding
              </Label>
            </div>

            {/* Informational Notes */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/10">
              <div>
                <p className="text-sm font-semibold text-primary">NOTE:</p>
                <p className="text-sm text-muted-foreground">
                  If Multi-lender loan, docs should reflect "See Attached Lender Schedule"
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  *Interest Differential (similar to Sold Rate this is used where lenders receive
                  different splits with Broker)
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Save Funding</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddFundingModal;
