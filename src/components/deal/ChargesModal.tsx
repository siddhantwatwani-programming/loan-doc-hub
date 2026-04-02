import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { CalendarIcon } from 'lucide-react';
import { sanitizeInterestInput, normalizeInterestOnBlur } from '@/lib/interestValidation';
import { numericKeyDown, numericPaste, formatCurrencyDisplay, unformatCurrencyDisplay } from '@/lib/numericInputFilter';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ModalSaveConfirmation } from './ModalSaveConfirmation';
import { hasModalFormData } from '@/lib/modalFormValidation';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { format, parse, isValid } from 'date-fns';
import type { ChargeData } from './ChargesTableView';

interface ChargesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  charge?: ChargeData | null;
  onSave: (charge: ChargeData) => void;
  isEdit?: boolean;
}

const generateChargeId = () => `charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getEmptyCharge = (): ChargeData => ({
  id: generateChargeId(), description: '', unpaidBalance: '', owedTo: '', owedFrom: '', totalDue: '',
  interestFrom: '', dateOfCharge: '', interestRate: '', notes: '', reference: '', chargeType: '',
  deferred: '', originalAmount: '', account: '', borrowerFullName: '', advancedByAccount: '',
  advancedByLenderName: '', advancedByAmount: '', onBehalfOfAccount: '', onBehalfOfLenderName: '',
  onBehalfOfAmount: '', amountOwedByBorrower: '', accruedInterest: '', distributeBetweenAllLenders: '',
});

export const ChargesModal: React.FC<ChargesModalProps> = ({ open, onOpenChange, charge, onSave, isEdit = false }) => {
  const [formData, setFormData] = useState<ChargeData>(getEmptyCharge());
  const [showConfirm, setShowConfirm] = useState(false);
  const [datePickerStates, setDatePickerStates] = useState<Record<string, boolean>>({});
  const [focusedCurrencyField, setFocusedCurrencyField] = useState<string | null>(null);

  useEffect(() => {
    if (open) setFormData(charge ? charge : getEmptyCharge());
  }, [open, charge]);

  const handleFieldChange = (field: keyof ChargeData, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const isFormFilled = hasModalFormData(formData, ['id']);

  const handleSaveClick = () => setShowConfirm(true);
  const handleConfirmSave = () => { setShowConfirm(false); onSave(formData); onOpenChange(false); };

  const renderInlineField = (field: keyof ChargeData, label: string, type = 'text') => (
    type === 'date' ? (() => {
      const val = formData[field] || '';
      const safeParse = (v: string): Date | undefined => { if (!v) return undefined; try { const d = parse(v, 'yyyy-MM-dd', new Date()); if (isValid(d)) return d; const d2 = new Date(v); return isValid(d2) ? d2 : undefined; } catch { return undefined; } };
      return (
        <div className="flex items-center gap-2">
          <Label className="w-[110px] shrink-0 text-xs font-semibold text-foreground">{label}</Label>
          <Popover open={datePickerStates[field] || false} onOpenChange={(o) => setDatePickerStates(prev => ({ ...prev, [field]: o }))}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-7 text-xs flex-1 justify-start text-left font-normal', !val && 'text-muted-foreground')}>
                {val && safeParse(val) ? format(safeParse(val)!, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
                <CalendarIcon className="ml-auto h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999]" align="start">
              <EnhancedCalendar mode="single" selected={safeParse(val)} onSelect={(date) => { if (date) handleFieldChange(field, format(date, 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [field]: false })); }} onClear={() => { handleFieldChange(field, ''); setDatePickerStates(prev => ({ ...prev, [field]: false })); }} onToday={() => { handleFieldChange(field, format(new Date(), 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [field]: false })); }} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      );
    })() : (
      <div className="flex items-center gap-2">
        <Label className="w-[110px] shrink-0 text-xs font-semibold text-foreground">{label}</Label>
        <Input value={formData[field]} onChange={(e) => handleFieldChange(field, e.target.value)} className="h-7 text-xs flex-1" type={type} />
      </div>
    )
  );

  const renderCurrencyField = (field: keyof ChargeData, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs font-semibold text-foreground">{label}</Label>
      <div className="relative flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <Input
          inputMode="decimal"
          value={focusedCurrencyField === field ? formData[field] : formatCurrencyDisplay(formData[field])}
          onFocus={() => { setFocusedCurrencyField(field); handleFieldChange(field, unformatCurrencyDisplay(formData[field])); }}
          onBlur={() => { setFocusedCurrencyField(null); const v = formatCurrencyDisplay(formData[field]); if (v) handleFieldChange(field, unformatCurrencyDisplay(v)); }}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          onKeyDown={numericKeyDown}
          onPaste={(e) => numericPaste(e, (v) => handleFieldChange(field, v))}
          className="h-7 text-xs pl-5"
          placeholder="0.00"
        />
      </div>
    </div>
  );

  const renderPercentageField = (field: keyof ChargeData, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs font-semibold text-foreground">{label}</Label>
      <div className="relative flex-1">
        <Input inputMode="decimal" value={formData[field]} onChange={(e) => handleFieldChange(field, sanitizeInterestInput(e.target.value))} onBlur={() => { const v = normalizeInterestOnBlur(formData[field], 2); if (v !== formData[field]) handleFieldChange(field, v); }} className="h-7 text-xs pr-5" placeholder="0.00" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-primary" />
              {isEdit ? 'Edit Charge' : 'New Charge'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 sleek-scrollbar space-y-4 mt-3">
            {/* Loan Information */}
            <div>
              <div className="bg-primary/10 border border-primary/20 rounded px-2 py-1 mb-2">
                <span className="font-semibold text-xs text-primary">Loan Information</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-1">
                {renderInlineField('account', 'Account')}
                {renderInlineField('borrowerFullName', 'Borrower Name')}
              </div>
            </div>

            {/* Charge Information */}
            <div>
              <div className="bg-primary/10 border border-primary/20 rounded px-2 py-1 mb-2">
                <span className="font-semibold text-xs text-primary">Charge Information</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-1">
                {renderInlineField('dateOfCharge', 'Date of Charge', 'date')}
                {renderInlineField('interestFrom', 'Interest From', 'date')}
                {renderInlineField('reference', 'Reference')}
                {renderInlineField('chargeType', 'Charge Type')}
                {renderCurrencyField('originalAmount', 'Original Amount')}
                {renderInlineField('description', 'Description')}
                {renderPercentageField('interestRate', 'Interest Rate')}
                {renderCurrencyField('unpaidBalance', 'Unpaid Balance')}
                <div className="flex items-center gap-2">
                  <Label className="w-[110px] shrink-0 text-xs font-semibold text-foreground">Notes</Label>
                  <Textarea value={formData.notes} onChange={(e) => handleFieldChange('notes', e.target.value)} className="text-xs min-h-[40px] flex-1" />
                </div>
              </div>
              <div className="flex items-center gap-2 px-1 pt-1.5">
                <Checkbox
                  id="modal-deferred-cb"
                  checked={formData.deferred === 'true'}
                  onCheckedChange={(checked) => handleFieldChange('deferred', checked ? 'true' : 'false')}
                  className="h-3.5 w-3.5"
                />
                <Label htmlFor="modal-deferred-cb" className="text-xs font-semibold text-foreground cursor-pointer">Deferred</Label>
              </div>
            </div>

            {/* Distribution */}
            <div>
              <div className="bg-primary/10 border border-primary/20 rounded px-2 py-1 mb-2">
                <span className="font-semibold text-xs text-primary">Distribution</span>
              </div>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] bg-muted/50 border-b border-border">
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground"></div>
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">ACCOUNT ID</div>
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">NAME</div>
                  <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">AMOUNT</div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] border-b border-border items-center">
                  <div className="px-2 py-1 text-xs font-medium text-foreground">Advanced By</div>
                  <div className="px-1.5 py-1"><Input value={formData.advancedByAccount} onChange={(e) => handleFieldChange('advancedByAccount', e.target.value)} className="h-6 text-xs" /></div>
                  <div className="px-1.5 py-1"><Input value={formData.advancedByLenderName} onChange={(e) => handleFieldChange('advancedByLenderName', e.target.value)} className="h-6 text-xs" /></div>
                  <div className="px-1.5 py-1"><div className="relative"><span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span><Input inputMode="decimal" value={focusedCurrencyField === 'advancedByAmount' ? formData.advancedByAmount : formatCurrencyDisplay(formData.advancedByAmount)} onFocus={() => { setFocusedCurrencyField('advancedByAmount'); handleFieldChange('advancedByAmount', unformatCurrencyDisplay(formData.advancedByAmount)); }} onBlur={() => setFocusedCurrencyField(null)} onChange={(e) => handleFieldChange('advancedByAmount', e.target.value)} onKeyDown={numericKeyDown} onPaste={(e) => numericPaste(e, (v) => handleFieldChange('advancedByAmount', v))} className="h-6 text-xs pl-4" placeholder="0.00" /></div></div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] border-b border-border items-center">
                  <div className="px-2 py-1 text-xs font-medium text-foreground">On Behalf Of</div>
                  <div className="px-1.5 py-1"><Input value={formData.onBehalfOfAccount} onChange={(e) => handleFieldChange('onBehalfOfAccount', e.target.value)} className="h-6 text-xs" /></div>
                  <div className="px-1.5 py-1"><Input value={formData.onBehalfOfLenderName} onChange={(e) => handleFieldChange('onBehalfOfLenderName', e.target.value)} className="h-6 text-xs" /></div>
                  <div className="px-1.5 py-1"><div className="relative"><span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span><Input inputMode="decimal" value={focusedCurrencyField === 'onBehalfOfAmount' ? formData.onBehalfOfAmount : formatCurrencyDisplay(formData.onBehalfOfAmount)} onFocus={() => { setFocusedCurrencyField('onBehalfOfAmount'); handleFieldChange('onBehalfOfAmount', unformatCurrencyDisplay(formData.onBehalfOfAmount)); }} onBlur={() => setFocusedCurrencyField(null)} onChange={(e) => handleFieldChange('onBehalfOfAmount', e.target.value)} onKeyDown={numericKeyDown} onPaste={(e) => numericPaste(e, (v) => handleFieldChange('onBehalfOfAmount', v))} className="h-6 text-xs pl-4" placeholder="0.00" /></div></div>
                </div>
                <div className="grid grid-cols-[120px_1fr_1fr_1fr] items-center">
                  <div className="px-2 py-1 flex items-center gap-1">
                    <button type="button" onClick={() => handleFieldChange('distributeBetweenAllLenders', formData.distributeBetweenAllLenders === 'true' ? 'false' : 'true')} className="aspect-square h-3 w-3 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex items-center justify-center">
                      {formData.distributeBetweenAllLenders === 'true' && <span className="h-1.5 w-1.5 rounded-full bg-current block" />}
                    </button>
                    <Label className="text-[10px] font-medium text-foreground cursor-pointer whitespace-nowrap" onClick={() => handleFieldChange('distributeBetweenAllLenders', formData.distributeBetweenAllLenders === 'true' ? 'false' : 'true')}>Distribute Between All Lenders</Label>
                  </div>
                  <div className="px-2 py-1 text-xs font-medium text-foreground col-span-2 text-right pr-3">Amount Advanced:</div>
                  <div className="px-1.5 py-1"><div className="relative"><span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span><Input inputMode="decimal" value={focusedCurrencyField === 'amountOwedByBorrower' ? formData.amountOwedByBorrower : formatCurrencyDisplay(formData.amountOwedByBorrower)} onFocus={() => { setFocusedCurrencyField('amountOwedByBorrower'); handleFieldChange('amountOwedByBorrower', unformatCurrencyDisplay(formData.amountOwedByBorrower)); }} onBlur={() => setFocusedCurrencyField(null)} onChange={(e) => handleFieldChange('amountOwedByBorrower', e.target.value)} onKeyDown={numericKeyDown} onPaste={(e) => numericPaste(e, (v) => handleFieldChange('amountOwedByBorrower', v))} className="h-6 text-xs pl-4" placeholder="0.00" /></div></div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveClick} disabled={!isFormFilled}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ModalSaveConfirmation open={showConfirm} onConfirm={handleConfirmSave} onCancel={() => setShowConfirm(false)} />
    </>
  );
};

export default ChargesModal;
