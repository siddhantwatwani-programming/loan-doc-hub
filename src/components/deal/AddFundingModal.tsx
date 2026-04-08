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
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LenderIdSearch } from './LenderIdSearch';
import { formatCurrencyDisplay, unformatCurrencyDisplay, numericKeyDown, numericPaste } from '@/lib/numericInputFilter';

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

export interface DisbursementRow {
  accountId: string;
  name: string;
  amount: string;
  percentage: string;
  comments: string;
}

const emptyDisbursementRow = (): DisbursementRow => ({ accountId: '', name: '', amount: '', percentage: '', comments: '' });
const defaultDisbursements = (): DisbursementRow[] => [emptyDisbursementRow(), emptyDisbursementRow(), emptyDisbursementRow(), emptyDisbursementRow()];

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
  roundingAdjustment: boolean;
  disbursements: DisbursementRow[];
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
  lateFee1Maximum: string;
  lateFee2Lender: string;
  lateFee2Company: string;
  lateFee2Broker: string;
  lateFee2Total: string;
  lateFee2Maximum: string;
  defaultInterestLender: string;
  defaultInterestCompany: string;
  defaultInterestBroker: string;
  defaultInterestTotal: string;
  defaultInterestMaximum: string;
  interestGuaranteeLender: string;
  interestGuaranteeCompany: string;
  interestGuaranteeBroker: string;
  interestGuaranteeTotal: string;
  interestGuaranteeMaximum: string;
  prepaymentLender: string;
  prepaymentCompany: string;
  prepaymentBroker: string;
  prepaymentTotal: string;
  prepaymentMaximum: string;
  maturityLender: string;
  maturityCompany: string;
  maturityBroker: string;
  maturityTotal: string;
  maturityMaximum: string;
}

