import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
];
const SALUTATION_OPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
const GENERATION_OPTIONS = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];

const emptyCoBorrower: CoBorrowerData = {
  id: '',
  fullName: '',
  firstName: '',
  middleName: '',
  lastName: '',
  salutation: '',
  generation: '',
  email: '',
  homePhone: '',
  workPhone: '',
  mobilePhone: '',
  fax: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  loanNumber: '',
  tin: '',
  relation: 'None',
  type: 'Co-Borrower',
  dob: '',
  creditReporting: false,
  resCode: '',
  addressIndicator: '',
  sendBorrowerNotifications: false,
  format: 'HTML',
  deliveryPrint: true,
  deliveryEmail: false,
  deliverySms: false,
};

export const CoBorrowerModal: React.FC<CoBorrowerModalProps> = ({
  open,
  onOpenChange,
  coBorrower,
  onSave,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<CoBorrowerData>(emptyCoBorrower);

  useEffect(() => {
    if (coBorrower) {
      setFormData(coBorrower);
    } else {
      setFormData(emptyCoBorrower);
    }
  }, [coBorrower, open]);

  const handleInputChange = (field: keyof CoBorrowerData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => { onSave(formData); };

  const renderInline = (label: string, children: React.ReactNode) => (
    <div className="flex items-center gap-2">
      <Label className="w-24 min-w-[6rem] text-xs text-muted-foreground flex-shrink-0 truncate">{label}</Label>
      {children}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-sm">{isEdit ? 'Edit Co-Borrower' : 'Add Co-Borrower'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-3">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mb-2">Name & Salutation</h4>
                {renderInline('Full Name', (<Input value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                {renderInline('Salutation', (
                  <Select value={formData.salutation} onValueChange={(v) => handleInputChange('salutation', v)}>
                    <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{SALUTATION_OPTIONS.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                  </Select>
                ))}
                {renderInline('First Name', (<Input value={formData.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                {renderInline('Middle Name', (<Input value={formData.middleName} onChange={(e) => handleInputChange('middleName', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                {renderInline('Last Name', (<Input value={formData.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                {renderInline('Generation', (
                  <Select value={formData.generation} onValueChange={(v) => handleInputChange('generation', v)}>
                    <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{GENERATION_OPTIONS.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                  </Select>
                ))}
              </div>

              <div className="space-y-1.5">
                <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mb-2">Mailing Address</h4>
                {renderInline('Street', (<Input value={formData.street} onChange={(e) => handleInputChange('street', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                {renderInline('City', (<Input value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                <div className="flex items-center gap-2">
                  <Label className="w-24 min-w-[6rem] text-xs text-muted-foreground flex-shrink-0">State / Zip</Label>
                  <Select value={formData.state} onValueChange={(v) => handleInputChange('state', v)}>
                    <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>{STATE_OPTIONS.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                  </Select>
                  <Input value={formData.zipCode} onChange={(e) => handleInputChange('zipCode', e.target.value)} className="h-7 text-xs w-24" placeholder="Zip" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mb-2">E-mail & Delivery</h4>
                {renderInline('Email', (<Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                {renderInline('Format', (
                  <Select value={formData.format} onValueChange={(v) => handleInputChange('format', v)}>
                    <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{FORMAT_OPTIONS.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                  </Select>
                ))}
                <div className="flex items-center gap-2">
                  <Label className="w-24 min-w-[6rem] text-xs text-muted-foreground flex-shrink-0">Delivery</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Checkbox id="m-deliveryPrint" checked={formData.deliveryPrint} onCheckedChange={(c) => handleInputChange('deliveryPrint', !!c)} className="h-3.5 w-3.5" />
                      <Label htmlFor="m-deliveryPrint" className="text-xs font-normal">Print</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox id="m-deliveryEmail" checked={formData.deliveryEmail} onCheckedChange={(c) => handleInputChange('deliveryEmail', !!c)} className="h-3.5 w-3.5" />
                      <Label htmlFor="m-deliveryEmail" className="text-xs font-normal">Email</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <Checkbox id="m-deliverySms" checked={formData.deliverySms} onCheckedChange={(c) => handleInputChange('deliverySms', !!c)} className="h-3.5 w-3.5" />
                      <Label htmlFor="m-deliverySms" className="text-xs font-normal">SMS</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mb-2">Phone Numbers</h4>
                {renderInline('Home', (<Input value={formData.homePhone} onChange={(e) => handleInputChange('homePhone', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                {renderInline('Work', (<Input value={formData.workPhone} onChange={(e) => handleInputChange('workPhone', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                {renderInline('Mobile', (<Input value={formData.mobilePhone} onChange={(e) => handleInputChange('mobilePhone', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                {renderInline('Fax', (<Input value={formData.fax} onChange={(e) => handleInputChange('fax', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
              </div>

              <div className="space-y-1.5">
                <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mb-2">Other Information</h4>
                {renderInline('Loan Number', (<Input value={formData.loanNumber} onChange={(e) => handleInputChange('loanNumber', e.target.value)} readOnly={isEdit} className={`h-7 text-xs flex-1 min-w-0 ${isEdit ? 'bg-muted' : ''}`} />))}
                {renderInline('TIN', (<Input value={formData.tin} onChange={(e) => handleInputChange('tin', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                {renderInline('Relation', (
                  <Select value={formData.relation} onValueChange={(v) => handleInputChange('relation', v)}>
                    <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{RELATION_OPTIONS.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                  </Select>
                ))}
                {renderInline('Type', (
                  <Select value={formData.type} onValueChange={(v) => handleInputChange('type', v)}>
                    <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{TYPE_OPTIONS.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
                  </Select>
                ))}
                <div className="flex items-center gap-2">
                  <Checkbox id="m-creditReporting" checked={formData.creditReporting} onCheckedChange={(c) => handleInputChange('creditReporting', !!c)} className="h-3.5 w-3.5" />
                  <Label htmlFor="m-creditReporting" className="text-xs font-normal">Credit Reporting</Label>
                </div>
                {renderInline('DOB', (<Input type="date" value={formData.dob} onChange={(e) => handleInputChange('dob', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                {renderInline('Res Code', (<Input value={formData.resCode} onChange={(e) => handleInputChange('resCode', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                {renderInline('Addr Indicator', (<Input value={formData.addressIndicator} onChange={(e) => handleInputChange('addressIndicator', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                <div className="flex items-center gap-2">
                  <Label className="w-24 min-w-[6rem] text-xs text-muted-foreground flex-shrink-0">Notifications</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <input type="radio" id="m-notifYes" name="m-sendNotif" checked={formData.sendBorrowerNotifications === true} onChange={() => handleInputChange('sendBorrowerNotifications', true)} className="h-3 w-3" />
                      <Label htmlFor="m-notifYes" className="text-xs font-normal">Yes</Label>
                    </div>
                    <div className="flex items-center gap-1">
                      <input type="radio" id="m-notifNo" name="m-sendNotif" checked={formData.sendBorrowerNotifications === false} onChange={() => handleInputChange('sendBorrowerNotifications', false)} className="h-3 w-3" />
                      <Label htmlFor="m-notifNo" className="text-xs font-normal">No</Label>
                    </div>
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
