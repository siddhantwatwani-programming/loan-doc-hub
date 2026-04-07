import React, { useEffect } from 'react';
import { formatCurrencyDisplay, unformatCurrencyDisplay, numericKeyDown, numericPaste } from '@/lib/numericInputFilter';
import { US_STATES } from '@/lib/usStates';
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
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
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
const PERFORMED_BY_OPTIONS = ['Broker', 'Third Party'];
const CONSTRUCTION_TYPES = ['Wood/Stucco', 'Stick', 'Concrete Block'];
const LIEN_SOURCES = ['Broker', 'Borrower', 'Other'];
const VALUATION_TYPE_OPTIONS = ['Appraisal', 'Broker Determined Value (BPO)'];

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
  const [datePickerStates, setDatePickerStates] = React.useState<Record<string, boolean>>({});
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
        <Input
          value={getFieldValue(fieldKey)}
          onChange={(e) => handleCurrencyChange(fieldKey, e.target.value)}
          onBlur={() => { const raw = getFieldValue(fieldKey); if (raw) onValueChange(fieldKey, formatCurrencyDisplay(raw)); }}
          onFocus={() => { const raw = getFieldValue(fieldKey); if (raw) onValueChange(fieldKey, unformatCurrencyDisplay(raw)); }}
          onKeyDown={numericKeyDown}
          onPaste={(e) => numericPaste(e, (val) => onValueChange(fieldKey, val))}
          disabled={disabled}
          className="h-7 text-xs pl-6"
          inputMode="decimal"
          placeholder="0.00"
        />
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

  const renderDateField = (fieldKey: string, label: string) => {
    const val = getFieldValue(fieldKey);
    return (
      <DirtyFieldWrapper fieldKey={fieldKey}>
        <div className="flex items-center gap-2">
          <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
          <Popover open={datePickerStates[fieldKey] || false} onOpenChange={(open) => setDatePickerStates(prev => ({ ...prev, [fieldKey]: open }))}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('h-7 w-full justify-start text-left font-normal text-xs', !val && 'text-muted-foreground')} disabled={disabled}>
                {val && parseDate(val) ? format(parseDate(val)!, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
                <CalendarIcon className="ml-auto h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-[9999]" align="start">
              <EnhancedCalendar mode="single" selected={parseDate(val)}
                onSelect={(date) => { if (date) onValueChange(fieldKey, format(date, 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [fieldKey]: false })); }}
                onClear={() => { onValueChange(fieldKey, ''); setDatePickerStates(prev => ({ ...prev, [fieldKey]: false })); }}
                onToday={() => { onValueChange(fieldKey, format(new Date(), 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [fieldKey]: false })); }}
                initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </DirtyFieldWrapper>
    );
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0">
        {/* Left Column - Property Information */}
        <div className="space-y-1.5">
          <div className="border-b border-border pb-1 mb-2">
            <span className="font-semibold text-xs text-primary">Property Information</span>
          </div>
          {renderInlineField(FIELD_KEYS.description, 'Description (Nick Name)')}
          {renderCheckboxField(FIELD_KEYS.primaryCollateral, 'Primary Collateral')}
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
                  {US_STATES.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
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

          <div className="pt-2">
            <span className="text-xs font-medium text-primary">Purchase Information</span>
          </div>
          {renderDateField(FIELD_KEYS.purchaseDate, 'Purchase Date')}
          {renderCurrencyField(FIELD_KEYS.purchasePrice, 'Purchase Price')}
          {renderCurrencyField(FIELD_KEYS.downPayment, 'Down Payment')}
        </div>

        {/* Right Column - Appraisal Information */}
        <div className="space-y-1.5">
          <div className="border-b border-border pb-1 mb-2">
            <span className="font-semibold text-xs text-primary">Property Valuation</span>
          </div>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.appraisedDate}>
            <div className="flex items-center gap-2">
              <Label className="w-[110px] shrink-0 text-xs text-foreground">Valuation Date</Label>
              <Popover open={datePickerStates[FIELD_KEYS.appraisedDate] || false} onOpenChange={(open) => setDatePickerStates(prev => ({ ...prev, [FIELD_KEYS.appraisedDate]: open }))}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('h-7 w-full justify-start text-left font-normal text-xs', !getFieldValue(FIELD_KEYS.appraisedDate) && 'text-muted-foreground')} disabled={disabled}>
                    {getFieldValue(FIELD_KEYS.appraisedDate) ? format(parseDate(getFieldValue(FIELD_KEYS.appraisedDate))!, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
                    <CalendarIcon className="ml-auto h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                  <EnhancedCalendar mode="single" selected={parseDate(getFieldValue(FIELD_KEYS.appraisedDate))}
                    onSelect={(date) => { if (date) onValueChange(FIELD_KEYS.appraisedDate, format(date, 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [FIELD_KEYS.appraisedDate]: false })); }}
                    onClear={() => { onValueChange(FIELD_KEYS.appraisedDate, ''); setDatePickerStates(prev => ({ ...prev, [FIELD_KEYS.appraisedDate]: false })); }}
                    onToday={() => { onValueChange(FIELD_KEYS.appraisedDate, format(new Date(), 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [FIELD_KEYS.appraisedDate]: false })); }}
                    initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </DirtyFieldWrapper>
          {renderCurrencyField(FIELD_KEYS.appraisedValue, 'Appraised Value')}
          {renderInlineSelect(FIELD_KEYS.propertyType, 'Property Type', PROPERTY_TYPE_OPTIONS, 'Select type')}
          {renderInlineSelect(FIELD_KEYS.occupancy, 'Occupancy', OCCUPANCY_OPTIONS, 'Select')}
          {renderInlineField(FIELD_KEYS.zoning, 'Zoning')}
          {renderCurrencyField(FIELD_KEYS.pledgedEquity, 'Pledged Equity')}
          {renderCheckboxField(FIELD_KEYS.floodZone, 'Flood Zone')}

          {renderCheckboxField(FIELD_KEYS.propertyGeneratesIncome, 'Property Generates Income')}
          {getFieldValue(FIELD_KEYS.propertyGeneratesIncome) === 'true' && (
            <>
              {renderCurrencyField(FIELD_KEYS.netMonthlyIncome, 'Net Monthly Income')}
              {renderCurrencyField(FIELD_KEYS.fromRent, 'From Rent')}
              {renderCurrencyField(FIELD_KEYS.fromOtherDescribe, 'From Other (Describe)')}
            </>
          )}
        </div>
      </div>

      {/* Additional Property Fields */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0 mt-4">
        {/* Left Column - Purchase & Tax */}
        <div className="space-y-1.5">
          {renderCurrencyField(FIELD_KEYS.delinquentTaxes, 'Delinquent Taxes')}

          <p className="text-xs italic text-foreground pt-3 pb-1">Appraiser Contact</p>
          {renderInlineField(FIELD_KEYS.appraiserStreet, 'Street')}
          {renderInlineField(FIELD_KEYS.appraiserCity, 'City')}
          {renderInlineSelect(FIELD_KEYS.appraiserState, 'State', US_STATES, 'Select state')}
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
            <Popover open={datePickerStates[FIELD_KEYS.yearBuilt] || false} onOpenChange={(open) => setDatePickerStates(prev => ({ ...prev, [FIELD_KEYS.yearBuilt]: open }))}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('h-7 w-full justify-start text-left font-normal text-xs', !getFieldValue(FIELD_KEYS.yearBuilt) && 'text-muted-foreground')} disabled={disabled}>
                  {getFieldValue(FIELD_KEYS.yearBuilt) ? format(parseDate(getFieldValue(FIELD_KEYS.yearBuilt))!, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
                  <CalendarIcon className="ml-auto h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                <EnhancedCalendar mode="single" selected={parseDate(getFieldValue(FIELD_KEYS.yearBuilt))}
                  onSelect={(date) => { if (date) onValueChange(FIELD_KEYS.yearBuilt, format(date, 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [FIELD_KEYS.yearBuilt]: false })); }}
                  onClear={() => { onValueChange(FIELD_KEYS.yearBuilt, ''); setDatePickerStates(prev => ({ ...prev, [FIELD_KEYS.yearBuilt]: false })); }}
                  onToday={() => { onValueChange(FIELD_KEYS.yearBuilt, format(new Date(), 'yyyy-MM-dd')); setDatePickerStates(prev => ({ ...prev, [FIELD_KEYS.yearBuilt]: false })); }}
                  initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          {renderInlineField(FIELD_KEYS.squareFeet, 'Square Feet')}
          {renderInlineSelect(FIELD_KEYS.constructionType, 'Type of Construction', CONSTRUCTION_TYPES, 'Select...')}
          {renderCurrencyField(FIELD_KEYS.monthlyIncome, 'Generates Monthly Income')}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.annualIncome}>
            <div className="flex items-center gap-2">
              <Label className="w-[110px] shrink-0 text-xs text-foreground">Annual Income</Label>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
                <Input
                  value={(() => {
                    const monthly = getFieldValue(FIELD_KEYS.monthlyIncome);
                    const num = parseFloat((monthly || '').replace(/[,$]/g, ''));
                    if (isNaN(num) || !monthly) return '';
                    return (num * 12).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  })()}
                  disabled
                  className="h-7 text-xs pl-6 bg-muted"
                  placeholder="0.00"
                />
              </div>
            </div>
          </DirtyFieldWrapper>
          {renderCurrencyField(FIELD_KEYS.lienProtectiveEquity, 'Lien (Protective Equity)')}
          {renderInlineSelect(FIELD_KEYS.sourceLienInfo, 'Source of Lien Information', LIEN_SOURCES, 'Select...')}

          
        </div>
      </div>

      {/* Valuation Section */}
      <div className="mt-4">
        <div className="border-b border-border pb-1 mb-2"><span className="font-semibold text-xs text-primary">Valuation:</span></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-0">
          <div className="space-y-1.5">
            {renderDateField(FIELD_KEYS.valuationDate, 'Valuation Date')}
            {renderInlineSelect(FIELD_KEYS.valuationType, 'Valuation Type', VALUATION_TYPE_OPTIONS, 'Select')}
            {renderInlineSelect(FIELD_KEYS.performedBy, 'Performed By', PERFORMED_BY_OPTIONS, 'Select...')}
            {getFieldValue(FIELD_KEYS.valuationType) === 'Broker Determined Value (BPO)' && getFieldValue(FIELD_KEYS.valuationDate) && (
              <p className="text-xs italic text-foreground pl-[118px]">
                property valuation performed on {(() => {
                  const d = parseDate(getFieldValue(FIELD_KEYS.valuationDate));
                  return d ? format(d, 'MM/dd/yyyy') : getFieldValue(FIELD_KEYS.valuationDate);
                })()}
              </p>
            )}
            {getFieldValue(FIELD_KEYS.performedBy) === 'Third Party' && (
              <>
                {renderInlineField(FIELD_KEYS.thirdPartyFullName, 'Full Name')}
                {renderInlineField(FIELD_KEYS.thirdPartyStreet, 'Street')}
                {renderInlineField(FIELD_KEYS.thirdPartyCity, 'City')}
                {renderInlineSelect(FIELD_KEYS.thirdPartyState, 'State', US_STATES, 'Select state')}
                <DirtyFieldWrapper fieldKey={FIELD_KEYS.thirdPartyZip}>
                  <div className="flex items-center gap-2">
                    <Label className="w-[110px] shrink-0 text-xs text-foreground">ZIP Code</Label>
                    <ZipInput value={getFieldValue(FIELD_KEYS.thirdPartyZip)} onValueChange={(v) => onValueChange(FIELD_KEYS.thirdPartyZip, v)} disabled={disabled} className="h-7 text-xs" />
                  </div>
                </DirtyFieldWrapper>
              </>
            )}
          </div>
          <div className="space-y-1.5">
            {renderCurrencyField(FIELD_KEYS.protectiveEquity, 'Protective Equity')}
            {renderPercentageField(FIELD_KEYS.ltv, 'Loan To Value')}
            {renderPercentageField(FIELD_KEYS.cltv, 'CLTV (If a Junior Lien)')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsForm;
