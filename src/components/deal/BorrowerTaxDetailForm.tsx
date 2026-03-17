import React, { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';

import { BORROWER_TAX_DETAIL_KEYS, BORROWER_PRIMARY_KEYS, BORROWER_GUARANTOR_KEYS } from '@/lib/fieldKeyMap';

// Use central field key map
const FIELD_KEYS = BORROWER_TAX_DETAIL_KEYS;

const STATE_OPTIONS = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY',
];

const DESIGNATED_RECIPIENT_OPTIONS = [
  { value: 'primary', label: 'Borrower' },
  { value: 'co-borrower', label: 'Co-borrower' },
  { value: 'additional_guarantor', label: 'Additional Guarantor' },
  { value: 'other', label: 'Other' },
];

const TIN_TYPE_OPTIONS = [
  { value: '0', label: '0 – Unknown' },
  { value: '1', label: '1 – EIN' },
  { value: '2', label: '2 – SSN' },
];

// Maps for auto-populating from entity data
const PRIMARY_SOURCE_MAP = {
  name: BORROWER_PRIMARY_KEYS.fullName,
  address: BORROWER_PRIMARY_KEYS.primaryStreet,
  city: BORROWER_PRIMARY_KEYS.primaryCity,
  state: BORROWER_PRIMARY_KEYS.primaryState,
  zip: BORROWER_PRIMARY_KEYS.primaryZip,
  tin: BORROWER_PRIMARY_KEYS.tin,
  tinType: BORROWER_PRIMARY_KEYS.taxIdType,
} as const;

const COBORROWER_SOURCE_MAP = {
  name: 'coborrower.full_name',
  address: 'coborrower.primary_address.street',
  city: 'coborrower.primary_address.city',
  state: 'coborrower.primary_address.state',
  zip: 'coborrower.primary_address.zip',
  tin: 'coborrower.tin',
  tinType: 'coborrower.tax_id_type',
} as const;

const GUARANTOR_SOURCE_MAP = {
  name: BORROWER_GUARANTOR_KEYS.fullName,
  address: BORROWER_GUARANTOR_KEYS.primaryStreet,
  city: BORROWER_GUARANTOR_KEYS.primaryCity,
  state: BORROWER_GUARANTOR_KEYS.primaryState,
  zip: BORROWER_GUARANTOR_KEYS.primaryZip,
  tin: BORROWER_GUARANTOR_KEYS.tin,
  tinType: BORROWER_GUARANTOR_KEYS.taxIdType,
} as const;

