import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { EmailInput } from '@/components/ui/email-input';
import { ZipInput } from '@/components/ui/zip-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { STATE_OPTIONS } from '@/lib/usStates';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';
import { BORROWER_AUTHORIZED_PARTY_KEYS } from '@/lib/fieldKeyMap';

const FIELD_KEYS = BORROWER_AUTHORIZED_PARTY_KEYS;

const BORROWER_TYPE_OPTIONS = [
  'Individual', 'Joint', 'Family Trust', 'LLC', 'C Corp / S Corp',
  'IRA / ERISA', 'Investment Fund', '401K', 'Foreign Holder W-8', 'Non-profit',
];

const TAX_ID_TYPE_OPTIONS = [
  { value: '0 - Unknown', label: '0 - Unknown' },
  { value: '1 - EIN', label: '1 - EIN' },
  { value: '2 - SSN', label: '2 - SSN' },
];

const CAPACITY_OPTIONS = [
  'Corporate Officer', 'Attorney', 'Power of Attorney',
  'Accountant / CPA', 'Family', 'Bankruptcy Trustee', 'Other',
];

const FORD_DROPDOWN_OPTIONS = [
  'Spouse, Kids, Grandkids', 'Big Dream', 'Sports Teams', 'Hobbies / Collections',
  'Goals / Achievements', 'Favorite Restaurant, Food, Drinks', 'Pet(s)', 'Vacation Spot',
  'Job / Occupation', 'Music / Bands', 'College', 'Hometown / Childhood',
  'TV / Movies / Books', 'Anniversary', 'Challenges / Frustrations',
  'Charity / Personal Causes', 'Upcoming Event - What / When', 'Celebration - What / When',
];

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

const InlineField = ({
  label, children, labelWidth = 'min-w-[140px]', fieldKey,
}: { label: string; children: React.ReactNode; labelWidth?: string; fieldKey?: string }) => {
  const content = (
    <div className="flex items-center gap-3">
      <Label className={`text-sm text-muted-foreground ${labelWidth} text-left shrink-0`}>{label}</Label>
      <div className="flex-1">{children}</div>
    </div>
  );
  if (fieldKey) return <DirtyFieldWrapper fieldKey={fieldKey}>{content}</DirtyFieldWrapper>;
  return content;
};

