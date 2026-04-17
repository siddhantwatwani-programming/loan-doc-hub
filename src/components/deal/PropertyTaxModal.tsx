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
import { ZipInput } from '@/components/ui/zip-input';
import { STATE_OPTIONS } from '@/lib/usStates';
import type { PropertyTaxData } from './PropertyTaxTableView';

interface PropertyTaxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyTax: PropertyTaxData | null;
  onSave: (data: PropertyTaxData) => void;
  isEdit: boolean;
  propertyOptions?: string[];
}

const TYPE_OPTIONS = ['Current Property Tax', 'Delinquent Property Tax', 'Other'];
const FREQUENCY_OPTIONS = ['Once Only', 'Monthly', 'Quarterly', 'Bi-Monthly', 'Bi-Weekly', 'Weekly', 'Semi-Monthly', 'Semi-Yearly', 'Yearly'];
const SOURCE_OPTIONS = ['Borrower', 'Title Report', 'Tax Records'];

const getDefaultTax = (): PropertyTaxData => ({
  id: '', property: '', authority: '', address: '', type: '', apn: '', memo: '',
  annualPayment: '', amount: '', nextDue: '', frequency: '',
  escrowImpounds: '', passThrough: '', sourceOfInformation: '',
  active: false, lastVerified: '', lenderNotified: '',
  current: false, delinquent: false, delinquentAmount: '',
  borrowerNotified: false, borrowerNotifiedDate: '', lenderNotifiedDate: '',
  pmaStreet: '', pmaCity: '', pmaState: '', pmaZip: '',
});

