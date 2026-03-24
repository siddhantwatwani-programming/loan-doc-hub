import React, { useState } from 'react';
import { ModalSaveConfirmation } from './ModalSaveConfirmation';
import { hasModalFormData } from '@/lib/modalFormValidation';
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
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LenderIdSearch } from './LenderIdSearch';

interface AddFundingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanNumber?: string;
  borrowerName?: string;
  onSubmit: (data: FundingFormData) => void;
  editData?: FundingFormData | null;
  isEditing?: boolean;
  noteRate?: string;
  soldRate?: string;
  totalPayment?: string;
  loanAmount?: string;
  existingRecords?: Array<{ id: string; roundingError: boolean; pctOwned: number }>;
  editingRecordId?: string;
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
  percentOwned: string;
  regularPayment: string;
  lenderShare: string;
  rateSelection: 'note_rate' | 'sold_rate' | 'lender_rate';
  rateNoteValue: string;
  rateSoldValue: string;
  rateLenderValue: string;
  // Servicing fees section
  overrideServicingFees: boolean;
  companyServicingFee: string;
  companyServicingFeePct: string;
  companyMaxFee: string;
  companyMaxFeePct: string;
  companyMinFee: string;
  companyMinFeePct: string;
  brokerServicingFee: string;
  brokerServicingFeePct: string;
  brokerMaxFee: string;
  brokerMaxFeePct: string;
  brokerMinFee: string;
  brokerMinFeePct: string;
  // Default fees section
  overrideDefaultFees: boolean;
  lateFee1Lender: string;
  lateFee1Company: string;
  lateFee1Broker: string;
  lateFee1Total: string;
  lateFee2Lender: string;
  lateFee2Company: string;
  lateFee2Broker: string;
  lateFee2Total: string;
  defaultInterestLender: string;
  defaultInterestCompany: string;
  defaultInterestBroker: string;
  defaultInterestTotal: string;
  interestGuaranteeLender: string;
  interestGuaranteeCompany: string;
  interestGuaranteeBroker: string;
  interestGuaranteeTotal: string;
  prepaymentLender: string;
  prepaymentCompany: string;
  prepaymentBroker: string;
  prepaymentTotal: string;
  maturityLender: string;
  maturityCompany: string;
  maturityBroker: string;
  maturityTotal: string;
}

const getDefaultFormData = (loanNumber: string, borrowerName: string, noteRate: string, soldRate: string): FundingFormData => ({
  loan: loanNumber, borrower: borrowerName, lenderId: '', lenderFullName: '',
  lenderRate: '', fundingAmount: '', fundingDate: '', interestFrom: '', notes: '', brokerParticipates: false,
  percentOwned: '', regularPayment: '', lenderShare: '',
  rateSelection: 'note_rate', rateNoteValue: noteRate, rateSoldValue: soldRate, rateLenderValue: '',
  overrideServicingFees: false,
  companyServicingFee: '', companyServicingFeePct: '', companyMaxFee: '', companyMaxFeePct: '',
  companyMinFee: '', companyMinFeePct: '', brokerServicingFee: '', brokerServicingFeePct: '',
  brokerMaxFee: '', brokerMaxFeePct: '', brokerMinFee: '', brokerMinFeePct: '',
  overrideDefaultFees: false,
  lateFee1Lender: '', lateFee1Company: '', lateFee1Broker: '', lateFee1Total: '',
  lateFee2Lender: '', lateFee2Company: '', lateFee2Broker: '', lateFee2Total: '',
  defaultInterestLender: '', defaultInterestCompany: '', defaultInterestBroker: '', defaultInterestTotal: '',
  interestGuaranteeLender: '', interestGuaranteeCompany: '', interestGuaranteeBroker: '', interestGuaranteeTotal: '',
  prepaymentLender: '', prepaymentCompany: '', prepaymentBroker: '', prepaymentTotal: '',
  maturityLender: '', maturityCompany: '', maturityBroker: '', maturityTotal: '',
});

