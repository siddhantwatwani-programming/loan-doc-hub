import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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
  'Earthquake Insurance', 'Fire Insurance', 'Flood Insurance', 'Hurricane',
  'Force-Placed CPI', 'Hazard', 'Flood', 'Wind'
];

const getDefaultInsurance = (): InsuranceData => ({
  id: '', property: '', description: '', insuredName: '', companyName: '', policyNumber: '',
  expiration: '', coverage: '', active: true, agentName: '', businessAddress: '',
  phoneNumber: '', faxNumber: '', email: '', note: '',
});

export const InsuranceModal: React.FC<InsuranceModalProps> = ({ open, onOpenChange, insurance, onSave, isEdit, propertyOptions = [] }) => {
  const [formData, setFormData] = useState<InsuranceData>(getDefaultInsurance());

  useEffect(() => {
    if (open) setFormData(insurance ? insurance : getDefaultInsurance());
  }, [open, insurance]);

  const handleChange = (field: keyof InsuranceData, value: string | boolean) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSave = () => { onSave(formData); onOpenChange(false); };

  const renderInlineField = (field: keyof InsuranceData, label: string, props: Record<string, any> = {}) => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
      <Input value={String(formData[field] || '')} onChange={(e) => handleChange(field, e.target.value)} className="h-7 text-xs flex-1" {...props} />
    </div>
  );

  const renderInlineSelect = (field: keyof InsuranceData, label: string, options: string[] | { id: string; label: string }[], placeholder: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
      <Select value={String(formData[field] || '')} onValueChange={(val) => handleChange(field, val)}>
        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent className="bg-background border border-border z-50">
          {options.map(opt => {
            const v = typeof opt === 'string' ? opt : opt.id;
            const l = typeof opt === 'string' ? opt : opt.label;
            return <SelectItem key={v} value={v}>{l}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            {isEdit ? 'Edit Insurance' : 'New Insurance'}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
            {/* Left Column */}
            <div className="space-y-1.5">
              <div className="border-b border-border pb-1 mb-2">
                <span className="font-semibold text-xs text-primary">Insurance Policy Information</span>
              </div>
              {renderInlineSelect('property', 'Property', [{ id: 'unassigned', label: 'Unassigned' }, ...propertyOptions], 'Unassigned')}
              {renderInlineSelect('description', 'Description', INSURANCE_DESCRIPTION_OPTIONS, 'Select')}
              {renderInlineField('insuredName', "Insured's Name")}
              {renderInlineField('companyName', 'Company Name')}
              {renderInlineField('policyNumber', 'Policy Number')}
              {renderInlineField('expiration', 'Expiration', { type: 'date' })}
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs text-foreground">Coverage</Label>
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-xs text-muted-foreground">$</span>
                  <Input value={String(formData.coverage || '')} onChange={(e) => handleChange('coverage', e.target.value)} className="h-7 text-xs text-right" inputMode="decimal" placeholder="0.00" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox id="modal-insurance-active" checked={formData.active} onCheckedChange={(checked) => handleChange('active', !!checked)} className="h-3.5 w-3.5" />
                <Label htmlFor="modal-insurance-active" className="text-xs text-foreground">Active</Label>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-1.5">
              <div className="border-b border-border pb-1 mb-2">
                <span className="font-semibold text-xs text-primary">Insurance Agent Information</span>
              </div>
              {renderInlineField('agentName', "Agent's Name")}
              {renderInlineField('businessAddress', 'Bus. Address')}
              {renderInlineField('phoneNumber', 'Phone Number')}
              {renderInlineField('faxNumber', 'Fax Number')}
              {renderInlineField('email', 'E-mail', { type: 'email' })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InsuranceModal;
