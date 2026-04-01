import React, { useState, useEffect } from 'react';
import { Shield, CalendarIcon } from 'lucide-react';
import { numericKeyDown, numericPaste, formatCurrencyDisplay, unformatCurrencyDisplay } from '@/lib/numericInputFilter';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmailInput } from '@/components/ui/email-input';
import { ZipInput } from '@/components/ui/zip-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { ModalSaveConfirmation } from './ModalSaveConfirmation';
import { hasModalFormData, hasValidEmails } from '@/lib/modalFormValidation';
import { US_STATES } from '@/lib/usStates';
import type { InsuranceData } from './InsuranceTableView';

interface InsuranceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insurance: InsuranceData | null;
  onSave: (insurance: InsuranceData) => void;
  isEdit: boolean;
  propertyOptions?: { id: string; label: string }[];
}

const INSURANCE_DESCRIPTION_OPTIONS = [
  'Earthquake Insurance', 'Fire Insurance', 'Flood Insurance', 'Hurricane',
  'Force-Placed CPI', 'Hazard', 'Flood', 'Wind'
];

const TRACKING_STATUS_OPTIONS = [
  'Unable to Verify', 'Current - Active', 'Pending Cancellation',
  'Cancelled - Payment', 'Cancelled - Other', 'Force Placed Coverage',
];

const getDefaultInsurance = (): InsuranceData => ({
  id: '', property: '', description: '', insuredName: '', companyName: '', policyNumber: '',
  expiration: '', coverage: '', active: true, agentName: '', businessAddress: '',
  businessAddressCity: '', businessAddressState: '', businessAddressZip: '',
  phoneNumber: '', faxNumber: '', email: '', note: '',
  paymentMailingStreet: '', paymentMailingCity: '', paymentMailingState: '', paymentMailingZip: '',
  insuranceTracking: false, lastVerified: '', trackingStatus: '',
});