export const PropertyTaxModal: React.FC<PropertyTaxModalProps> = ({
  open, onOpenChange, propertyTax, onSave, isEdit, propertyOptions = [],
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
      if (data.amount) data.amount = formatCurrencyDisplay(String(data.amount));
      setFormData(data);
    }
  }, [open, propertyTax]);

  const handleChange = (field: keyof PropertyTaxData, value: string | boolean) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const isFormFilled = hasModalFormData(formData, ['id', 'active', 'current', 'delinquent', 'borrowerNotified']);

  const handleSaveClick = () => setShowConfirm(true);
  const handleConfirmSave = () => {
    setShowConfirm(false);
    const cleaned = { ...formData };
    if (cleaned.annualPayment) cleaned.annualPayment = unformatCurrencyDisplay(String(cleaned.annualPayment));
    if (cleaned.delinquentAmount) cleaned.delinquentAmount = unformatCurrencyDisplay(String(cleaned.delinquentAmount));
    if (cleaned.amount) cleaned.amount = unformatCurrencyDisplay(String(cleaned.amount));
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
              {val && safeParseDateStr(val) ? format(safeParseDateStr(val)!, 'MM/dd/yyyy') : 'MM/DD/YYYY'}
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

  const renderDropdownField = (field: keyof PropertyTaxData, label: string, options: string[]) => (
    <div className="flex items-center gap-2">
      <Label className="w-[120px] shrink-0 text-xs text-foreground">{label}</Label>
      <Select value={String(formData[field] || '')} onValueChange={(v) => handleChange(field, v)}>
        <SelectTrigger className="h-7 text-xs flex-1 bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent className="bg-background z-[9999]">
          {options.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] z-[9999] flex flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-2 border-b border-border">
            <DialogTitle>{isEdit ? 'Edit Property Tax' : 'Add Property Tax'}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-6 grid grid-cols-2 gap-x-6 gap-y-3 py-4">
            {/* Left column */}
            <div className="space-y-3">
              {propertyOptions.length > 0 && renderDropdownField('property', 'Property', propertyOptions)}

              <div className="flex items-center gap-2">
                <Label className="w-[120px] shrink-0 text-xs text-foreground">Tax Authority</Label>
                <Input value={formData.authority} onChange={(e) => handleChange('authority', e.target.value)} className="h-7 text-xs flex-1" />
              </div>

              {renderDropdownField('type', 'Type', TYPE_OPTIONS)}

              {renderCurrencyField('annualPayment', 'Annual Payment (est.)')}
              {renderCurrencyField('amount', 'Amount')}
              {renderDateField('nextDue', 'Next Due')}

              {renderDropdownField('frequency', 'Frequency', FREQUENCY_OPTIONS)}

              {renderDropdownField('escrowImpounds', 'Escrow Impounds', SOURCE_OPTIONS)}
              {renderDropdownField('passThrough', 'Pass Through', SOURCE_OPTIONS)}
              {renderDropdownField('sourceOfInformation', 'Source of Information', SOURCE_OPTIONS)}
            </div>

            {/* Right column */}
            <div className="space-y-3">
              {/* Payment Mailing Address */}
              <div className="border-b border-border pb-1 mb-2">
                <span className="font-semibold text-xs text-foreground">Payment Mailing Address</span>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-[120px] shrink-0 text-xs text-foreground">Street</Label>
                <Input value={formData.pmaStreet} onChange={(e) => handleChange('pmaStreet', e.target.value)} className="h-7 text-xs flex-1" />
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-[120px] shrink-0 text-xs text-foreground">City</Label>
                <Input value={formData.pmaCity} onChange={(e) => handleChange('pmaCity', e.target.value)} className="h-7 text-xs flex-1" />
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-[120px] shrink-0 text-xs text-foreground">State</Label>
                <Select value={formData.pmaState} onValueChange={(v) => handleChange('pmaState', v)}>
                  <SelectTrigger className="h-7 text-xs flex-1 bg-background"><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent className="bg-background z-[9999] max-h-[200px]">
                    {STATE_OPTIONS.map((st) => (<SelectItem key={st} value={st}>{st}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="w-[120px] shrink-0 text-xs text-foreground">ZIP</Label>
                <ZipInput
                  value={formData.pmaZip}
                  onValueChange={(v) => handleChange('pmaZip', v)}
                  className="h-7 text-xs"
                />
              </div>

              {/* Tax Tracking */}
              <div className="border-b border-border pb-1 mb-2 mt-2">
                <span className="font-semibold text-xs text-foreground">Tax Tracking</span>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.active}
                  onCheckedChange={(checked) => handleChange('active', checked === true)}
                />
                <Label className="text-xs text-foreground">Active</Label>
              </div>

              {renderDateField('lastVerified', 'Last Verified')}
              {renderDateField('lenderNotified', 'Lender Notified')}

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.current}
                  onCheckedChange={(checked) => handleChange('current', checked === true)}
                />
                <Label className="text-xs text-foreground">Current</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.delinquent}
                  onCheckedChange={(checked) => handleChange('delinquent', checked === true)}
                />
                <Label className="text-xs text-foreground">Delinquent</Label>
              </div>

              {formData.delinquent && (
                renderCurrencyField('delinquentAmount', 'Delinquent Amt')
              )}

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.borrowerNotified}
                  onCheckedChange={(checked) => handleChange('borrowerNotified', checked === true)}
                />
                <Label className="text-xs text-foreground">Borrower Notified</Label>
              </div>

              {formData.borrowerNotified && (
                renderDateField('borrowerNotifiedDate', 'Borrower Notified')
              )}

              {renderDateField('lenderNotifiedDate', 'Lender Notified')}

              <div className="flex items-center gap-2">
                <Label className="w-[120px] shrink-0 text-xs text-foreground">APN</Label>
                <Input value={formData.apn} onChange={(e) => handleChange('apn', e.target.value)} className="h-7 text-xs flex-1" />
              </div>

              <div className="flex items-start gap-2">
                <Label className="w-[120px] shrink-0 text-xs text-foreground pt-1">Memo</Label>
                <Textarea value={formData.memo} onChange={(e) => handleChange('memo', e.target.value)} className="text-xs flex-1 min-h-[50px]" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-3 border-t border-border shrink-0">
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
