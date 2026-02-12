import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Home } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface PropertyInsuranceFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const INSURANCE_DESCRIPTION_OPTIONS = [
  'Earthquake Insurance', 'Fire Insurance', 'Flood Insurance', 'Hurricane',
  'Force-Placed CPI', 'Hazard', 'Flood', 'Wind'
];

const FIELD_KEYS = {
  description: 'property1.insurance_description',
  insuredName: 'property1.insured_s_name',
  companyName: 'property1.insurance_company_name',
  policyNumber: 'property1.insurance_policy_number',
  expiration: 'property1.insurance_expiration',
  coverage: 'property1.insurance_coverage',
  active: 'property1.insurance_active',
  agentName: 'property1.agent_s_name',
  businessAddress: 'property1.insurance_business_address',
  phoneNumber: 'property1.insurance_phone_number',
  faxNumber: 'property1.insurance_fax_number',
  email: 'property1.insurance_e_mail',
} as const;

export const PropertyInsuranceForm: React.FC<PropertyInsuranceFormProps> = ({
  fields, values, onValueChange, showValidation = false, disabled = false,
}) => {
  const getFieldValue = (key: string) => values[key] || '';
  const propertyAddress = values['property1.street'] || 'Unassigned';

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base text-foreground">New Insurance</span>
      </div>

      {propertyAddress !== 'Unassigned' && (
        <div className="bg-muted/30 px-3 py-1.5 rounded text-sm">
          <span className="text-muted-foreground">Property: </span>
          <span className="text-foreground font-medium">{propertyAddress}</span>
        </div>
      )}

      <div className="form-section-header">Insurance Policy Information</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Property</Label>
          <Select value={getFieldValue('Property.Insurance.Property')} onValueChange={(val) => onValueChange('Property.Insurance.Property', val)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {propertyAddress !== 'Unassigned' && (<SelectItem value={propertyAddress}>{propertyAddress}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Description</Label>
          <Select value={getFieldValue(FIELD_KEYS.description)} onValueChange={(val) => onValueChange(FIELD_KEYS.description, val)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">{INSURANCE_DESCRIPTION_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Insured's Name</Label>
          <Input value={getFieldValue(FIELD_KEYS.insuredName)} onChange={(e) => onValueChange(FIELD_KEYS.insuredName, e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Company Name</Label>
          <Input value={getFieldValue(FIELD_KEYS.companyName)} onChange={(e) => onValueChange(FIELD_KEYS.companyName, e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Policy Number</Label>
          <Input value={getFieldValue(FIELD_KEYS.policyNumber)} onChange={(e) => onValueChange(FIELD_KEYS.policyNumber, e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Expiration</Label>
          <Input type="date" value={getFieldValue(FIELD_KEYS.expiration)} onChange={(e) => onValueChange(FIELD_KEYS.expiration, e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Coverage</Label>
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input value={getFieldValue(FIELD_KEYS.coverage)} onChange={(e) => onValueChange(FIELD_KEYS.coverage, e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.00" />
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label"></Label>
          <div className="flex items-center gap-1.5 flex-1">
            <Checkbox id="insurance-active" checked={getFieldValue(FIELD_KEYS.active) === 'true'} onCheckedChange={(checked) => onValueChange(FIELD_KEYS.active, checked ? 'true' : 'false')} disabled={disabled} className="h-4 w-4" />
            <Label htmlFor="insurance-active" className="text-sm">Active</Label>
          </div>
        </div>
      </div>

      <div className="form-section-header">Insurance Agent Information</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Agent's Name</Label>
          <Input value={getFieldValue(FIELD_KEYS.agentName)} onChange={(e) => onValueChange(FIELD_KEYS.agentName, e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Bus. Address</Label>
          <Input value={getFieldValue(FIELD_KEYS.businessAddress)} onChange={(e) => onValueChange(FIELD_KEYS.businessAddress, e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Phone Number</Label>
          <Input value={getFieldValue(FIELD_KEYS.phoneNumber)} onChange={(e) => onValueChange(FIELD_KEYS.phoneNumber, e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Fax Number</Label>
          <Input value={getFieldValue(FIELD_KEYS.faxNumber)} onChange={(e) => onValueChange(FIELD_KEYS.faxNumber, e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">E-mail</Label>
          <Input type="email" value={getFieldValue(FIELD_KEYS.email)} onChange={(e) => onValueChange(FIELD_KEYS.email, e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Insurance information is used to track property coverage requirements and agent contacts.</p>
      </div>
    </div>
  );
};

export default PropertyInsuranceForm;
