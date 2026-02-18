import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { BorrowerData } from './BorrowersTableView';

interface BorrowerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  borrower?: BorrowerData | null;
  onSave: (borrower: BorrowerData) => void;
  isEdit?: boolean;
}

const BORROWER_TYPE_OPTIONS = [
  'Individual', 'Joint', 'Family Trust', 'LLC', 'C Corp / S Corp',
  'IRA / ERISA', 'Investment Fund', '401K', 'Foreign Holder W-8', 'Non-profit',
];

const CAPACITY_OPTIONS = [
  'Borrower', 'Co-Borrower', 'Additional Guarantor', 'Authorized Party',
];



const STATE_OPTIONS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const generateBorrowerId = () => `borrower_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getEmptyBorrower = (): BorrowerData => ({
  id: generateBorrowerId(), isPrimary: false, borrowerType: '', fullName: '',
  firstName: '', middleName: '', lastName: '', email: '', phone: '',
  street: '', city: '', state: '', zipCode: '',
  creditScore: '', capacity: '',
  homePhone: '', workPhone: '', mobilePhone: '', fax: '',
  preferredHome: false, preferredWork: false, preferredCell: false, preferredFax: false,
  primaryStreet: '', primaryCity: '', primaryState: '', primaryZip: '',
  mailingStreet: '', mailingCity: '', mailingState: '', mailingZip: '', mailingSameAsPrimary: false,
  vesting: '', ford1: '', ford2: '', ford3: '', ford4: '', ford5: '', ford6: '', ford7: '', ford8: '',
  issue1098: false, alternateReporting: false,
  deliveryOnline: false, deliveryMail: false,
  borrowerId: '',
});

export const BorrowerModal: React.FC<BorrowerModalProps> = ({
  open, onOpenChange, borrower, onSave, isEdit = false,
}) => {
  const [formData, setFormData] = useState<BorrowerData>(getEmptyBorrower());

  useEffect(() => {
    if (open) {
      setFormData(borrower ? { ...getEmptyBorrower(), ...borrower } : getEmptyBorrower());
    }
  }, [open, borrower]);

  const handleFieldChange = (field: keyof BorrowerData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const primaryPhone = formData.mobilePhone || formData.homePhone || formData.workPhone || formData.phone || '';
    onSave({ ...formData, phone: primaryPhone });
    onOpenChange(false);
  };

  const renderInlineField = (field: keyof BorrowerData, label: string, props: Record<string, any> = {}) => (
    <div className="flex items-center gap-2">
      <Label className="w-[140px] shrink-0 text-xs">{label}</Label>
      <Input value={String(formData[field] || '')} onChange={(e) => handleFieldChange(field, e.target.value)} className="h-7 text-xs flex-1" {...props} />
    </div>
  );

  const renderInlineSelect = (field: keyof BorrowerData, label: string, options: string[], placeholder: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[140px] shrink-0 text-xs">{label}</Label>
      <Select value={String(formData[field] || '')} onValueChange={(value) => handleFieldChange(field, value)}>
        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{options.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-primary" />
            {isEdit ? 'Edit Borrower' : 'Add New Borrower'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] pr-4">
          {/* Top section - 4 column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-0 py-2">
            {/* Column 1 - Name */}
            <div className="space-y-1">
              <div className="font-semibold text-xs text-foreground pb-1 mb-1.5">Name</div>
              {renderInlineField('borrowerId', 'Borrower ID')}
              {renderInlineSelect('borrowerType', 'Borrower Type', BORROWER_TYPE_OPTIONS, 'Select')}
              {renderInlineSelect('capacity', 'Capacity', CAPACITY_OPTIONS, 'Select')}
              {renderInlineField('fullName', 'Full Name: If Entity, Use Entity')}
              {renderInlineField('firstName', 'First: If Entity, Use Signer')}
              {renderInlineField('middleName', 'Middle')}
              {renderInlineField('lastName', 'Last')}
              {renderInlineField('email', 'Email', { type: 'email' })}
              <div className="h-1" />
              {renderInlineField('creditScore', 'Credit Score')}
            </div>

            {/* Column 2 - Primary & Mailing Address */}
            <div className="space-y-1">
              <div className="font-semibold text-xs text-foreground pb-1 mb-1.5">Primary Address</div>
              {renderInlineField('primaryStreet', 'Street')}
              {renderInlineField('primaryCity', 'City')}
              {renderInlineSelect('primaryState', 'State', STATE_OPTIONS, 'State')}
              {renderInlineField('primaryZip', 'ZIP')}

              <div className="font-semibold text-xs text-foreground pb-1 mt-2 mb-1.5 flex items-center gap-2">
                Mailing Address
                <div className="flex items-center gap-1.5 ml-auto">
                  <Checkbox id="modal-borrower-mailingSame" checked={formData.mailingSameAsPrimary} onCheckedChange={(checked) => handleFieldChange('mailingSameAsPrimary', !!checked)} className="h-3 w-3" />
                  <Label htmlFor="modal-borrower-mailingSame" className="font-normal text-[10px]">Same as Primary</Label>
                </div>
              </div>
              {renderInlineField('mailingStreet', 'Street', { disabled: formData.mailingSameAsPrimary })}
              {renderInlineField('mailingCity', 'City', { disabled: formData.mailingSameAsPrimary })}
              {renderInlineSelect('mailingState', 'State', STATE_OPTIONS, 'State')}
              {renderInlineField('mailingZip', 'ZIP', { disabled: formData.mailingSameAsPrimary })}
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
                    <Input value={String(formData[phoneKey] || '')} onChange={(e) => handleFieldChange(phoneKey, e.target.value)} className="h-7 text-xs flex-1" />
                    <Checkbox id={`modal-borrower-${prefKey}`} checked={!!formData[prefKey]} onCheckedChange={(checked) => handleFieldChange(prefKey, !!checked)} className="h-3 w-3 shrink-0" />
                  </div>
                );
              })}
            </div>

            {/* Column 4 - Vesting & FORD */}
            <div className="space-y-1">
              <div className="font-semibold text-xs text-foreground pb-1 mb-1.5">Vesting</div>
              <Textarea value={String(formData.vesting || '')} onChange={(e) => handleFieldChange('vesting', e.target.value)} className="text-xs w-full min-h-[80px] resize-none" />

              <div className="font-semibold text-xs text-foreground pb-1 mt-2 mb-1.5">FORD</div>
              <div className="grid grid-cols-2 gap-1">
                <Input value={String(formData.ford1 || '')} onChange={(e) => handleFieldChange('ford1', e.target.value)} className="h-7 text-xs" />
                <Input value={String(formData.ford2 || '')} onChange={(e) => handleFieldChange('ford2', e.target.value)} className="h-7 text-xs" />
                <Input value={String(formData.ford3 || '')} onChange={(e) => handleFieldChange('ford3', e.target.value)} className="h-7 text-xs" />
                <Input value={String(formData.ford4 || '')} onChange={(e) => handleFieldChange('ford4', e.target.value)} className="h-7 text-xs" />
                <Input value={String(formData.ford5 || '')} onChange={(e) => handleFieldChange('ford5', e.target.value)} className="h-7 text-xs" />
                <Input value={String(formData.ford6 || '')} onChange={(e) => handleFieldChange('ford6', e.target.value)} className="h-7 text-xs" />
                <Input value={String(formData.ford7 || '')} onChange={(e) => handleFieldChange('ford7', e.target.value)} className="h-7 text-xs" />
                <Input value={String(formData.ford8 || '')} onChange={(e) => handleFieldChange('ford8', e.target.value)} className="h-7 text-xs" />
              </div>
            </div>
          </div>

          {/* Bottom section - Tax, Delivery */}
          <div className="mt-2 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-0">
              {/* Reporting */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 h-7">
                  <Checkbox id="modal-borrower-issue1098" checked={formData.issue1098} onCheckedChange={(checked) => handleFieldChange('issue1098', !!checked)} className="h-3 w-3" />
                  <Label htmlFor="modal-borrower-issue1098" className="font-normal text-xs">Issue 1098</Label>
                </div>
                <div className="flex items-center gap-2 h-7">
                  <Checkbox id="modal-borrower-altReporting" checked={formData.alternateReporting} onCheckedChange={(checked) => handleFieldChange('alternateReporting', !!checked)} className="h-3 w-3" />
                  <Label htmlFor="modal-borrower-altReporting" className="font-normal text-xs">Alternate Reporting</Label>
                </div>
              </div>

              {/* Delivery */}
              <div className="space-y-1">
                <div className="font-semibold text-xs text-foreground pb-1 mb-1.5">Delivery</div>
                <div className="flex items-center gap-2 h-7">
                  <Label className="w-[140px] shrink-0 text-xs">Online</Label>
                  <Checkbox id="modal-borrower-deliveryOnline" checked={formData.deliveryOnline} onCheckedChange={(checked) => handleFieldChange('deliveryOnline', !!checked)} className="h-3 w-3" />
                </div>
                <div className="flex items-center gap-2 h-7">
                  <Label className="w-[140px] shrink-0 text-xs">Mail</Label>
                  <Checkbox id="modal-borrower-deliveryMail" checked={formData.deliveryMail} onCheckedChange={(checked) => handleFieldChange('deliveryMail', !!checked)} className="h-3 w-3" />
                </div>
              </div>

              {/* Primary checkbox */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 pt-4">
                  <Checkbox id="modal-borrower-isPrimary" checked={formData.isPrimary} onCheckedChange={(checked) => handleFieldChange('isPrimary', !!checked)} className="h-3.5 w-3.5" />
                  <Label htmlFor="modal-borrower-isPrimary" className="text-xs font-medium">Primary Borrower</Label>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4 shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BorrowerModal;
