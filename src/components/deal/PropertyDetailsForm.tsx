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
  // Origination property fields
  purchasePrice: 'property1.purchase_price',
  downPayment: 'property1.down_payment',
  delinquentTaxes: 'property1.delinquent_taxes',
  appraiserStreet: 'property1.appraiser_street',
  appraiserCity: 'property1.appraiser_city',
  appraiserState: 'property1.appraiser_state',
  appraiserZip: 'property1.appraiser_zip',
  appraiserPhone: 'property1.appraiser_phone',
  appraiserEmail: 'property1.appraiser_email',
  yearBuilt: 'property1.year_built',
  squareFeet: 'property1.square_feet',
  constructionType: 'property1.construction_type',
  monthlyIncome: 'property1.monthly_income',
  lienProtectiveEquity: 'property1.lien_protective_equity',
  sourceLienInfo: 'property1.source_lien_info',
  delinquencies60day: 'property1.delinquencies_60day',
  delinquenciesHowMany: 'property1.delinquencies_how_many',
  currentlyDelinquent: 'property1.currently_delinquent',
  paidByLoan: 'property1.paid_by_loan',
  sourceOfPayment: 'property1.source_of_payment',
  recordingNumber: 'property1.recording_number',
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
          {renderInlineField(FIELD_KEYS.appraiserPhone, 'Phone')}
          {renderInlineField(FIELD_KEYS.appraiserEmail, 'Email')}
        </div>

        {/* Right Column - Construction & Delinquency */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="w-[110px] shrink-0 text-xs text-foreground">Year Built</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('h-7 w-full justify-start text-left font-normal text-xs', !getFieldValue(FIELD_KEYS.yearBuilt) && 'text-muted-foreground')} disabled={disabled}>
                  {getFieldValue(FIELD_KEYS.yearBuilt) ? format(parseDate(getFieldValue(FIELD_KEYS.yearBuilt))!, 'MM/dd/yyyy') : 'Date'}
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
