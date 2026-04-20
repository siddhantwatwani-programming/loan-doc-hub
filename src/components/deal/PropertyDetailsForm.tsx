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
  'SFR 1-4', 'Multi-family', 'Condo / Townhouse', 'Mobile Home', 'Commercial',
  'Mixed-use', 'Land', 'Farm', 'Restaurant / Bar', 'Group Housing'
];

const OCCUPANCY_OPTIONS = ['Investor', 'Other', 'Owner', 'Primary Borrower', 'Secondary Borrower', 'Tenant', 'Unknown', 'Vacant', 'Non Owner Occupied'];
const PERFORMED_BY_OPTIONS = ['Broker', 'Third Party'];
const CONSTRUCTION_TYPES = ['Wood/Stucco', 'Stick', 'Concrete Block'];
const VALUATION_TYPE_OPTIONS = ['Appraisal', 'Broker Determined Value (BPO)'];
const INFO_PROVIDED_BY_OPTIONS = ['Broker', 'Borrower', 'Public Record', 'Other'];

import { PROPERTY_DETAILS_KEYS } from '@/lib/fieldKeyMap';

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

  // Helper: sum all lien new_remaining_balance values
  const existingLiensTotal = React.useMemo(() => {
    let total = 0;
    const lienPrefixes = new Set<string>();
    Object.keys(values).forEach(key => {
      const m = key.match(/^(lien\d+)\./);
      if (m) lienPrefixes.add(m[1]);
    });
    lienPrefixes.forEach(prefix => {
      const raw = values[`${prefix}.new_remaining_balance`] || '';
      const num = parseFloat(raw.replace(/[,$]/g, ''));
      if (!isNaN(num)) total += num;
    });
    return total;
  }, [values]);

  // Auto-calculate LTV, Protective Equity, CLTV
  useEffect(() => {
    const loanAmountRaw = values['loan_terms.loan_amount'] || '';
    const purchasePriceRaw = getFieldValue(FIELD_KEYS.purchasePrice);
    const loanAmount = parseFloat(loanAmountRaw.replace(/[,$]/g, ''));
    const purchasePrice = parseFloat(purchasePriceRaw.replace(/[,$]/g, ''));

    // LTV = (Loan Amount / Purchase Price) × 100
    if (!isNaN(loanAmount) && !isNaN(purchasePrice) && purchasePrice > 0) {
      const ltv = ((loanAmount / purchasePrice) * 100).toFixed(2);
      if (getFieldValue(FIELD_KEYS.ltv) !== ltv) {
        onValueChange(FIELD_KEYS.ltv, ltv);
      }
    }


    // Protective Equity = Purchase Price − (Existing Liens + Loan Amount)
    if (!isNaN(purchasePrice) && !isNaN(loanAmount)) {
      const protEq = (purchasePrice - (existingLiensTotal + loanAmount)).toFixed(2);
      if (getFieldValue(FIELD_KEYS.protectiveEquity) !== protEq) {
        onValueChange(FIELD_KEYS.protectiveEquity, protEq);
      }
    }

    // CLTV = (Existing Liens + Loan Amount) / Purchase Price × 100
    if (!isNaN(loanAmount) && !isNaN(purchasePrice) && purchasePrice > 0) {
      const cltv = (((existingLiensTotal + loanAmount) / purchasePrice) * 100).toFixed(2);
      if (getFieldValue(FIELD_KEYS.cltv) !== cltv) {
        onValueChange(FIELD_KEYS.cltv, cltv);
      }
    }
  }, [values['loan_terms.loan_amount'], values[FIELD_KEYS.purchasePrice], existingLiensTotal]);

  const isCopyBorrower = getFieldValue(FIELD_KEYS.copyBorrowerAddress) === 'true';

  // Resolve the primary borrower's address from multi-entity keys (borrower1.*, borrower2.*, ...).
  // Falls back to legacy 'borrower.*' keys when present.
  const { borrowerStreet, borrowerCity, borrowerState, borrowerZip } = React.useMemo(() => {
    const prefixes = new Set<string>();
    Object.keys(values).forEach((k) => {
      const m = k.match(/^(borrower\d+)\./);
      if (m) prefixes.add(m[1]);
    });
    const list = Array.from(prefixes).sort();
    // Prefer the borrower flagged as primary; otherwise fall back to the first entry.
    const primary = list.find((p) => values[`${p}.is_primary`] === 'true') || list[0];
    const pick = (suffix: string, legacy: string) =>
      (primary && values[`${primary}.${suffix}`]) || values[legacy] || '';
    return {
      borrowerStreet: pick('address.street', 'borrower.address.street'),
      borrowerCity: pick('address.city', 'borrower.address.city'),
      borrowerState: pick('state', 'borrower.state'),
      borrowerZip: pick('address.zip', 'borrower.address.zip'),
    };
  }, [values]);

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
    <DirtyFieldWrapper fieldKey={fieldKey}>
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
    </DirtyFieldWrapper>
  );

  const renderPercentageField = (fieldKey: string, label: string) => (
    <DirtyFieldWrapper fieldKey={fieldKey}>
      <div className="flex items-center gap-2">
        <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
        <div className="relative flex-1">
          <Input value={getFieldValue(fieldKey)} onChange={(e) => handlePercentageChange(fieldKey, e.target.value)} disabled={disabled} className="h-7 text-xs pr-6" inputMode="decimal" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
        </div>
      </div>
    </DirtyFieldWrapper>
  );

  const renderCheckboxField = (fieldKey: string, label: string) => (
    <DirtyFieldWrapper fieldKey={fieldKey}>
      <div className="flex items-center gap-2">
        <Checkbox checked={getFieldValue(fieldKey) === 'true'} onCheckedChange={(c) => onValueChange(fieldKey, String(!!c))} disabled={disabled} className="h-3.5 w-3.5" />
        <Label className="text-xs text-foreground">{label}</Label>
      </div>
    </DirtyFieldWrapper>
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
                {val && parseDate(val) ? format(parseDate(val)!, 'MM/dd/yyyy') : 'MM/DD/YYYY'}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-0">
        {/* Column 1 — Property Details */}
        <div className="space-y-1.5">
          <div className="border-b border-border pb-1 mb-2">
            <span className="font-semibold text-xs text-primary">Property Details</span>
          </div>
          {renderInlineSelect(FIELD_KEYS.informationProvidedBy, 'Information Provided By', INFO_PROVIDED_BY_OPTIONS, 'Select...')}
          {renderCheckboxField(FIELD_KEYS.primaryCollateral, 'Primary Property')}
          {renderInlineField(FIELD_KEYS.description, 'Description (Nickname)')}

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
              <Label className="w-[110px] shrink-0 text-xs text-foreground">ZIP Code</Label>
              <ZipInput value={getFieldValue(FIELD_KEYS.zip)} onValueChange={(v) => onValueChange(FIELD_KEYS.zip, v)} disabled={disabled || isCopyBorrower} className="h-7 text-xs" />
            </div>
          </DirtyFieldWrapper>
          {renderInlineField(FIELD_KEYS.county, 'County')}

        </div>

        {/* Column 2 — Characteristics */}
        <div className="space-y-1.5">
          <div className="border-b border-border pb-1 mb-2">
            <span className="font-semibold text-xs text-primary">Purchase Information</span>
          </div>
          {renderDateField(FIELD_KEYS.purchaseDate, 'Purchase Date')}
          {renderCurrencyField(FIELD_KEYS.purchasePrice, 'Purchase Price')}
          {renderCurrencyField(FIELD_KEYS.downPayment, 'Down Payment')}

          {renderInlineSelect(FIELD_KEYS.propertyType, 'Property Type', PROPERTY_TYPE_OPTIONS, 'Select type')}
          {renderInlineSelect(FIELD_KEYS.occupancy, 'Occupancy', OCCUPANCY_OPTIONS, 'Select')}
          {renderDateField(FIELD_KEYS.yearBuilt, 'Year Built')}
          {renderInlineField(FIELD_KEYS.squareFeet, 'Square Feet')}
          {renderInlineSelect(FIELD_KEYS.constructionType, 'Type of Construction', CONSTRUCTION_TYPES, 'Select...')}
          {renderInlineField(FIELD_KEYS.zoning, 'Zoning')}

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

        {/* Column 3 — Valuation */}
        <div className="space-y-1.5">
          <div className="border-b border-border pb-1 mb-2">
            <span className="font-semibold text-xs text-primary">Valuation:</span>
          </div>
          {renderCurrencyField(FIELD_KEYS.appraisedValue, 'Estimate of Value')}
          {renderDateField(FIELD_KEYS.appraisedDate, 'Valuation Date')}
          {renderInlineSelect(FIELD_KEYS.valuationType, 'Valuation Type', VALUATION_TYPE_OPTIONS, 'Select')}
          {renderInlineSelect(FIELD_KEYS.performedBy, 'Performed By', PERFORMED_BY_OPTIONS, 'Select...')}

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
            </>
          )}

          <DirtyFieldWrapper fieldKey={FIELD_KEYS.protectiveEquity}>
            <div className="flex items-center gap-2">
              <Label className="w-[110px] shrink-0 text-xs text-foreground">Protective Equity</Label>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">$</span>
                <Input value={getFieldValue(FIELD_KEYS.protectiveEquity)} disabled className="h-7 text-xs pl-6 bg-muted" readOnly />
              </div>
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.ltv}>
            <div className="flex items-center gap-2">
              <Label className="w-[110px] shrink-0 text-xs text-foreground">Loan To Value</Label>
              <div className="relative flex-1">
                <Input value={getFieldValue(FIELD_KEYS.ltv)} disabled className="h-7 text-xs pr-6 bg-muted" readOnly />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
              </div>
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.cltv}>
            <div className="flex items-center gap-2">
              <Label className="w-[110px] shrink-0 text-xs text-foreground">CLTV (If a Junior Lien)</Label>
              <div className="relative flex-1">
                <Input value={getFieldValue(FIELD_KEYS.cltv)} disabled className="h-7 text-xs pr-6 bg-muted" readOnly />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
              </div>
            </div>
          </DirtyFieldWrapper>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailsForm;
