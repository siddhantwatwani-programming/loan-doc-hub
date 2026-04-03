import React, { useState, useEffect } from 'react';
import { CalendarIcon } from 'lucide-react';
import { numericKeyDown, numericPaste, formatCurrencyDisplay, unformatCurrencyDisplay } from '@/lib/numericInputFilter';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { ModalSaveConfirmation } from './ModalSaveConfirmation';
import { hasModalFormData } from '@/lib/modalFormValidation';
import type { PropertyTaxData } from './PropertyTaxTableView';

interface PropertyTaxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyTax: PropertyTaxData | null;
  onSave: (data: PropertyTaxData) => void;
  isEdit: boolean;
}

const TYPE_OPTIONS = ['Current Property Tax', 'Delinquent Property Tax', 'Other'];
const FREQUENCY_OPTIONS = ['Once Only', 'Monthly', 'Quarterly', 'Bi-Monthly', 'Bi-Weekly', 'Weekly', 'Semi-Monthly', 'Semi-Yearly', 'Yearly'];
const TRACKING_STATUS_OPTIONS = ['Current', 'Delinquent'];

const getDefaultTax = (): PropertyTaxData => ({
  id: '', payee: '', authority: '', payeeAddress: '', type: '', memo: '',
  nextDueDate: '', frequency: '', annualPayment: '', taxTracking: false,
  lastVerified: '', lenderNotified: '', trackingStatus: '', delinquentAmount: '',
});

