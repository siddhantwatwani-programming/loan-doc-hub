import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BrokerData } from './BrokersTableView';

interface BrokerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  broker?: BrokerData | null;
  onSave: (broker: BrokerData) => void;
  isEdit?: boolean;
}

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

const generateBrokerId = () => `broker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getEmptyBroker = (): BrokerData => ({
  id: generateBrokerId(),
  brokerId: '',
  license: '',
  company: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  phoneWork: '',
  phoneCell: '',
});

export const BrokerModal: React.FC<BrokerModalProps> = ({
  open,
  onOpenChange,
  broker,
  onSave,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<BrokerData>(getEmptyBroker());

  useEffect(() => {
    if (open) {
      if (broker) {
        setFormData(broker);
      } else {
        setFormData(getEmptyBroker());
      }
    }
  }, [open, broker]);

  const handleFieldChange = (field: keyof BrokerData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit Broker' : 'Add New Broker'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-8 mt-4">
          {/* Left Column - Name & Contact */}
          <div className="space-y-3">
            <div className="border-b border-border pb-2 mb-3">
              <span className="font-semibold text-sm text-primary">Broker Information</span>
            </div>

            <div>
              <Label className="text-sm text-foreground">Broker ID <span className="text-destructive">*</span></Label>
              <Input
                value={formData.brokerId}
                onChange={(e) => handleFieldChange('brokerId', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter broker ID"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">License</Label>
              <Input
                value={formData.license}
                onChange={(e) => handleFieldChange('license', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter license number"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">Company</Label>
              <Input
                value={formData.company}
                onChange={(e) => handleFieldChange('company', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">First Name</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter first name"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">Middle Name</Label>
              <Input
                value={formData.middleName}
                onChange={(e) => handleFieldChange('middleName', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter middle name"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">Last Name</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter last name"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter email address"
              />
            </div>
          </div>

          {/* Right Column - Address & Phone */}
          <div className="space-y-3">
            <div className="border-b border-border pb-2 mb-3">
              <span className="font-semibold text-sm text-primary">Address & Contact</span>
            </div>

            <div>
              <Label className="text-sm text-foreground">Street</Label>
              <Input
                value={formData.street}
                onChange={(e) => handleFieldChange('street', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter street address"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">City</Label>
              <Input
                value={formData.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter city"
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
              <Label className="text-sm text-foreground">ZIP Code</Label>
              <Input
                value={formData.zip}
                onChange={(e) => handleFieldChange('zip', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter ZIP code"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">Work Phone</Label>
              <Input
                type="tel"
                value={formData.phoneWork}
                onChange={(e) => handleFieldChange('phoneWork', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter work phone"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">Cell Phone</Label>
              <Input
                type="tel"
                value={formData.phoneCell}
                onChange={(e) => handleFieldChange('phoneCell', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter cell phone"
              />
            </div>
          </div>
        </div>

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

export default BrokerModal;
