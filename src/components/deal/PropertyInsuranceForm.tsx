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
  'Earthquake Insurance',
  'Fire Insurance',
  'Flood Insurance',
  'Hurricane',
  'Force-Placed CPI',
  'Hazard',
  'Flood',
  'Wind'
];

// Field key mapping as specified
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
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getFieldValue = (key: string) => values[key] || '';

  // Pulls in property addresses for the dropdown
  const propertyAddress = values['property1.street'] || 'Unassigned';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">New Insurance</span>
      </div>

      {/* Property Selection - shows available property addresses */}
      {propertyAddress !== 'Unassigned' && (
        <div className="bg-muted/30 px-3 py-2 rounded text-sm">
          <span className="text-muted-foreground">Property: </span>
          <span className="text-foreground font-medium">{propertyAddress}</span>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-8">
        {/* Left Column - Insurance Policy Information */}
        <div className="space-y-4">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">Insurance Policy Information</span>
          </div>

          <div>
            <Label className="text-sm text-foreground">Property</Label>
            <Select
              value={getFieldValue('Property.Insurance.Property')}
              onValueChange={(val) => onValueChange('Property.Insurance.Property', val)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-sm mt-1">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {propertyAddress !== 'Unassigned' && (
                  <SelectItem value={propertyAddress}>{propertyAddress}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-foreground">Description</Label>
            <Select
              value={getFieldValue(FIELD_KEYS.description)}
              onValueChange={(val) => onValueChange(FIELD_KEYS.description, val)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-sm mt-1">
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
              value={getFieldValue(FIELD_KEYS.insuredName)}
              onChange={(e) => onValueChange(FIELD_KEYS.insuredName, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Company Name</Label>
            <Input
              value={getFieldValue(FIELD_KEYS.companyName)}
              onChange={(e) => onValueChange(FIELD_KEYS.companyName, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Policy Number</Label>
            <Input
              value={getFieldValue(FIELD_KEYS.policyNumber)}
              onChange={(e) => onValueChange(FIELD_KEYS.policyNumber, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Expiration</Label>
            <Input
              type="date"
              value={getFieldValue(FIELD_KEYS.expiration)}
              onChange={(e) => onValueChange(FIELD_KEYS.expiration, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Coverage</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                value={getFieldValue(FIELD_KEYS.coverage)}
                onChange={(e) => onValueChange(FIELD_KEYS.coverage, e.target.value)}
                disabled={disabled}
                className="h-8 text-sm text-right"
                inputMode="decimal"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="insurance-active"
              checked={getFieldValue(FIELD_KEYS.active) === 'true'}
              onCheckedChange={(checked) => onValueChange(FIELD_KEYS.active, checked ? 'true' : 'false')}
              disabled={disabled}
              className="h-4 w-4"
            />
            <Label htmlFor="insurance-active" className="text-sm text-foreground">
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
              value={getFieldValue(FIELD_KEYS.agentName)}
              onChange={(e) => onValueChange(FIELD_KEYS.agentName, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Bus. Address</Label>
            <Input
              value={getFieldValue(FIELD_KEYS.businessAddress)}
              onChange={(e) => onValueChange(FIELD_KEYS.businessAddress, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Phone Number</Label>
            <Input
              value={getFieldValue(FIELD_KEYS.phoneNumber)}
              onChange={(e) => onValueChange(FIELD_KEYS.phoneNumber, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">Fax Number</Label>
            <Input
              value={getFieldValue(FIELD_KEYS.faxNumber)}
              onChange={(e) => onValueChange(FIELD_KEYS.faxNumber, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>

          <div>
            <Label className="text-sm text-foreground">E-mail</Label>
            <Input
              type="email"
              value={getFieldValue(FIELD_KEYS.email)}
              onChange={(e) => onValueChange(FIELD_KEYS.email, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Insurance information is used to track property coverage requirements and agent contacts.
        </p>
      </div>
    </div>
  );
};

export default PropertyInsuranceForm;
