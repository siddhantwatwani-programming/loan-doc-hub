import React, { useState, useEffect, useCallback } from 'react';
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
import { ArrowLeft, Home } from 'lucide-react';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface PropertyDetailsFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
  propertyIndex?: number;
  onBackToGrid?: () => void;
}

const PROPERTY_TYPE_OPTIONS = [
  'Aircraft', 'Apartment Complex', 'Automobile', 'Commercial', 'Coop', 'Farm',
  'Four Family Res', 'Industrial', 'Land', 'Mix Use', 'Mobile Home', 'Office Condo',
  'Other', 'PUD', 'Ranch', 'Raw Land', 'Residential Condo', 'Residential Income 1-4',
  'Residential Income 5+', 'Resort', 'SFR', 'Single Family Res', 'Townhouse',
  'Two Family Res', 'Two to Four Family Res', 'Unsecured', 'Vacant', 'Industrial Condo',
  'Restaurant/Bar'
];

const OCCUPANCY_OPTIONS = [
  'Investor', 'Other', 'Owner', 'Primary Borrower', 'Secondary Borrower',
  'Tenant', 'Unknown', 'Vacant', 'Non Owner Occupied', 'Owner Occupied',
  'Investment', 'Second Home'
];

const PRIORITY_OPTIONS = ['1st', '2nd', '3rd', '4th', '5th'];

const FLOOD_ZONE_OPTIONS = ['Zone A', 'Zone AE', 'Zone AO', 'Zone X', 'Zone V', 'Zone VE', 'Zone D', 'Unknown'];

const PERFORMED_BY_OPTIONS = ['Broker', 'Third Party'];

// Field key mapping - uses property1.* prefix (will be remapped by parent)
const FIELD_KEYS = {
  // Address
  address: 'property1.address',
  street: 'property1.street',
  city: 'property1.city',
  state: 'property1.state',
  zip: 'property1.zip',
  county: 'property1.county',
  copyBorrowerAddress: 'property1.copy_borrower_address',
  primaryProperty: 'property1.primary_property',
  description: 'property1.description',
  // Appraisal
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
} as const;

// US States for dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

