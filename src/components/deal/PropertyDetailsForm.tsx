import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface PropertyDetailsFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const PROPERTY_TYPE_OPTIONS = [
  'Aircraft', 'Apartment Complex', 'Automobile', 'Commercial', 'Coop', 'Farm',
  'Four Family Res', 'Industrial', 'Land', 'Mix Use', 'Mobile Home', 'Office Condo',
  'Other', 'PUD', 'Ranch', 'Raw Land', 'Residential Condo', 'Residential Income 1-4',
  'Residential Income 5+', 'Resort', 'SFR', 'Single Family Res', 'Townhouse',
  'Two Family Res', 'Two to Four Family Res', 'Unsecured', 'Vacant', 'Industrial Condo',
  'Restaurant/Bar'
];

const OCCUPANCY_OPTIONS = ['Investor', 'Other', 'Owner', 'Primary Borrower', 'Secondary Borrower', 'Tenant', 'Unknown', 'Vacant', 'Non Owner Occupied'];
const PRIORITY_OPTIONS = ['1st', '2nd', '3rd', '4th', '5th'];
const FLOOD_ZONE_OPTIONS = ['Zone A', 'Zone AE', 'Zone AO', 'Zone X', 'Zone V', 'Zone VE', 'Zone D', 'Unknown'];
const PERFORMED_BY_OPTIONS = ['Broker', 'Third Party'];

const FIELD_KEYS = {
  description: 'property1.description',
  address: 'property1.address',
  street: 'property1.street',
  city: 'property1.city',
  state: 'property1.state',
  zip: 'property1.zip',
  county: 'property1.county',
  copyBorrowerAddress: 'property1.copy_borrower_address',
  primaryProperty: 'property1.primary_property',
  performedBy: 'property1.appraisal_performed_by',
  propertyType: 'property1.appraisal_property_type',
  occupancy: 'property1.appraisal_occupancy',
  ltv: 'property1.ltv',
  zoning: 'property1.zoning',
  appraisedValue: 'property1.appraised_value',
  pledgedEquity: 'property1.pledged_equity',
  appraisedDate: 'property1.appraised_date',
  priority: 'property1.priority',
  floodZone: 'property1.flood_zone',
  apn: 'property1.apn',
  thomasMap: 'property1.thomas_map',
} as const;

export const PropertyDetailsForm: React.FC<PropertyDetailsFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getFieldValue = (key: string) => values[key] || '';
  const sanitizeNumericValue = (value: string): string => value.replace(/[^0-9.-]/g, '');
  const handleCurrencyChange = (fieldKey: string, value: string) => onValueChange(fieldKey, sanitizeNumericValue(value));
  const handlePercentageChange = (fieldKey: string, value: string) => onValueChange(fieldKey, sanitizeNumericValue(value));

  const renderInlineField = (fieldKey: string, label: string, type: 'text' | 'date' = 'text') => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
      <Input
        value={getFieldValue(fieldKey)}
        onChange={(e) => onValueChange(fieldKey, e.target.value)}
        disabled={disabled}
        type={type}
        className="h-7 text-xs flex-1"
      />
    </div>
  );

  const renderInlineSelect = (fieldKey: string, label: string, options: string[], placeholder: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
      <Select value={getFieldValue(fieldKey)} onValueChange={(val) => onValueChange(fieldKey, val)} disabled={disabled}>
        <SelectTrigger className="h-7 text-xs flex-1">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-background border border-border z-50 max-h-60">
          {options.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderCurrencyField = (fieldKey: string, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
      <div className="flex items-center gap-1 flex-1">
        <span className="text-xs text-muted-foreground">$</span>
        <Input value={getFieldValue(fieldKey)} onChange={(e) => handleCurrencyChange(fieldKey, e.target.value)} disabled={disabled} className="h-7 text-xs text-right" inputMode="decimal" placeholder="0.00" />
      </div>
    </div>
  );

  const renderPercentageField = (fieldKey: string, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
      <div className="flex items-center gap-1 flex-1">
        <Input value={getFieldValue(fieldKey)} onChange={(e) => handlePercentageChange(fieldKey, e.target.value)} disabled={disabled} className="h-7 text-xs" inputMode="decimal" />
        <span className="text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0">
        {/* Left Column - Property Information */}
        <div className="space-y-1.5">
          <div className="border-b border-border pb-1 mb-2">
            <span className="font-semibold text-xs text-primary">Property Information</span>
          </div>
          {renderInlineField(FIELD_KEYS.description, 'Description')}
          <div className="pt-1">
            <span className="text-xs font-medium text-primary">Address</span>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="copy-borrower-address" checked={getFieldValue(FIELD_KEYS.copyBorrowerAddress) === 'true'} onCheckedChange={(checked) => onValueChange(FIELD_KEYS.copyBorrowerAddress, String(!!checked))} disabled={disabled} className="h-3.5 w-3.5" />
            <Label htmlFor="copy-borrower-address" className="text-xs text-primary">Copy Borrower's Address</Label>
          </div>
          {renderInlineField(FIELD_KEYS.street, 'Street')}
          {renderInlineField(FIELD_KEYS.city, 'City')}
          {renderInlineSelect(FIELD_KEYS.state, 'State', ['CA', 'TX', 'FL', 'NY', 'WA'], 'Select state')}
          {renderInlineField(FIELD_KEYS.zip, 'Zip Code')}
          {renderInlineField(FIELD_KEYS.county, 'County')}
          <div className="flex items-center gap-2 pt-1">
            <Checkbox id="primary-property" checked={getFieldValue(FIELD_KEYS.primaryProperty) === 'true'} onCheckedChange={(checked) => onValueChange(FIELD_KEYS.primaryProperty, String(!!checked))} disabled={disabled} className="h-3.5 w-3.5" />
            <Label htmlFor="primary-property" className="text-xs text-foreground">Primary Property</Label>
          </div>
        </div>

        {/* Right Column - Appraisal Information */}
        <div className="space-y-1.5">
          <div className="border-b border-border pb-1 mb-2">
            <span className="font-semibold text-xs text-primary">Appraisal Information</span>
          </div>
          {renderCurrencyField(FIELD_KEYS.appraisedValue, 'Appraised Value')}
          {renderInlineSelect(FIELD_KEYS.performedBy, 'Performed By', PERFORMED_BY_OPTIONS, 'Select...')}
          {renderInlineSelect(FIELD_KEYS.propertyType, 'Property Type', PROPERTY_TYPE_OPTIONS, 'Select type')}
          {renderInlineSelect(FIELD_KEYS.occupancy, 'Occupancy', OCCUPANCY_OPTIONS, 'Select')}
          {renderPercentageField(FIELD_KEYS.ltv, 'Loan To Value')}
          {renderInlineField(FIELD_KEYS.zoning, 'Zoning')}
          {renderCurrencyField(FIELD_KEYS.pledgedEquity, 'Pledged Equity')}
          {renderInlineField(FIELD_KEYS.appraisedDate, 'Appraisal Date', 'date')}
          {renderInlineSelect(FIELD_KEYS.priority, 'Priority', PRIORITY_OPTIONS, 'Select')}
          {renderInlineSelect(FIELD_KEYS.floodZone, 'Flood Zone', FLOOD_ZONE_OPTIONS, 'Select')}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsForm;
