import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { BorrowerData } from './BorrowersTableView';

interface BorrowerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  borrower?: BorrowerData | null;
  onSave: (borrower: BorrowerData) => void;
  isEdit?: boolean;
}

const TAX_ID_TYPE_OPTIONS = ['SSN', 'EIN', 'ITIN', 'Other'];

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
];

const generateBorrowerId = () => `borrower_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getEmptyBorrower = (): BorrowerData => ({
  id: generateBorrowerId(), isPrimary: false, borrowerType: '', fullName: '',
  firstName: '', middleName: '', lastName: '', email: '', phone: '',
  street: '', city: '', state: '', zipCode: '', taxIdType: '', taxId: '',
  creditScore: '', capacity: '',
});

export const BorrowerModal: React.FC<BorrowerModalProps> = ({
  open, onOpenChange, borrower, onSave, isEdit = false,
}) => {
  const [formData, setFormData] = useState<BorrowerData>(getEmptyBorrower());
  const [activeTab, setActiveTab] = useState('general');
  const [phoneHome, setPhoneHome] = useState('');
  const [phoneWork, setPhoneWork] = useState('');
  const [phoneCell, setPhoneCell] = useState('');
  const [phoneFax, setPhoneFax] = useState('');

  useEffect(() => {
    if (open) {
      if (borrower) { setFormData(borrower); setPhoneHome(borrower.phone || ''); }
      else { setFormData(getEmptyBorrower()); setPhoneHome(''); setPhoneWork(''); setPhoneCell(''); setPhoneFax(''); }
      setActiveTab('general');
    }
  }, [open, borrower]);

  const handleFieldChange = (field: keyof BorrowerData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const primaryPhone = phoneCell || phoneHome || phoneWork || '';
    onSave({ ...formData, phone: primaryPhone });
    onOpenChange(false);
  };

  const renderInlineField = (field: keyof BorrowerData, label: string, type = 'text') => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
      <Input value={String(formData[field] || '')} onChange={(e) => handleFieldChange(field, e.target.value)} className="h-7 text-xs flex-1" type={type} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-primary" />
            {isEdit ? 'Edit Borrower' : 'Add New Borrower'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
              {/* Left Column */}
              <div className="space-y-1.5">
                <div className="border-b border-border pb-1 mb-2">
                  <span className="font-semibold text-xs text-primary">Borrower Details</span>
                </div>
                {renderInlineField('borrowerType', 'Borrower Type')}
                {renderInlineField('fullName', 'Full Name')}
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs text-foreground">Name</Label>
                  <div className="flex-1 grid grid-cols-3 gap-1">
                    <Input value={formData.firstName} onChange={(e) => handleFieldChange('firstName', e.target.value)} className="h-7 text-xs" placeholder="First" />
                    <Input value={formData.middleName} onChange={(e) => handleFieldChange('middleName', e.target.value)} className="h-7 text-xs" placeholder="Middle" />
                    <Input value={formData.lastName} onChange={(e) => handleFieldChange('lastName', e.target.value)} className="h-7 text-xs" placeholder="Last" />
                  </div>
                </div>
                {renderInlineField('capacity', 'Capacity')}
                {renderInlineField('email', 'Email')}
                {renderInlineField('creditScore', 'Credit Score')}
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs text-foreground">Tax ID Type</Label>
                  <Select value={formData.taxIdType} onValueChange={(val) => handleFieldChange('taxIdType', val)}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {TAX_ID_TYPE_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                {renderInlineField('taxId', 'Tax ID / TIN')}
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox id="modal-primary-borrower" checked={formData.isPrimary} onCheckedChange={(checked) => handleFieldChange('isPrimary', !!checked)} className="h-3.5 w-3.5" />
                  <Label htmlFor="modal-primary-borrower" className="text-xs text-foreground">Primary Borrower</Label>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-1.5">
                <div className="border-b border-border pb-1 mb-2">
                  <span className="font-semibold text-xs text-primary">Primary Address</span>
                </div>
                {renderInlineField('street', 'Street')}
                {renderInlineField('city', 'City')}
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs text-foreground">State</Label>
                  <Select value={formData.state} onValueChange={(val) => handleFieldChange('state', val)}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50 max-h-60">
                      {US_STATES.map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                {renderInlineField('zipCode', 'Zip Code')}

                <div className="border-b border-border pb-1 mt-3 mb-2">
                  <span className="font-semibold text-xs text-primary">Phone Numbers</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label className="w-10 shrink-0 text-xs">Home</Label>
                    <Input value={phoneHome} onChange={(e) => setPhoneHome(e.target.value)} className="h-7 text-xs flex-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-10 shrink-0 text-xs">Work</Label>
                    <Input value={phoneWork} onChange={(e) => setPhoneWork(e.target.value)} className="h-7 text-xs flex-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-10 shrink-0 text-xs">Cell</Label>
                    <Input value={phoneCell} onChange={(e) => setPhoneCell(e.target.value)} className="h-7 text-xs flex-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-10 shrink-0 text-xs">Fax</Label>
                    <Input value={phoneFax} onChange={(e) => setPhoneFax(e.target.value)} className="h-7 text-xs flex-1" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BorrowerModal;
