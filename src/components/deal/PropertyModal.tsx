import React, { useState, useEffect } from 'react';
import { Home, CalendarIcon } from 'lucide-react';
import { EmailInput } from '@/components/ui/email-input';
import { ZipInput } from '@/components/ui/zip-input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { ModalSaveConfirmation } from './ModalSaveConfirmation';
import { hasModalFormData, hasValidEmails } from '@/lib/modalFormValidation';
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
const CONSTRUCTION_TYPES = ['Wood/Stucco', 'Stick', 'Concrete Block'];
const LIEN_SOURCES = ['Broker', 'Borrower', 'Other'];

import { US_STATES } from '@/lib/usStates';

const generatePropertyId = () => `property_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getEmptyProperty = (): PropertyData => ({
  id: generatePropertyId(), isPrimary: false, description: '', street: '', city: '', state: '', zipCode: '', county: '',
  propertyType: '', occupancy: '', appraisedValue: '', appraisedDate: '', ltv: '', apn: '',
  loanPriority: '', floodZone: '', pledgedEquity: '', zoning: '', performedBy: '', copyBorrowerAddress: false,
  purchasePrice: '', downPayment: '', delinquentTaxes: '',
  appraiserStreet: '', appraiserCity: '', appraiserState: '', appraiserZip: '', appraiserPhone: '', appraiserEmail: '',
  yearBuilt: '', squareFeet: '', constructionType: '', monthlyIncome: '', lienProtectiveEquity: '', sourceLienInfo: '',
  delinquencies60day: false, delinquenciesHowMany: '', currentlyDelinquent: false, paidByLoan: false,
  sourceOfPayment: '', recordingNumber: '',
});

export const PropertyModal: React.FC<PropertyModalProps> = ({ open, onOpenChange, property, onSave, isEdit = false }) => {
  const [formData, setFormData] = useState<PropertyData>(getEmptyProperty());
  const [activeTab, setActiveTab] = useState('general');
  const [yearBuiltOpen, setYearBuiltOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData(property ? { ...getEmptyProperty(), ...property } : getEmptyProperty());
      setActiveTab('general');
    }
  }, [open, property]);

  const handleFieldChange = (field: keyof PropertyData, value: string | boolean) => {
    const resolved = value === '__none__' ? '' : value;
    setFormData(prev => ({ ...prev, [field]: resolved }));
  };
  const sanitizeNumericValue = (value: string): string => value.replace(/[^0-9.-]/g, '');
  const handleCurrencyChange = (field: keyof PropertyData, value: string) => setFormData(prev => ({ ...prev, [field]: sanitizeNumericValue(value) }));
  const handlePercentageChange = (field: keyof PropertyData, value: string) => setFormData(prev => ({ ...prev, [field]: sanitizeNumericValue(value).replace(/-/g, '') }));

  const parseDate = (val: string): Date | undefined => {
    if (!val) return undefined;
    try { return parse(val, 'yyyy-MM-dd', new Date()); } catch { return undefined; }
  };

  const isFormFilled = hasModalFormData(formData, ['id']);
  const emailsValid = hasValidEmails(formData as any, ['appraiserEmail']);

  const handleSaveClick = () => setShowConfirm(true);
  const handleConfirmSave = () => { setShowConfirm(false); onSave(formData); onOpenChange(false); };

  const [datePickerStates, setDatePickerStates] = useState<Record<string, boolean>>({});

  const renderInlineField = (field: keyof PropertyData, label: string, type = 'text') => {
    if (type === 'date') {
      const val = String(formData[field] || '');
      return (
        <div className="flex items-center gap-2">
          <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
          <Popover open={datePickerStates[field] || false} onOpenChange={(open) => setDatePickerStates(prev => ({ ...prev, [field]: open }))}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-7 text-xs flex-1 justify-start text-left font-normal', !val && 'text-muted-foreground')}>
                {val && parseDate(val) ? format(parseDate(val)!, 'dd-MM-yyyy') : 'dd-mm-yyyy'}
                <CalendarIcon className="ml-auto h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999]" align="start">
              <EnhancedCalendar
                mode="single"
                selected={parseDate(val)}
                onSelect={(date) => { if (date) handleFieldChange(field, format(date, 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [field]: false })); }}
                onClear={() => { handleFieldChange(field, ''); setDatePickerStates(prev => ({ ...prev, [field]: false })); }}
                onToday={() => { handleFieldChange(field, format(new Date(), 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [field]: false })); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
        <Input value={String(formData[field] || '')} onChange={(e) => handleFieldChange(field, e.target.value)} className="h-7 text-xs flex-1" type={type} />
      </div>
    );
  };

  const renderInlineSelect = (field: keyof PropertyData, label: string, options: string[] | { value: string; label: string }[], placeholder: string) => {
    const rawVal = String(formData[field] || '');
    const selectVal = rawVal === '' ? '__none__' : rawVal;
    return (
      <div className="flex items-center gap-2">
        <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
        <Select value={selectVal} onValueChange={(val) => handleFieldChange(field, val)}>
          <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder={placeholder} /></SelectTrigger>
          <SelectContent className="bg-background border border-border z-[200] max-h-60">
            <SelectItem value="__none__">{placeholder}</SelectItem>
            {options.map(opt => {
              const v = typeof opt === 'string' ? opt : opt.value;
              const l = typeof opt === 'string' ? opt : opt.label;
              return <SelectItem key={v} value={v}>{l}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderCurrencyField = (field: keyof PropertyData, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
      <div className="relative flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
        <Input value={String(formData[field] || '')} onChange={(e) => handleCurrencyChange(field, e.target.value)} className="h-7 text-xs pl-6" inputMode="decimal" placeholder="0.00" />
      </div>
    </div>
  );

  const renderCheckboxField = (field: keyof PropertyData, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
      <Checkbox checked={!!formData[field]} onCheckedChange={(c) => handleFieldChange(field, !!c)} className="h-3.5 w-3.5" />
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Home className="h-4 w-4 text-primary" />
              {isEdit ? 'Edit Property' : 'Add New Property'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 sleek-scrollbar">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-1"><TabsTrigger value="general" className="text-xs">General</TabsTrigger></TabsList>

            <TabsContent value="general" className="mt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
                <div className="space-y-1.5">
                  <div className="border-b border-border pb-1 mb-2"><span className="font-semibold text-xs text-primary">Property Information</span></div>
                  {renderInlineField('description', 'Description')}
                  <div className="pt-1">
                    <span className="text-xs font-medium text-primary">Address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="modal-copy-borrower-address" checked={!!formData.copyBorrowerAddress} onCheckedChange={(checked) => handleFieldChange('copyBorrowerAddress', !!checked)} className="h-3.5 w-3.5" />
                    <Label htmlFor="modal-copy-borrower-address" className="text-xs text-primary">Copy Borrower's Address</Label>
                  </div>
                  {renderInlineField('street', 'Street')}
                  {renderInlineField('city', 'City')}
                  {renderInlineSelect('state', 'State', US_STATES, 'Select state')}
                  <div className="flex items-center gap-2">
                    <Label className="w-[100px] shrink-0 text-xs text-foreground">Zip Code</Label>
                    <ZipInput value={String(formData.zipCode || '')} onValueChange={(v) => handleFieldChange('zipCode', v)} className="h-7 text-xs" />
                  </div>
                  {renderInlineField('county', 'County')}
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox id="modal-primary-property" checked={formData.isPrimary} onCheckedChange={(checked) => handleFieldChange('isPrimary', !!checked)} className="h-3.5 w-3.5" />
                    <Label htmlFor="modal-primary-property" className="text-xs text-foreground">Primary Property</Label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="border-b border-border pb-1 mb-2"><span className="font-semibold text-xs text-primary">Appraisal Information</span></div>
                  {renderInlineField('appraisedDate', 'Appraisal Date', 'date')}
                  {renderInlineSelect('performedBy', 'Performed By', PERFORMED_BY_OPTIONS, 'Select')}
                  {renderInlineSelect('propertyType', 'Property Type', PROPERTY_TYPE_OPTIONS, 'Select type')}
                  {renderInlineSelect('occupancy', 'Occupancy', OCCUPANCY_OPTIONS, 'Select')}
                  <div className="flex items-center gap-2">
                    <Label className="w-[100px] shrink-0 text-xs text-foreground">Loan To Value</Label>
                    <div className="relative flex-1">
                      <Input value={formData.ltv} onChange={(e) => handlePercentageChange('ltv', e.target.value)} className="h-7 text-xs pr-6" inputMode="decimal" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
                    </div>
                  </div>
                  {renderInlineField('zoning', 'Zoning')}
                  {renderCurrencyField('appraisedValue', 'Appraised Value')}
                  {renderCurrencyField('pledgedEquity', 'Pledged Equity')}
                  {renderInlineSelect('loanPriority', 'Priority', PRIORITY_OPTIONS, 'Select')}
                  {renderInlineSelect('floodZone', 'Flood Zone', FLOOD_ZONE_OPTIONS, 'Select')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0 mt-4">
                <div className="space-y-1.5">
                  {renderCurrencyField('purchasePrice', 'Purchase Price')}
                  {renderCurrencyField('downPayment', 'Down Payment')}
                  {renderCurrencyField('delinquentTaxes', 'Delinquent Taxes')}

                  <p className="text-xs italic text-foreground pt-3 pb-1">Appraiser Contact</p>
                  {renderInlineField('appraiserStreet', 'Street')}
                  {renderInlineField('appraiserCity', 'City')}
                  {renderInlineField('appraiserState', 'State')}
                  <div className="flex items-center gap-2">
                    <Label className="w-[100px] shrink-0 text-xs text-foreground">ZIP</Label>
                    <ZipInput value={String(formData.appraiserZip || '')} onValueChange={(v) => handleFieldChange('appraiserZip', v)} className="h-7 text-xs" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-[100px] shrink-0 text-xs text-foreground">Phone</Label>
                    <PhoneInput value={String(formData.appraiserPhone || '')} onValueChange={(v) => handleFieldChange('appraiserPhone', v)} className="h-7 text-xs flex-1" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="w-[100px] shrink-0 text-xs text-foreground">Email</Label>
                    <EmailInput value={String(formData.appraiserEmail || '')} onValueChange={(v) => handleFieldChange('appraiserEmail', v)} className="h-7 text-xs" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Label className="w-[100px] shrink-0 text-xs text-foreground">Year Built</Label>
                    <Popover open={yearBuiltOpen} onOpenChange={setYearBuiltOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('h-7 w-full justify-start text-left font-normal text-xs', !formData.yearBuilt && 'text-muted-foreground')}>
                          {formData.yearBuilt ? format(parseDate(formData.yearBuilt)!, 'dd-MM-yyyy') : 'dd-mm-yyyy'}
                          <CalendarIcon className="ml-auto h-3.5 w-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                        <EnhancedCalendar mode="single" selected={parseDate(formData.yearBuilt || '')}
                          onSelect={(date) => { if (date) { handleFieldChange('yearBuilt', format(date, 'yyyy-MM-dd')); setYearBuiltOpen(false); } }}
                          onClear={() => { handleFieldChange('yearBuilt', ''); setYearBuiltOpen(false); }}
                          onToday={() => { handleFieldChange('yearBuilt', format(new Date(), 'yyyy-MM-dd')); setYearBuiltOpen(false); }}
                          initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {renderInlineField('squareFeet', 'Square Feet')}
                  {renderInlineSelect('constructionType', 'Type of Construction', CONSTRUCTION_TYPES, 'Select...')}
                  {renderCurrencyField('monthlyIncome', 'Generates Monthly Income')}
                  {renderCurrencyField('lienProtectiveEquity', 'Lien (Protective Equity)')}
                  {renderInlineSelect('sourceLienInfo', 'Source of Lien Information', LIEN_SOURCES, 'Select...')}

                  <p className="text-xs font-medium text-foreground pt-3 pb-1">During Previous 12 Months</p>
                  {renderCheckboxField('delinquencies60day', '60-day + Delinquencies')}
                  {renderInlineField('delinquenciesHowMany', 'How Many')}
                  {renderCheckboxField('currentlyDelinquent', 'Currently Delinquent')}
                  {renderCheckboxField('paidByLoan', 'Will be Paid by this Loan')}
                  {renderInlineField('sourceOfPayment', 'If No, List Source of Payment')}
                  {renderInlineField('recordingNumber', 'Recording number')}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          </div>

          <DialogFooter className="shrink-0 border-t border-border pt-3">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveClick} disabled={!isFormFilled || !emailsValid}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ModalSaveConfirmation open={showConfirm} onConfirm={handleConfirmSave} onCancel={() => setShowConfirm(false)} />
    </>
  );
};

export default PropertyModal;
