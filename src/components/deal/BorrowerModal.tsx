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
  'Individual',
  'Corporation',
  'LLC',
  'Partnership',
  'Trust',
  'Estate',
  'Other',
];

const CAPACITY_OPTIONS = [
  'Borrower',
  'Co-Borrower',
  'Guarantor',
  'Co-Signer',
  'Power of Attorney',
  'Trustee',
  'Other',
];

const TAX_ID_TYPE_OPTIONS = [
  'SSN',
  'EIN',
  'ITIN',
  'Other',
];

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
  
  // Additional phone fields
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
    // Set primary phone from the first available phone
    const primaryPhone = phoneCell || phoneHome || phoneWork || '';
    onSave({ ...formData, phone: primaryPhone });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit Borrower' : 'Add New Borrower'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Borrower Details */}
              <div className="space-y-3">
                <div className="border-b border-border pb-2 mb-3">
                  <span className="font-semibold text-sm text-primary">Borrower Details</span>
                </div>

                <div>
                  <Label className="text-sm text-foreground">Borrower Type</Label>
                  <Input
                    value={formData.borrowerType}
                    onChange={(e) => handleFieldChange('borrowerType', e.target.value)}
                    className="h-8 text-sm mt-1"
                    placeholder="Enter borrower type"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">Full Name (If Entity, Use Entity Name)</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => handleFieldChange('fullName', e.target.value)}
                    className="h-8 text-sm mt-1"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-sm text-foreground">First Name</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleFieldChange('firstName', e.target.value)}
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-foreground">Middle</Label>
                    <Input
                      value={formData.middleName}
                      onChange={(e) => handleFieldChange('middleName', e.target.value)}
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-foreground">Last Name</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleFieldChange('lastName', e.target.value)}
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-foreground">Capacity</Label>
                  <Input
                    value={formData.capacity}
                    onChange={(e) => handleFieldChange('capacity', e.target.value)}
                    className="h-8 text-sm mt-1"
                    placeholder="Enter capacity"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="h-8 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">Credit Score</Label>
                  <Input
                    value={formData.creditScore}
                    onChange={(e) => handleFieldChange('creditScore', e.target.value)}
                    className="h-8 text-sm mt-1"
                    inputMode="numeric"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-foreground">Tax ID Type</Label>
                    <Select
                      value={formData.taxIdType}
                      onValueChange={(val) => handleFieldChange('taxIdType', val)}
                    >
                      <SelectTrigger className="h-8 text-sm mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border z-50">
                        {TAX_ID_TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-foreground">Tax ID / TIN</Label>
                    <Input
                      value={formData.taxId}
                      onChange={(e) => handleFieldChange('taxId', e.target.value)}
                      className="h-8 text-sm mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="modal-primary-borrower"
                    checked={formData.isPrimary}
                    onCheckedChange={(checked) => handleFieldChange('isPrimary', !!checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="modal-primary-borrower" className="text-sm text-foreground">
                    Primary Borrower
                  </Label>
                </div>
              </div>

              {/* Right Column - Address & Phone */}
              <div className="space-y-4">
                {/* Address Section */}
                <div>
                  <div className="border-b border-border pb-2 mb-3">
                    <span className="font-semibold text-sm text-primary">Primary Address</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-foreground">Street</Label>
                      <Input
                        value={formData.street}
                        onChange={(e) => handleFieldChange('street', e.target.value)}
                        className="h-8 text-sm mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm text-foreground">City</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleFieldChange('city', e.target.value)}
                        className="h-8 text-sm mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-sm text-foreground">State</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(val) => handleFieldChange('state', val)}
                      >
                        <SelectTrigger className="h-8 text-sm mt-1">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50 max-h-60">
                          {US_STATES.map(state => (
                            <SelectItem key={state.value} value={state.value}>{state.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm text-foreground">Zip Code</Label>
                      <Input
                        value={formData.zipCode}
                        onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                        className="h-8 text-sm mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Phone Section */}
                <div>
                  <div className="border-b border-border pb-2 mb-3">
                    <span className="font-semibold text-sm text-primary">Phone Numbers</span>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-foreground">Home</Label>
                        <Input
                          value={phoneHome}
                          onChange={(e) => setPhoneHome(e.target.value)}
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-foreground">Work</Label>
                        <Input
                          value={phoneWork}
                          onChange={(e) => setPhoneWork(e.target.value)}
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-foreground">Cell</Label>
                        <Input
                          value={phoneCell}
                          onChange={(e) => setPhoneCell(e.target.value)}
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-foreground">Fax</Label>
                        <Input
                          value={phoneFax}
                          onChange={(e) => setPhoneFax(e.target.value)}
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BorrowerModal;
