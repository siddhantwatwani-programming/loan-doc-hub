import React, { useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';
import { DirtyFieldWrapper } from './DirtyFieldWrapper';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP',
];

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
    const requiredFields: (keyof typeof FIELD_KEYS)[] = ['brokerId'];
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

  const renderPhoneField = (key: keyof typeof FIELD_KEYS, prefKey: keyof typeof FIELD_KEYS, label: string) => (
    <DirtyFieldWrapper fieldKey={FIELD_KEYS[key]}>
      <div className="flex items-center gap-2">
        <Label className="w-14 shrink-0 text-xs">{label}</Label>
        <Input type="tel" value={getValue(key)} onChange={(e) => handleChange(key, e.target.value)} disabled={disabled} className="h-7 text-xs flex-1" />
        <Checkbox
          checked={getBoolValue(prefKey)}
          onCheckedChange={(checked) => handleChange(prefKey, !!checked)}
          disabled={disabled}
          className="h-3.5 w-3.5 shrink-0"
        />
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
        {/* Column 1 - Name */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Broker Details</h3>
          {renderInlineField('brokerId', 'Broker ID', true)}
          {renderInlineField('license', 'License')}
          {renderInlineField('company', 'Company')}
          {renderInlineField('fullName', 'Full Name')}
          {renderInlineField('firstName', 'First')}
          {renderInlineField('middleName', 'Middle')}
          {renderInlineField('lastName', 'Last')}
          {renderInlineField('email', 'Email')}

          <div className="space-y-1.5 pt-2">
            <DirtyFieldWrapper fieldKey={FIELD_KEYS.taxIdType}>
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">Tax ID Type</Label>
                <Select value={getValue('taxIdType') || '0'} onValueChange={(val) => handleChange('taxIdType', val)} disabled={disabled}>
                  <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 - Unknown</SelectItem>
                    <SelectItem value="1">1 - EIN</SelectItem>
                    <SelectItem value="2">2 - SSN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </DirtyFieldWrapper>
            {renderInlineField('taxId', 'TIN')}
            <DirtyFieldWrapper fieldKey={FIELD_KEYS.tinVerified}>
              <div className="flex items-center space-x-2">
                <Checkbox id="broker-tinVerified" checked={getBoolValue('tinVerified')} onCheckedChange={(checked) => handleChange('tinVerified', !!checked)} disabled={disabled} className="h-3.5 w-3.5" />
                <Label htmlFor="broker-tinVerified" className="text-xs font-normal cursor-pointer">TIN Verified</Label>
              </div>
            </DirtyFieldWrapper>
          </div>

          <div className="space-y-1.5 pt-2">
            <DirtyFieldWrapper fieldKey={FIELD_KEYS.frozen}>
              <div className="flex items-center space-x-2">
                <Checkbox id="broker-frozen" checked={getBoolValue('frozen')} onCheckedChange={(checked) => handleChange('frozen', !!checked)} disabled={disabled} className="h-3.5 w-3.5" />
                <Label htmlFor="broker-frozen" className="text-xs font-normal cursor-pointer">Frozen</Label>
              </div>
            </DirtyFieldWrapper>
            <DirtyFieldWrapper fieldKey={FIELD_KEYS.ach}>
              <div className="flex items-center space-x-2">
                <Checkbox id="broker-ach" checked={getBoolValue('ach')} onCheckedChange={(checked) => handleChange('ach', !!checked)} disabled={disabled} className="h-3.5 w-3.5" />
                <Label htmlFor="broker-ach" className="text-xs font-normal cursor-pointer">ACH</Label>
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
          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Primary Address</h3>
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
          {renderInlineField('zip', 'ZIP')}

          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2 mt-3 flex items-center gap-3">
            Mailing Address
            <div className="flex items-center gap-1.5 ml-2">
              <Checkbox id="broker-mailingSameAsPrimary" checked={getBoolValue('mailingSameAsPrimary')} onCheckedChange={(checked) => {
                handleChange('mailingSameAsPrimary', !!checked);
                if (checked) {
                  handleChange('mailingStreet', getValue('street'));
                  handleChange('mailingCity', getValue('city'));
                  handleChange('mailingState', getValue('state'));
                  handleChange('mailingZip', getValue('zip'));
                } else {
                  handleChange('mailingStreet', '');
                  handleChange('mailingCity', '');
                  handleChange('mailingState', '');
                  handleChange('mailingZip', '');
                }
              }} disabled={disabled} className="h-3.5 w-3.5" />
              <Label htmlFor="broker-mailingSameAsPrimary" className="text-[10px] font-normal text-muted-foreground">Same as Primary</Label>
            </div>
          </h3>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.mailingStreet}>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs">Street</Label>
              <Input value={getValue('mailingStreet')} onChange={(e) => handleChange('mailingStreet', e.target.value)} disabled={disabled || getBoolValue('mailingSameAsPrimary')} className="h-7 text-xs flex-1" />
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.mailingCity}>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs">City</Label>
              <Input value={getValue('mailingCity')} onChange={(e) => handleChange('mailingCity', e.target.value)} disabled={disabled || getBoolValue('mailingSameAsPrimary')} className="h-7 text-xs flex-1" />
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.mailingState}>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs">State</Label>
              <Select value={getValue('mailingState') || ''} onValueChange={(val) => handleChange('mailingState', val)} disabled={disabled || getBoolValue('mailingSameAsPrimary')}>
                <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={FIELD_KEYS.mailingZip}>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs">ZIP</Label>
              <Input value={getValue('mailingZip')} onChange={(e) => handleChange('mailingZip', e.target.value)} disabled={disabled || getBoolValue('mailingSameAsPrimary')} className="h-7 text-xs flex-1" />
            </div>
          </DirtyFieldWrapper>
        </div>

        {/* Column 3 - Phone */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Phone</h3>
          {renderPhoneField('phoneHome', 'preferredHome', 'Home')}
          {renderPhoneField('phoneWork', 'preferredWork', 'Work')}
          {renderPhoneField('phoneCell', 'preferredCell', 'Cell')}
          {renderPhoneField('phoneFax', 'preferredFax', 'Fax')}

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
