import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
}

const BORROWER_TYPE_OPTIONS = [
  'Individual', 'Joint', 'Family Trust', 'LLC', 'C Corp / S Corp',
  'IRA / ERISA', 'Investment Fund', '401K', 'Foreign Holder W-8', 'Non-profit',
];

const TAX_ID_TYPE_OPTIONS = ['0 – Unknown', '1 – EIN', '2 – SSN'];

const STATE_OPTIONS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const emptyCoBorrower: CoBorrowerData = {
  id: '', fullName: '', firstName: '', middleName: '', lastName: '', salutation: '', generation: '',
  email: '', homePhone: '', homePhone2: '', workPhone: '', mobilePhone: '', fax: '',
  preferredHome: false, preferredHome2: false, preferredWork: false, preferredCell: false, preferredFax: false,
  street: '', city: '', state: '', zipCode: '',
  primaryStreet: '', primaryCity: '', primaryState: '', primaryZip: '',
  mailingStreet: '', mailingCity: '', mailingState: '', mailingZip: '', mailingSameAsPrimary: false,
  loanNumber: '', tin: '', relation: '', type: 'Co-Borrower',
  borrowerId: '', borrowerType: '', capacity: '', creditScore: '',
  vesting: '', ford: '', taxIdType: '', issue1098: false, alternateReporting: false,
  deliveryOnline: false, deliveryMail: false,
  dob: '', creditReporting: false, resCode: '', addressIndicator: '',
  sendBorrowerNotifications: false, format: 'HTML',
  deliveryPrint: true, deliveryEmail: false, deliverySms: false,
};

