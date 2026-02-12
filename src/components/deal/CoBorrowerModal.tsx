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

const TYPE_OPTIONS = [
  'Co-Borrower',
  'Guarantor',
  'Co-Signer',
  'Authorized User',
  'Other',
];

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

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Co-Borrower' : 'Add Co-Borrower'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-140px)] pr-4">
          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Name & Salutation Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Name & Salutation</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salutation">Salutation</Label>
                  <Select
                    value={formData.salutation}
                    onValueChange={(value) => handleInputChange('salutation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select salutation" />
                    </SelectTrigger>
                    <SelectContent>
                      {SALUTATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    placeholder="Enter middle name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="generation">Generation</Label>
                  <Select
                    value={formData.generation}
                    onValueChange={(value) => handleInputChange('generation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select generation" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENERATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mailing Address Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Mailing Address</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="street">Street (Address 1)</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    placeholder="Enter street address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City / Town</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Enter city"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => handleInputChange('state', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATE_OPTIONS.map((state) => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      placeholder="Enter zip code"
                    />
                  </div>
                </div>
              </div>

              {/* E-mail & Delivery Options Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">E-mail & Delivery Options</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value) => handleInputChange('format', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAT_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Delivery</Label>
                  <div className="flex items-center gap-6 pt-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="deliveryPrint"
                        checked={formData.deliveryPrint}
                        onCheckedChange={(checked) => handleInputChange('deliveryPrint', !!checked)}
                      />
                      <Label htmlFor="deliveryPrint" className="font-normal">Print</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="deliveryEmail"
                        checked={formData.deliveryEmail}
                        onCheckedChange={(checked) => handleInputChange('deliveryEmail', !!checked)}
                      />
                      <Label htmlFor="deliveryEmail" className="font-normal">Email</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="deliverySms"
                        checked={formData.deliverySms}
                        onCheckedChange={(checked) => handleInputChange('deliverySms', !!checked)}
                      />
                      <Label htmlFor="deliverySms" className="font-normal">SMS</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Phone Numbers Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Phone Numbers</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="homePhone">Home Phone</Label>
                  <Input
                    id="homePhone"
                    value={formData.homePhone}
                    onChange={(e) => handleInputChange('homePhone', e.target.value)}
                    placeholder="Enter home phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workPhone">Work Phone</Label>
                  <Input
                    id="workPhone"
                    value={formData.workPhone}
                    onChange={(e) => handleInputChange('workPhone', e.target.value)}
                    placeholder="Enter work phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobilePhone">Mobile / Cell Phone</Label>
                  <Input
                    id="mobilePhone"
                    value={formData.mobilePhone}
                    onChange={(e) => handleInputChange('mobilePhone', e.target.value)}
                    placeholder="Enter mobile phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fax">Fax</Label>
                  <Input
                    id="fax"
                    value={formData.fax}
                    onChange={(e) => handleInputChange('fax', e.target.value)}
                    placeholder="Enter fax number"
                  />
                </div>
              </div>

              {/* Other Information Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Other Information</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="loanNumber">Loan Number</Label>
                  <Input
                    id="loanNumber"
                    value={formData.loanNumber}
                    onChange={(e) => handleInputChange('loanNumber', e.target.value)}
                    placeholder="Enter loan number"
                    readOnly={isEdit}
                    className={isEdit ? 'bg-muted' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tin">TIN (SSN or Tax ID)</Label>
                  <Input
                    id="tin"
                    value={formData.tin}
                    onChange={(e) => handleInputChange('tin', e.target.value)}
                    placeholder="Enter SSN or Tax ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relation">Relation</Label>
                  <Select
                    value={formData.relation}
                    onValueChange={(value) => handleInputChange('relation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleInputChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="creditReporting"
                    checked={formData.creditReporting}
                    onCheckedChange={(checked) => handleInputChange('creditReporting', !!checked)}
                  />
                  <Label htmlFor="creditReporting" className="font-normal">Credit Reporting</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">DOB</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resCode">Res Code</Label>
                  <Input
                    id="resCode"
                    value={formData.resCode}
                    onChange={(e) => handleInputChange('resCode', e.target.value)}
                    placeholder="Enter res code"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addressIndicator">Address Indicator</Label>
                  <Input
                    id="addressIndicator"
                    value={formData.addressIndicator}
                    onChange={(e) => handleInputChange('addressIndicator', e.target.value)}
                    placeholder="Enter address indicator"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Send Borrower Notifications</Label>
                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="notificationsYes"
                        name="sendNotifications"
                        checked={formData.sendBorrowerNotifications === true}
                        onChange={() => handleInputChange('sendBorrowerNotifications', true)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="notificationsYes" className="font-normal">Yes</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="notificationsNo"
                        name="sendNotifications"
                        checked={formData.sendBorrowerNotifications === false}
                        onChange={() => handleInputChange('sendBorrowerNotifications', false)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="notificationsNo" className="font-normal">No</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {isEdit ? 'Save Changes' : 'Add Co-Borrower'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoBorrowerModal;
