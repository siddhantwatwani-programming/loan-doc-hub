import React from 'react';
import { Input } from '@/components/ui/input';
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

const BORROWER_TYPE_OPTIONS = [
  'Individual',
  'Joint',
  'Family Trust',
  'LLC',
  'C Corp / S Corp',
  'IRA / ERISA',
  'Investment Fund',
  '401K',
  'Foreign Holder W-8',
  'Non-profit',
];

const CAPACITY_OPTIONS = [
  'Borrower',
  'Co-Borrower',
  'Additional Guarantor',
  'Authorized Party',
];

const STATE_OPTIONS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
];

// Field key mapping for additional guarantor fields
const FIELD_KEYS = {
  // Guarantor Details
  borrowerType: 'borrower.guarantor.borrower_type',
  borrowerId: 'borrower.guarantor.borrower_id',
  fullName: 'borrower.guarantor.full_name',
  firstName: 'borrower.guarantor.first_name',
  middleName: 'borrower.guarantor.middle_initial',
  lastName: 'borrower.guarantor.last_name',
  capacity: 'borrower.guarantor.capacity',
  email: 'borrower.guarantor.email',
  creditScore: 'borrower.guarantor.credit_score',
  issue1098: 'borrower.guarantor.issue_1098',
  alternateReporting: 'borrower.guarantor.alternate_reporting',
  // Primary Address
  primaryStreet: 'borrower.guarantor.address.street',
  primaryCity: 'borrower.guarantor.address.city',
  primaryState: 'borrower.guarantor.state',
  primaryZip: 'borrower.guarantor.address.zip',
  // Mailing Address
  mailingSameAsPrimary: 'borrower.guarantor.mailing_same_as_primary',
  mailingStreet: 'borrower.guarantor.mailing.street',
  mailingCity: 'borrower.guarantor.mailing.city',
  mailingState: 'borrower.guarantor.mailing.state',
  mailingZip: 'borrower.guarantor.mailing.zip',
  // Phone
  phoneHome: 'borrower.guarantor.phone.home',
  phoneWork: 'borrower.guarantor.phone.work',
  phoneCell: 'borrower.guarantor.phone.mobile',
  phoneFax: 'borrower.guarantor.phone.fax',
  preferredHome: 'borrower.guarantor.preferred.home',
  preferredWork: 'borrower.guarantor.preferred.work',
  preferredCell: 'borrower.guarantor.preferred.cell',
  preferredFax: 'borrower.guarantor.preferred.fax',
  // Delivery
  deliveryOnline: 'borrower.guarantor.delivery_online',
  deliveryMail: 'borrower.guarantor.delivery_mail',
  // Vesting & FORD
  vesting: 'borrower.guarantor.vesting',
  vestingOverridden: 'borrower.guarantor.vesting_overridden',
  ford1: 'borrower.guarantor.ford.1',
  ford2: 'borrower.guarantor.ford.2',
  ford3: 'borrower.guarantor.ford.3',
  ford4: 'borrower.guarantor.ford.4',
  ford5: 'borrower.guarantor.ford.5',
  ford6: 'borrower.guarantor.ford.6',
  ford7: 'borrower.guarantor.ford.7',
  ford8: 'borrower.guarantor.ford.8',
} as const;

interface BorrowerAdditionalGuarantorFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const InlineField = ({ label, children, labelWidth = 'min-w-[140px]' }: { label: string; children: React.ReactNode; labelWidth?: string }) => (
  <div className="flex items-center gap-3">
    <Label className={`text-sm text-muted-foreground ${labelWidth} text-left shrink-0`}>{label}</Label>
    <div className="flex-1">{children}</div>
  </div>
);

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
    }
  };

  const phoneRows: { key: keyof typeof FIELD_KEYS; prefKey: keyof typeof FIELD_KEYS; label: string; prefId: string }[] = [
    { key: 'phoneHome', prefKey: 'preferredHome', label: 'Home', prefId: 'prefHome' },
    { key: 'phoneWork', prefKey: 'preferredWork', label: 'Work', prefId: 'prefWork' },
    { key: 'phoneCell', prefKey: 'preferredCell', label: 'Cell', prefId: 'prefCell' },
    { key: 'phoneFax', prefKey: 'preferredFax', label: 'Fax', prefId: 'prefFax' },
  ];

  return (
    <div className="p-4">
      <div className="grid gap-x-4 gap-y-0" style={{ gridTemplateColumns: '1.2fr 1.2fr 1.2fr auto' }}>
        {/* Column 1 - Name */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Name</h4>

          <InlineField label="Borrower ID">
            <Input value={getValue('borrowerId')} onChange={(e) => handleChange('borrowerId', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Borrower Type">
            <Select value={getValue('borrowerType')} onValueChange={(value) => handleChange('borrowerType', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{BORROWER_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="Capacity">
            <Select value={getValue('capacity')} onValueChange={(value) => handleChange('capacity', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {CAPACITY_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
              </SelectContent>
            </Select>
          </InlineField>

          <InlineField label="Full Name: If Entity, Use Entity">
            <Input value={getValue('fullName')} onChange={(e) => handleChange('fullName', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="First: If Entity, Use Signer">
            <Input value={getValue('firstName')} onChange={(e) => handleChange('firstName', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Middle">
            <Input value={getValue('middleName')} onChange={(e) => handleChange('middleName', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Last">
            <Input value={getValue('lastName')} onChange={(e) => handleChange('lastName', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Email">
            <Input type="email" value={getValue('email')} onChange={(e) => handleChange('email', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <div className="h-0.5" />

          <InlineField label="Credit Score">
            <Input value={getValue('creditScore')} onChange={(e) => handleChange('creditScore', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <div className="flex items-center gap-2">
            <Checkbox id="guarantor-issue1098" checked={getBoolValue('issue1098')} onCheckedChange={(checked) => handleChange('issue1098', !!checked)} disabled={disabled} />
            <Label htmlFor="guarantor-issue1098" className="text-sm font-normal">Issue 1098</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="guarantor-alternateReporting" checked={getBoolValue('alternateReporting')} onCheckedChange={(checked) => handleChange('alternateReporting', !!checked)} disabled={disabled} />
            <Label htmlFor="guarantor-alternateReporting" className="text-sm font-normal">Alternate Reporting</Label>
          </div>
        </div>

        {/* Column 2 - Primary Address & Mailing Address & Delivery */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Primary Address</h4>

          <InlineField label="Street" labelWidth="min-w-[60px]">
            <Input value={getValue('primaryStreet')} onChange={(e) => handleChange('primaryStreet', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="City" labelWidth="min-w-[60px]">
            <Input value={getValue('primaryCity')} onChange={(e) => handleChange('primaryCity', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="State" labelWidth="min-w-[60px]">
            <Select value={getValue('primaryState')} onValueChange={(value) => handleChange('primaryState', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="ZIP" labelWidth="min-w-[60px]">
            <Input value={getValue('primaryZip')} onChange={(e) => handleChange('primaryZip', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <h4 className="font-semibold text-sm text-foreground pb-1 pt-2 flex items-center gap-3">
            Mailing Address
            <div className="flex items-center gap-1.5 ml-4">
              <Checkbox id="guarantor-mailingSameAsPrimary" checked={getBoolValue('mailingSameAsPrimary')} onCheckedChange={(checked) => handleSameAsPrimaryChange(!!checked)} disabled={disabled} />
              <Label htmlFor="guarantor-mailingSameAsPrimary" className="text-xs font-normal text-muted-foreground">Same as Primary</Label>
            </div>
          </h4>

          <InlineField label="Street" labelWidth="min-w-[60px]">
            <Input value={getValue('mailingStreet')} onChange={(e) => handleChange('mailingStreet', e.target.value)} disabled={disabled || getBoolValue('mailingSameAsPrimary')} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="City" labelWidth="min-w-[60px]">
            <Input value={getValue('mailingCity')} onChange={(e) => handleChange('mailingCity', e.target.value)} disabled={disabled || getBoolValue('mailingSameAsPrimary')} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="State" labelWidth="min-w-[60px]">
            <Select value={getValue('mailingState')} onValueChange={(value) => handleChange('mailingState', value)} disabled={disabled || getBoolValue('mailingSameAsPrimary')}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="ZIP" labelWidth="min-w-[60px]">
            <Input value={getValue('mailingZip')} onChange={(e) => handleChange('mailingZip', e.target.value)} disabled={disabled || getBoolValue('mailingSameAsPrimary')} className="h-7 text-sm" />
          </InlineField>

          <h4 className="font-semibold text-sm text-foreground pb-1 pt-2">Delivery</h4>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground min-w-[60px] text-left shrink-0">Online</Label>
            <Checkbox id="guarantor-deliveryOnline" checked={getBoolValue('deliveryOnline')} onCheckedChange={(checked) => handleChange('deliveryOnline', !!checked)} disabled={disabled} />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground min-w-[60px] text-left shrink-0">Mail</Label>
            <Checkbox id="guarantor-deliveryMail" checked={getBoolValue('deliveryMail')} onCheckedChange={(checked) => handleChange('deliveryMail', !!checked)} disabled={disabled} />
          </div>
        </div>

        {/* Column 3 - Phone + Vesting + FORD */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Phone</h4>
          {phoneRows.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[40px] text-left shrink-0">{label}</Label>
              <Input value={getValue(key)} onChange={(e) => handleChange(key, e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
          ))}

          <h4 className="font-semibold text-sm text-foreground pb-1 pt-2">Vesting</h4>
          <Textarea value={getValue('vesting')} onChange={(e) => handleChange('vesting', e.target.value)} disabled={disabled} className="text-sm min-h-[80px] resize-none" />

          <h4 className="font-semibold text-sm text-foreground pb-1 pt-2">FORD</h4>
          <div className="grid grid-cols-2 gap-1">
            {(['ford1', 'ford2', 'ford3', 'ford4', 'ford5', 'ford6', 'ford7', 'ford8'] as (keyof typeof FIELD_KEYS)[]).map((key) => (
              <Input key={key} value={getValue(key)} onChange={(e) => handleChange(key, e.target.value)} disabled={disabled} className="h-7 text-sm" />
            ))}
          </div>
        </div>

        {/* Column 4 - Preferred (narrow) */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Preferred</h4>
          {phoneRows.map(({ prefKey, prefId }) => (
            <div key={prefId} className="flex items-center justify-center h-7">
              <Checkbox id={`guarantor-${prefId}`} checked={getBoolValue(prefKey)} onCheckedChange={(checked) => handleChange(prefKey, !!checked)} disabled={disabled} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BorrowerAdditionalGuarantorForm;
