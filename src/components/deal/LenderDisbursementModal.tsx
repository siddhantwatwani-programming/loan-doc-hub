import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy } from 'lucide-react';
import { AccountIdSearch } from './AccountIdSearch';
import { ModalSaveConfirmation } from './ModalSaveConfirmation';
import { hasModalFormData } from '@/lib/modalFormValidation';
import { numericKeyDown, numericPaste, formatCurrencyDisplay, unformatCurrencyDisplay } from '@/lib/numericInputFilter';

export interface DisbursementFormData {
  accountId: string;
  name: string;
  debitPercent: string;
  debitOf: 'Payment' | 'Interest' | 'Principal' | '';
  plusAmount: string;
  minimumAmount: string;
  debitThrough: 'date' | 'amount' | 'payments' | 'payoff' | '';
  debitThroughDate: string;
  debitThroughAmount: string;
  debitThroughPayments: string;
  from: 'Payment' | 'Interest' | 'Principal' | '';
}

const emptyForm = (): DisbursementFormData => ({
  accountId: '',
  name: '',
  debitPercent: '',
  debitOf: '',
  plusAmount: '',
  minimumAmount: '',
  debitThrough: '',
  debitThroughDate: '',
  debitThroughAmount: '',
  debitThroughPayments: '',
  from: '',
});

interface LenderDisbursementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DisbursementFormData) => void;
  editData?: DisbursementFormData | null;
  isEditing?: boolean;
}

