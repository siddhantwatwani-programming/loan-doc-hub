import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BorrowerData } from './BorrowersTableView';

interface BorrowerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  borrower?: BorrowerData | null;
  onSave: (borrower: BorrowerData) => void;
  isEdit?: boolean;
}

const BORROWER_TYPE_OPTIONS = [
  'Individual', 'Corporation', 'LLC', 'Partnership', 'Trust', 'Estate', 'Other',
];

const CAPACITY_OPTIONS = [
  'Borrower', 'Co-Borrower', 'Guarantor', 'Co-Signer', 'Power of Attorney', 'Trustee', 'Other',
];

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
  id: generateBorrowerId(),
  isPrimary: false,
  borrowerType: '',
  fullName: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  taxIdType: '',
  taxId: '',
  creditScore: '',
  capacity: '',
});

export const BorrowerModal: React.FC<BorrowerModalProps> = ({
  open,
  onOpenChange,
  borrower,
  onSave,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<BorrowerData>(getEmptyBorrower());
  const [activeTab, setActiveTab] = useState('general');
  const [phoneHome, setPhoneHome] = useState('');
  const [phoneWork, setPhoneWork] = useState('');
  const [phoneCell, setPhoneCell] = useState('');
  const [phoneFax, setPhoneFax] = useState('');

  useEffect(() => {
    if (open) {
      if (borrower) {
        setFormData(borrower);
        setPhoneHome(borrower.phone || '');
      } else {
        setFormData(getEmptyBorrower());
        setPhoneHome('');
        setPhoneWork('');
        setPhoneCell('');
        setPhoneFax('');
      }
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

  const renderInline = (label: string, children: React.ReactNode) => (
    <div className="flex items-center gap-2">
      <Label className="w-24 min-w-[6rem] text-xs text-muted-foreground flex-shrink-0 truncate">{label}</Label>
      {children}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Left Column */}
              <div className="space-y-2">
                <div className="border-b border-border pb-1 mb-2">
                  <span className="font-semibold text-xs text-primary">Borrower Details</span>
                </div>

                {renderInline('Borrower Type', (
                  <Input value={formData.borrowerType} onChange={(e) => handleFieldChange('borrowerType', e.target.value)} className="h-7 text-xs flex-1 min-w-0" placeholder="Enter borrower type" />
                ))}
                {renderInline('Full Name', (
                  <Input value={formData.fullName} onChange={(e) => handleFieldChange('fullName', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />
                ))}
                <div className="flex items-center gap-2">
                  <Label className="w-24 min-w-[6rem] text-xs text-muted-foreground flex-shrink-0">Name</Label>
                  <div className="flex gap-1.5 flex-1 min-w-0">
                    <Input value={formData.firstName} onChange={(e) => handleFieldChange('firstName', e.target.value)} className="h-7 text-xs flex-1 min-w-0" placeholder="First" />
                    <Input value={formData.middleName} onChange={(e) => handleFieldChange('middleName', e.target.value)} className="h-7 text-xs w-16" placeholder="MI" />
                    <Input value={formData.lastName} onChange={(e) => handleFieldChange('lastName', e.target.value)} className="h-7 text-xs flex-1 min-w-0" placeholder="Last" />
                  </div>
                </div>
                {renderInline('Capacity', (
                  <Input value={formData.capacity} onChange={(e) => handleFieldChange('capacity', e.target.value)} className="h-7 text-xs flex-1 min-w-0" placeholder="Enter capacity" />
                ))}
                {renderInline('Email', (
                  <Input type="email" value={formData.email} onChange={(e) => handleFieldChange('email', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />
                ))}
                {renderInline('Credit Score', (
                  <Input value={formData.creditScore} onChange={(e) => handleFieldChange('creditScore', e.target.value)} className="h-7 text-xs flex-1 min-w-0" inputMode="numeric" />
                ))}
                <div className="flex items-center gap-2">
                  <Label className="w-24 min-w-[6rem] text-xs text-muted-foreground flex-shrink-0">Tax ID</Label>
                  <Select value={formData.taxIdType} onValueChange={(val) => handleFieldChange('taxIdType', val)}>
                    <SelectTrigger className="h-7 text-xs w-20"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {TAX_ID_TYPE_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Input value={formData.taxId} onChange={(e) => handleFieldChange('taxId', e.target.value)} className="h-7 text-xs flex-1 min-w-0" placeholder="TIN" />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox id="modal-primary-borrower" checked={formData.isPrimary} onCheckedChange={(checked) => handleFieldChange('isPrimary', !!checked)} className="h-3.5 w-3.5" />
                  <Label htmlFor="modal-primary-borrower" className="text-xs text-foreground">Primary Borrower</Label>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="border-b border-border pb-1 mb-2">
                    <span className="font-semibold text-xs text-primary">Primary Address</span>
                  </div>
                  {renderInline('Street', (
                    <Input value={formData.street} onChange={(e) => handleFieldChange('street', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />
                  ))}
                  {renderInline('City', (
                    <Input value={formData.city} onChange={(e) => handleFieldChange('city', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />
                  ))}
                  {renderInline('State', (
                    <Select value={formData.state} onValueChange={(val) => handleFieldChange('state', val)}>
                      <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="bg-background border border-border z-50 max-h-60">
                        {US_STATES.map(state => (<SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  ))}
                  {renderInline('Zip Code', (
                    <Input value={formData.zipCode} onChange={(e) => handleFieldChange('zipCode', e.target.value)} className="h-7 text-xs flex-1 min-w-0" />
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="border-b border-border pb-1 mb-2">
                    <span className="font-semibold text-xs text-primary">Phone Numbers</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                    {renderInline('Home', (<Input value={phoneHome} onChange={(e) => setPhoneHome(e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                    {renderInline('Work', (<Input value={phoneWork} onChange={(e) => setPhoneWork(e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                    {renderInline('Cell', (<Input value={phoneCell} onChange={(e) => setPhoneCell(e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
                    {renderInline('Fax', (<Input value={phoneFax} onChange={(e) => setPhoneFax(e.target.value)} className="h-7 text-xs flex-1 min-w-0" />))}
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
