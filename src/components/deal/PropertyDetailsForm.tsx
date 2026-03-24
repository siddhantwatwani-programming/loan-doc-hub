import React, { useEffect } from 'react';
import { PhoneInput } from '@/components/ui/phone-input';
import { Input } from '@/components/ui/input';
import { EmailInput } from '@/components/ui/email-input';
import { ZipInput } from '@/components/ui/zip-input';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';

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
const CONSTRUCTION_TYPES = ['Wood/Stucco', 'Stick', 'Concrete Block'];
const LIEN_SOURCES = ['Broker', 'Borrower', 'Other'];

import { PROPERTY_DETAILS_KEYS } from '@/lib/fieldKeyMap';

// Use central field key map
const FIELD_KEYS = PROPERTY_DETAILS_KEYS;

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
  const handlePercentageChange = (fieldKey: string, value: string) => onValueChange(fieldKey, sanitizeNumericValue(value).replace(/-/g, ''));

  const isCopyBorrower = getFieldValue(FIELD_KEYS.copyBorrowerAddress) === 'true';
  const borrowerStreet = values['borrower.address.street'] || '';
  const borrowerCity = values['borrower.address.city'] || '';
  const borrowerState = values['borrower.state'] || '';
  const borrowerZip = values['borrower.address.zip'] || '';

  useEffect(() => {
    if (isCopyBorrower) {
      const mappings: [string, string][] = [
        [FIELD_KEYS.street, borrowerStreet],
        [FIELD_KEYS.city, borrowerCity],
        [FIELD_KEYS.state, borrowerState],
        [FIELD_KEYS.zip, borrowerZip],
      ];
      mappings.forEach(([dst, srcVal]) => {
        if (getFieldValue(dst) !== srcVal) onValueChange(dst, srcVal);
      });
    }
  }, [isCopyBorrower, borrowerStreet, borrowerCity, borrowerState, borrowerZip]);

  const parseDate = (val: string): Date | undefined => {
    if (!val) return undefined;
    try { return parse(val, 'yyyy-MM-dd', new Date()); } catch { return undefined; }
  };

  const renderInlineField = (fieldKey: string, label: string, type: 'text' | 'date' = 'text') => (
    <DirtyFieldWrapper fieldKey={fieldKey}>
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
    </DirtyFieldWrapper>
  );

  const renderInlineSelect = (fieldKey: string, label: string, options: string[], placeholder: string) => (
    <DirtyFieldWrapper fieldKey={fieldKey}>
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
    </DirtyFieldWrapper>
  );

  const renderCurrencyField = (fieldKey: string, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
      <div className="relative flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
        <Input value={getFieldValue(fieldKey)} onChange={(e) => handleCurrencyChange(fieldKey, e.target.value)} disabled={disabled} className="h-7 text-xs pl-6" inputMode="decimal" placeholder="0.00" />
      </div>
    </div>
  );

  const renderPercentageField = (fieldKey: string, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
      <div className="relative flex-1">
        <Input value={getFieldValue(fieldKey)} onChange={(e) => handlePercentageChange(fieldKey, e.target.value)} disabled={disabled} className="h-7 text-xs pr-6" inputMode="decimal" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
      </div>
    </div>
  );

  const renderCheckboxField = (fieldKey: string, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
      <Checkbox checked={getFieldValue(fieldKey) === 'true'} onCheckedChange={(c) => onValueChange(fieldKey, String(!!c))} disabled={disabled} className="h-3.5 w-3.5" />
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
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.street}>
            <div className="flex items-center gap-2">
              <Label className="w-[110px] shrink-0 text-xs text-foreground">Street</Label>
              <Input value={getFieldValue(FIELD_KEYS.street)} onChange={(e) => onValueChange(FIELD_KEYS.street, e.target.value)} disabled={disabled || isCopyBorrower} className="h-7 text-xs flex-1" />
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.city}>
            <div className="flex items-center gap-2">
              <Label className="w-[110px] shrink-0 text-xs text-foreground">City</Label>
              <Input value={getFieldValue(FIELD_KEYS.city)} onChange={(e) => onValueChange(FIELD_KEYS.city, e.target.value)} disabled={disabled || isCopyBorrower} className="h-7 text-xs flex-1" />
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.state}>
            <div className="flex items-center gap-2">
              <Label className="w-[110px] shrink-0 text-xs text-foreground">State</Label>
              <Select value={getFieldValue(FIELD_KEYS.state)} onValueChange={(val) => onValueChange(FIELD_KEYS.state, val)} disabled={disabled || isCopyBorrower}>
                <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent className="bg-background border border-border z-50 max-h-60">
                  {['CA', 'TX', 'FL', 'NY', 'WA'].map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.zip}>
            <div className="flex items-center gap-2">
              <Label className="w-[110px] shrink-0 text-xs text-foreground">Zip Code</Label>
              <ZipInput value={getFieldValue(FIELD_KEYS.zip)} onValueChange={(v) => onValueChange(FIELD_KEYS.zip, v)} disabled={disabled || isCopyBorrower} className="h-7 text-xs" />
            </div>
          </DirtyFieldWrapper>
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
          {renderInlineField(FIELD_KEYS.appraisedDate, 'Appraisal Date', 'date')}
          {renderInlineSelect(FIELD_KEYS.performedBy, 'Performed By', PERFORMED_BY_OPTIONS, 'Select...')}
          {renderInlineSelect(FIELD_KEYS.propertyType, 'Property Type', PROPERTY_TYPE_OPTIONS, 'Select type')}
          {renderInlineSelect(FIELD_KEYS.occupancy, 'Occupancy', OCCUPANCY_OPTIONS, 'Select')}
          {renderPercentageField(FIELD_KEYS.ltv, 'Loan To Value')}
          {renderInlineField(FIELD_KEYS.zoning, 'Zoning')}
          {renderCurrencyField(FIELD_KEYS.appraisedValue, 'Appraised Value')}
          {renderCurrencyField(FIELD_KEYS.pledgedEquity, 'Pledged Equity')}
          {renderInlineSelect(FIELD_KEYS.priority, 'Priority', PRIORITY_OPTIONS, 'Select')}
          {renderInlineSelect(FIELD_KEYS.floodZone, 'Flood Zone', FLOOD_ZONE_OPTIONS, 'Select')}
        </div>
      </div>

      {/* Additional Property Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0 mt-4">
        {/* Left Column - Purchase & Tax */}
        <div className="space-y-1.5">
          {renderCurrencyField(FIELD_KEYS.purchasePrice, 'Purchase Price')}
          {renderCurrencyField(FIELD_KEYS.downPayment, 'Down Payment')}
          {renderCurrencyField(FIELD_KEYS.delinquentTaxes, 'Delinquent Taxes')}

          <p className="text-xs italic text-foreground pt-3 pb-1">Appraiser Contact</p>
          {renderInlineField(FIELD_KEYS.appraiserStreet, 'Street')}
          {renderInlineField(FIELD_KEYS.appraiserCity, 'City')}
          {renderInlineField(FIELD_KEYS.appraiserState, 'State')}
          {renderInlineField(FIELD_KEYS.appraiserZip, 'ZIP')}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.appraiserPhone}>
            <div className="flex items-center gap-2">
              <Label className="w-[110px] shrink-0 text-xs text-foreground">Phone</Label>
              <PhoneInput value={getFieldValue(FIELD_KEYS.appraiserPhone)} onValueChange={(v) => onValueChange(FIELD_KEYS.appraiserPhone, v)} disabled={disabled} className="h-7 text-xs" />
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.appraiserEmail}>
            <div className="flex items-center gap-2">
              <Label className="w-[110px] shrink-0 text-xs text-foreground">Email</Label>
              <EmailInput value={getFieldValue(FIELD_KEYS.appraiserEmail)} onValueChange={(v) => onValueChange(FIELD_KEYS.appraiserEmail, v)} disabled={disabled} className="h-7 text-xs" />
            </div>
          </DirtyFieldWrapper>
        </div>

        {/* Right Column - Construction & Delinquency */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="w-[110px] shrink-0 text-xs text-foreground">Year Built</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('h-7 w-full justify-start text-left font-normal text-xs', !getFieldValue(FIELD_KEYS.yearBuilt) && 'text-muted-foreground')} disabled={disabled}>
                  {getFieldValue(FIELD_KEYS.yearBuilt) ? format(parseDate(getFieldValue(FIELD_KEYS.yearBuilt))!, 'dd-MM-yyyy') : 'Date'}
                  <CalendarIcon className="ml-auto h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={parseDate(getFieldValue(FIELD_KEYS.yearBuilt))}
                  onSelect={(date) => date && onValueChange(FIELD_KEYS.yearBuilt, format(date, 'yyyy-MM-dd'))}
                  initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          {renderInlineField(FIELD_KEYS.squareFeet, 'Square Feet')}
          {renderInlineSelect(FIELD_KEYS.constructionType, 'Type of Construction', CONSTRUCTION_TYPES, 'Select...')}
          {renderCurrencyField(FIELD_KEYS.monthlyIncome, 'Generates Monthly Income')}
          {renderCurrencyField(FIELD_KEYS.lienProtectiveEquity, 'Lien (Protective Equity)')}
          {renderInlineSelect(FIELD_KEYS.sourceLienInfo, 'Source of Lien Information', LIEN_SOURCES, 'Select...')}

          <p className="text-xs font-medium text-foreground pt-3 pb-1">During Previous 12 Months</p>
          {renderCheckboxField(FIELD_KEYS.delinquencies60day, '60-day + Delinquencies')}
          {renderInlineField(FIELD_KEYS.delinquenciesHowMany, 'How Many')}
          {renderCheckboxField(FIELD_KEYS.currentlyDelinquent, 'Currently Delinquent')}
          {renderCheckboxField(FIELD_KEYS.paidByLoan, 'Will be Paid by this Loan')}
          {renderInlineField(FIELD_KEYS.sourceOfPayment, 'If No, List Source of Payment')}
          {renderInlineField(FIELD_KEYS.recordingNumber, 'Recording number')}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsForm;