export const CoBorrowerModal: React.FC<CoBorrowerModalProps> = ({ open, onOpenChange, coBorrower, onSave, isEdit = false }) => {
  const [formData, setFormData] = useState<CoBorrowerData>(emptyCoBorrower);

  useEffect(() => {
    setFormData(coBorrower ? coBorrower : emptyCoBorrower);
  }, [coBorrower, open]);

  const handleInputChange = (field: keyof CoBorrowerData, value: string | boolean) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSave = () => onSave(formData);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-sm">{isEdit ? 'Edit Co-Borrower' : 'Add Co-Borrower'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          {/* Top section - 4 column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-0 py-2">
            {/* Column 1 - Name */}
            <div className="space-y-1">
              <div className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1.5">Name</div>
              {renderInlineField('borrowerId', 'Borrower ID')}
              {renderInlineSelect('borrowerType', 'Borrower Type', BORROWER_TYPE_OPTIONS, 'Select')}
              {renderInlineField('fullName', 'Full Name: If Entity, Use Entity')}
              {renderInlineField('firstName', 'First: If Entity, Use Signer')}
              {renderInlineField('middleName', 'Middle')}
              {renderInlineField('lastName', 'Last')}
              {renderInlineField('capacity', 'Capacity')}
              {renderInlineField('email', 'Email', { type: 'email' })}
              <div className="h-1" />
              {renderInlineField('creditScore', 'Credit Score')}
            </div>

            {/* Column 2 - Primary & Mailing Address */}
            <div className="space-y-1">
              <div className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1.5">Primary Address</div>
              {renderInlineField('primaryStreet', 'Street')}
              {renderInlineField('primaryCity', 'City')}
              {renderInlineSelect('primaryState', 'State', STATE_OPTIONS, 'State')}
              {renderInlineField('primaryZip', 'ZIP')}

              <div className="font-semibold text-xs text-foreground border-b border-border pb-1 mt-2 mb-1.5 flex items-center gap-2">
                Mailing Address
                <div className="flex items-center gap-1.5 ml-auto">
                  <Checkbox id="modal-mailingSame" checked={formData.mailingSameAsPrimary} onCheckedChange={(checked) => handleInputChange('mailingSameAsPrimary', !!checked)} className="h-3 w-3" />
                  <Label htmlFor="modal-mailingSame" className="font-normal text-[10px]">Same as Primary</Label>
                </div>
              </div>
              {renderInlineField('mailingStreet', 'Street', { disabled: formData.mailingSameAsPrimary })}
              {renderInlineField('mailingCity', 'City', { disabled: formData.mailingSameAsPrimary })}
              {renderInlineSelect('mailingState', 'State', STATE_OPTIONS, 'State')}
              {renderInlineField('mailingZip', 'ZIP', { disabled: formData.mailingSameAsPrimary })}
            </div>

            {/* Column 3 - Phone */}
            <div className="space-y-1">
              <div className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1.5">Phone</div>
              {renderInlineField('homePhone', 'Home')}
              {renderInlineField('homePhone2', 'Home')}
              {renderInlineField('workPhone', 'Work')}
              {renderInlineField('mobilePhone', 'Cell')}
              {renderInlineField('fax', 'Fax')}

              <div className="font-semibold text-xs text-foreground border-b border-border pb-1 mt-2 mb-1.5">Vesting</div>
              <Input value={String(formData.vesting || '')} onChange={(e) => handleInputChange('vesting', e.target.value)} className="h-7 text-xs w-full" />

              <div className="font-semibold text-xs text-foreground border-b border-border pb-1 mt-2 mb-1.5">FORD</div>
              <Input value={String(formData.ford || '')} onChange={(e) => handleInputChange('ford', e.target.value)} className="h-7 text-xs w-full" />
            </div>

            {/* Column 4 - Preferred */}
            <div className="space-y-1">
              <div className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1.5">Preferred</div>
              {(['preferredHome', 'preferredHome2', 'preferredWork', 'preferredCell', 'preferredFax'] as const).map(key => (
                <div key={key} className="flex items-center justify-end gap-1.5 h-7">
                  <Checkbox id={`modal-${key}`} checked={!!formData[key]} onCheckedChange={(checked) => handleInputChange(key, !!checked)} className="h-3 w-3" />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom section - Tax, Delivery, extra fields */}
          <div className="border-t border-border mt-2 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-0">
              {/* Tax & Reporting */}
              <div className="space-y-1">
                {renderInlineSelect('taxIdType', 'Tax ID Type', TAX_ID_TYPE_OPTIONS, 'Select')}
                {renderInlineField('tin', 'TIN')}
                <div className="flex items-center gap-2 h-7">
                  <Checkbox id="modal-issue1098" checked={formData.issue1098} onCheckedChange={(checked) => handleInputChange('issue1098', !!checked)} className="h-3 w-3" />
                  <Label htmlFor="modal-issue1098" className="font-normal text-xs">Issue 1098</Label>
                </div>
                <div className="flex items-center gap-2 h-7">
                  <Checkbox id="modal-altReporting" checked={formData.alternateReporting} onCheckedChange={(checked) => handleInputChange('alternateReporting', !!checked)} className="h-3 w-3" />
                  <Label htmlFor="modal-altReporting" className="font-normal text-xs">Alternate Reporting</Label>
                </div>
              </div>

              {/* Delivery */}
              <div className="space-y-1">
                <div className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1.5">Delivery</div>
                <div className="flex items-center gap-2 h-7">
                  <Label className="w-[140px] shrink-0 text-xs">Online</Label>
                  <Checkbox id="modal-deliveryOnline" checked={formData.deliveryOnline} onCheckedChange={(checked) => handleInputChange('deliveryOnline', !!checked)} className="h-3 w-3" />
                </div>
                <div className="flex items-center gap-2 h-7">
                  <Label className="w-[140px] shrink-0 text-xs">Mail</Label>
                  <Checkbox id="modal-deliveryMail" checked={formData.deliveryMail} onCheckedChange={(checked) => handleInputChange('deliveryMail', !!checked)} className="h-3 w-3" />
                </div>
              </div>

              {/* Empty column for alignment */}
              <div />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{isEdit ? 'Save Changes' : 'Add Co-Borrower'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoBorrowerModal;
