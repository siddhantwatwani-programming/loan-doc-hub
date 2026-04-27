import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { EmailInput } from '@/components/ui/email-input';
import { ZipInput } from '@/components/ui/zip-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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

const FORD_DROPDOWN_OPTIONS = [
  { value: 'Spouse, Kids, Grandkids', label: 'Spouse, Kids, Grandkids' },
  { value: 'Big Dream', label: 'Big Dream' },
  { value: 'Sports Teams', label: 'Sports Teams' },
  { value: 'Hobbies / Collections', label: 'Hobbies / Collections' },
  { value: 'Goals / Achievements', label: 'Goals / Achievements' },
  { value: 'Favorite Restaurant, Food, Drinks', label: 'Favorite Restaurant, Food, Drinks' },
  { value: 'Pet(s)', label: 'Pet(s)' },
  { value: 'Vacation Spot', label: 'Vacation Spot' },
  { value: 'Job / Occupation', label: 'Job / Occupation' },
  { value: 'Music / Bands', label: 'Music / Bands' },
  { value: 'College', label: 'College' },
  { value: 'Hometown / Childhood', label: 'Hometown / Childhood' },
  { value: 'TV / Movies / Books', label: 'TV / Movies / Books' },
  { value: 'Anniversary', label: 'Anniversary' },
  { value: 'Challenges / Frustrations', label: 'Challenges / Frustrations' },
  { value: 'Charity / Personal Causes', label: 'Charity / Personal Causes' },
  { value: 'Upcoming Event - What / When', label: 'Upcoming Event - What / When' },
  { value: 'Celebration - What / When', label: 'Celebration - What / When' },
];

const BORROWER_TYPE_OPTIONS = [
  'Individual', 'Joint', 'Family Trust', 'LLC', 'C Corp / S Corp',
  'IRA / ERISA', 'Investment Fund', '401K', 'Foreign Holder W-8', 'Non-profit',
];

const CAPACITY_OPTIONS = [
  'Trustee', 'Successor Trustee', 'Authorized Signer', 'President', 'CEO',
  'Power of Attorney', 'Member', 'Manager', 'Partner', 'Attorney',
];

import { STATE_OPTIONS } from '@/lib/usStates';

import { BORROWER_GUARANTOR_KEYS } from '@/lib/fieldKeyMap';

// Use central field key map
const FIELD_KEYS = BORROWER_GUARANTOR_KEYS;

interface BorrowerAdditionalGuarantorFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const InlineField = ({ label, children, labelWidth = 'min-w-[140px]', fieldKey }: { label: string; children: React.ReactNode; labelWidth?: string; fieldKey?: string }) => {
  const content = (
    <div className="flex items-center gap-3">
      <Label className={`text-sm text-muted-foreground ${labelWidth} text-left shrink-0`}>{label}</Label>
      <div className="flex-1">{children}</div>
    </div>
  );
  if (fieldKey) {
    return <DirtyFieldWrapper fieldKey={fieldKey}>{content}</DirtyFieldWrapper>;
  }
  return content;
};