interface BorrowerTaxDetailFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const BorrowerTaxDetailForm: React.FC<BorrowerTaxDetailFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (key: keyof typeof FIELD_KEYS): string => {
    return values[FIELD_KEYS[key]] || '';
  };

  const handleChange = (key: keyof typeof FIELD_KEYS, value: string) => {
    onValueChange(FIELD_KEYS[key], value);
  };

  const designatedRecipient = getValue('designatedRecipient');

  // Use refs to avoid stale closures in useEffect
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  // Auto-populate when designated recipient changes
  useEffect(() => {
    const currentValues = valuesRef.current;
    const fireChange = (key: keyof typeof FIELD_KEYS, value: string) => {
      onValueChangeRef.current(FIELD_KEYS[key], value);
    };

    if (!designatedRecipient || designatedRecipient === 'other') {
      if (designatedRecipient === 'other') {
        fireChange('name', '');
        fireChange('address', '');
        fireChange('city', '');
        fireChange('state', '');
        fireChange('zip', '');
        fireChange('tin', '');
        fireChange('tinType', '');
      }
      return;
    }

    let sourceMap: Record<string, string>;
    if (designatedRecipient === 'primary') {
      sourceMap = PRIMARY_SOURCE_MAP;
    } else if (designatedRecipient === 'co-borrower') {
      sourceMap = COBORROWER_SOURCE_MAP;
    } else if (designatedRecipient === 'additional_guarantor') {
      sourceMap = GUARANTOR_SOURCE_MAP;
    } else {
      return;
    }

    // Debug: log available coborrower keys and source map lookups
    if (designatedRecipient === 'co-borrower') {
      const coborrowerKeys = Object.keys(currentValues).filter(k => k.startsWith('coborrower.'));
      console.log('[1098 Debug] Co-borrower keys in values:', coborrowerKeys);
      console.log('[1098 Debug] Source map:', sourceMap);
      console.log('[1098 Debug] Resolved values:', {
        name: currentValues[sourceMap.name],
        address: currentValues[sourceMap.address],
        tin: currentValues[sourceMap.tin],
      });
    }

    fireChange('name', currentValues[sourceMap.name] || '');
    fireChange('address', currentValues[sourceMap.address] || '');
    fireChange('city', currentValues[sourceMap.city] || '');
    fireChange('state', currentValues[sourceMap.state] || '');
    fireChange('zip', currentValues[sourceMap.zip] || '');
    fireChange('tin', currentValues[sourceMap.tin] || '');
    fireChange('tinType', currentValues[sourceMap.tinType] || '');
  }, [designatedRecipient]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="border-b border-border pb-2 mb-4">
        <span className="font-semibold text-base text-foreground">1098</span>
      </div>

      <div className="max-w-[700px] space-y-3">
        {/* Designated Recipient + Dropdown Populates */}
        <DirtyFieldWrapper fieldKey={FIELD_KEYS.designatedRecipient}>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-foreground whitespace-nowrap min-w-[140px]">Designated Recipient</Label>
            <Select
              value={getValue('designatedRecipient')}
              onValueChange={(value) => handleChange('designatedRecipient', value)}
              disabled={disabled}
            >
              <SelectTrigger className="h-7 text-sm flex-1 max-w-[200px] bg-background">
                <SelectValue placeholder="Dropdown Populates" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {DESIGNATED_RECIPIENT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DirtyFieldWrapper>

        <DirtyFieldWrapper fieldKey={FIELD_KEYS.name}>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-foreground whitespace-nowrap min-w-[140px]">Name</Label>
            <Input
              value={getValue('name')}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={disabled}
              className="h-7 text-sm flex-1"
            />
          </div>
        </DirtyFieldWrapper>

        <div className="grid grid-cols-2 gap-4">
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.address}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[140px]">Address</Label>
              <Input value={getValue('address')} onChange={(e) => handleChange('address', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.accountNumber}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[120px]">Account Number</Label>
              <Input value={getValue('accountNumber')} onChange={(e) => handleChange('accountNumber', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
          </DirtyFieldWrapper>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.city}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[140px]">City</Label>
              <Input value={getValue('city')} onChange={(e) => handleChange('city', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.tinType}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[120px]">TIN Type</Label>
              <Select value={getValue('tinType')} onValueChange={(value) => handleChange('tinType', value)} disabled={disabled}>
                <SelectTrigger className="h-7 text-sm flex-1 bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {TIN_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </DirtyFieldWrapper>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.state}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[140px]">State</Label>
              <Select value={getValue('state')} onValueChange={(value) => handleChange('state', value)} disabled={disabled}>
                <SelectTrigger className="h-7 text-sm flex-1 bg-background"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-background z-50 max-h-60">
                  {STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.tin}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[120px]">TIN</Label>
              <Input value={getValue('tin')} onChange={(e) => handleChange('tin', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
          </DirtyFieldWrapper>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.zip}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[140px]">ZIP</Label>
              <Input value={getValue('zip')} onChange={(e) => handleChange('zip', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.send1098}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-foreground whitespace-nowrap min-w-[120px]">Send 1098</Label>
              <Checkbox checked={getValue('send1098') === 'true'} onCheckedChange={(checked) => handleChange('send1098', checked === true ? 'true' : 'false')} disabled={disabled} />
            </div>
          </DirtyFieldWrapper>
        </div>
      </div>
    </div>
  );
};

export default BorrowerTaxDetailForm;