export const PropertyTaxModal: React.FC<PropertyTaxModalProps> = ({
  open, onOpenChange, propertyTax, onSave, isEdit,
}) => {
  const [formData, setFormData] = useState<PropertyTaxData>(getDefaultTax());
  const [showConfirm, setShowConfirm] = useState(false);
  const [datePickerStates, setDatePickerStates] = useState<Record<string, boolean>>({});

  const safeParseDateStr = (val: string): Date | undefined => {
    if (!val) return undefined;
    try {
      const d = parse(val, 'yyyy-MM-dd', new Date());
      return isValid(d) ? d : undefined;
    } catch { return undefined; }
  };

  useEffect(() => {
    if (open) {
      const data = propertyTax ? { ...propertyTax } : getDefaultTax();
      if (data.annualPayment) data.annualPayment = formatCurrencyDisplay(String(data.annualPayment));
      if (data.delinquentAmount) data.delinquentAmount = formatCurrencyDisplay(String(data.delinquentAmount));
      setFormData(data);
    }
  }, [open, propertyTax]);

  const handleChange = (field: keyof PropertyTaxData, value: string | boolean) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const isFormFilled = hasModalFormData(formData, ['id', 'taxTracking']);

  const handleSaveClick = () => setShowConfirm(true);
  const handleConfirmSave = () => {
    setShowConfirm(false);
    const cleaned = { ...formData };
    if (cleaned.annualPayment) cleaned.annualPayment = unformatCurrencyDisplay(String(cleaned.annualPayment));
    if (cleaned.delinquentAmount) cleaned.delinquentAmount = unformatCurrencyDisplay(String(cleaned.delinquentAmount));
    onSave(cleaned);
    onOpenChange(false);
  };

  const renderDateField = (field: keyof PropertyTaxData, label: string) => {
    const val = String(formData[field] || '');
    return (
      <div className="flex items-center gap-2">
        <Label className="w-[120px] shrink-0 text-xs text-foreground">{label}</Label>
        <Popover open={datePickerStates[field] || false} onOpenChange={(o) => setDatePickerStates(prev => ({ ...prev, [field]: o }))}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn('h-7 text-xs flex-1 justify-start text-left font-normal', !val && 'text-muted-foreground')}>
              {val && safeParseDateStr(val) ? format(safeParseDateStr(val)!, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
              <CalendarIcon className="ml-auto h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-[9999]" align="start">
            <EnhancedCalendar
              mode="single"
              selected={safeParseDateStr(val)}
              onSelect={(date) => { if (date) handleChange(field, format(date, 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [field]: false })); }}
              onClear={() => { handleChange(field, ''); setDatePickerStates(prev => ({ ...prev, [field]: false })); }}
              onToday={() => { handleChange(field, format(new Date(), 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [field]: false })); }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const renderCurrencyField = (field: keyof PropertyTaxData, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[120px] shrink-0 text-xs text-foreground">{label}</Label>
      <div className="relative flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <Input
          value={String(formData[field] || '')}
          onChange={(e) => handleChange(field, e.target.value)}
          onKeyDown={numericKeyDown}
          onPaste={(e) => numericPaste(e, (v) => handleChange(field, v))}
          onFocus={(e) => { const v = unformatCurrencyDisplay(e.target.value); handleChange(field, v); }}
          onBlur={(e) => { const v = formatCurrencyDisplay(e.target.value); handleChange(field, v); }}
          className="h-7 text-xs pl-5"
        />
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto z-[9999]">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Property Tax' : 'Add Property Tax'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 py-4">
            {/* Left column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="w-[120px] shrink-0 text-xs text-foreground">Tax Authority</Label>
                <Input value={formData.authority} onChange={(e) => handleChange('authority', e.target.value)} className="h-7 text-xs flex-1" />
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-[120px] shrink-0 text-xs text-foreground">Type</Label>
                <Select value={formData.type} onValueChange={(v) => handleChange('type', v)}>
                  <SelectTrigger className="h-7 text-xs flex-1 bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-background z-[9999]">
                    {TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-[120px] shrink-0 text-xs text-foreground">Property</Label>
                <Input value={formData.payee} onChange={(e) => handleChange('payee', e.target.value)} className="h-7 text-xs flex-1" />
              </div>

              <div className="flex items-start gap-2">
                <Label className="w-[120px] shrink-0 text-xs text-foreground mt-1.5">Address</Label>
                <Textarea value={formData.payeeAddress} onChange={(e) => handleChange('payeeAddress', e.target.value)} className="text-xs min-h-[60px] resize-none flex-1" />
              </div>

              {renderCurrencyField('annualPayment', 'Annual Payment')}

              <div className="flex items-center gap-2">
                <Label className="w-[120px] shrink-0 text-xs text-foreground">Frequency</Label>
                <Select value={formData.frequency} onValueChange={(v) => handleChange('frequency', v)}>
                  <SelectTrigger className="h-7 text-xs flex-1 bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-background z-[9999]">
                    {FREQUENCY_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start gap-2">
                <Label className="w-[120px] shrink-0 text-xs text-foreground mt-1.5">Memo</Label>
                <Textarea value={formData.memo} onChange={(e) => handleChange('memo', e.target.value)} className="text-xs min-h-[60px] resize-none flex-1" />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-3">
              {renderDateField('nextDueDate', 'Next Due')}

              <div className="border-b border-border my-2" />

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.taxTracking}
                  onCheckedChange={(checked) => handleChange('taxTracking', checked === true)}
                />
                <Label className="text-xs text-foreground">Tax Tracking</Label>
              </div>

              {formData.taxTracking && (
                <>
                  {renderDateField('lastVerified', 'Last Verified')}
                  {renderDateField('lenderNotified', 'Lender Notified')}

                  <div className="flex items-center gap-2">
                    <Label className="w-[120px] shrink-0 text-xs text-foreground">Status</Label>
                    <Select value={formData.trackingStatus} onValueChange={(v) => handleChange('trackingStatus', v)}>
                      <SelectTrigger className="h-7 text-xs flex-1 bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-background z-[9999]">
                        {TRACKING_STATUS_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.trackingStatus === 'Delinquent' && (
                    renderCurrencyField('delinquentAmount', 'Delinquent Amt')
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveClick} disabled={!isFormFilled}>
              {isEdit ? 'Update' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ModalSaveConfirmation
        open={showConfirm}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

export default PropertyTaxModal;