export const PropertyDetailsForm: React.FC<PropertyDetailsFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  propertyIndex = 1,
  onBackToGrid,
}) => {
  const getFieldValue = (key: string) => values[key] || '';

  return (
    <div className="p-6 space-y-6">
      {/* Header with Back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBackToGrid && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToGrid}
              className="gap-1 mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Grid
            </Button>
          )}
          <Home className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg text-foreground">
            {propertyIndex === 1 ? 'New Property' : `Property ${propertyIndex}`}
          </span>
        </div>
      </div>

      {/* Property Details Card */}
      <div className="border border-border rounded-lg p-4 space-y-4">
        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column - Address */}
          <div className="space-y-3">
            <div className="border-b border-border pb-2 mb-3">
              <span className="font-semibold text-sm text-primary">Address</span>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm text-foreground">Description</Label>
                <Input
                  value={getFieldValue(FIELD_KEYS.description)}
                  onChange={(e) => onValueChange(FIELD_KEYS.description, e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm mt-1"
                  placeholder="Property description"
                />
              </div>

              <div>
                <Label className="text-sm text-foreground">Street</Label>
                <Input
                  value={getFieldValue(FIELD_KEYS.street)}
                  onChange={(e) => onValueChange(FIELD_KEYS.street, e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-sm text-foreground">City</Label>
                <Input
                  value={getFieldValue(FIELD_KEYS.city)}
                  onChange={(e) => onValueChange(FIELD_KEYS.city, e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-sm text-foreground">State</Label>
                <Select
                  value={getFieldValue(FIELD_KEYS.state)}
                  onValueChange={(val) => onValueChange(FIELD_KEYS.state, val)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50 max-h-60">
                    {US_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-foreground">Zip Code</Label>
                <Input
                  value={getFieldValue(FIELD_KEYS.zip)}
                  onChange={(e) => onValueChange(FIELD_KEYS.zip, e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-sm text-foreground">County</Label>
                <Input
                  value={getFieldValue(FIELD_KEYS.county)}
                  onChange={(e) => onValueChange(FIELD_KEYS.county, e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm mt-1"
                />
              </div>

              <Button
                variant="link"
                className="text-primary p-0 h-auto text-sm"
                disabled={disabled}
              >
                Copy Borrower's Address
              </Button>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="primary-property"
                  checked={getFieldValue(FIELD_KEYS.primaryProperty) === 'true'}
                  onCheckedChange={(checked) =>
                    onValueChange(FIELD_KEYS.primaryProperty, checked ? 'true' : 'false')
                  }
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label htmlFor="primary-property" className="text-sm text-foreground">
                  Primary Property
                </Label>
              </div>
            </div>
          </div>

          {/* Right Column - Appraisal Information */}
          <div className="space-y-3">
            <div className="border-b border-border pb-2 mb-3">
              <span className="font-semibold text-sm text-primary">Appraisal / Broker Price Opinion Value</span>
            </div>

            <div>
              <Label className="text-sm text-foreground">Performed By:</Label>
              <Select
                value={getFieldValue(FIELD_KEYS.performedBy)}
                onValueChange={(val) => onValueChange(FIELD_KEYS.performedBy, val)}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {PERFORMED_BY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-foreground">Property Type</Label>
              <Select
                value={getFieldValue(FIELD_KEYS.propertyType)}
                onValueChange={(val) => onValueChange(FIELD_KEYS.propertyType, val)}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50 max-h-60">
                  {PROPERTY_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-foreground">Occupancy</Label>
              <Select
                value={getFieldValue(FIELD_KEYS.occupancy)}
                onValueChange={(val) => onValueChange(FIELD_KEYS.occupancy, val)}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue placeholder="Select occupancy" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50 max-h-60">
                  {OCCUPANCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-foreground">LTV (Loan To Value)</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    value={getFieldValue(FIELD_KEYS.ltv)}
                    onChange={(e) => onValueChange(FIELD_KEYS.ltv, e.target.value)}
                    disabled={disabled}
                    className="h-8 text-sm"
                    inputMode="decimal"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>

              <div>
                <Label className="text-sm text-foreground">Zoning</Label>
                <Input
                  value={getFieldValue(FIELD_KEYS.zoning)}
                  onChange={(e) => onValueChange(FIELD_KEYS.zoning, e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-foreground">Appraised Value</Label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    value={getFieldValue(FIELD_KEYS.appraisedValue)}
                    onChange={(e) => onValueChange(FIELD_KEYS.appraisedValue, e.target.value)}
                    disabled={disabled}
                    className="h-8 text-sm text-right"
                    inputMode="decimal"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm text-foreground">Pledged Equity</Label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    value={getFieldValue(FIELD_KEYS.pledgedEquity)}
                    onChange={(e) => onValueChange(FIELD_KEYS.pledgedEquity, e.target.value)}
                    disabled={disabled}
                    className="h-8 text-sm text-right"
                    inputMode="decimal"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm text-foreground">Appraised Date</Label>
              <Input
                type="date"
                value={getFieldValue(FIELD_KEYS.appraisedDate)}
                onChange={(e) => onValueChange(FIELD_KEYS.appraisedDate, e.target.value)}
                disabled={disabled}
                className="h-8 text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-sm text-foreground">Priority</Label>
              <Select
                value={getFieldValue(FIELD_KEYS.priority)}
                onValueChange={(val) => onValueChange(FIELD_KEYS.priority, val)}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-foreground">Flood Zone</Label>
              <Select
                value={getFieldValue(FIELD_KEYS.floodZone)}
                onValueChange={(val) => onValueChange(FIELD_KEYS.floodZone, val)}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-sm mt-1">
                  <SelectValue placeholder="Select flood zone" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {FLOOD_ZONE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsForm;
