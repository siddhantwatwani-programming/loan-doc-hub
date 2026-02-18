import React, { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
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
const OCCUPANCY_OPTIONS = ['Investor', 'Other', 'Owner', 'Primary Borrower', 'Secondary Borrower', 'Tenant', 'Unknown', 'Vacant', 'Non Owner Occupied'];
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
  id: generatePropertyId(), isPrimary: false, description: '', street: '', city: '', state: '', zipCode: '', county: '',
  propertyType: '', occupancy: '', appraisedValue: '', appraisedDate: '', ltv: '', apn: '',
  loanPriority: '', floodZone: '', pledgedEquity: '', zoning: '', performedBy: '',
});

export const PropertyModal: React.FC<PropertyModalProps> = ({ open, onOpenChange, property, onSave, isEdit = false }) => {
  const [formData, setFormData] = useState<PropertyData>(getEmptyProperty());
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (open) {
      setFormData(property ? { ...getEmptyProperty(), ...property } : getEmptyProperty());
      setActiveTab('general');
    }
  }, [open, property]);

  const handleFieldChange = (field: keyof PropertyData, value: string | boolean) => setFormData(prev => ({ ...prev, [field]: value }));
  const sanitizeNumericValue = (value: string): string => value.replace(/[^0-9.-]/g, '');
  const handleCurrencyChange = (field: keyof PropertyData, value: string) => setFormData(prev => ({ ...prev, [field]: sanitizeNumericValue(value) }));
  const handlePercentageChange = (field: keyof PropertyData, value: string) => setFormData(prev => ({ ...prev, [field]: sanitizeNumericValue(value) }));

  const handleSave = () => { onSave(formData); onOpenChange(false); };

  const renderInlineField = (field: keyof PropertyData, label: string, type = 'text') => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
      <Input value={String(formData[field] || '')} onChange={(e) => handleFieldChange(field, e.target.value)} className="h-7 text-xs flex-1" type={type} />
    </div>
  );

  const renderInlineSelect = (field: keyof PropertyData, label: string, options: string[] | { value: string; label: string }[], placeholder: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
      <Select value={String(formData[field] || '')} onValueChange={(val) => handleFieldChange(field, val)}>
        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent className="bg-background border border-border z-50 max-h-60">
          {options.map(opt => {
            const v = typeof opt === 'string' ? opt : opt.value;
            const l = typeof opt === 'string' ? opt : opt.label;
            return <SelectItem key={v} value={v}>{l}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Home className="h-4 w-4 text-primary" />
            {isEdit ? 'Edit Property' : 'Add New Property'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1"><TabsTrigger value="general" className="text-xs">General</TabsTrigger></TabsList>

          <TabsContent value="general" className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
              {/* Left Column - Property Information */}
              <div className="space-y-1.5">
                <div className="border-b border-border pb-1 mb-2"><span className="font-semibold text-xs text-primary">Property Information</span></div>
                {renderInlineField('description', 'Description')}
                <div className="pt-1">
                  <span className="text-xs font-medium text-primary">Address</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="modal-copy-borrower-address" checked={false} disabled className="h-3.5 w-3.5" />
                  <Label htmlFor="modal-copy-borrower-address" className="text-xs text-primary">Copy Borrower's Address</Label>
                </div>
                {renderInlineField('street', 'Street')}
                {renderInlineField('city', 'City')}
                {renderInlineSelect('state', 'State', US_STATES, 'Select state')}
                {renderInlineField('zipCode', 'Zip Code')}
                {renderInlineField('county', 'County')}
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox id="modal-primary-property" checked={formData.isPrimary} onCheckedChange={(checked) => handleFieldChange('isPrimary', !!checked)} className="h-3.5 w-3.5" />
                  <Label htmlFor="modal-primary-property" className="text-xs text-foreground">Primary Property</Label>
                </div>
              </div>

              {/* Right Column - Appraisal Information */}
              <div className="space-y-1.5">
                <div className="border-b border-border pb-1 mb-2"><span className="font-semibold text-xs text-primary">Appraisal Information</span></div>
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs text-foreground">Appraised Value</Label>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <Input value={formData.appraisedValue} onChange={(e) => handleCurrencyChange('appraisedValue', e.target.value)} className="h-7 text-xs text-right" inputMode="decimal" placeholder="0.00" />
                  </div>
                </div>
                {renderInlineSelect('performedBy', 'Performed By', PERFORMED_BY_OPTIONS, 'Select')}
                {renderInlineSelect('propertyType', 'Property Type', PROPERTY_TYPE_OPTIONS, 'Select type')}
                {renderInlineSelect('occupancy', 'Occupancy', OCCUPANCY_OPTIONS, 'Select')}
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs text-foreground">Loan To Value</Label>
                  <div className="flex items-center gap-1 flex-1">
                    <Input value={formData.ltv} onChange={(e) => handlePercentageChange('ltv', e.target.value)} className="h-7 text-xs" inputMode="decimal" />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>
                </div>
                {renderInlineField('zoning', 'Zoning')}
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs text-foreground">Pledged Equity</Label>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-xs text-muted-foreground">$</span>
                    <Input value={formData.pledgedEquity || ''} onChange={(e) => handleCurrencyChange('pledgedEquity', e.target.value)} className="h-7 text-xs text-right" inputMode="decimal" placeholder="0.00" />
                  </div>
                </div>
                {renderInlineField('appraisedDate', 'Appraisal Date', 'date')}
                {renderInlineSelect('loanPriority', 'Priority', PRIORITY_OPTIONS, 'Select')}
                {renderInlineSelect('floodZone', 'Flood Zone', FLOOD_ZONE_OPTIONS, 'Select')}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyModal;
