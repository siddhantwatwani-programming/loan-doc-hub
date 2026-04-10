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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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

export interface PaymentRow {
  active: boolean;
  accountId: string;
  name: string;
  amount: string;
  percentage: string;
  comment: string;
  from: 'Interest' | 'Principal' | '';
}

const emptyDisbursementRow = (): DisbursementRow => ({ accountId: '', name: '', amount: '', percentage: '', comments: '' });
const defaultDisbursements = (): DisbursementRow[] => [emptyDisbursementRow(), emptyDisbursementRow(), emptyDisbursementRow(), emptyDisbursementRow()];

const emptyPaymentRow = (): PaymentRow => ({ active: false, accountId: '', name: '', amount: '', percentage: '', comment: '', from: '' });
const defaultPayments = (): PaymentRow[] => [emptyPaymentRow(), emptyPaymentRow()];

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
  // New: principal balance and note rate for display
  principalBalance?: string;
  noteRateDisplay?: string;
  // Override servicing
  overrideServicing?: boolean;
  // Company Servicing Fees
  companyBaseFee?: string;
  companyBaseFeePct?: string;
  companyAdditionalServices?: string;
  companyMinimum?: string;
  companyMaximum?: string;
  // Originating Vendor Fee
  vendorBaseFee?: string;
  vendorBaseFeePct?: string;
  vendorAdditionalServices?: string;
  vendorMinimum?: string;
  vendorMaximum?: string;
  // Payments table
  payments?: PaymentRow[];
  // Legacy servicing fees (kept for backward compatibility)
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
  principalBalance: '', noteRateDisplay: noteRate,
  overrideServicing: false,
  companyBaseFee: '', companyBaseFeePct: '', companyAdditionalServices: '', companyMinimum: '', companyMaximum: '',
  vendorBaseFee: '', vendorBaseFeePct: '', vendorAdditionalServices: '', vendorMinimum: '', vendorMaximum: '',
  payments: defaultPayments(),
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
        ...getDefaultFormData(loanNumber, borrowerName, noteRate, soldRate),
        ...editData,
        loan: loanNumber || editData.loan,
        borrower: borrowerName || editData.borrower,
        roundingAdjustment: editData.roundingAdjustment ?? false,
        disbursements: editData.disbursements?.length ? editData.disbursements : defaultDisbursements(),
        payments: editData.payments?.length ? editData.payments : defaultPayments(),
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

  React.useEffect(() => {
    if (open) {
      const data = getInitialFormData();
      setFormData(data);
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

  // Auto-compute Percent Owned
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

  // Regular Payment calculation
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

  // Auto-compute total columns for default fees
  const computeTotal = (lender: string, company: string, broker: string): string => {
    const l = parseFloat(lender) || 0;
    const c = parseFloat(company) || 0;
    const b = parseFloat(broker) || 0;
    const total = l + c + b;
    return total > 0 ? total.toFixed(3) : '';
  };

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

  const percentOwnedNum = parseFloat(formData.percentOwned) || 0;
  const percentOwnedError = percentOwnedNum > 100;
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

  // Payment row handlers
  const handlePaymentChange = (index: number, field: keyof PaymentRow, value: string | boolean) => {
    setFormData(prev => {
      const payments = [...(prev.payments || defaultPayments())];
      payments[index] = { ...payments[index], [field]: value };
      return { ...prev, payments };
    });
  };

  const handleAddPaymentRow = () => {
    setFormData(prev => ({
      ...prev,
      payments: [...(prev.payments || []), emptyPaymentRow()],
    }));
  };

  const handleDeletePaymentRow = (index: number) => {
    setFormData(prev => {
      const payments = [...(prev.payments || [])];
      payments.splice(index, 1);
      return { ...prev, payments };
    });
  };

  const isFormFilled = hasModalFormData(formData, ['loan', 'borrower', 'rateSelection', 'rateNoteValue', 'rateSoldValue', 'rateLenderValue', 'percentOwned', 'regularPayment', 'lenderRate', 'disbursements', 'payments', 'principalBalance', 'noteRateDisplay', 'overrideServicing', 'companyBaseFee', 'companyBaseFeePct', 'companyAdditionalServices', 'companyMinimum', 'companyMaximum', 'vendorBaseFee', 'vendorBaseFeePct', 'vendorAdditionalServices', 'vendorMinimum', 'vendorMaximum'], { brokerParticipates: false, overrideServicingFees: false, overrideDefaultFees: false, roundingAdjustment: false });

  const handleSaveClick = () => setShowConfirm(true);
  const handleConfirmSave = () => {
    setShowConfirm(false);
    // Sync new fee fields back to legacy fields for persistence
    const syncedData: FundingFormData = {
      ...formData,
      loan: loanNumber || formData.loan,
      borrower: borrowerName || formData.borrower,
      overrideServicingFees: formData.overrideServicing || formData.overrideServicingFees,
      companyServicingFee: formData.companyBaseFee || formData.companyServicingFee,
      companyServicingFeePct: formData.companyBaseFeePct || formData.companyServicingFeePct,
      companyMinFee: formData.companyMinimum || formData.companyMinFee,
      companyMaxFee: formData.companyMaximum || formData.companyMaxFee,
      brokerServicingFee: formData.vendorBaseFee || formData.brokerServicingFee,
      brokerServicingFeePct: formData.vendorBaseFeePct || formData.brokerServicingFeePct,
      brokerMinFee: formData.vendorMinimum || formData.brokerMinFee,
      brokerMaxFee: formData.vendorMaximum || formData.brokerMaxFee,
    };
    onSubmit(syncedData);
    setFormData(getDefaultFormData(loanNumber, borrowerName, noteRate, soldRate));
    onOpenChange(false);
  };

  const handleCancel = () => { onOpenChange(false); };

  const renderCurrencyField = (field: keyof FundingFormData, placeholder = '-', disabled = false) => (
    <div className="relative flex-1">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
      <Input
        value={(formData[field] as string) || ''}
        onChange={(e) => handleChange(field, e.target.value.replace(/[^0-9.]/g, ''))}
        onKeyDown={numericKeyDown}
        onPaste={(e) => numericPaste(e, (val) => handleChange(field, val))}
        onBlur={() => { const raw = formData[field] as string; if (raw) handleChange(field, formatCurrencyDisplay(raw)); }}
        onFocus={() => { const raw = formData[field] as string; if (raw) handleChange(field, unformatCurrencyDisplay(raw)); }}
        className="h-7 text-xs pl-5"
        inputMode="decimal"
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );

  const renderPercentField = (field: keyof FundingFormData, placeholder = '%', disabled = false) => (
    <div className="relative flex-1">
      <Input
        value={(formData[field] as string) || ''}
        onChange={(e) => handleChange(field, e.target.value.replace(/[^0-9.]/g, ''))}
        onKeyDown={numericKeyDown}
        className="h-7 text-xs pr-5"
        inputMode="decimal"
        placeholder={placeholder}
        disabled={disabled}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
    </div>
  );

  const servicingDisabled = !(formData.overrideServicing ?? false);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-sm font-bold underline">Funding Lender</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 py-2 sleek-scrollbar">
          {/* Section 1: Basic Details - two column layout */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {/* Row 1: Lender ID | Name */}
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium min-w-[110px] shrink-0">Lender ID</Label>
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
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium min-w-[60px] shrink-0">Name</Label>
              <Input value={formData.lenderFullName} readOnly className="h-7 text-xs bg-muted/30" />
            </div>

            {/* Row 2: Principal Balance | Note Rate */}
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium min-w-[110px] shrink-0">Principal Balance</Label>
              {renderCurrencyField('principalBalance', '-', true)}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium min-w-[60px] shrink-0">Note Rate</Label>
              {renderPercentField('noteRateDisplay', '%', true)}
            </div>

            {/* Row 3: Funding Amount | Lender Rate */}
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium min-w-[110px] shrink-0">Funding Amount</Label>
              {renderCurrencyField('fundingAmount', '0.00')}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium min-w-[60px] shrink-0">Lender Rate</Label>
              {renderPercentField('lenderRate', '%')}
            </div>
          </div>

          {/* Validation messages */}
          {percentOwnedError && (
            <p className="text-xs text-destructive font-medium">Percent Owned cannot exceed 100%</p>
          )}
          {totalPercentError && !percentOwnedError && (
            <p className="text-xs text-destructive font-medium">Total ownership across all lenders exceeds 100%</p>
          )}

          {/* Section 2: Override Servicing */}
          <div className="flex items-center gap-2 pt-1">
            <Label className="text-xs font-bold">Override Servicing</Label>
            <Checkbox
              checked={formData.overrideServicing ?? false}
              onCheckedChange={(checked) => handleChange('overrideServicing', !!checked)}
              className="h-3.5 w-3.5"
            />
          </div>

          {/* Section 3: Two-column Fees */}
          <div className="grid grid-cols-2 gap-x-6">
            {/* Company Servicing Fees */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold underline">Company Servicing Fees</p>
              <div className="flex items-center gap-2">
                <Label className="text-xs min-w-[110px] shrink-0">Base Fee</Label>
                {renderCurrencyField('companyBaseFee', '-', servicingDisabled)}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs min-w-[110px] shrink-0"></Label>
                {renderPercentField('companyBaseFeePct', '%', servicingDisabled)}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs min-w-[110px] shrink-0">Additional Services</Label>
                {renderCurrencyField('companyAdditionalServices', '-', servicingDisabled)}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs min-w-[110px] shrink-0">Minimum</Label>
                {renderCurrencyField('companyMinimum', '-', servicingDisabled)}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs min-w-[110px] shrink-0">Maximum</Label>
                {renderCurrencyField('companyMaximum', '-', servicingDisabled)}
              </div>
            </div>

            {/* Originating Vendor Fee */}
            <div className="space-y-1.5">
              <p className="text-xs font-bold underline">Originating Vendor Fee</p>
              <div className="flex items-center gap-2">
                <Label className="text-xs min-w-[110px] shrink-0">Base Fee</Label>
                {renderCurrencyField('vendorBaseFee', '-', servicingDisabled)}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs min-w-[110px] shrink-0"></Label>
                {renderPercentField('vendorBaseFeePct', '%', servicingDisabled)}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs min-w-[110px] shrink-0">Additional Services</Label>
                {renderCurrencyField('vendorAdditionalServices', '-', servicingDisabled)}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs min-w-[110px] shrink-0">Minimum</Label>
                {renderCurrencyField('vendorMinimum', '-', servicingDisabled)}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs min-w-[110px] shrink-0">Maximum</Label>
                {renderCurrencyField('vendorMaximum', '-', servicingDisabled)}
              </div>
            </div>
          </div>

          {/* Section 4: Payments Table */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold">Payments</p>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={handleAddPaymentRow} title="Add payment row">
                <Plus className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" title="Edit">
                <Pencil className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5" title="Delete">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="overflow-x-auto border border-border rounded">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left py-1 px-1.5 font-semibold text-muted-foreground w-[50px]">Active</th>
                    <th className="text-left py-1 px-1.5 font-semibold text-muted-foreground min-w-[90px]">Account ID</th>
                    <th className="text-left py-1 px-1.5 font-semibold text-muted-foreground min-w-[90px]">Name</th>
                    <th className="text-left py-1 px-1.5 font-semibold text-muted-foreground min-w-[70px]">Amount</th>
                    <th className="text-left py-1 px-1.5 font-semibold text-muted-foreground min-w-[70px]">Percentage</th>
                    <th className="text-left py-1 px-1.5 font-semibold text-muted-foreground min-w-[80px]">Comment</th>
                    <th className="text-left py-1 px-1.5 font-semibold text-muted-foreground min-w-[90px]">From</th>
                    <th className="w-[30px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {(formData.payments || defaultPayments()).map((row, idx) => (
                    <tr key={idx} className="border-b border-border last:border-b-0">
                      <td className="py-0.5 px-1.5">
                        <Checkbox
                          checked={row.active}
                          onCheckedChange={(checked) => handlePaymentChange(idx, 'active', !!checked)}
                          className="h-3.5 w-3.5"
                        />
                      </td>
                      <td className="py-0.5 px-1.5">
                        <Input value={row.accountId} onChange={(e) => handlePaymentChange(idx, 'accountId', e.target.value)} className="h-6 text-xs" placeholder="Search" />
                      </td>
                      <td className="py-0.5 px-1.5">
                        <Input value={row.name} onChange={(e) => handlePaymentChange(idx, 'name', e.target.value)} className="h-6 text-xs" placeholder="Name" />
                      </td>
                      <td className="py-0.5 px-1.5">
                        <Input value={row.amount} onChange={(e) => handlePaymentChange(idx, 'amount', e.target.value.replace(/[^0-9.]/g, ''))} onKeyDown={numericKeyDown} className="h-6 text-xs" inputMode="decimal" placeholder="##" />
                      </td>
                      <td className="py-0.5 px-1.5">
                        <Input value={row.percentage} onChange={(e) => handlePaymentChange(idx, 'percentage', e.target.value.replace(/[^0-9.]/g, ''))} onKeyDown={numericKeyDown} className="h-6 text-xs" inputMode="decimal" placeholder="%" />
                      </td>
                      <td className="py-0.5 px-1.5">
                        <Input value={row.comment} onChange={(e) => handlePaymentChange(idx, 'comment', e.target.value)} className="h-6 text-xs" />
                      </td>
                      <td className="py-0.5 px-1.5">
                        <Select value={row.from} onValueChange={(val) => handlePaymentChange(idx, 'from', val)}>
                          <SelectTrigger className="h-6 text-xs">
                            <SelectValue placeholder="Dropdown" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Interest">Interest</SelectItem>
                            <SelectItem value="Principal">Principal</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-0.5 px-1.5">
                        {(formData.payments || []).length > 1 && (
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleDeletePaymentRow(idx)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hidden fields for backward-compat calculations */}
          <div className="hidden">
            <RadioGroup value={formData.rateSelection} onValueChange={(val) => handleChange('rateSelection', val)}>
              <RadioGroupItem value="note_rate" id="rate-note" />
              <RadioGroupItem value="sold_rate" id="rate-sold" />
              <RadioGroupItem value="lender_rate" id="rate-lender" />
            </RadioGroup>
            <Input type="text" value={formData.percentOwned} disabled />
            <Input type="text" value={formData.regularPayment || ''} disabled />
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border pt-3">
          <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSaveClick} disabled={percentOwnedError || totalPercentError || !isFormFilled}>
            {isEditing ? 'Update Funding' : 'Save Funding'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ModalSaveConfirmation open={showConfirm} onConfirm={handleConfirmSave} onCancel={() => setShowConfirm(false)} />
    </>
  );
};

export default AddFundingModal;
