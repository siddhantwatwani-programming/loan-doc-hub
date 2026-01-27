import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Home, Trash2 } from 'lucide-react';
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

const OCCUPANCY_OPTIONS = ['Owner Occupied', 'Investment', 'Second Home', 'Vacant'];

const PRIORITY_OPTIONS = ['1st', '2nd', '3rd', '4th', '5th'];

const FLOOD_ZONE_OPTIONS = ['Zone A', 'Zone AE', 'Zone AO', 'Zone X', 'Zone V', 'Zone VE', 'Zone D', 'Unknown'];

const PERFORMED_BY_OPTIONS = ['Broker', 'Third Party'];

interface PropertyEntry {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  isPrimary: boolean;
}

export const PropertyDetailsForm: React.FC<PropertyDetailsFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const [properties, setProperties] = useState<PropertyEntry[]>([
    {
      id: '1',
      street: values['Property.Address.Street'] || '',
      city: values['Property.Address.City'] || '',
      state: values['Property.Address.State'] || '',
      zipCode: values['Property.Address.ZipCode'] || '',
      county: values['Property.Address.County'] || '',
      isPrimary: true,
    }
  ]);

  const getFieldValue = (key: string) => values[key] || '';

  const handleAddProperty = () => {
    const newProperty: PropertyEntry = {
      id: Date.now().toString(),
      street: '',
      city: '',
      state: '',
      zipCode: '',
      county: '',
      isPrimary: false,
    };
    setProperties([...properties, newProperty]);
  };

  const handleRemoveProperty = (id: string) => {
    if (properties.length <= 1) return;
    setProperties(properties.filter(p => p.id !== id));
  };

  const handlePropertyChange = (id: string, field: keyof PropertyEntry, value: string | boolean) => {
    setProperties(properties.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
    // For the first property, also update the main values
    const property = properties.find(p => p.id === id);
    if (property?.isPrimary || id === '1') {
      const fieldKeyMap: Record<string, string> = {
        street: 'Property.Address.Street',
        city: 'Property.Address.City',
        state: 'Property.Address.State',
        zipCode: 'Property.Address.ZipCode',
        county: 'Property.Address.County',
      };
      if (fieldKeyMap[field as string]) {
        onValueChange(fieldKeyMap[field as string], value as string);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Add Property Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg text-foreground">New Property</span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddProperty}
          disabled={disabled}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      {/* Multiple Properties */}
      {properties.map((property, index) => (
        <div key={property.id} className="border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Property {index + 1}</span>
            {properties.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveProperty(property.id)}
                disabled={disabled}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column - Address */}
            <div className="space-y-3">
              <div className="border-b border-border pb-2 mb-3">
                <span className="font-semibold text-sm text-primary">Address</span>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-foreground">Street</Label>
                  <Input
                    value={property.street}
                    onChange={(e) => handlePropertyChange(property.id, 'street', e.target.value)}
                    disabled={disabled}
                    className="h-8 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">City</Label>
                  <Input
                    value={property.city}
                    onChange={(e) => handlePropertyChange(property.id, 'city', e.target.value)}
                    disabled={disabled}
                    className="h-8 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">State</Label>
                  <Select
                    value={property.state}
                    onValueChange={(val) => handlePropertyChange(property.id, 'state', val)}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-8 text-sm mt-1">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      <SelectItem value="CA">California</SelectItem>
                      <SelectItem value="TX">Texas</SelectItem>
                      <SelectItem value="FL">Florida</SelectItem>
                      <SelectItem value="NY">New York</SelectItem>
                      <SelectItem value="WA">Washington</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm text-foreground">Zip Code</Label>
                  <Input
                    value={property.zipCode}
                    onChange={(e) => handlePropertyChange(property.id, 'zipCode', e.target.value)}
                    disabled={disabled}
                    className="h-8 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">County</Label>
                  <Input
                    value={property.county}
                    onChange={(e) => handlePropertyChange(property.id, 'county', e.target.value)}
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
                    id={`primary-property-${property.id}`}
                    checked={property.isPrimary}
                    onCheckedChange={(checked) => handlePropertyChange(property.id, 'isPrimary', !!checked)}
                    disabled={disabled}
                    className="h-4 w-4"
                  />
                  <Label htmlFor={`primary-property-${property.id}`} className="text-sm text-foreground">
                    Primary Property
                  </Label>
                </div>
              </div>
            </div>

            {/* Right Column - Appraisal Information */}
            <div className="space-y-3">
              <div className="border-b border-border pb-2 mb-3">
                <span className="font-semibold text-sm text-primary">Appraisal / Broker Price Opinion</span>
              </div>

              <div>
                <Label className="text-sm text-foreground">Performed By:</Label>
                <Select
                  value={getFieldValue('Property.Appraisal.PerformedBy')}
                  onValueChange={(val) => onValueChange('Property.Appraisal.PerformedBy', val)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {PERFORMED_BY_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-foreground">Property Type</Label>
                <Select
                  value={getFieldValue('Property.PropertyType')}
                  onValueChange={(val) => onValueChange('Property.PropertyType', val)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50 max-h-60">
                    {PROPERTY_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-foreground">Occupancy</Label>
                <Select
                  value={getFieldValue('Property.Occupancy')}
                  onValueChange={(val) => onValueChange('Property.Occupancy', val)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue placeholder="Select occupancy" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {OCCUPANCY_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-foreground">LTV</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <Input
                      value={getFieldValue('Property.LTV')}
                      onChange={(e) => onValueChange('Property.LTV', e.target.value)}
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
                    value={getFieldValue('Property.Zoning')}
                    onChange={(e) => onValueChange('Property.Zoning', e.target.value)}
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
                      value={getFieldValue('Property.AppraisedValue')}
                      onChange={(e) => onValueChange('Property.AppraisedValue', e.target.value)}
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
                      value={getFieldValue('Property.PledgedEquity')}
                      onChange={(e) => onValueChange('Property.PledgedEquity', e.target.value)}
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
                  value={getFieldValue('Property.AppraisedDate')}
                  onChange={(e) => onValueChange('Property.AppraisedDate', e.target.value)}
                  disabled={disabled}
                  className="h-8 text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-sm text-foreground">Priority</Label>
                <Select
                  value={getFieldValue('Property.Priority')}
                  onValueChange={(val) => onValueChange('Property.Priority', val)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {PRIORITY_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm text-foreground">Flood Zone</Label>
                <Select
                  value={getFieldValue('Property.FloodZone')}
                  onValueChange={(val) => onValueChange('Property.FloodZone', val)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue placeholder="Select flood zone" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {FLOOD_ZONE_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertyDetailsForm;
