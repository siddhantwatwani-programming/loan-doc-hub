import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { EmailInput } from '@/components/ui/email-input';
import { ZipInput } from '@/components/ui/zip-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { US_STATES } from '@/lib/usStates';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';

const CAPACITY_OPTIONS = [
  'Corporate Officer',
  'Attorney',
  'Power of Attorney',
  'Accountant / CPA',
  'Family',
  'Bankruptcy Trustee',
  'Other',
];

import { BORROWER_AUTHORIZED_PARTY_KEYS } from '@/lib/fieldKeyMap';

// Use central field key map
const FIELD_KEYS = BORROWER_AUTHORIZED_PARTY_KEYS;

/** Only allow letters, spaces, hyphens, apostrophes */
const sanitizeName = (v: string) => v.replace(/[^a-zA-Z\s'\-]/g, '').slice(0, 100);

const parseDate = (dateStr: string): Date | undefined => {
  if (!dateStr) return undefined;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? undefined : date;
};

interface BorrowerAuthorizedPartyFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const BorrowerAuthorizedPartyForm: React.FC<BorrowerAuthorizedPartyFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [dateOpen, setDateOpen] = useState(false);

  const getValue = (key: keyof typeof FIELD_KEYS): string => {
    return values[FIELD_KEYS[key]] || '';
  };

  const getBoolValue = (key: keyof typeof FIELD_KEYS): boolean => {
    return values[FIELD_KEYS[key]] === 'true';
  };

  const handleChange = (key: keyof typeof FIELD_KEYS, value: string | boolean) => {
    onValueChange(FIELD_KEYS[key], String(value));
  };

  const handleNameChange = (key: keyof typeof FIELD_KEYS, raw: string) => {
    handleChange(key, sanitizeName(raw));
  };

  const renderNameField = (key: keyof typeof FIELD_KEYS, label: string) => (
    <DirtyFieldWrapper fieldKey={FIELD_KEYS[key]} key={key}>
      <div className="flex items-center gap-2">
        <Label className="w-[100px] shrink-0 text-xs text-muted-foreground">{label}</Label>
        <Input
          value={getValue(key)}
          onChange={(e) => handleNameChange(key, e.target.value)}
          disabled={disabled}
          className="h-7 text-xs flex-1"
          maxLength={100}
        />
      </div>
    </DirtyFieldWrapper>
  );

  const renderPhoneRow = (
    key: keyof typeof FIELD_KEYS,
    label: string,
    preferredKey?: keyof typeof FIELD_KEYS,
  ) => (
    <div className="grid grid-cols-[1fr_60px] gap-2 items-center">
      <DirtyFieldWrapper fieldKey={FIELD_KEYS[key]} key={key}>
        <div className="flex items-center gap-2">
          <Label className="w-[60px] shrink-0 text-xs text-muted-foreground">{label}</Label>
          <PhoneInput
            value={getValue(key)}
            onValueChange={(v) => handleChange(key, v)}
            disabled={disabled}
            className="h-7 text-xs flex-1"
          />
        </div>
      </DirtyFieldWrapper>
      {preferredKey ? (
        <DirtyFieldWrapper fieldKey={FIELD_KEYS[preferredKey]}>
          <div className="flex items-center justify-center h-7">
            <Checkbox
              checked={getBoolValue(preferredKey)}
              onCheckedChange={(checked) => handleChange(preferredKey, !!checked)}
              disabled={disabled}
              className="h-3.5 w-3.5"
            />
          </div>
        </DirtyFieldWrapper>
      ) : (
        <div />
      )}
    </div>
  );

  const renderInlineField = (key: keyof typeof FIELD_KEYS, label: string, type?: string) => (
    <DirtyFieldWrapper fieldKey={FIELD_KEYS[key]} key={key}>
      <div className="flex items-center gap-2">
        <Label className="w-[100px] shrink-0 text-xs text-muted-foreground">{label}</Label>
        <Input
          type={type}
          value={getValue(key)}
          onChange={(e) => handleChange(key, e.target.value)}
          disabled={disabled}
          className="h-7 text-xs flex-1"
        />
      </div>
    </DirtyFieldWrapper>
  );

  const sendCheckbox = (key: keyof typeof FIELD_KEYS, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="text-xs text-muted-foreground flex-1">{label}</Label>
      <DirtyFieldWrapper fieldKey={FIELD_KEYS[key]}>
        <Checkbox
          checked={getBoolValue(key)}
          onCheckedChange={(checked) => handleChange(key, !!checked)}
          disabled={disabled}
          className="h-3.5 w-3.5"
        />
      </DirtyFieldWrapper>
    </div>
  );

  const deliveryCheckbox = (key: keyof typeof FIELD_KEYS, label: string) => (
    <div className="flex items-center gap-2">
      <DirtyFieldWrapper fieldKey={FIELD_KEYS[key]}>
        <Checkbox
          checked={getBoolValue(key)}
          onCheckedChange={(checked) => handleChange(key, !!checked)}
          disabled={disabled}
          className="h-3.5 w-3.5"
        />
      </DirtyFieldWrapper>
      <Label className="text-xs text-muted-foreground">{label}</Label>
    </div>
  );

  return (
    <div className="p-4">
      {/* Row 1: Name | Address | Phone | Preferred */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr_1.1fr_70px] gap-x-6 gap-y-0">
        {/* Column 1: Name */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Name</h3>
          {renderNameField('firstName', 'First')}
          {renderNameField('middleName', 'Middle')}
          {renderNameField('lastName', 'Last')}
          <div className="flex items-center gap-2">
            <Label className="w-[100px] shrink-0 text-xs text-muted-foreground">Capacity</Label>
            <Select
              value={getValue('capacity')}
              onValueChange={(value) => handleChange('capacity', value)}
              disabled={disabled}
            >
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {CAPACITY_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.email}>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs text-muted-foreground">Email</Label>
              <EmailInput value={getValue('email')} onValueChange={(v) => handleChange('email', v)} disabled={disabled} className="h-7 text-xs" />
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.dateAuthorized}>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs text-muted-foreground">Date Authorized</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                      'h-7 text-xs flex-1 justify-start font-normal',
                      !getValue('dateAuthorized') && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5 mr-2 opacity-60" />
                    {getValue('dateAuthorized')
                      ? format(parseDate(getValue('dateAuthorized'))!, 'MM/dd/yyyy')
                      : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                  <EnhancedCalendar
                    mode="single"
                    selected={parseDate(getValue('dateAuthorized'))}
                    onSelect={(date) => { handleChange('dateAuthorized', date ? format(date, 'yyyy-MM-dd') : ''); setDateOpen(false); }}
                    onClear={() => { handleChange('dateAuthorized', ''); setDateOpen(false); }}
                    onToday={() => { handleChange('dateAuthorized', format(new Date(), 'yyyy-MM-dd')); setDateOpen(false); }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </DirtyFieldWrapper>
        </div>

        {/* Column 2: Address */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Address</h3>
          {renderInlineField('street', 'Street')}
          {renderInlineField('city', 'City')}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.state} key="state">
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs text-muted-foreground">State</Label>
              <Select value={getValue('state')} onValueChange={(v) => handleChange('state', v)} disabled={disabled}>
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map(s => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.zip} key="zip">
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs text-muted-foreground">ZIP</Label>
              <ZipInput value={getValue('zip')} onValueChange={(v) => handleChange('zip', v)} disabled={disabled} className="h-7 text-xs" />
            </div>
          </DirtyFieldWrapper>
        </div>

        {/* Column 3: Phone (with embedded Preferred) */}
        <div className="space-y-1.5 col-span-1 lg:col-span-2">
          <div className="grid grid-cols-[1fr_60px] gap-2">
            <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Phone</h3>
            <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2 text-center">Preferred</h3>
          </div>
          {renderPhoneRow('phoneHome', 'Home', 'preferredHome')}
          {renderPhoneRow('phoneWork', 'Work', 'preferredWork')}
          {renderPhoneRow('phoneCell', 'Cell', 'preferredCell')}
          {renderPhoneRow('phoneFax', 'Fax')}
        </div>
      </div>

      {/* Row 2: Delivery Options + Send (left panel) | Details (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-x-6 gap-y-0 mt-6">
        {/* Left panel: Delivery Options + Send */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Delivery Options:</h3>
          <div className="grid grid-cols-[160px_1fr] gap-x-6">
            {/* Delivery Options */}
            <div className="space-y-1.5">
              {deliveryCheckbox('deliveryOnline', 'Online')}
              {deliveryCheckbox('deliveryMail', 'Mail')}
              {deliveryCheckbox('deliverySms', 'SMS')}
            </div>
            {/* Send */}
            <div>
              <div className="text-xs font-semibold text-foreground mb-1.5">Send</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {sendCheckbox('sendPaymentConfirmation', 'Payment Confirmation')}
                {sendCheckbox('sendLateNotice', 'Late Notice')}
                {sendCheckbox('sendCouponBook', 'Coupon Book')}
                {sendCheckbox('sendMaturityNotice', 'Maturity Notice')}
                {sendCheckbox('sendPaymentStatement', 'Payment Statement')}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Details */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-foreground border-b border-border pb-1 mb-2">Details</h3>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.details}>
            <Textarea
              value={getValue('details')}
              onChange={(e) => handleChange('details', e.target.value)}
              disabled={disabled}
              className="min-h-[80px] text-xs"
            />
          </DirtyFieldWrapper>
        </div>
      </div>
    </div>
  );
};

export default BorrowerAuthorizedPartyForm;