export const BorrowerAdditionalGuarantorForm: React.FC<BorrowerAdditionalGuarantorFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getValue = (key: keyof typeof FIELD_KEYS): string => {
    return values[FIELD_KEYS[key]] || '';
  };

  const getBoolValue = (key: keyof typeof FIELD_KEYS): boolean => {
    return values[FIELD_KEYS[key]] === 'true';
  };

  const handleChange = (key: keyof typeof FIELD_KEYS, value: string | boolean) => {
    onValueChange(FIELD_KEYS[key], String(value));
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
  }, [isSameAsPrimary, primaryStreetVal, primaryCityVal, primaryStateVal, primaryZipVal]);

  const phoneRows: { key: keyof typeof FIELD_KEYS; prefKey: keyof typeof FIELD_KEYS; label: string; prefId: string; hasPreferred?: boolean }[] = [
    { key: 'phoneHome', prefKey: 'preferredHome', label: 'Home', prefId: 'prefHome' },
    { key: 'phoneHome2', prefKey: 'preferredHome', label: 'Home', prefId: 'prefHome2', hasPreferred: false },
    { key: 'phoneWork', prefKey: 'preferredWork', label: 'Work', prefId: 'prefWork' },
    { key: 'phoneCell', prefKey: 'preferredCell', label: 'Cell', prefId: 'prefCell' },
    { key: 'phoneFax', prefKey: 'preferredFax', label: 'Fax', prefId: 'prefFax' },
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
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Entity Name - If Applicable</Label>
              <Input value={getValue('fullName')} onChange={(e) => handleChange('fullName', e.target.value)} disabled={disabled} className="h-7 text-sm" />
            </div>
          </DirtyFieldWrapper>

          <DirtyFieldWrapper fieldKey={FIELD_KEYS.firstName}>
            <div className="flex items-start gap-3">
              <div className="min-w-[140px] text-left shrink-0">
                <Label className="text-sm text-muted-foreground">First</Label>
                <p className="text-xs text-muted-foreground">If Entity, Use Signer</p>
              </div>
              <Input value={getValue('firstName')} onChange={(e) => handleChange('firstName', e.target.value)} disabled={disabled} className="h-7 text-sm" />
            </div>
          </DirtyFieldWrapper>

          <InlineField label="Middle" fieldKey={FIELD_KEYS.middleName}>
            <Input value={getValue('middleName')} onChange={(e) => handleChange('middleName', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Last" fieldKey={FIELD_KEYS.lastName}>
            <Input value={getValue('lastName')} onChange={(e) => handleChange('lastName', e.target.value)} disabled={disabled} className="h-7 text-sm" />
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

        </div>

        {/* Column 2 - Primary Address & Mailing Address & Delivery Options & Send */}
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
              <Checkbox id="guarantor-mailingSameAsPrimary" checked={getBoolValue('mailingSameAsPrimary')} onCheckedChange={(checked) => handleSameAsPrimaryChange(!!checked)} disabled={disabled} />
              <Label htmlFor="guarantor-mailingSameAsPrimary" className="text-xs font-normal text-muted-foreground">Same as Primary</Label>
            </div>
          </h4>

          <InlineField label="Street" labelWidth="min-w-[60px]" fieldKey={FIELD_KEYS.mailingStreet}>
            <Input value={getValue('mailingStreet')} onChange={(e) => handleChange('mailingStreet', e.target.value)} disabled={disabled || getBoolValue('mailingSameAsPrimary')} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="City" labelWidth="min-w-[60px]" fieldKey={FIELD_KEYS.mailingCity}>
            <Input value={getValue('mailingCity')} onChange={(e) => handleChange('mailingCity', e.target.value)} disabled={disabled || getBoolValue('mailingSameAsPrimary')} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="State" labelWidth="min-w-[60px]" fieldKey={FIELD_KEYS.mailingState}>
            <Select value={getValue('mailingState')} onValueChange={(value) => handleChange('mailingState', value)} disabled={disabled || getBoolValue('mailingSameAsPrimary')}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="ZIP" labelWidth="min-w-[60px]" fieldKey={FIELD_KEYS.mailingZip}>
            <ZipInput value={getValue('mailingZip')} onValueChange={(v) => handleChange('mailingZip', v)} disabled={disabled || getBoolValue('mailingSameAsPrimary')} className="h-7 text-sm" />
          </InlineField>

          {/* Delivery Options & Send - stacked, inline checkboxes */}
          <div className="pt-2 space-y-2">
            <div>
              <h4 className="font-semibold text-sm text-foreground pb-1">Delivery Options</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Checkbox id="guarantor-deliveryPrint" checked={getBoolValue('deliveryPrint')} onCheckedChange={(checked) => handleChange('deliveryPrint', !!checked)} disabled={disabled} />
                  <Label htmlFor="guarantor-deliveryPrint" className="text-sm font-normal">Print</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="guarantor-deliveryEmail" checked={getBoolValue('deliveryEmail')} onCheckedChange={(checked) => handleChange('deliveryEmail', !!checked)} disabled={disabled} />
                  <Label htmlFor="guarantor-deliveryEmail" className="text-sm font-normal">Email</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="guarantor-deliverySms" checked={getBoolValue('deliverySms')} onCheckedChange={(checked) => handleChange('deliverySms', !!checked)} disabled={disabled} />
                  <Label htmlFor="guarantor-deliverySms" className="text-sm font-normal">SMS</Label>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-foreground pb-1">Send</h4>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Checkbox id="guarantor-sendPaymentNotification" checked={getBoolValue('sendPaymentNotification')} onCheckedChange={(checked) => handleChange('sendPaymentNotification', !!checked)} disabled={disabled} />
                  <Label htmlFor="guarantor-sendPaymentNotification" className="text-sm font-normal">Payment Notification</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="guarantor-sendLateNotice" checked={getBoolValue('sendLateNotice')} onCheckedChange={(checked) => handleChange('sendLateNotice', !!checked)} disabled={disabled} />
                  <Label htmlFor="guarantor-sendLateNotice" className="text-sm font-normal">Late Notice</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="guarantor-sendBorrowerStatement" checked={getBoolValue('sendBorrowerStatement')} onCheckedChange={(checked) => handleChange('sendBorrowerStatement', !!checked)} disabled={disabled} />
                  <Label htmlFor="guarantor-sendBorrowerStatement" className="text-sm font-normal">Borrower Statement</Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="guarantor-sendMaturityNotice" checked={getBoolValue('sendMaturityNotice')} onCheckedChange={(checked) => handleChange('sendMaturityNotice', !!checked)} disabled={disabled} />
                  <Label htmlFor="guarantor-sendMaturityNotice" className="text-sm font-normal">Maturity Notice</Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3 - Phone + Vesting + FORD */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Phone</h4>
          {phoneRows.map(({ key, label }) => (
            <DirtyFieldWrapper key={key} fieldKey={FIELD_KEYS[key]}>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground min-w-[40px] text-left shrink-0">{label}</Label>
                <Input value={getValue(key)} onChange={(e) => handleChange(key, e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
              </div>
            </DirtyFieldWrapper>
          ))}

          <h4 className="font-semibold text-sm text-foreground pb-1 pt-2">Vesting</h4>
          <Textarea value={getValue('vesting')} onChange={(e) => handleChange('vesting', e.target.value)} disabled={disabled} className="text-sm min-h-[80px] resize-none" />

          <h4 className="font-semibold text-sm text-foreground pb-1 pt-2">FORD</h4>
          <div className="space-y-1">
            {([['ford1', 'ford2'], ['ford3', 'ford4'], ['ford5', 'ford6'], ['ford7', 'ford8']] as [keyof typeof FIELD_KEYS, keyof typeof FIELD_KEYS][]).map(([dropdownKey, inputKey], idx) => (
              <div key={idx} className="grid grid-cols-2 gap-1">
                <Select value={getValue(dropdownKey)} onValueChange={(v) => handleChange(dropdownKey, v)} disabled={disabled}>
                  <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{FORD_DROPDOWN_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={getValue(inputKey)} onChange={(e) => handleChange(inputKey, e.target.value)} disabled={disabled} className="h-7 text-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Column 4 - Preferred (narrow) */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Preferred</h4>
          {phoneRows.filter(({ key }) => key !== 'phoneFax').map(({ prefKey, prefId }) => (
            <div key={prefId} className="flex items-center justify-center h-7">
              <Checkbox id={`guarantor-${prefId}`} checked={getBoolValue(prefKey)} onCheckedChange={(checked) => handleChange(prefKey, !!checked)} disabled={disabled} />
            </div>
          ))}
          {/* Fax has no preferred slot — render spacer to keep alignment */}
          <div className="h-7" />
        </div>
      </div>
    </div>
  );
};

export default BorrowerAdditionalGuarantorForm;
