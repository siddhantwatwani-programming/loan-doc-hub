import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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
  id: generateBrokerId(), brokerId: '', license: '', company: '', firstName: '',
  middleName: '', lastName: '', email: '', street: '', city: '', state: '', zip: '',
  phoneWork: '', phoneCell: '',
});

export const BrokerModal: React.FC<BrokerModalProps> = ({ open, onOpenChange, broker, onSave, isEdit = false }) => {
  const [formData, setFormData] = useState<BrokerData>(getEmptyBroker());

  useEffect(() => {
    if (open) setFormData(broker ? broker : getEmptyBroker());
  }, [open, broker]);

  const handleFieldChange = (field: keyof BrokerData, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSave = () => { onSave(formData); onOpenChange(false); };

  const renderInlineField = (field: keyof BrokerData, label: string, props: Record<string, any> = {}) => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
      <Input value={formData[field]} onChange={(e) => handleFieldChange(field, e.target.value)} className="h-7 text-xs flex-1" {...props} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            {isEdit ? 'Edit Broker' : 'Add New Broker'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 mt-3">
          {/* Left Column */}
          <div className="space-y-1.5">
            <div className="border-b border-border pb-1 mb-2"><span className="font-semibold text-xs text-primary">Broker Information</span></div>
            {renderInlineField('brokerId', 'Broker ID *')}
            {renderInlineField('license', 'License')}
            {renderInlineField('company', 'Company')}
            {renderInlineField('firstName', 'First Name')}
            {renderInlineField('middleName', 'Middle Name')}
            {renderInlineField('lastName', 'Last Name')}
            {renderInlineField('email', 'Email', { type: 'email' })}
          </div>

          {/* Right Column */}
          <div className="space-y-1.5">
            <div className="border-b border-border pb-1 mb-2"><span className="font-semibold text-xs text-primary">Address & Contact</span></div>
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
            {renderInlineField('zip', 'ZIP Code')}
            {renderInlineField('phoneWork', 'Work Phone', { type: 'tel' })}
            {renderInlineField('phoneCell', 'Cell Phone', { type: 'tel' })}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BrokerModal;