const getDefaultFormData = (loanNumber: string, borrowerName: string, noteRate: string, soldRate: string): FundingFormData => ({
  loan: loanNumber, borrower: borrowerName, lenderId: '', lenderFullName: '',
  lenderRate: '', fundingAmount: '', fundingDate: '', interestFrom: '', notes: '', brokerParticipates: false,
  percentOwned: '', regularPayment: '', lenderShare: '',
  rateSelection: 'note_rate', rateNoteValue: noteRate, rateSoldValue: soldRate, rateLenderValue: '',
  roundingAdjustment: false,
  disbursements: defaultDisbursements(),
  overrideServicingFees: false,
  companyServicingFee: '', companyServicingFeePct: '', companyMaxFee: '', companyMaxFeePct: '',
  companyMinFee: '', companyMinFeePct: '', brokerServicingFee: '', brokerServicingFeePct: '',
  brokerMaxFee: '', brokerMaxFeePct: '', brokerMinFee: '', brokerMinFeePct: '',
  overrideDefaultFees: false,
  lateFee1Lender: '', lateFee1Company: '', lateFee1Broker: '', lateFee1Total: '', lateFee1Maximum: '',
  lateFee2Lender: '', lateFee2Company: '', lateFee2Broker: '', lateFee2Total: '', lateFee2Maximum: '',
  defaultInterestLender: '', defaultInterestCompany: '', defaultInterestBroker: '', defaultInterestTotal: '', defaultInterestMaximum: '',
  interestGuaranteeLender: '', interestGuaranteeCompany: '', interestGuaranteeBroker: '', interestGuaranteeTotal: '', interestGuaranteeMaximum: '',
  prepaymentLender: '', prepaymentCompany: '', prepaymentBroker: '', prepaymentTotal: '', prepaymentMaximum: '',
  maturityLender: '', maturityCompany: '', maturityBroker: '', maturityTotal: '', maturityMaximum: '',
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
    if (editData) {
      return {
        ...editData,
        loan: loanNumber || editData.loan,
        borrower: borrowerName || editData.borrower,
        roundingAdjustment: editData.roundingAdjustment ?? false,
        disbursements: editData.disbursements?.length ? editData.disbursements : defaultDisbursements(),
        lateFee1Maximum: editData.lateFee1Maximum ?? '',
        lateFee2Maximum: editData.lateFee2Maximum ?? '',
        defaultInterestMaximum: editData.defaultInterestMaximum ?? '',
        interestGuaranteeMaximum: editData.interestGuaranteeMaximum ?? '',
        prepaymentMaximum: editData.prepaymentMaximum ?? '',
        maturityMaximum: editData.maturityMaximum ?? '',
      };
    }
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
    const fa = parseFloat((formData.fundingAmount || '').replace(/[$,]/g, '')) || 0;
    const la = parseFloat((loanAmount || '').replace(/[$,]/g, '')) || 0;
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

  const handleDisbursementChange = (index: number, field: keyof DisbursementRow, value: string) => {
    setFormData(prev => {
      const updated = [...prev.disbursements];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, disbursements: updated };
    });
  };

  const isFormFilled = hasModalFormData(formData, ['loan', 'borrower', 'rateSelection', 'rateNoteValue', 'rateSoldValue', 'rateLenderValue', 'percentOwned', 'regularPayment', 'lenderRate', 'disbursements'], { brokerParticipates: false, overrideServicingFees: false, overrideDefaultFees: false, roundingAdjustment: false });

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

  const renderServicingRow = (label: string, feeField: keyof FundingFormData, pctField?: keyof FundingFormData) => (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-foreground font-medium min-w-[100px] shrink-0">{label}</Label>
      <div className="relative w-24">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <Input value={formData[feeField] as string} onChange={(e) => handleChange(feeField, e.target.value.replace(/[^0-9.]/g, ''))} onKeyDown={numericKeyDown} onPaste={(e) => numericPaste(e, (val) => handleChange(feeField, val))} onBlur={() => { const raw = formData[feeField] as string; if (raw) handleChange(feeField, formatCurrencyDisplay(raw)); }} onFocus={() => { const raw = formData[feeField] as string; if (raw) handleChange(feeField, unformatCurrencyDisplay(raw)); }} className="h-7 text-xs pl-5" inputMode="decimal" placeholder="-" />
      </div>
      {pctField && (
        <div className="relative w-20">
          <Input value={formData[pctField] as string} onChange={(e) => handleChange(pctField, e.target.value.replace(/[^0-9.]/g, ''))} className="h-7 text-xs pr-5" inputMode="decimal" placeholder="0%" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
        </div>
      )}
    </div>
  );

  const renderDefaultFeeRow = (label: string, lenderField: keyof FundingFormData, companyField: keyof FundingFormData, brokerField: keyof FundingFormData, totalField: keyof FundingFormData, maximumField: keyof FundingFormData) => (
    <div className="flex items-center gap-1.5">
      <Label className="text-xs text-foreground font-medium min-w-[110px] shrink-0">{label}</Label>
      <div className="relative w-14">
        <Input value={formData[lenderField] as string} onChange={(e) => handleChange(lenderField, e.target.value.replace(/[^0-9.]/g, ''))} className="h-7 text-xs text-right" inputMode="decimal" placeholder="" />
      </div>
      <div className="relative w-14">
        <Input value={formData[companyField] as string} onChange={(e) => handleChange(companyField, e.target.value.replace(/[^0-9.]/g, ''))} className="h-7 text-xs text-right" inputMode="decimal" placeholder="" />
      </div>
      <div className="relative w-14">
        <Input value={formData[brokerField] as string} onChange={(e) => handleChange(brokerField, e.target.value.replace(/[^0-9.]/g, ''))} className="h-7 text-xs text-right" inputMode="decimal" placeholder="" />
      </div>
      <div className="relative w-14">
        <Input value={formData[totalField] as string} disabled className="h-7 text-xs text-right opacity-50 bg-muted" placeholder="" />
      </div>
      <div className="relative w-14">
        <Input value={formData[maximumField] as string} onChange={(e) => handleChange(maximumField, e.target.value.replace(/[^0-9.]/g, ''))} className="h-7 text-xs text-right" inputMode="decimal" placeholder="" />
      </div>
    </div>
  );

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEditing ? 'Edit Funding' : 'Add / Edit Funding'}</DialogTitle>
          <div className="text-sm text-muted-foreground">Account: {loanNumber || formData.loan}</div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-3 py-3 sleek-scrollbar">
          {/* Top Section: Two columns - Fields left, Disbursements right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-3">
            {/* Left Column: Basic Fields */}
            <div className="space-y-2">
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
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Lender Name</Label>
                <Input value={formData.lenderFullName} readOnly disabled className="h-7 text-sm bg-muted opacity-50" />
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Funding Amount</Label>
                <div className="relative flex-1">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
                  <Input type="text" inputMode="decimal" value={formData.fundingAmount} onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ''); handleChange('fundingAmount', v); }} onKeyDown={numericKeyDown} onPaste={(e) => numericPaste(e, (val) => handleChange('fundingAmount', val))} onBlur={() => { const raw = formData.fundingAmount; if (raw) handleChange('fundingAmount', formatCurrencyDisplay(raw)); }} onFocus={() => { const raw = formData.fundingAmount; if (raw) handleChange('fundingAmount', unformatCurrencyDisplay(raw)); }} placeholder="0.00" className="h-7 text-sm pl-6" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Funding Date</Label>
                <Popover open={fundingDateOpen} onOpenChange={setFundingDateOpen} modal={false}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('h-7 text-sm w-full justify-start text-left font-normal flex-1', !fundingDate && 'text-muted-foreground')}>
                      {fundingDate ? format(fundingDate, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
                      <CalendarIcon className="ml-auto h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999]" align="start"><EnhancedCalendar mode="single" selected={fundingDate} onSelect={(d) => { setFundingDate(d); setFundingDateOpen(false); }} onClear={() => { setFundingDate(undefined); setFundingDateOpen(false); }} onToday={() => { setFundingDate(new Date()); setFundingDateOpen(false); }} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[110px] text-left shrink-0">Interest From</Label>
                <Popover open={interestFromOpen} onOpenChange={setInterestFromOpen} modal={false}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('h-7 text-sm w-full justify-start text-left font-normal flex-1', !interestFromDate && 'text-muted-foreground')}>
                      {interestFromDate ? format(interestFromDate, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
                      <CalendarIcon className="ml-auto h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999]" align="start"><EnhancedCalendar mode="single" selected={interestFromDate} onSelect={(d) => { setInterestFromDate(d); setInterestFromOpen(false); }} onClear={() => { setInterestFromDate(undefined); setInterestFromOpen(false); }} onToday={() => { setInterestFromDate(new Date()); setInterestFromOpen(false); }} initialFocus /></PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="roundingAdjustment" checked={formData.roundingAdjustment} onCheckedChange={(checked) => handleChange('roundingAdjustment', !!checked)} />
                <Label htmlFor="roundingAdjustment" className="text-sm font-medium leading-tight cursor-pointer">Rounding Adjustment</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="brokerParticipates" checked={formData.brokerParticipates} onCheckedChange={(checked) => handleChange('brokerParticipates', !!checked)} />
                <Label htmlFor="brokerParticipates" className="text-sm font-medium leading-tight cursor-pointer">Lender is the Broker or Employee, Family Member of Broker</Label>
              </div>
            </div>

            {/* Right Column: Disbursements */}
            <div className="space-y-1">
              
              <div className="border-b border-border pb-1">
                <span className="font-semibold text-sm text-foreground">Disbursements</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1 px-1 font-semibold text-muted-foreground min-w-[80px]">Account ID</th>
                      <th className="text-left py-1 px-1 font-semibold text-muted-foreground min-w-[80px]">Name</th>
                      <th className="text-left py-1 px-1 font-semibold text-muted-foreground min-w-[70px]">$</th>
                      <th className="text-left py-1 px-1 font-semibold text-muted-foreground min-w-[50px]">%</th>
                      <th className="text-left py-1 px-1 font-semibold text-muted-foreground min-w-[80px]">Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.disbursements.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-0.5 px-1">
                          <Input value={row.accountId} onChange={(e) => handleDisbursementChange(idx, 'accountId', e.target.value)} className="h-7 text-xs" placeholder="" />
                        </td>
                        <td className="py-0.5 px-1">
                          <Input value={row.name} onChange={(e) => handleDisbursementChange(idx, 'name', e.target.value)} className="h-7 text-xs" placeholder="" />
                        </td>
                        <td className="py-0.5 px-1">
                          <Input value={row.amount} onChange={(e) => handleDisbursementChange(idx, 'amount', e.target.value.replace(/[^0-9.]/g, ''))} onKeyDown={numericKeyDown} className="h-7 text-xs" inputMode="decimal" placeholder="" />
                        </td>
                        <td className="py-0.5 px-1">
                          <Input value={row.percentage} onChange={(e) => handleDisbursementChange(idx, 'percentage', e.target.value.replace(/[^0-9.]/g, ''))} className="h-7 text-xs" inputMode="decimal" placeholder="" />
                        </td>
                        <td className="py-0.5 px-1">
                          <Input value={row.comments} onChange={(e) => handleDisbursementChange(idx, 'comments', e.target.value)} className="h-7 text-xs" placeholder="" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Bottom Section: Override Fees and Splits + Override Default Fees */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
            {/* Left: Override Fees and Splits */}
            <div className="space-y-2">
              <div className="border-b border-border pb-1">
                <span className="font-semibold text-sm text-foreground">Override Fees and Splits</span>
              </div>
              <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground underline">Company</div>
                {renderServicingRow('Servicing Fee', 'companyServicingFee', 'companyServicingFeePct')}
                {renderServicingRow('Minimum', 'companyMinFee')}
                {renderServicingRow('Maximum', 'companyMaxFee')}
                <div className="text-xs font-semibold text-muted-foreground underline mt-2">Broker</div>
                {renderServicingRow('Servicing Fee', 'brokerServicingFee', 'brokerServicingFeePct')}
                {renderServicingRow('Minimum', 'brokerMinFee')}
                {renderServicingRow('Maximum', 'brokerMaxFee')}
              </div>
            </div>

            {/* Right: Override Default Fees */}
            <div className="space-y-2">
              <div className="border-b border-border pb-1">
                <span className="font-semibold text-sm text-foreground">Override Default Fees</span>
              </div>
              <div className="space-y-1.5">
                {/* Column headers */}
                <div className="flex items-center gap-1.5">
                  <div className="min-w-[110px]" />
                  <span className="text-[10px] font-semibold text-muted-foreground w-14 text-center">Lender</span>
                  <span className="text-[10px] font-semibold text-muted-foreground w-14 text-center">Company</span>
                  <span className="text-[10px] font-semibold text-muted-foreground w-14 text-center">Broker</span>
                  <span className="text-[10px] font-semibold text-muted-foreground w-14 text-center">Total %</span>
                  <span className="text-[10px] font-semibold text-muted-foreground w-14 text-center">Maximum</span>
                </div>
                {renderDefaultFeeRow('Late Fee 1', 'lateFee1Lender', 'lateFee1Company', 'lateFee1Broker', 'lateFee1Total', 'lateFee1Maximum')}
                {renderDefaultFeeRow('Late Fee 2', 'lateFee2Lender', 'lateFee2Company', 'lateFee2Broker', 'lateFee2Total', 'lateFee2Maximum')}
                {renderDefaultFeeRow('Default Interest', 'defaultInterestLender', 'defaultInterestCompany', 'defaultInterestBroker', 'defaultInterestTotal', 'defaultInterestMaximum')}
                {renderDefaultFeeRow('Interest Guarantee', 'interestGuaranteeLender', 'interestGuaranteeCompany', 'interestGuaranteeBroker', 'interestGuaranteeTotal', 'interestGuaranteeMaximum')}
                {renderDefaultFeeRow('Prepayment', 'prepaymentLender', 'prepaymentCompany', 'prepaymentBroker', 'prepaymentTotal', 'prepaymentMaximum')}
                {renderDefaultFeeRow('Maturity', 'maturityLender', 'maturityCompany', 'maturityBroker', 'maturityTotal', 'maturityMaximum')}
              </div>
            </div>
          </div>

          {/* Rate Selection - hidden from UI, kept for calculation logic */}
          <div className="hidden">
            <RadioGroup value={formData.rateSelection} onValueChange={(val) => handleChange('rateSelection', val)}>
              <RadioGroupItem value="note_rate" id="rate-note" />
              <RadioGroupItem value="sold_rate" id="rate-sold" />
              <RadioGroupItem value="lender_rate" id="rate-lender" />
            </RadioGroup>
          </div>

          {/* Percent Owned & Regular Payment - hidden from UI, kept for backend */}
          <div className="hidden">
            <Input value={formData.percentOwned} readOnly />
            <Input value={formData.regularPayment} readOnly />
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSaveClick} disabled={!isFormFilled}>{isEditing ? 'Update Funding' : 'Save Funding'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ModalSaveConfirmation open={showConfirm} onConfirm={handleConfirmSave} onCancel={() => setShowConfirm(false)} />
    </>
  );
};

export default AddFundingModal;
