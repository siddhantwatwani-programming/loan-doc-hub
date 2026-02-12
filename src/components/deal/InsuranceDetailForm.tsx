import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { InsuranceData } from './InsuranceTableView';

interface InsuranceDetailFormProps {
  insurance: InsuranceData;
  onChange: (field: keyof InsuranceData, value: string | boolean) => void;
  disabled?: boolean;
  propertyOptions?: { id: string; label: string }[];
}

const INSURANCE_DESCRIPTION_OPTIONS = [
  'Earthquake Insurance', 'Fire Insurance', 'Flood Insurance', 'Hurricane',
  'Force-Placed CPI', 'Hazard', 'Flood', 'Wind'
];

export const InsuranceDetailForm: React.FC<InsuranceDetailFormProps> = ({
  insurance, onChange, disabled = false, propertyOptions = [],
}) => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base text-foreground">General</span>
      </div>

      <div className="form-section-header">Insurance Policy Information</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Property</Label>
          <Select value={insurance.property} onValueChange={(val) => onChange('property', val)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {propertyOptions.map(opt => (<SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Description</Label>
          <Select value={insurance.description} onValueChange={(val) => onChange('description', val)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">{INSURANCE_DESCRIPTION_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Insured's Name</Label>
          <Input value={insurance.insuredName} onChange={(e) => onChange('insuredName', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Company Name</Label>
          <Input value={insurance.companyName} onChange={(e) => onChange('companyName', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Policy Number</Label>
          <Input value={insurance.policyNumber} onChange={(e) => onChange('policyNumber', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Expiration</Label>
          <Input type="date" value={insurance.expiration} onChange={(e) => onChange('expiration', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Coverage</Label>
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input value={insurance.coverage} onChange={(e) => onChange('coverage', e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.00" />
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label"></Label>
          <div className="flex items-center gap-1.5 flex-1">
            <Checkbox id="detail-insurance-active" checked={insurance.active} onCheckedChange={(checked) => onChange('active', !!checked)} disabled={disabled} className="h-4 w-4" />
            <Label htmlFor="detail-insurance-active" className="text-sm">Active</Label>
          </div>
        </div>
      </div>

      <div className="form-section-header">Insurance Agent Information</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Agent's Name</Label>
          <Input value={insurance.agentName} onChange={(e) => onChange('agentName', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Bus. Address</Label>
          <Input value={insurance.businessAddress} onChange={(e) => onChange('businessAddress', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Phone Number</Label>
          <Input value={insurance.phoneNumber} onChange={(e) => onChange('phoneNumber', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Fax Number</Label>
          <Input value={insurance.faxNumber} onChange={(e) => onChange('faxNumber', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">E-mail</Label>
          <Input type="email" value={insurance.email} onChange={(e) => onChange('email', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Insurance information is used to track property coverage requirements and agent contacts.</p>
      </div>
    </div>
  );
};

export default InsuranceDetailForm;
