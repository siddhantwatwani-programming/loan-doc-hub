import React, { useMemo, useEffect } from 'react';
import { PhoneInput } from '@/components/ui/phone-input';
import { Input } from '@/components/ui/input';
import { EmailInput } from '@/components/ui/email-input';
import { ZipInput } from '@/components/ui/zip-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle } from 'lucide-react';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';

import { US_STATES } from '@/lib/usStates';

import { BROKER_INFO_KEYS } from '@/lib/fieldKeyMap';

// Use central field key map
const FIELD_KEYS = BROKER_INFO_KEYS;

interface BrokerInfoFormProps {
  disabled?: boolean;
  values?: Record<string, string>;
  onValueChange?: (fieldKey: string, value: string) => void;
}

export const BrokerInfoForm: React.FC<BrokerInfoFormProps> = ({ 
  disabled = false,
  values = {},
  onValueChange,
}) => {
  const getValue = (key: keyof typeof FIELD_KEYS): string => values[FIELD_KEYS[key]] || '';
  const getBoolValue = (key: keyof typeof FIELD_KEYS): boolean => values[FIELD_KEYS[key]] === 'true';

  const handleChange = (key: keyof typeof FIELD_KEYS, value: string | boolean) => {
    if (onValueChange) onValueChange(FIELD_KEYS[key], String(value));
  };

  const requiredFieldsStatus = useMemo(() => {
    const requiredFields: (keyof typeof FIELD_KEYS)[] = [];
    const filledCount = requiredFields.filter(field => getValue(field).trim() !== '').length;
    return { filledCount, totalRequired: requiredFields.length, missingCount: requiredFields.length - filledCount };
  }, [values]);

  // Reactive sync: when primary address changes while "Same as Primary" is checked
  const primaryStreetVal = getValue('street');
  const primaryCityVal = getValue('city');
  const primaryStateVal = getValue('state');
  const primaryZipVal = getValue('zip');
  const isMailingSame = getBoolValue('mailingSameAsPrimary');

  useEffect(() => {
    if (isMailingSame && onValueChange) {
      const mappings: [keyof typeof FIELD_KEYS, string][] = [
        ['mailingStreet', primaryStreetVal],
        ['mailingCity', primaryCityVal],
        ['mailingState', primaryStateVal],
        ['mailingZip', primaryZipVal],
      ];
      mappings.forEach(([dst, srcVal]) => {
        onValueChange(FIELD_KEYS[dst], srcVal);
      });
    }
  }, [isMailingSame, primaryStreetVal, primaryCityVal, primaryStateVal, primaryZipVal]);

  const renderInlineField = (key: keyof typeof FIELD_KEYS, label: string, required = false) => (
    <DirtyFieldWrapper fieldKey={FIELD_KEYS[key]}>
      <div className="flex items-center gap-2">
        <Label className="w-[100px] shrink-0 text-xs">{label}{required && <span className="text-destructive"> *</span>}</Label>
        <Input value={getValue(key)} onChange={(e) => handleChange(key, e.target.value)} disabled={disabled} className="h-7 text-xs flex-1" />
      </div>
    </DirtyFieldWrapper>
  );

  const handlePhonePref = (prefKey: keyof typeof FIELD_KEYS) => {
    const allPrefKeys: (keyof typeof FIELD_KEYS)[] = ['preferredHome', 'preferredWork', 'preferredCell', 'preferredFax'];
    allPrefKeys.forEach(k => {
      handleChange(k, k === prefKey);
    });
  };

  const renderPhoneField = (key: keyof typeof FIELD_KEYS, label: string) => (
    <DirtyFieldWrapper fieldKey={FIELD_KEYS[key]}>
      <div className="flex items-center gap-2">
        <Label className="w-14 shrink-0 text-xs">{label}</Label>
        <PhoneInput value={getValue(key)} onValueChange={(val) => handleChange(key, val)} disabled={disabled} className="h-7 text-xs flex-1" />
      </div>
    </DirtyFieldWrapper>
  );

  return (
    <div className="space-y-4">
      {requiredFieldsStatus.missingCount > 0 && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-1.5 text-amber-500">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{requiredFieldsStatus.missingCount} required field{requiredFieldsStatus.missingCount !== 1 ? 's' : ''} missing</span>
          </div>
          <span className="text-xs text-muted-foreground">{requiredFieldsStatus.filledCount}/{requiredFieldsStatus.totalRequired} filled</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-6 gap-y-0">
        {/* Column 1 - Broker Details + Representative */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Broker Details</h3>
          {renderInlineField('brokerId', 'Broker ID')}
          {renderInlineField('company', 'Company')}
          {renderInlineField('license', 'License')}

          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2 mt-4">Broker's Representative</h3>
          {renderInlineField('firstName', 'First Name')}
          {renderInlineField('lastName', 'Last Name')}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.repPhone}>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs">Phone</Label>
              <PhoneInput value={getValue('repPhone')} onValueChange={(v) => handleChange('repPhone', v)} disabled={disabled} className="h-7 text-xs flex-1" />
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.repEmail}>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs">Email</Label>
              <EmailInput value={getValue('repEmail')} onValueChange={(v) => handleChange('repEmail', v)} disabled={disabled} className="h-7 text-xs" />
            </div>
          </DirtyFieldWrapper>
          {renderInlineField('repLicense', 'License')}

          <DirtyFieldWrapper fieldKey={FIELD_KEYS.email}>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs">Email</Label>
              <EmailInput value={getValue('email')} onValueChange={(v) => handleChange('email', v)} disabled={disabled} className="h-7 text-xs" />
            </div>
          </DirtyFieldWrapper>


          <div className="space-y-1.5 pt-2">
            <DirtyFieldWrapper fieldKey={FIELD_KEYS.frozen}>
              <div className="flex items-center space-x-2">
                <Checkbox id="broker-frozen" checked={getBoolValue('frozen')} onCheckedChange={(checked) => handleChange('frozen', !!checked)} disabled={disabled} className="h-3.5 w-3.5" />
                <Label htmlFor="broker-frozen" className="text-xs font-normal cursor-pointer">Frozen</Label>
              </div>
            </DirtyFieldWrapper>
            <DirtyFieldWrapper fieldKey={FIELD_KEYS.agreementOnFile}>
              <div className="flex items-center space-x-2">
                <Checkbox id="broker-agreementOnFile" checked={getBoolValue('agreementOnFile')} onCheckedChange={(checked) => handleChange('agreementOnFile', !!checked)} disabled={disabled} className="h-3.5 w-3.5" />
                <Label htmlFor="broker-agreementOnFile" className="text-xs font-normal cursor-pointer">Agreement on File</Label>
              </div>
            </DirtyFieldWrapper>
            {renderInlineField('issue1099', 'Send 1099')}
          </div>
        </div>

        {/* Column 2 - Address */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Address</h3>
          {renderInlineField('street', 'Street')}
          {renderInlineField('city', 'City')}
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.state}>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs">State</Label>
              <Select value={getValue('state') || ''} onValueChange={(val) => handleChange('state', val)} disabled={disabled}>
                <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.zip}>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs">ZIP</Label>
              <ZipInput value={getValue('zip')} onValueChange={(v) => handleChange('zip', v)} disabled={disabled} className="h-7 text-xs" />
            </div>
          </DirtyFieldWrapper>
        </div>

        {/* Column 3 - Phone */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-[56px_1fr_72px] items-center gap-2 border-b border-border pb-1 mb-2">
            <span />
            <h3 className="font-semibold text-xs text-foreground">Phone</h3>
            <span className="font-semibold text-xs text-foreground text-center">Preferred</span>
          </div>
          <RadioGroup
            value={(['preferredHome', 'preferredWork', 'preferredCell', 'preferredFax'].find((key) => getBoolValue(key as keyof typeof FIELD_KEYS)) || '') as string}
            onValueChange={(value) => handlePhonePref(value as keyof typeof FIELD_KEYS)}
            className="space-y-1.5"
          >
            {[
              { phoneKey: 'phoneHome', prefKey: 'preferredHome', label: 'Home' },
              { phoneKey: 'phoneWork', prefKey: 'preferredWork', label: 'Work' },
              { phoneKey: 'phoneCell', prefKey: 'preferredCell', label: 'Cell' },
              { phoneKey: 'phoneFax', prefKey: 'preferredFax', label: 'Fax' },
            ].map(({ phoneKey, prefKey, label }) => (
              <div key={phoneKey} className="grid grid-cols-[56px_1fr_72px] items-center gap-2">
                {renderPhoneField(phoneKey as keyof typeof FIELD_KEYS, label)}
                <div className="flex justify-center">
                  <RadioGroupItem value={prefKey} disabled={disabled} aria-label={`Preferred ${label} phone`} />
                </div>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-1.5 pt-3">
            <Label className="text-xs font-medium">Send:</Label>
            {[
              { key: 'paymentNotification' as const, label: 'Payment Notification' },
              { key: 'lateNotice' as const, label: 'Late Notice' },
              { key: 'lenderStatement' as const, label: 'Lender Statement' },
            ].map(({ key, label }) => (
              <DirtyFieldWrapper key={key} fieldKey={FIELD_KEYS[key]}>
                <div className="flex items-center space-x-2">
                  <Checkbox id={key} checked={getBoolValue(key)} onCheckedChange={(checked) => handleChange(key, !!checked)} disabled={disabled} className="h-3.5 w-3.5" />
                  <Label htmlFor={key} className="text-xs font-normal cursor-pointer">{label}</Label>
                </div>
              </DirtyFieldWrapper>
            ))}
          </div>
        </div>

        {/* Column 4 - Send Preferences */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Send Preferences</h3>
          {[
            { key: 'borrowerStatement' as const, label: 'Borrower Statement' },
            { key: 'maturityNotice' as const, label: 'Maturity Notice' },
          ].map(({ key, label }) => (
            <DirtyFieldWrapper key={key} fieldKey={FIELD_KEYS[key]}>
              <div className="flex items-center space-x-2">
                <Checkbox id={key} checked={getBoolValue(key)} onCheckedChange={(checked) => handleChange(key, !!checked)} disabled={disabled} className="h-3.5 w-3.5" />
                <Label htmlFor={key} className="text-xs font-normal cursor-pointer">{label}</Label>
              </div>
            </DirtyFieldWrapper>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrokerInfoForm;
