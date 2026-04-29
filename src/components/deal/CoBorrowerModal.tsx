import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ModalSaveConfirmation } from './ModalSaveConfirmation';
import { hasModalFormData, hasValidEmails } from '@/lib/modalFormValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { EmailInput } from '@/components/ui/email-input';
import { ZipInput } from '@/components/ui/zip-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CoBorrowerData } from './CoBorrowersTableView';

interface CoBorrowerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coBorrower: CoBorrowerData | null;
  onSave: (coBorrower: CoBorrowerData) => void;
  isEdit?: boolean;
  parentBorrowerVesting?: string;
}

const FORD_DROPDOWN_OPTIONS = [
  { value: 'Spouse, Kids, Grandkids', label: 'Spouse, Kids, Grandkids' },
  { value: 'Big Dream', label: 'Big Dream' },
  { value: 'Sports Teams', label: 'Sports Teams' },
  { value: 'Hobbies / Collections', label: 'Hobbies / Collections' },
  { value: 'Goals / Achievements', label: 'Goals / Achievements' },
  { value: 'Favorite Restaurant, Food, Drinks', label: 'Favorite Restaurant, Food, Drinks' },
  { value: 'Pet(s)', label: 'Pet(s)' },
  { value: 'Vacation Spot', label: 'Vacation Spot' },
  { value: 'Job / Occupation', label: 'Job / Occupation' },
  { value: 'Music / Bands', label: 'Music / Bands' },
  { value: 'College', label: 'College' },
  { value: 'Hometown / Childhood', label: 'Hometown / Childhood' },
  { value: 'TV / Movies / Books', label: 'TV / Movies / Books' },
  { value: 'Anniversary', label: 'Anniversary' },
  { value: 'Challenges / Frustrations', label: 'Challenges / Frustrations' },
  { value: 'Charity / Personal Causes', label: 'Charity / Personal Causes' },
  { value: 'Upcoming Event - What / When', label: 'Upcoming Event - What / When' },
  { value: 'Celebration - What / When', label: 'Celebration - What / When' },
];

const BORROWER_TYPE_OPTIONS = [
  'Individual', 'Joint', 'Family Trust', 'LLC', 'C Corp / S Corp',
  'IRA / ERISA', 'Investment Fund', '401K', 'Foreign Holder W-8', 'Non-profit',
];

const CAPACITY_OPTIONS = [
  'Borrower', 'Co-borrower', 'Trustee', 'Co-Trustee', 'Managing Member', 'Authorized Signer', 'Additional Guarantor',
];

const TAX_ID_TYPE_OPTIONS = ['0 – Unknown', '1 – EIN', '2 – SSN'];

import { STATE_OPTIONS } from '@/lib/usStates';

const emptyCoBorrower: CoBorrowerData = {
  id: '', isPrimary: false, fullName: '', firstName: '', middleName: '', lastName: '', salutation: '', generation: '',
  email: '', homePhone: '', workPhone: '', mobilePhone: '', fax: '',
  preferredHome: false, preferredWork: false, preferredCell: false, preferredFax: false,
  street: '', city: '', state: '', zipCode: '',
  primaryStreet: '', primaryCity: '', primaryState: '', primaryZip: '',
  mailingStreet: '', mailingCity: '', mailingState: '', mailingZip: '', mailingSameAsPrimary: false,
  loanNumber: '', tin: '', relation: '', type: 'Co-Borrower',
  borrowerId: '', borrowerType: '', capacity: '', creditScore: '',
  vesting: '', ford: '', ford1: '', ford2: '', ford3: '', ford4: '', ford5: '', ford6: '', ford7: '', ford8: '',
  issue1098: false, alternateReporting: false,
  deliveryOnline: false, deliveryMail: false,
  dob: '', creditReporting: false, resCode: '', addressIndicator: '',
  sendBorrowerNotifications: false, format: 'HTML',
  deliveryPrint: true, deliveryEmail: false, deliverySms: false,
  parentBorrowerPrefix: '',
  taxIdType: '', tinVerified: false,
  sendPaymentNotification: false, sendLateNotice: false, sendBorrowerStatement: false, sendMaturityNotice: false,
};