export const BorrowerAuthorizedPartyForm: React.FC<BorrowerAuthorizedPartyFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const [dateOpen, setDateOpen] = useState(false);

  const getValue = (key: keyof typeof FIELD_KEYS): string => values[FIELD_KEYS[key]] || '';
  const getBoolValue = (key: keyof typeof FIELD_KEYS): boolean => values[FIELD_KEYS[key]] === 'true';
  const handleChange = (key: keyof typeof FIELD_KEYS, value: string | boolean) => {
    onValueChange(FIELD_KEYS[key], String(value));
  };
  const handleNameChange = (key: keyof typeof FIELD_KEYS, raw: string) => {
    handleChange(key, sanitizeName(raw));
  };

  const handleSameAsPrimaryChange = (checked: boolean) => {
    handleChange('mailingSameAsPrimary', checked);
    if (checked) {
      handleChange('mailingStreet', getValue('primaryStreet'));
      handleChange('mailingCity', getValue('primaryCity'));
      handleChange('mailingState', getValue('primaryState'));
      handleChange('mailingZip', getValue('primaryZip'));
    } else {
      handleChange('mailingStreet', '');
      handleChange('mailingCity', '');
      handleChange('mailingState', '');
      handleChange('mailingZip', '');
    }
  };

  const isSameAsPrimary = getBoolValue('mailingSameAsPrimary');
  const primaryStreetVal = getValue('primaryStreet');
  const primaryCityVal = getValue('primaryCity');
  const primaryStateVal = getValue('primaryState');
  const primaryZipVal = getValue('primaryZip');

  useEffect(() => {
    if (isSameAsPrimary) {
      const mappings: [keyof typeof FIELD_KEYS, string][] = [
        ['mailingStreet', primaryStreetVal],
        ['mailingCity', primaryCityVal],
        ['mailingState', primaryStateVal],
        ['mailingZip', primaryZipVal],
      ];
      mappings.forEach(([dst, srcVal]) => {
        if (getValue(dst) !== srcVal) handleChange(dst, srcVal);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSameAsPrimary, primaryStreetVal, primaryCityVal, primaryStateVal, primaryZipVal]);

  const phoneRows: { key: keyof typeof FIELD_KEYS; prefKey: keyof typeof FIELD_KEYS; label: string; prefId: string; hasPreferred?: boolean }[] = [
    { key: 'phoneHome', prefKey: 'preferredHome', label: 'Home', prefId: 'ap-prefHome' },
    { key: 'phoneHome2', prefKey: 'preferredHome2', label: 'Home', prefId: 'ap-prefHome2' },
    { key: 'phoneWork', prefKey: 'preferredWork', label: 'Work', prefId: 'ap-prefWork' },
    { key: 'phoneCell', prefKey: 'preferredCell', label: 'Cell', prefId: 'ap-prefCell' },
    { key: 'phoneFax', prefKey: 'preferredFax', label: 'Fax', prefId: 'ap-prefFax', hasPreferred: false },
  ];

  return (
    <div className="p-4">
      <div className="grid gap-x-4 gap-y-0" style={{ gridTemplateColumns: '1.2fr 1.2fr 1.2fr auto' }}>
        {/* Column 1 - Name + Tax Info */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Name</h4>

          <InlineField label="Borrower ID" fieldKey={FIELD_KEYS.borrowerId}>
            <Input value={getValue('borrowerId')} onChange={(e) => handleChange('borrowerId', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Borrower Type" fieldKey={FIELD_KEYS.borrowerType}>
            <Select value={getValue('borrowerType')} onValueChange={(value) => handleChange('borrowerType', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{BORROWER_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <DirtyFieldWrapper fieldKey={FIELD_KEYS.fullName}>
            <div className="flex items-start gap-3">
              <div className="min-w-[140px] text-left shrink-0">
                <Label className="text-sm text-muted-foreground">Full Name</Label>
                <p className="text-xs text-muted-foreground">If Entity, Use Entity</p>
              </div>
              <Input value={getValue('fullName')} onChange={(e) => handleChange('fullName', e.target.value)} disabled={disabled} className="h-7 text-sm" />
            </div>
          </DirtyFieldWrapper>

          <DirtyFieldWrapper fieldKey={FIELD_KEYS.firstName}>
            <div className="flex items-start gap-3">
              <div className="min-w-[140px] text-left shrink-0">
                <Label className="text-sm text-muted-foreground">First</Label>
                <p className="text-xs text-muted-foreground">If Entity, Use Signer</p>
              </div>
              <Input value={getValue('firstName')} onChange={(e) => handleNameChange('firstName', e.target.value)} disabled={disabled} className="h-7 text-sm" maxLength={100} />
            </div>
          </DirtyFieldWrapper>

          <InlineField label="Middle" fieldKey={FIELD_KEYS.middleName}>
            <Input value={getValue('middleName')} onChange={(e) => handleNameChange('middleName', e.target.value)} disabled={disabled} className="h-7 text-sm" maxLength={100} />
          </InlineField>

          <InlineField label="Last" fieldKey={FIELD_KEYS.lastName}>
            <Input value={getValue('lastName')} onChange={(e) => handleNameChange('lastName', e.target.value)} disabled={disabled} className="h-7 text-sm" maxLength={100} />
          </InlineField>

          <InlineField label="Capacity" fieldKey={FIELD_KEYS.capacity}>
            <Select value={getValue('capacity')} onValueChange={(value) => handleChange('capacity', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {CAPACITY_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
              </SelectContent>
            </Select>
          </InlineField>

          <InlineField label="Email" fieldKey={FIELD_KEYS.email}>
            <EmailInput value={getValue('email')} onValueChange={(v) => handleChange('email', v)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <DirtyFieldWrapper fieldKey={FIELD_KEYS.dateAuthorized}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Date Authorized</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn('h-7 text-sm flex-1 justify-start font-normal', !getValue('dateAuthorized') && 'text-muted-foreground')}
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

          <InlineField label="Tax ID Type" fieldKey={FIELD_KEYS.taxIdType}>
            <Select value={getValue('taxIdType')} onValueChange={(v) => handleChange('taxIdType', v)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{TAX_ID_TYPE_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="TIN" fieldKey={FIELD_KEYS.tin}>
            <Input value={getValue('tin')} onChange={(e) => handleChange('tin', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <DirtyFieldWrapper fieldKey={FIELD_KEYS.issue1098}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Issue 1098</Label>
              <Checkbox
                checked={getBoolValue('issue1098')}
                onCheckedChange={(checked) => handleChange('issue1098', !!checked)}
                disabled={disabled}
              />
            </div>
          </DirtyFieldWrapper>
        </div>

        {/* Column 2 - Primary Address & Mailing Address & Delivery */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Primary Address</h4>

          <InlineField label="Street" labelWidth="min-w-[60px]" fieldKey={FIELD_KEYS.primaryStreet}>
            <Input value={getValue('primaryStreet')} onChange={(e) => handleChange('primaryStreet', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="City" labelWidth="min-w-[60px]" fieldKey={FIELD_KEYS.primaryCity}>
            <Input value={getValue('primaryCity')} onChange={(e) => handleChange('primaryCity', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="State" labelWidth="min-w-[60px]" fieldKey={FIELD_KEYS.primaryState}>
            <Select value={getValue('primaryState')} onValueChange={(value) => handleChange('primaryState', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="ZIP" labelWidth="min-w-[60px]" fieldKey={FIELD_KEYS.primaryZip}>
            <ZipInput value={getValue('primaryZip')} onValueChange={(v) => handleChange('primaryZip', v)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <h4 className="font-semibold text-sm text-foreground pb-1 pt-2 flex items-center gap-3">
            Mailing Address
            <div className="flex items-center gap-1.5 ml-4">
              <Checkbox
                id="ap-mailingSameAsPrimary"
                checked={isSameAsPrimary}
                onCheckedChange={(checked) => handleSameAsPrimaryChange(!!checked)}
                disabled={disabled}
              />
              <Label htmlFor="ap-mailingSameAsPrimary" className="text-xs font-normal text-muted-foreground">Same as Primary</Label>
            </div>
          </h4>

          <InlineField label="Street" labelWidth="min-w-[60px]" fieldKey={FIELD_KEYS.mailingStreet}>
            <Input value={getValue('mailingStreet')} onChange={(e) => handleChange('mailingStreet', e.target.value)} disabled={disabled || isSameAsPrimary} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="City" labelWidth="min-w-[60px]" fieldKey={FIELD_KEYS.mailingCity}>
            <Input value={getValue('mailingCity')} onChange={(e) => handleChange('mailingCity', e.target.value)} disabled={disabled || isSameAsPrimary} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="State" labelWidth="min-w-[60px]" fieldKey={FIELD_KEYS.mailingState}>
            <Select value={getValue('mailingState')} onValueChange={(value) => handleChange('mailingState', value)} disabled={disabled || isSameAsPrimary}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="ZIP" labelWidth="min-w-[60px]" fieldKey={FIELD_KEYS.mailingZip}>
            <ZipInput value={getValue('mailingZip')} onValueChange={(v) => handleChange('mailingZip', v)} disabled={disabled || isSameAsPrimary} className="h-7 text-sm" />
          </InlineField>

          <div className="pt-2">
            <h4 className="font-semibold text-sm text-foreground pb-1">Delivery</h4>
            <div className="flex items-center gap-4 flex-wrap">
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.deliveryOnline}>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="ap-deliveryOnline" checked={getBoolValue('deliveryOnline')} onCheckedChange={(checked) => handleChange('deliveryOnline', !!checked)} disabled={disabled} />
                  <Label htmlFor="ap-deliveryOnline" className="text-sm font-normal">Online</Label>
                </div>
              </DirtyFieldWrapper>
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.deliveryMail}>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="ap-deliveryMail" checked={getBoolValue('deliveryMail')} onCheckedChange={(checked) => handleChange('deliveryMail', !!checked)} disabled={disabled} />
                  <Label htmlFor="ap-deliveryMail" className="text-sm font-normal">Mail</Label>
                </div>
              </DirtyFieldWrapper>
            </div>
          </div>
        </div>

        {/* Column 3 - Phone + Send + FORD */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Phone</h4>
          {phoneRows.map(({ key, label }) => (
            <DirtyFieldWrapper key={key} fieldKey={FIELD_KEYS[key]}>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground min-w-[40px] text-left shrink-0">{label}</Label>
                <PhoneInput value={getValue(key)} onValueChange={(v) => handleChange(key, v)} disabled={disabled} className="h-7 text-sm flex-1" />
              </div>
            </DirtyFieldWrapper>
          ))}

          <div className="pt-2">
            <h4 className="font-semibold text-sm text-foreground pb-1">Send</h4>
            <div className="flex items-center gap-4 flex-wrap">
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.sendPaymentNotification}>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="ap-sendPaymentNotification" checked={getBoolValue('sendPaymentNotification')} onCheckedChange={(checked) => handleChange('sendPaymentNotification', !!checked)} disabled={disabled} />
                  <Label htmlFor="ap-sendPaymentNotification" className="text-sm font-normal">Payment Notification</Label>
                </div>
              </DirtyFieldWrapper>
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.sendBorrowerStatement}>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="ap-sendBorrowerStatement" checked={getBoolValue('sendBorrowerStatement')} onCheckedChange={(checked) => handleChange('sendBorrowerStatement', !!checked)} disabled={disabled} />
                  <Label htmlFor="ap-sendBorrowerStatement" className="text-sm font-normal">Borrower Statement</Label>
                </div>
              </DirtyFieldWrapper>
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.sendLateNotice}>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="ap-sendLateNotice" checked={getBoolValue('sendLateNotice')} onCheckedChange={(checked) => handleChange('sendLateNotice', !!checked)} disabled={disabled} />
                  <Label htmlFor="ap-sendLateNotice" className="text-sm font-normal">Late Notice</Label>
                </div>
              </DirtyFieldWrapper>
              <DirtyFieldWrapper fieldKey={FIELD_KEYS.sendMaturityNotice}>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="ap-sendMaturityNotice" checked={getBoolValue('sendMaturityNotice')} onCheckedChange={(checked) => handleChange('sendMaturityNotice', !!checked)} disabled={disabled} />
                  <Label htmlFor="ap-sendMaturityNotice" className="text-sm font-normal">Maturity Notice</Label>
                </div>
              </DirtyFieldWrapper>
            </div>
          </div>

          <h4 className="font-semibold text-sm text-foreground pb-1 pt-2">FORD</h4>
          <div className="space-y-1">
            {([['ford1', 'ford2'], ['ford3', 'ford4'], ['ford5', 'ford6'], ['ford7', 'ford8']] as [keyof typeof FIELD_KEYS, keyof typeof FIELD_KEYS][]).map(([dropdownKey, inputKey], idx) => (
              <div key={idx} className="grid grid-cols-2 gap-1">
                <Select value={getValue(dropdownKey)} onValueChange={(v) => handleChange(dropdownKey, v)} disabled={disabled}>
                  <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FORD_DROPDOWN_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={getValue(inputKey)} onChange={(e) => handleChange(inputKey, e.target.value)} disabled={disabled} className="h-7 text-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Column 4 - Preferred (narrow) */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Preferred</h4>
          {phoneRows.map(({ prefKey, prefId, hasPreferred }) => (
            hasPreferred === false ? (
              <div key={prefId} className="flex items-center justify-center h-7" />
            ) : (
              <DirtyFieldWrapper key={prefId} fieldKey={FIELD_KEYS[prefKey]}>
                <div className="flex items-center justify-center h-7">
                  <Checkbox
                    id={prefId}
                    checked={getBoolValue(prefKey)}
                    onCheckedChange={(checked) => handleChange(prefKey, !!checked)}
                    disabled={disabled}
                  />
                </div>
              </DirtyFieldWrapper>
            )
          ))}
        </div>
      </div>

      {/* Details textarea row */}
      <div className="mt-6">
        <h4 className="font-semibold text-sm text-foreground pb-1">Details</h4>
        <DirtyFieldWrapper fieldKey={FIELD_KEYS.details}>
          <Textarea
            value={getValue('details')}
            onChange={(e) => handleChange('details', e.target.value)}
            disabled={disabled}
            className="min-h-[80px] text-sm"
          />
        </DirtyFieldWrapper>
      </div>
    </div>
  );
};

export default BorrowerAuthorizedPartyForm;
