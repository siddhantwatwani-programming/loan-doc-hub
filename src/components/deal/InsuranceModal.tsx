import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { InsuranceData } from './InsuranceTableView';

interface InsuranceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insurance: InsuranceData | null;
  onSave: (insurance: InsuranceData) => void;
  isEdit: boolean;
  propertyOptions?: { id: string; label: string }[];
}

const INSURANCE_DESCRIPTION_OPTIONS = [
  'Earthquake Insurance',
  'Fire Insurance',
  'Flood Insurance',
  'Hurricane',
  'Force-Placed CPI',
  'Hazard',
  'Flood',
  'Wind'
];

const getDefaultInsurance = (): InsuranceData => ({
  id: '',
  property: '',
  description: '',
  insuredName: '',
  companyName: '',
  policyNumber: '',
  expiration: '',
  coverage: '',
  active: true,
  agentName: '',
  businessAddress: '',
  phoneNumber: '',
  faxNumber: '',
  email: '',
  note: '',
});

export const InsuranceModal: React.FC<InsuranceModalProps> = ({
  open,
  onOpenChange,
  insurance,
  onSave,
  isEdit,
  propertyOptions = [],
}) => {
  const [formData, setFormData] = useState<InsuranceData>(getDefaultInsurance());
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (open) {
      if (insurance) {
        setFormData(insurance);
      } else {
        setFormData(getDefaultInsurance());
      }
      setActiveTab('general');
    }
  }, [open, insurance]);

  const handleChange = (field: keyof InsuranceData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit Insurance' : 'New Insurance'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Insurance Policy Information */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <span className="font-semibold text-sm text-primary">Insurance Policy Information</span>
                </div>

                <div>
                  <Label className="text-sm text-foreground">Property</Label>
                  <Select
                    value={formData.property}
                    onValueChange={(val) => handleChange('property', val)}
                  >
                    <SelectTrigger className="h-9 text-sm mt-1">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {propertyOptions.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-foreground">Description</Label>
                  <Select
                    value={formData.description}
                    onValueChange={(val) => handleChange('description', val)}
                  >
                    <SelectTrigger className="h-9 text-sm mt-1">
                      <SelectValue placeholder="Select description" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {INSURANCE_DESCRIPTION_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-foreground">Insured's Name</Label>
                  <Input
                    value={formData.insuredName}
                    onChange={(e) => handleChange('insuredName', e.target.value)}
                    className="h-9 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">Company Name</Label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="h-9 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">Policy Number</Label>
                  <Input
                    value={formData.policyNumber}
                    onChange={(e) => handleChange('policyNumber', e.target.value)}
                    className="h-9 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">Expiration</Label>
                  <Input
                    type="date"
                    value={formData.expiration}
                    onChange={(e) => handleChange('expiration', e.target.value)}
                    className="h-9 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">Coverage</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      value={formData.coverage}
                      onChange={(e) => handleChange('coverage', e.target.value)}
                      className="h-9 text-sm text-right"
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="modal-insurance-active"
                    checked={formData.active}
                    onCheckedChange={(checked) => handleChange('active', !!checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="modal-insurance-active" className="text-sm text-foreground">
                    Active
                  </Label>
                </div>
              </div>

              {/* Right Column - Insurance Agent Information */}
              <div className="space-y-4">
                <div className="border-b border-border pb-2">
                  <span className="font-semibold text-sm text-primary">Insurance Agent Information</span>
                </div>

                <div>
                  <Label className="text-sm text-foreground">Agent's Name</Label>
                  <Input
                    value={formData.agentName}
                    onChange={(e) => handleChange('agentName', e.target.value)}
                    className="h-9 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">Bus. Address</Label>
                  <Input
                    value={formData.businessAddress}
                    onChange={(e) => handleChange('businessAddress', e.target.value)}
                    className="h-9 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">Phone Number</Label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    className="h-9 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">Fax Number</Label>
                  <Input
                    value={formData.faxNumber}
                    onChange={(e) => handleChange('faxNumber', e.target.value)}
                    className="h-9 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">E-mail</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="h-9 text-sm mt-1"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <div className="border-b border-border pb-2 mb-4">
              <span className="font-semibold text-sm text-primary">Notes</span>
            </div>
            <Textarea
              value={formData.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="Enter notes about this insurance policy..."
              className="min-h-[200px]"
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InsuranceModal;