export const AddFundingModal: React.FC<AddFundingModalProps> = ({
  open,
  onOpenChange,
  loanNumber = '',
  borrowerName = '',
  onSubmit,
  editData,
  isEditing = false,
  noteRate = '',
  soldRate = '',
  totalPayment = '',
  loanAmount = '',
  existingRecords = [],
  editingRecordId,
}) => {
  const getInitialFormData = (): FundingFormData => {
    if (editData) return { ...editData, loan: loanNumber || editData.loan, borrower: borrowerName || editData.borrower };
    return getDefaultFormData(loanNumber, borrowerName, noteRate, soldRate);
  };

  const [formData, setFormData] = useState<FundingFormData>(getInitialFormData());
  const [showConfirm, setShowConfirm] = useState(false);
  const [fundingDateOpen, setFundingDateOpen] = useState(false);
  const [interestFromOpen, setInterestFromOpen] = useState(false);

  const [fundingDate, setFundingDate] = useState<Date | undefined>(editData?.fundingDate ? new Date(editData.fundingDate) : undefined);
  const [interestFromDate, setInterestFromDate] = useState<Date | undefined>(editData?.interestFrom ? new Date(editData.interestFrom) : undefined);

  React.useEffect(() => {
    if (open) {
      const data = getInitialFormData();
      setFormData(data);
      setFundingDate(data.fundingDate ? new Date(data.fundingDate) : undefined);
      setInterestFromDate(data.interestFrom ? new Date(data.interestFrom) : undefined);
    }
  }, [open, editData]);

  // Compute lenderRate from rate selection
  React.useEffect(() => {
    let rate = '';
    if (formData.rateSelection === 'note_rate') rate = formData.rateNoteValue;
    else if (formData.rateSelection === 'sold_rate') rate = formData.rateSoldValue;
    else if (formData.rateSelection === 'lender_rate') rate = formData.rateLenderValue;
    if (rate !== formData.lenderRate) {
      setFormData(prev => ({ ...prev, lenderRate: rate }));
    }
  }, [formData.rateSelection, formData.rateNoteValue, formData.rateSoldValue, formData.rateLenderValue]);

   // Auto-compute Percent Owned = Funding Amount / Loan Amount * 100 (NO cap – show error instead)
  React.useEffect(() => {
    const fa = parseFloat(formData.fundingAmount) || 0;
    const la = parseFloat(loanAmount) || 0;
    if (la > 0 && fa > 0) {
      const computed = (fa / la * 100).toFixed(3);
      if (computed !== formData.percentOwned) {
        setFormData(prev => ({ ...prev, percentOwned: computed }));
      }
    } else if (fa === 0 && formData.percentOwned !== '') {
      setFormData(prev => ({ ...prev, percentOwned: '' }));
    }
  }, [formData.fundingAmount, loanAmount]);

  // Regular Payment = Loan Amount × Rate / 12 (always based on TOTAL LOAN)
  React.useEffect(() => {
    const la = parseFloat(loanAmount) || 0;
    let rate = 0;
    if (formData.rateSelection === 'note_rate') rate = parseFloat(formData.rateNoteValue) || 0;
    else if (formData.rateSelection === 'sold_rate') rate = parseFloat(formData.rateSoldValue) || 0;
    else if (formData.rateSelection === 'lender_rate') rate = parseFloat(formData.rateLenderValue) || 0;

    const payment = la > 0 && rate > 0 ? (la * (rate / 100) / 12).toFixed(2) : '';
    if (payment !== formData.regularPayment) {
      setFormData(prev => ({ ...prev, regularPayment: payment }));
    }
  }, [loanAmount, formData.rateSelection, formData.rateNoteValue, formData.rateSoldValue, formData.rateLenderValue]);

  // Validation: percent owned > 100
  const percentOwnedNum = parseFloat(formData.percentOwned) || 0;
  const percentOwnedError = percentOwnedNum > 100;

  // Validation: total % across all lenders > 100
  const otherLendersTotal = existingRecords
    .filter(r => r.id !== editingRecordId)
    .reduce((sum, r) => sum + r.pctOwned, 0);
  const projectedTotal = otherLendersTotal + percentOwnedNum;
  const totalPercentError = projectedTotal > 100;


  const handleChange = (field: keyof FundingFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormFilled = hasModalFormData(formData, ['loan', 'borrower', 'rateSelection', 'rateNoteValue', 'rateSoldValue', 'percentOwned', 'regularPayment', 'lenderRate'], { brokerParticipates: false, overrideServicingFees: false, overrideDefaultFees: false });

  const handleSaveClick = () => setShowConfirm(true);
  const handleConfirmSave = () => {
    setShowConfirm(false);
    onSubmit({
      ...formData,
      loan: loanNumber || formData.loan,
      borrower: borrowerName || formData.borrower,
      fundingDate: fundingDate ? format(fundingDate, 'yyyy-MM-dd') : '',
      interestFrom: interestFromDate ? format(interestFromDate, 'yyyy-MM-dd') : '',
    });
    setFormData(getDefaultFormData(loanNumber, borrowerName, noteRate, soldRate));
    setFundingDate(undefined);
    setInterestFromDate(undefined);
    onOpenChange(false);
  };

  const handleCancel = () => { onOpenChange(false); };

  // Helper: compute default fee total
  const computeTotal = (lender: string, company: string, broker: string): string => {
    const l = parseFloat(lender) || 0;
    const c = parseFloat(company) || 0;
    const b = parseFloat(broker) || 0;
    const total = l + c + b;
    return total > 0 ? total.toFixed(3) : '';
  };

  // Auto-compute total columns for default fees
  React.useEffect(() => {
    const updates: Partial<FundingFormData> = {};
    updates.lateFee1Total = computeTotal(formData.lateFee1Lender, formData.lateFee1Company, formData.lateFee1Broker);
    updates.lateFee2Total = computeTotal(formData.lateFee2Lender, formData.lateFee2Company, formData.lateFee2Broker);
    updates.defaultInterestTotal = computeTotal(formData.defaultInterestLender, formData.defaultInterestCompany, formData.defaultInterestBroker);
    updates.interestGuaranteeTotal = computeTotal(formData.interestGuaranteeLender, formData.interestGuaranteeCompany, formData.interestGuaranteeBroker);
    updates.prepaymentTotal = computeTotal(formData.prepaymentLender, formData.prepaymentCompany, formData.prepaymentBroker);
    updates.maturityTotal = computeTotal(formData.maturityLender, formData.maturityCompany, formData.maturityBroker);
    setFormData(prev => ({ ...prev, ...updates }));
  }, [
    formData.lateFee1Lender, formData.lateFee1Company, formData.lateFee1Broker,
    formData.lateFee2Lender, formData.lateFee2Company, formData.lateFee2Broker,
    formData.defaultInterestLender, formData.defaultInterestCompany, formData.defaultInterestBroker,
    formData.interestGuaranteeLender, formData.interestGuaranteeCompany, formData.interestGuaranteeBroker,
    formData.prepaymentLender, formData.prepaymentCompany, formData.prepaymentBroker,
    formData.maturityLender, formData.maturityCompany, formData.maturityBroker,
  ]);

  const renderServicingRow = (label: string, feeField: keyof FundingFormData, pctField: keyof FundingFormData) => (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-foreground font-medium min-w-[140px] shrink-0">{label}</Label>
      <div className="relative w-24">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <Input value={formData[feeField] as string} onChange={(e) => handleChange(feeField, e.target.value.replace(/[^0-9.]/g, ''))} className="h-7 text-xs pl-5" inputMode="decimal" placeholder="-" />
      </div>
      <span className="text-xs text-muted-foreground">Plus</span>
      <div className="relative w-20">
        <Input value={formData[pctField] as string} onChange={(e) => handleChange(pctField, e.target.value.replace(/[^0-9.]/g, ''))} className="h-7 text-xs pr-5" inputMode="decimal" placeholder="0%" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );

  const renderDefaultFeeRow = (label: string, lenderField: keyof FundingFormData, companyField: keyof FundingFormData, brokerField: keyof FundingFormData, totalField: keyof FundingFormData) => (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-foreground font-medium min-w-[120px] shrink-0">{label}</Label>
      <div className="relative w-16">
        <Input value={formData[lenderField] as string} onChange={(e) => handleChange(lenderField, e.target.value.replace(/[^0-9.]/g, ''))} className="h-7 text-xs pr-4 text-right" inputMode="decimal" placeholder="0%" />
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
      </div>
      <div className="relative w-16">
        <Input value={formData[companyField] as string} onChange={(e) => handleChange(companyField, e.target.value.replace(/[^0-9.]/g, ''))} className="h-7 text-xs pr-4 text-right" inputMode="decimal" placeholder="0%" />
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
      </div>
      <div className="relative w-16">
        <Input value={formData[brokerField] as string} onChange={(e) => handleChange(brokerField, e.target.value.replace(/[^0-9.]/g, ''))} className="h-7 text-xs pr-4 text-right" inputMode="decimal" placeholder="0%" />
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
      </div>
      <div className="relative w-16">
        <Input value={formData[totalField] as string} disabled className="h-7 text-xs pr-4 text-right opacity-50 bg-muted" placeholder="0%" />
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
      </div>
    </div>
  );

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEditing ? 'Edit Funding' : 'Add Funding'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 py-3 sleek-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {/* Loan Account - auto-populated, read-only */}
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Loan Account</Label>
                <Input value={loanNumber || formData.loan} disabled className="h-7 text-sm opacity-50 bg-muted" />
              </div>
              {/* Borrower - auto-populated input with borrower name from Loan Details */}
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Borrower</Label>
                <Input
                  value={borrowerName || formData.borrower}
                  disabled
                  className="h-8 bg-muted opacity-50"
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Lender ID</Label>
                <LenderIdSearch
                  value={formData.lenderId}
                  onChange={(lenderId, lenderFullName) => {
                    setFormData(prev => ({
                      ...prev,
                      lenderId,
                      ...(lenderFullName ? { lenderFullName } : {}),
                    }));
                  }}
                />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Funding Amount</Label>
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
                  <Input type="text" inputMode="decimal" value={formData.fundingAmount} onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ''); handleChange('fundingAmount', v); }} placeholder="0.00" className="h-7 text-sm pl-6" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Lender Name</Label>
                <Input value={formData.lenderFullName} readOnly disabled className="h-7 text-sm opacity-50 bg-muted" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Funding Date</Label>
                <Popover open={fundingDateOpen} onOpenChange={setFundingDateOpen} modal={false}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('h-7 text-sm w-full justify-start text-left font-normal flex-1', !fundingDate && 'text-muted-foreground')}>
                      {fundingDate ? format(fundingDate, 'dd-MM-yyyy') : 'Select date'}
                      <CalendarIcon className="ml-auto h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999]" align="start"><Calendar mode="single" selected={fundingDate} onSelect={(d) => { setFundingDate(d); setFundingDateOpen(false); }} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Interest From</Label>
                <Popover open={interestFromOpen} onOpenChange={setInterestFromOpen} modal={false}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('h-7 text-sm w-full justify-start text-left font-normal flex-1', !interestFromDate && 'text-muted-foreground')}>
                      {interestFromDate ? format(interestFromDate, 'dd-MM-yyyy') : 'Select date'}
                      <CalendarIcon className="ml-auto h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999]" align="start"><Calendar mode="single" selected={interestFromDate} onSelect={(d) => { setInterestFromDate(d); setInterestFromOpen(false); }} initialFocus className="p-3 pointer-events-auto" /></PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Rate Selection */}
            <div className="space-y-2 mt-2">
              <div className="border-b border-border pb-1">
                <span className="font-semibold text-sm text-primary">Rate Selection</span>
              </div>
              <RadioGroup value={formData.rateSelection} onValueChange={(val) => handleChange('rateSelection', val)} className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="note_rate" id="rate-note" />
                  <Label htmlFor="rate-note" className="text-sm">Note Rate</Label>
                  <div className="relative w-28">
                    <Input type="text" inputMode="decimal" value={formData.rateNoteValue} onChange={(e) => handleChange('rateNoteValue', e.target.value.replace(/[^0-9.]/g, ''))} className={cn("h-7 text-sm pr-6", formData.rateSelection !== 'note_rate' && 'opacity-50 bg-muted')} disabled={formData.rateSelection !== 'note_rate'} placeholder="0.000" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="sold_rate" id="rate-sold" />
                  <Label htmlFor="rate-sold" className="text-sm">Sold Rate</Label>
                  <div className="relative w-28">
                    <Input type="text" inputMode="decimal" value={formData.rateSoldValue} onChange={(e) => handleChange('rateSoldValue', e.target.value.replace(/[^0-9.]/g, ''))} className={cn("h-7 text-sm pr-6", formData.rateSelection !== 'sold_rate' && 'opacity-50 bg-muted')} disabled={formData.rateSelection !== 'sold_rate'} placeholder="0.000" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="lender_rate" id="rate-lender" />
                  <Label htmlFor="rate-lender" className="text-sm">Lender Rate</Label>
                  <div className="relative w-28">
                    <Input type="text" inputMode="decimal" value={formData.rateLenderValue} onChange={(e) => handleChange('rateLenderValue', e.target.value.replace(/[^0-9.]/g, ''))} className={cn("h-7 text-sm pr-6", formData.rateSelection !== 'lender_rate' && 'opacity-50 bg-muted')} disabled={formData.rateSelection !== 'lender_rate'} placeholder="0.000" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                  </div>
                </div>
              </RadioGroup>
            </div>

             <div className="flex items-center gap-6 flex-wrap mt-1">
              <div className="flex items-center gap-2">
                <Label className={cn("text-sm shrink-0", percentOwnedError ? "text-destructive font-medium" : "text-muted-foreground")}>Percent Owned</Label>
                <div className="relative w-28">
                  <Input type="text" inputMode="decimal" value={formData.percentOwned} disabled className={cn("h-7 text-sm pr-6 opacity-50 bg-muted", percentOwnedError && "border-destructive")} placeholder="0.000" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                </div>
              </div>
              {percentOwnedError && (
                <span className="text-xs text-destructive font-medium">Percent Owned cannot exceed 100%</span>
              )}
              {!percentOwnedError && totalPercentError && (
                <span className="text-xs text-destructive font-medium">Total ownership across all lenders cannot exceed 100% (currently {projectedTotal.toFixed(3)}%)</span>
              )}
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground shrink-0">Regular Payment</Label>
                <div className="relative w-28">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
                  <Input type="text" inputMode="decimal" value={formData.regularPayment} disabled className="h-7 text-sm pl-6 opacity-50 bg-muted" placeholder="0.00" />
                </div>
              </div>
            </div>

            {/* Broker checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox id="brokerParticipates" checked={formData.brokerParticipates} onCheckedChange={(checked) => handleChange('brokerParticipates', !!checked)} />
              <Label htmlFor="brokerParticipates" className="text-sm font-medium leading-tight cursor-pointer">Lender is: The Broker, Employee or Family of Broker</Label>
            </div>

            {/* Servicing Fees & Default Fees Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4 mt-4">
              {/* Left: Override Standard Servicing Fees */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="overrideServicingFees" checked={formData.overrideServicingFees} onCheckedChange={(c) => handleChange('overrideServicingFees', !!c)} />
                  <Label htmlFor="overrideServicingFees" className="text-sm font-semibold text-foreground">Override Standard Servicing Fees</Label>
                </div>
                <div className="space-y-2 pl-2">
                    <div className="text-xs font-semibold text-muted-foreground mb-1 ml-[140px]">To Company</div>
                    {renderServicingRow('Monthly Servicing Fee', 'companyServicingFee', 'companyServicingFeePct')}
                    {renderServicingRow('Maximum', 'companyMaxFee', 'companyMaxFeePct')}
                    {renderServicingRow('Minimum', 'companyMinFee', 'companyMinFeePct')}
                    <div className="text-xs font-semibold text-muted-foreground mt-2 mb-1 ml-[140px]">To Broker</div>
                    {renderServicingRow('Monthly Servicing Fee', 'brokerServicingFee', 'brokerServicingFeePct')}
                    {renderServicingRow('Maximum', 'brokerMaxFee', 'brokerMaxFeePct')}
                    {renderServicingRow('Minimum', 'brokerMinFee', 'brokerMinFeePct')}
                </div>
              </div>

              {/* Right: Override Default Fees */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="overrideDefaultFees" checked={formData.overrideDefaultFees} onCheckedChange={(c) => handleChange('overrideDefaultFees', !!c)} />
                  <Label htmlFor="overrideDefaultFees" className="text-sm font-semibold text-foreground">Override Default Fees Fees</Label>
                </div>
                <div className="space-y-1.5 pl-2">
                    {/* Column headers */}
                    <div className="flex items-center gap-2">
                      <div className="min-w-[120px]" />
                      <span className="text-[10px] font-semibold text-muted-foreground w-16 text-center">Lender</span>
                      <span className="text-[10px] font-semibold text-muted-foreground w-16 text-center">Company</span>
                      <span className="text-[10px] font-semibold text-muted-foreground w-16 text-center">Broker</span>
                      <span className="text-[10px] font-semibold text-muted-foreground w-16 text-center">Total</span>
                    </div>
                    {renderDefaultFeeRow('Late Fee 1', 'lateFee1Lender', 'lateFee1Company', 'lateFee1Broker', 'lateFee1Total')}
                    {renderDefaultFeeRow('Late Fee 2', 'lateFee2Lender', 'lateFee2Company', 'lateFee2Broker', 'lateFee2Total')}
                    {renderDefaultFeeRow('Default Interest', 'defaultInterestLender', 'defaultInterestCompany', 'defaultInterestBroker', 'defaultInterestTotal')}
                    {renderDefaultFeeRow('Interest Guarantee', 'interestGuaranteeLender', 'interestGuaranteeCompany', 'interestGuaranteeBroker', 'interestGuaranteeTotal')}
                    {renderDefaultFeeRow('Prepayment', 'prepaymentLender', 'prepaymentCompany', 'prepaymentBroker', 'prepaymentTotal')}
                    {renderDefaultFeeRow('Maturity', 'maturityLender', 'maturityCompany', 'maturityBroker', 'maturityTotal')}
                </div>
              </div>
            </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSaveClick} disabled={percentOwnedError || totalPercentError || !isFormFilled}>{isEditing ? 'Update Funding' : 'Save Funding'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ModalSaveConfirmation open={showConfirm} onConfirm={handleConfirmSave} onCancel={() => setShowConfirm(false)} />
    </>
  );
};

export default AddFundingModal;