export const LenderDisbursementModal: React.FC<LenderDisbursementModalProps> = ({
  open,
  onOpenChange,
  onSubmit,
  editData,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<DisbursementFormData>(emptyForm());
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData(editData ? { ...emptyForm(), ...editData } : emptyForm());
    }
  }, [open, editData]);

  const handleChange = (field: keyof DisbursementFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormFilled = hasModalFormData(formData, ['debitThroughDate', 'debitThroughAmount', 'debitThroughPayments', 'debitPercent', 'plusAmount', 'minimumAmount', 'debitOf', 'debitThrough', 'from'], {});

  const handleSaveClick = () => setShowConfirm(true);
  const handleConfirmSave = () => {
    setShowConfirm(false);
    onSubmit(formData);
    onOpenChange(false);
  };

  const handleCancel = () => onOpenChange(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[520px] p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 pr-10">
            <span className="text-xs font-bold">Lender Disbursements</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-5 w-5" title="Copy">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="px-3 py-3 space-y-2">
            {/* Main 2-column layout: Left fields | Right Debit Through + Dropdown */}
            <div className="grid grid-cols-[1fr_auto] gap-x-4">
              {/* LEFT COLUMN */}
              <div className="space-y-2">
                {/* Payee */}
                <div className="flex items-center gap-1">
                  <Label className="text-[11px] font-bold min-w-[60px] shrink-0">Payee</Label>
                  <AccountIdSearch
                    value={formData.accountId}
                    onChange={(accountId, name) => {
                      setFormData(prev => ({
                        ...prev,
                        accountId,
                        ...(name ? { name } : {}),
                      }));
                    }}
                    className="h-6 text-[11px]"
                  />
                </div>

                {/* Name */}
                <div className="flex items-center gap-1">
                  <Label className="text-[11px] font-bold min-w-[60px] shrink-0">Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="h-6 text-[11px]"
                    placeholder=""
                  />
                </div>

                {/* Debit ___% of [Dropdown] */}
                <div className="flex items-center gap-1">
                  <Label className="text-[11px] font-bold min-w-[60px] shrink-0">Debit</Label>
                  <div className="relative w-[60px]">
                    <Input
                      value={formData.debitPercent}
                      onChange={(e) => handleChange('debitPercent', e.target.value.replace(/[^0-9.]/g, ''))}
                      onKeyDown={numericKeyDown}
                      className="h-6 text-[11px] pr-5"
                      inputMode="decimal"
                      placeholder=""
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">%</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">of</span>
                  <Select value={formData.debitOf || undefined} onValueChange={(val) => handleChange('debitOf', val)}>
                    <SelectTrigger className="h-6 text-[11px] w-[90px]">
                      <SelectValue placeholder="Dropdown" />
                    </SelectTrigger>
                    <SelectContent className="!z-[9999]" position="popper" sideOffset={4}>
                      <SelectItem value="Payment">Payment</SelectItem>
                      <SelectItem value="Interest">Interest</SelectItem>
                      <SelectItem value="Principal">Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Plus */}
                <div className="flex items-center gap-1">
                  <Label className="text-[11px] font-bold min-w-[60px] shrink-0">Plus</Label>
                  <div className="relative flex-1">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                    <Input
                      value={formData.plusAmount}
                      onChange={(e) => handleChange('plusAmount', e.target.value.replace(/[^0-9.]/g, ''))}
                      onKeyDown={numericKeyDown}
                      onPaste={(e) => numericPaste(e, (val) => handleChange('plusAmount', val))}
                      onBlur={() => { if (formData.plusAmount) handleChange('plusAmount', formatCurrencyDisplay(formData.plusAmount)); }}
                      onFocus={() => { if (formData.plusAmount) handleChange('plusAmount', unformatCurrencyDisplay(formData.plusAmount)); }}
                      className="h-6 text-[11px] pl-4"
                      inputMode="decimal"
                      placeholder="-"
                    />
                  </div>
                </div>

                {/* Minimum */}
                <div className="flex items-center gap-1">
                  <Label className="text-[11px] font-bold min-w-[60px] shrink-0">Minimum</Label>
                  <div className="relative flex-1">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                    <Input
                      value={formData.minimumAmount}
                      onChange={(e) => handleChange('minimumAmount', e.target.value.replace(/[^0-9.]/g, ''))}
                      onKeyDown={numericKeyDown}
                      onPaste={(e) => numericPaste(e, (val) => handleChange('minimumAmount', val))}
                      onBlur={() => { if (formData.minimumAmount) handleChange('minimumAmount', formatCurrencyDisplay(formData.minimumAmount)); }}
                      onFocus={() => { if (formData.minimumAmount) handleChange('minimumAmount', unformatCurrencyDisplay(formData.minimumAmount)); }}
                      className="h-6 text-[11px] pl-4"
                      inputMode="decimal"
                      placeholder="-"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Debit Through + Dropdown */}
              <div className="space-y-1 min-w-[160px]">
                <Label className="text-[11px] font-bold">Debit Through</Label>
                <RadioGroup
                  value={formData.debitThrough}
                  onValueChange={(val) => handleChange('debitThrough', val)}
                  className="space-y-1.5"
                >
                  {/* Date */}
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="date" id="dt-date" className="h-3.5 w-3.5" />
                    <Label htmlFor="dt-date" className="text-[11px] min-w-[30px] cursor-pointer">Date</Label>
                    <Input
                      type="date"
                      value={formData.debitThroughDate}
                      onChange={(e) => {
                        handleChange('debitThroughDate', e.target.value);
                        handleChange('debitThrough', 'date');
                      }}
                      className="h-6 text-[10px] flex-1"
                      disabled={formData.debitThrough !== 'date'}
                    />
                  </div>

                  {/* Amount */}
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="amount" id="dt-amount" className="h-3.5 w-3.5" />
                    <Label htmlFor="dt-amount" className="text-[11px] min-w-[30px] cursor-pointer">$</Label>
                    <div className="relative flex-1">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                      <Input
                        value={formData.debitThroughAmount}
                        onChange={(e) => {
                          handleChange('debitThroughAmount', e.target.value.replace(/[^0-9.]/g, ''));
                          handleChange('debitThrough', 'amount');
                        }}
                        onKeyDown={numericKeyDown}
                        className="h-6 text-[10px] pl-4"
                        inputMode="decimal"
                        placeholder="-"
                        disabled={formData.debitThrough !== 'amount'}
                      />
                    </div>
                  </div>

                  {/* Payments */}
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="payments" id="dt-payments" className="h-3.5 w-3.5" />
                    <Label htmlFor="dt-payments" className="text-[11px] cursor-pointer">Payments</Label>
                    <Input
                      value={formData.debitThroughPayments}
                      onChange={(e) => {
                        handleChange('debitThroughPayments', e.target.value.replace(/[^0-9]/g, ''));
                        handleChange('debitThrough', 'payments');
                      }}
                      className="h-6 text-[10px] w-[50px]"
                      inputMode="numeric"
                      placeholder=""
                      disabled={formData.debitThrough !== 'payments'}
                    />
                  </div>

                  {/* Payoff */}
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="payoff" id="dt-payoff" className="h-3.5 w-3.5" />
                    <Label htmlFor="dt-payoff" className="text-[11px] cursor-pointer">Payoff</Label>
                  </div>
                </RadioGroup>

                {/* Dropdown: Payment / Interest / Principal */}
                <div className="pt-1">
                  <Select value={formData.from || undefined} onValueChange={(val) => handleChange('from', val)}>
                    <SelectTrigger className="h-6 text-[11px] w-full">
                      <SelectValue placeholder="Dropdown" />
                    </SelectTrigger>
                    <SelectContent className="!z-[9999]" position="popper" sideOffset={4}>
                      <SelectItem value="Payment">Payment</SelectItem>
                      <SelectItem value="Interest">Interest</SelectItem>
                      <SelectItem value="Principal">Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border px-3 py-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
            <Button size="sm" onClick={handleSaveClick} disabled={!isFormFilled}>
              {isEditing ? 'Update' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ModalSaveConfirmation open={showConfirm} onConfirm={handleConfirmSave} onCancel={() => setShowConfirm(false)} />
    </>
  );
};

export default LenderDisbursementModal;
