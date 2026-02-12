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

const TYPE_OPTIONS = ['Co-Borrower', 'Guarantor', 'Co-Signer', 'Authorized User', 'Other'];
const RELATION_OPTIONS = ['None', 'Spouse'];
const FORMAT_OPTIONS = ['HTML', 'Text'];
const STATE_OPTIONS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];
const SALUTATION_OPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
const GENERATION_OPTIONS = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];

const emptyCoBorrower: CoBorrowerData = {
  id: '', fullName: '', firstName: '', middleName: '', lastName: '', salutation: '', generation: '',
  email: '', homePhone: '', workPhone: '', mobilePhone: '', fax: '', street: '', city: '', state: '',
  zipCode: '', loanNumber: '', tin: '', relation: 'None', type: 'Co-Borrower', dob: '',
  creditReporting: false, resCode: '', addressIndicator: '', sendBorrowerNotifications: false,
  format: 'HTML', deliveryPrint: true, deliveryEmail: false, deliverySms: false,
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
      <Label className="w-[100px] shrink-0 text-xs">{label}</Label>
      <Input value={String(formData[field] || '')} onChange={(e) => handleInputChange(field, e.target.value)} className="h-7 text-xs flex-1" {...props} />
    </div>
  );

  const renderInlineSelect = (field: keyof CoBorrowerData, label: string, options: string[], placeholder: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs">{label}</Label>
      <Select value={String(formData[field] || '')} onValueChange={(value) => handleInputChange(field, value)}>
        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>{options.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-sm">{isEdit ? 'Edit Co-Borrower' : 'Add Co-Borrower'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 py-3">
            {/* Left Column */}
            <div className="space-y-1.5">
              <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mb-2">Name & Salutation</h4>
              {renderInlineField('fullName', 'Full Name')}
              {renderInlineSelect('salutation', 'Salutation', SALUTATION_OPTIONS, 'Select')}
              {renderInlineField('firstName', 'First Name')}
              {renderInlineField('middleName', 'Middle Name')}
              {renderInlineField('lastName', 'Last Name')}
              {renderInlineSelect('generation', 'Generation', GENERATION_OPTIONS, 'Select')}

              <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mt-3 mb-2">Mailing Address</h4>
              {renderInlineField('street', 'Street')}
              {renderInlineField('city', 'City')}
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">State / ZIP</Label>
                <div className="flex-1 grid grid-cols-2 gap-1">
                  <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>{STATE_OPTIONS.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                  </Select>
                  <Input value={formData.zipCode} onChange={(e) => handleInputChange('zipCode', e.target.value)} className="h-7 text-xs" placeholder="Zip" />
                </div>
              </div>

              <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mt-3 mb-2">E-mail & Delivery</h4>
              {renderInlineField('email', 'Email', { type: 'email' })}
              {renderInlineSelect('format', 'Format', FORMAT_OPTIONS, 'Select')}
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">Delivery</Label>
                <div className="flex items-center gap-4 flex-1">
                  {(['deliveryPrint', 'deliveryEmail', 'deliverySms'] as const).map(key => (
                    <div key={key} className="flex items-center gap-1">
                      <Checkbox id={key} checked={!!formData[key]} onCheckedChange={(checked) => handleInputChange(key, !!checked)} className="h-3 w-3" />
                      <Label htmlFor={key} className="font-normal text-[10px]">{key.replace('delivery', '')}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-1.5">
              <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mb-2">Phone Numbers</h4>
              {renderInlineField('homePhone', 'Home Phone')}
              {renderInlineField('workPhone', 'Work Phone')}
              {renderInlineField('mobilePhone', 'Mobile')}
              {renderInlineField('fax', 'Fax')}

              <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mt-3 mb-2">Other Information</h4>
              {renderInlineField('loanNumber', 'Loan Number', { readOnly: isEdit, className: `h-7 text-xs flex-1 ${isEdit ? 'bg-muted' : ''}` })}
              {renderInlineField('tin', 'TIN')}
              {renderInlineSelect('relation', 'Relation', RELATION_OPTIONS, 'Select')}
              {renderInlineSelect('type', 'Type', TYPE_OPTIONS, 'Select')}
              <div className="flex items-center gap-2">
                <Checkbox id="creditReporting" checked={formData.creditReporting} onCheckedChange={(checked) => handleInputChange('creditReporting', !!checked)} className="h-3 w-3" />
                <Label htmlFor="creditReporting" className="font-normal text-xs">Credit Reporting</Label>
              </div>
              {renderInlineField('dob', 'DOB', { type: 'date' })}
              {renderInlineField('resCode', 'Res Code')}
              {renderInlineField('addressIndicator', 'Address Ind.')}
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">Notifications</Label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <input type="radio" id="notif-yes" name="notifications" checked={formData.sendBorrowerNotifications} onChange={() => handleInputChange('sendBorrowerNotifications', true)} className="h-3 w-3" />
                    <Label htmlFor="notif-yes" className="font-normal text-xs">Yes</Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <input type="radio" id="notif-no" name="notifications" checked={!formData.sendBorrowerNotifications} onChange={() => handleInputChange('sendBorrowerNotifications', false)} className="h-3 w-3" />
                    <Label htmlFor="notif-no" className="font-normal text-xs">No</Label>
                  </div>
                </div>
              </div>
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