export const InsuranceModal: React.FC<InsuranceModalProps> = ({ open, onOpenChange, insurance, onSave, isEdit, propertyOptions = [] }) => {
  const [formData, setFormData] = useState<InsuranceData>(getDefaultInsurance());
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
      const data = insurance ? { ...insurance } : getDefaultInsurance();
      // Format coverage for display
      if (data.coverage) {
        data.coverage = formatCurrencyDisplay(String(data.coverage));
      }
      setFormData(data);
    }
  }, [open, insurance]);

  const handleChange = (field: keyof InsuranceData, value: string | boolean) => setFormData(prev => ({ ...prev, [field]: value }));

  const isFormFilled = hasModalFormData(formData, ['id', 'active']);
  const emailsValid = hasValidEmails(formData as any, ['email']);

  const handleSaveClick = () => setShowConfirm(true);
  const handleConfirmSave = () => {
    setShowConfirm(false);
    const cleaned = { ...formData };
    if (cleaned.coverage) {
      cleaned.coverage = unformatCurrencyDisplay(String(cleaned.coverage));
    }
    onSave(cleaned);
    onOpenChange(false);
  };

  const renderInlineField = (field: keyof InsuranceData, label: string, props: Record<string, any> = {}) => {
    if (props.type === 'date') {
      const val = String(formData[field] || '');
      return (
        <div className="flex items-center gap-2">
          <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
          <Popover open={datePickerStates[field] || false} onOpenChange={(open) => setDatePickerStates(prev => ({ ...prev, [field]: open }))}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-7 text-xs flex-1 justify-start text-left font-normal', !val && 'text-muted-foreground')}>
                {val && safeParseDateStr(val) ? format(safeParseDateStr(val)!, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
                <CalendarIcon className="ml-auto h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999]" align="start">
              <EnhancedCalendar mode="single" selected={safeParseDateStr(val)} onSelect={(date) => { if (date) handleChange(field, format(date, 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [field]: false })); }} onClear={() => { handleChange(field, ''); setDatePickerStates(prev => ({ ...prev, [field]: false })); }} onToday={() => { handleChange(field, format(new Date(), 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [field]: false })); }} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
        <Input value={String(formData[field] || '')} onChange={(e) => handleChange(field, e.target.value)} className="h-7 text-xs flex-1" {...props} />
      </div>
    );
  };

  const renderInlineSelect = (field: keyof InsuranceData, label: string, options: string[] | { id: string; label: string }[], placeholder: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
      <Select value={String(formData[field] || '') || undefined} onValueChange={(val) => handleChange(field, val === '__none__' ? '' : val)}>
        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent className="bg-background border border-border !z-[9999]" position="popper" sideOffset={4}>
          {options.map(opt => {
            const v = typeof opt === 'string' ? opt : opt.id;
            const l = typeof opt === 'string' ? opt : opt.label;
            return <SelectItem key={v} value={v}>{l}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" />
              {isEdit ? 'Edit Insurance' : 'New Insurance'}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-3 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
              <div className="space-y-1.5">
                <div className="border-b border-border pb-1 mb-2">
                  <span className="font-semibold text-xs text-primary">Insurance Policy Information</span>
                </div>
                {renderInlineSelect('property', 'Property', [{ id: 'unassigned', label: 'Unassigned' }, ...propertyOptions], 'Unassigned')}
                {renderInlineSelect('description', 'Description', INSURANCE_DESCRIPTION_OPTIONS, 'Select')}
                {renderInlineField('insuredName', "Insured's Name")}
                {renderInlineField('companyName', 'Ins. Company')}
                {renderInlineField('policyNumber', 'Policy Number')}
                {renderInlineField('expiration', 'Expiration', { type: 'date' })}
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs text-foreground">Coverage</Label>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
                    <Input value={String(formData.coverage || '')} onChange={(e) => handleChange('coverage', e.target.value)} className="h-7 text-xs text-right pl-5" inputMode="decimal" placeholder="0.00" />
                  </div>
                </div>

                <div className="border-b border-border pb-1 mb-2 pt-2">
                  <span className="font-semibold text-xs text-primary">Payment Mailing Address</span>
                </div>
                {renderInlineField('paymentMailingStreet', 'Street')}
                {renderInlineField('paymentMailingCity', 'City')}
                {renderInlineSelect('paymentMailingState', 'State', US_STATES, 'Select state')}
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs text-foreground">ZIP</Label>
                  <ZipInput value={String(formData.paymentMailingZip || '')} onValueChange={(v) => handleChange('paymentMailingZip', v)} className="h-7 text-xs" />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Checkbox id="modal-insurance-active" checked={formData.active} onCheckedChange={(checked) => handleChange('active', !!checked)} className="h-3.5 w-3.5" />
                  <Label htmlFor="modal-insurance-active" className="text-xs text-foreground">Active</Label>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="border-b border-border pb-1 mb-2">
                  <span className="font-semibold text-xs text-primary">Insurance Agent Information</span>
                </div>
                {renderInlineField('agentName', "Agent's Name")}
                {renderInlineField('businessAddress', 'Bus. Address')}
                {renderInlineField('businessAddressCity', 'City')}
                {renderInlineSelect('businessAddressState', 'State', US_STATES, 'Select state')}
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs text-foreground">ZIP</Label>
                  <ZipInput value={String(formData.businessAddressZip || '')} onValueChange={(v) => handleChange('businessAddressZip', v)} className="h-7 text-xs" />
                </div>
                {renderInlineField('phoneNumber', 'Phone Number')}
                {renderInlineField('faxNumber', 'Fax Number')}
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs text-foreground">E-mail</Label>
                  <EmailInput value={String(formData.email || '')} onValueChange={(v) => handleChange('email', v)} className="h-7 text-xs" />
                </div>

                <div className="border-b border-border pb-1 mb-2 pt-2">
                  <span className="font-semibold text-xs text-primary">Insurance Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="modal-insurance-tracking" checked={formData.insuranceTracking} onCheckedChange={(checked) => handleChange('insuranceTracking', !!checked)} className="h-3.5 w-3.5" />
                  <Label htmlFor="modal-insurance-tracking" className="text-xs text-foreground">Insurance Tracking</Label>
                </div>
                {formData.insuranceTracking && (
                  <>
                    {renderInlineField('lastVerified', 'Last Verified', { type: 'date' })}
                    {renderInlineSelect('trackingStatus', 'Status', TRACKING_STATUS_OPTIONS, 'Select status')}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border shrink-0">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveClick} disabled={!isFormFilled || !emailsValid}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ModalSaveConfirmation open={showConfirm} onConfirm={handleConfirmSave} onCancel={() => setShowConfirm(false)} />
    </>
  );
};

export default InsuranceModal;
