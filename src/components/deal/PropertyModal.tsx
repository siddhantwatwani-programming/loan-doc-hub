import React, { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PropertyData } from './PropertiesTableView';

interface PropertyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: PropertyData | null;
  onSave: (property: PropertyData) => void;
  isEdit?: boolean;
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
  'Owner Occupied', 'Investment', 'Second Home', 'Vacant',
  'Investor', 'Other', 'Primary Borrower', 'Secondary Borrower',
  'Tenant', 'Unknown', 'Non Owner Occupied'
];

const PRIORITY_OPTIONS = ['1st', '2nd', '3rd', '4th', '5th'];

const FLOOD_ZONE_OPTIONS = ['Zone A', 'Zone AE', 'Zone AO', 'Zone X', 'Zone V', 'Zone VE', 'Zone D', 'Unknown'];

const PERFORMED_BY_OPTIONS = ['Broker', 'Third Party'];

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

const generatePropertyId = () => `property_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getEmptyProperty = (): PropertyData => ({
  id: generatePropertyId(),
  isPrimary: false,
  description: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  county: '',
  propertyType: '',
  occupancy: '',
  appraisedValue: '',
  appraisedDate: '',
  ltv: '',
  apn: '',
  loanPriority: '',
});

export const PropertyModal: React.FC<PropertyModalProps> = ({
  open,
  onOpenChange,
  property,
  onSave,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<PropertyData>(getEmptyProperty());
  const [activeTab, setActiveTab] = useState('general');
  
  // Additional form fields not in PropertyData
  const [performedBy, setPerformedBy] = useState('');
  const [zoning, setZoning] = useState('');
  const [pledgedEquity, setPledgedEquity] = useState('');
  const [floodZone, setFloodZone] = useState('');

  useEffect(() => {
    if (open) {
      if (property) {
        setFormData(property);
      } else {
        setFormData(getEmptyProperty());
      }
      setActiveTab('general');
      setPerformedBy('');
      setZoning('');
      setPledgedEquity('');
      setFloodZone('');
    }
  }, [open, property]);

  const handleFieldChange = (field: keyof PropertyData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  // Sanitize numeric input - strip all non-numeric characters except decimal point and minus
  const sanitizeNumericValue = (value: string): string => {
    return value.replace(/[^0-9.-]/g, '');
  };
  
  // Handle currency input change - store raw numeric value only
  const handleCurrencyChange = (field: keyof PropertyData, value: string) => {
    const sanitized = sanitizeNumericValue(value);
    setFormData(prev => ({ ...prev, [field]: sanitized }));
  };
  
  // Handle percentage input change - store raw numeric value only
  const handlePercentageChange = (field: keyof PropertyData, value: string) => {
    const sanitized = sanitizeNumericValue(value);
    setFormData(prev => ({ ...prev, [field]: sanitized }));
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
            <Home className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit Property' : 'Add New Property'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="general">General</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Address */}
              <div className="space-y-3">
                <div className="border-b border-border pb-2 mb-3">
                  <span className="font-semibold text-sm text-primary">Address</span>
                </div>

                <div>
                  <Label className="text-sm text-foreground">Street</Label>
                  <Input
                    value={formData.street}
                    onChange={(e) => handleFieldChange('street', e.target.value)}
                    className="h-8 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    className="h-8 text-sm mt-1"
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
                  <Label className="text-sm text-foreground">Zip Code</Label>
                  <Input
                    value={formData.zipCode}
                    onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                    className="h-8 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">County</Label>
                  <Input
                    value={formData.county}
                    onChange={(e) => handleFieldChange('county', e.target.value)}
                    className="h-8 text-sm mt-1"
                  />
                </div>

                <Button
                  variant="link"
                  className="text-primary p-0 h-auto text-sm"
                  type="button"
                >
                  Copy Borrower's Address
                </Button>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="modal-primary-property"
                    checked={formData.isPrimary}
                    onCheckedChange={(checked) => handleFieldChange('isPrimary', !!checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="modal-primary-property" className="text-sm text-foreground">
                    Primary Property
                  </Label>
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
                    value={performedBy}
                    onValueChange={setPerformedBy}
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
                    value={formData.propertyType}
                    onValueChange={(val) => handleFieldChange('propertyType', val)}
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
                    value={formData.occupancy}
                    onValueChange={(val) => handleFieldChange('occupancy', val)}
                  >
                    <SelectTrigger className="h-8 text-sm mt-1">
                      <SelectValue placeholder="Select occupancy" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50 max-h-60">
                      {OCCUPANCY_OPTIONS.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-foreground">Loan To Value</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        value={formData.ltv}
                        onChange={(e) => handlePercentageChange('ltv', e.target.value)}
                        className="h-8 text-sm"
                        inputMode="decimal"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-foreground">Zoning</Label>
                    <Input
                      value={zoning}
                      onChange={(e) => setZoning(e.target.value)}
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
                        value={formData.appraisedValue}
                        onChange={(e) => handleCurrencyChange('appraisedValue', e.target.value)}
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
                        value={pledgedEquity}
                        onChange={(e) => setPledgedEquity(e.target.value)}
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
                    value={formData.appraisedDate}
                    onChange={(e) => handleFieldChange('appraisedDate', e.target.value)}
                    className="h-8 text-sm mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-foreground">Priority</Label>
                  <Select
                    value={formData.loanPriority}
                    onValueChange={(val) => handleFieldChange('loanPriority', val)}
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
                    value={floodZone}
                    onValueChange={setFloodZone}
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
          </TabsContent>
        </Tabs>

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

export default PropertyModal;