export const CoBorrowerModal: React.FC<CoBorrowerModalProps> = ({ open, onOpenChange, coBorrower, onSave, isEdit = false, parentBorrowerVesting = '' }) => {
  const [formData, setFormData] = useState<CoBorrowerData>(emptyCoBorrower);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (coBorrower) {
      setFormData({ ...emptyCoBorrower, ...coBorrower, vesting: parentBorrowerVesting || coBorrower.vesting });
    } else {
      setFormData({ ...emptyCoBorrower, vesting: parentBorrowerVesting });
    }
  }, [coBorrower, open, parentBorrowerVesting]);

  const handleInputChange = (field: keyof CoBorrowerData, value: string | boolean) => setFormData(prev => ({ ...prev, [field]: value }));

  const isFormFilled = hasModalFormData(formData, ['id', 'type', 'parentBorrowerPrefix', 'format'], { isPrimary: false, mailingSameAsPrimary: false, issue1098: false, alternateReporting: false, deliveryOnline: false, deliveryMail: false, preferredHome: false, preferredWork: false, preferredCell: false, preferredFax: false, creditReporting: false, sendBorrowerNotifications: false, deliveryPrint: true, deliveryEmail: false, deliverySms: false, tinVerified: false, sendPaymentNotification: false, sendLateNotice: false, sendBorrowerStatement: false, sendMaturityNotice: false });
  const emailsValid = hasValidEmails(formData as any, ['email']);

  const handleSaveClick = () => setShowConfirm(true);
  const handleConfirmSave = () => { setShowConfirm(false); onSave(formData); };

  const renderInlineField = (field: keyof CoBorrowerData, label: string, props: Record<string, any> = {}) => (
    <div className="flex items-center gap-2">
      <Label className="w-[140px] shrink-0 text-xs">{label}</Label>
      <Input value={String(formData[field] || '')} onChange={(e) => handleInputChange(field, e.target.value)} className="h-7 text-xs flex-1" {...props} />
    </div>
  );

  const renderInlineSelect = (field: keyof CoBorrowerData, label: string, options: string[], placeholder: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[140px] shrink-0 text-xs">{label}</Label>
      <Select value={String(formData[field] || '')} onValueChange={(value) => handleInputChange(field, value)}>
        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{options.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
      </Select>
    </div>
  );

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">{isEdit ? 'Edit Co-Borrower' : 'Add Co-Borrower'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-140px)] pr-4">
          {/* Top section - 4 column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-0 py-2">
            {/* Column 1 - Name + Tax ID */}
            <div className="space-y-1">
              <div className="font-semibold text-xs text-foreground pb-1 mb-1.5">Name</div>
              {renderInlineField('borrowerId', 'Borrower ID')}
              {renderInlineSelect('borrowerType', 'Borrower Type', BORROWER_TYPE_OPTIONS, 'Select')}
              <div className="flex items-center gap-2">
                <div className="w-[140px] shrink-0">
                  <Label className="text-xs">Full Name</Label>
                  <div className="text-[10px] text-muted-foreground leading-tight">If Entity, Use Entity</div>
                </div>
                <Input value={String(formData.fullName || '')} onChange={(e) => handleInputChange('fullName', e.target.value)} className="h-7 text-xs flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-[140px] shrink-0">
                  <Label className="text-xs">First</Label>
                  <div className="text-[10px] text-muted-foreground leading-tight">If Entity, Use Signer</div>
                </div>
                <Input value={String(formData.firstName || '')} onChange={(e) => handleInputChange('firstName', e.target.value)} className="h-7 text-xs flex-1" />
              </div>
              {renderInlineField('middleName', 'Middle')}
              {renderInlineField('lastName', 'Last')}
              {renderInlineSelect('capacity', 'Capacity', CAPACITY_OPTIONS, 'Select')}
              <div className="flex items-center gap-2">
                <Label className="w-[140px] shrink-0 text-xs">Email</Label>
                <EmailInput value={String(formData.email || '')} onValueChange={(v) => handleInputChange('email', v)} className="h-7 text-xs" />
              </div>
              <div className="h-1" />
              {renderInlineField('creditScore', 'Credit Score')}
              {renderInlineSelect('taxIdType', 'Tax ID Type', TAX_ID_TYPE_OPTIONS, 'Select')}
              {renderInlineField('tin', 'TIN')}
              <div className="flex items-center gap-2 h-7">
                <Checkbox id="modal-coborrower-tinVerified" checked={!!formData.tinVerified} onCheckedChange={(checked) => handleInputChange('tinVerified', !!checked)} className="h-3 w-3" />
                <Label htmlFor="modal-coborrower-tinVerified" className="font-normal text-xs">TIN Verified</Label>
              </div>
            </div>

            {/* Column 2 - Primary & Mailing Address */}
            <div className="space-y-1">
              <div className="font-semibold text-xs text-foreground pb-1 mb-1.5">Primary Address</div>
              {renderInlineField('primaryStreet', 'Street')}
              {renderInlineField('primaryCity', 'City')}
              {renderInlineSelect('primaryState', 'State', STATE_OPTIONS, 'State')}
              <div className="flex items-center gap-2">
                <Label className="w-[140px] shrink-0 text-xs">ZIP</Label>
                <ZipInput value={String(formData.primaryZip || '')} onValueChange={(v) => handleInputChange('primaryZip', v)} className="h-7 text-xs" />
              </div>

              <div className="font-semibold text-xs text-foreground pb-1 mt-2 mb-1.5 flex items-center gap-2">
                Mailing Address
                <div className="flex items-center gap-1.5 ml-auto">
                  <Checkbox id="modal-mailingSame" checked={formData.mailingSameAsPrimary} onCheckedChange={(checked) => {
                    const isChecked = !!checked;
                    setFormData(prev => ({
                      ...prev,
                      mailingSameAsPrimary: isChecked,
                      mailingStreet: isChecked ? (prev.primaryStreet || '') : '',
                      mailingCity: isChecked ? (prev.primaryCity || '') : '',
                      mailingState: isChecked ? (prev.primaryState || '') : '',
                      mailingZip: isChecked ? (prev.primaryZip || '') : '',
                    }));
                  }} className="h-3 w-3" />
                  <Label htmlFor="modal-mailingSame" className="font-normal text-[10px]">Same as Primary</Label>
                </div>
              </div>
              {renderInlineField('mailingStreet', 'Street', { disabled: formData.mailingSameAsPrimary })}
              {renderInlineField('mailingCity', 'City', { disabled: formData.mailingSameAsPrimary })}
              {renderInlineSelect('mailingState', 'State', STATE_OPTIONS, 'State')}
              <div className="flex items-center gap-2">
                <Label className="w-[140px] shrink-0 text-xs">ZIP</Label>
                <ZipInput value={String(formData.mailingZip || '')} onValueChange={(v) => handleInputChange('mailingZip', v)} disabled={formData.mailingSameAsPrimary} className="h-7 text-xs" />
              </div>

              {/* Delivery Options & Send */}
              <div className="pt-2 space-y-2">
                <div>
                  <div className="font-semibold text-xs text-foreground pb-1">Delivery Options</div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Checkbox id="modal-coborrower-deliveryPrint" checked={!!formData.deliveryPrint} onCheckedChange={(checked) => handleInputChange('deliveryPrint', !!checked)} className="h-3 w-3" />
                      <Label htmlFor="modal-coborrower-deliveryPrint" className="font-normal text-xs">Print</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox id="modal-coborrower-deliveryEmail" checked={!!formData.deliveryEmail} onCheckedChange={(checked) => handleInputChange('deliveryEmail', !!checked)} className="h-3 w-3" />
                      <Label htmlFor="modal-coborrower-deliveryEmail" className="font-normal text-xs">Email</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox id="modal-coborrower-deliverySms" checked={!!formData.deliverySms} onCheckedChange={(checked) => handleInputChange('deliverySms', !!checked)} className="h-3 w-3" />
                      <Label htmlFor="modal-coborrower-deliverySms" className="font-normal text-xs">SMS</Label>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-xs text-foreground pb-1">Send</div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Checkbox id="modal-coborrower-sendPayment" checked={!!formData.sendPaymentNotification} onCheckedChange={(checked) => handleInputChange('sendPaymentNotification', !!checked)} className="h-3 w-3" />
                      <Label htmlFor="modal-coborrower-sendPayment" className="font-normal text-xs">Payment Notification</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox id="modal-coborrower-sendLate" checked={!!formData.sendLateNotice} onCheckedChange={(checked) => handleInputChange('sendLateNotice', !!checked)} className="h-3 w-3" />
                      <Label htmlFor="modal-coborrower-sendLate" className="font-normal text-xs">Late Notice</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox id="modal-coborrower-sendStatement" checked={!!formData.sendBorrowerStatement} onCheckedChange={(checked) => handleInputChange('sendBorrowerStatement', !!checked)} className="h-3 w-3" />
                      <Label htmlFor="modal-coborrower-sendStatement" className="font-normal text-xs">Borrower Statement</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox id="modal-coborrower-sendMaturity" checked={!!formData.sendMaturityNotice} onCheckedChange={(checked) => handleInputChange('sendMaturityNotice', !!checked)} className="h-3 w-3" />
                      <Label htmlFor="modal-coborrower-sendMaturity" className="font-normal text-xs">Maturity Notice</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3 - Phone + Preferred */}
            <div className="space-y-1">
              <div className="font-semibold text-xs text-foreground pb-1 mb-1.5">Phone</div>
              {(['homePhone', 'workPhone', 'mobilePhone', 'fax'] as const).map((phoneKey, idx) => {
                const prefKey = (['preferredHome', 'preferredWork', 'preferredCell', 'preferredFax'] as const)[idx];
                const phoneLabel = ['Home', 'Work', 'Cell', 'Fax'][idx];
                return (
                  <div key={phoneKey} className="flex items-center gap-2">
                    <Label className="w-[50px] shrink-0 text-xs">{phoneLabel}</Label>
                    <PhoneInput value={String(formData[phoneKey] || '')} onValueChange={(val) => handleInputChange(phoneKey, val)} className="h-7 text-xs flex-1" />
                    <Checkbox id={`modal-${prefKey}`} checked={!!formData[prefKey]} onCheckedChange={(checked) => handleInputChange(prefKey, !!checked)} className="h-3 w-3 shrink-0" />
                  </div>
                );
              })}
            </div>

            {/* Column 4 - Vesting & FORD */}
            <div className="space-y-1">
              <div className="font-semibold text-xs text-foreground pb-1 mb-1.5">Vesting</div>
              <Textarea value={String(formData.vesting || '')} disabled={true} className="text-xs w-full min-h-[80px] resize-none bg-muted/50 cursor-not-allowed" />

              <div className="font-semibold text-xs text-foreground pb-1 mt-2 mb-1.5">FORD</div>
              <div className="space-y-1">
                {([['ford1', 'ford2'], ['ford3', 'ford4'], ['ford5', 'ford6'], ['ford7', 'ford8']] as [string, string][]).map(([dropdownKey, inputKey], idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-1">
                    <Select value={String(formData[dropdownKey as keyof CoBorrowerData] || '')} onValueChange={(v) => handleInputChange(dropdownKey as keyof CoBorrowerData, v)}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{FORD_DROPDOWN_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input value={String(formData[inputKey as keyof CoBorrowerData] || '')} onChange={(e) => handleInputChange(inputKey as keyof CoBorrowerData, e.target.value)} className="h-7 text-xs" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom section - Reporting */}
          <div className="mt-2 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 h-7">
                  <Checkbox id="modal-issue1098" checked={formData.issue1098} onCheckedChange={(checked) => handleInputChange('issue1098', !!checked)} className="h-3 w-3" />
                  <Label htmlFor="modal-issue1098" className="font-normal text-xs">Issue 1098</Label>
                </div>
                <div className="flex items-center gap-2 h-7">
                  <Checkbox id="modal-altReporting" checked={formData.alternateReporting} onCheckedChange={(checked) => handleInputChange('alternateReporting', !!checked)} className="h-3 w-3" />
                  <Label htmlFor="modal-altReporting" className="font-normal text-xs">Alternate Reporting</Label>
                </div>
              </div>

              <div />
              <div />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSaveClick} disabled={!isFormFilled || !emailsValid}>{isEdit ? 'Save Changes' : 'Add Co-Borrower'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <ModalSaveConfirmation open={showConfirm} onConfirm={handleConfirmSave} onCancel={() => setShowConfirm(false)} />
    </>
  );
};

export default CoBorrowerModal;
