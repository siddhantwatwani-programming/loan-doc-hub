import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { EmailInput } from '@/components/ui/email-input';
import { ZipInput } from '@/components/ui/zip-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer Not to Say', label: 'Prefer Not to Say' },
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Widowed', label: 'Widowed' },
];

const EDUCATION_LEVEL_OPTIONS = [
  { value: 'High School', label: 'High School' },
  { value: 'Some College', label: 'Some College' },
  { value: 'Associate\'s Degree', label: 'Associate\'s Degree' },
  { value: 'Bachelor\'s Degree', label: 'Bachelor\'s Degree' },
  { value: 'Master\'s Degree', label: 'Master\'s Degree' },
  { value: 'Doctorate', label: 'Doctorate' },
];

const LANGUAGE_PROFICIENCY_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Other', label: 'Other' },
];

const ETHNICITY_OPTIONS = [
  { value: 'Hispanic or Latino', label: 'Hispanic or Latino' },
  { value: 'Not Hispanic or Latino', label: 'Not Hispanic or Latino' },
  { value: 'Prefer Not to Say', label: 'Prefer Not to Say' },
];

const RACE_OPTIONS = [
  { value: 'American Indian or Alaska Native', label: 'American Indian or Alaska Native' },
  { value: 'Asian', label: 'Asian' },
  { value: 'Black or African American', label: 'Black or African American' },
  { value: 'Native Hawaiian or Other Pacific Islander', label: 'Native Hawaiian or Other Pacific Islander' },
  { value: 'White', label: 'White' },
  { value: 'Two or More Races', label: 'Two or More Races' },
  { value: 'Prefer Not to Say', label: 'Prefer Not to Say' },
];

const CITIZENSHIP_OPTIONS = [
  { value: 'US Citizen', label: 'US Citizen' },
  { value: 'Permanent Resident Alien', label: 'Permanent Resident Alien' },
  { value: 'Non-Permanent Resident Alien', label: 'Non-Permanent Resident Alien' },
];

const VISA_TYPE_OPTIONS = [
  { value: 'H-1B', label: 'H-1B' },
  { value: 'L-1', label: 'L-1' },
  { value: 'O-1', label: 'O-1' },
  { value: 'TN', label: 'TN' },
  { value: 'E-3', label: 'E-3' },
  { value: 'Other', label: 'Other' },
];

const RESIDENCY_TYPE_OPTIONS = [
  { value: 'Primary Residence', label: 'Primary Residence' },
  { value: 'Secondary Residence', label: 'Secondary Residence' },
  { value: 'Investment Property', label: 'Investment Property' },
];

const OCCUPATION_TYPE_OPTIONS = [
  { value: 'Employed', label: 'Employed' },
  { value: 'Self-Employed', label: 'Self-Employed' },
  { value: 'Retired', label: 'Retired' },
  { value: 'Unemployed', label: 'Unemployed' },
  { value: 'Student', label: 'Student' },
  { value: 'Other', label: 'Other' },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'Full-Time', label: 'Full-Time' },
  { value: 'Part-Time', label: 'Part-Time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Temporary', label: 'Temporary' },
  { value: 'Seasonal', label: 'Seasonal' },
];

const INDUSTRY_OPTIONS = [
  { value: 'Accounting', label: 'Accounting' },
  { value: 'Aerospace', label: 'Aerospace' },
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Arts and Entertainment', label: 'Arts and Entertainment' },
  { value: 'Automotive', label: 'Automotive' },
  { value: 'Banking', label: 'Banking' },
  { value: 'Biotechnology', label: 'Biotechnology' },
  { value: 'Construction', label: 'Construction' },
  { value: 'Consulting', label: 'Consulting' },
  { value: 'Education', label: 'Education' },
  { value: 'Energy', label: 'Energy' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Food and Beverage', label: 'Food and Beverage' },
  { value: 'Government', label: 'Government' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Hospitality', label: 'Hospitality' },
  { value: 'Information Technology', label: 'Information Technology' },
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Marketing and Advertising', label: 'Marketing and Advertising' },
  { value: 'Media and Communications', label: 'Media and Communications' },
  { value: 'Nonprofit', label: 'Nonprofit' },
  { value: 'Pharmaceuticals', label: 'Pharmaceuticals' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Telecommunications', label: 'Telecommunications' },
  { value: 'Transportation and Logistics', label: 'Transportation and Logistics' },
  { value: 'Utilities', label: 'Utilities' },
  { value: 'Other', label: 'Other' },
];

const JOB_TITLE_OPTIONS = [
  { value: 'Accountant', label: 'Accountant' },
  { value: 'Software Engineer', label: 'Software Engineer' },
  { value: 'Registered Nurse', label: 'Registered Nurse' },
  { value: 'Teacher', label: 'Teacher' },
  { value: 'Financial Analyst', label: 'Financial Analyst' },
  { value: 'Project Manager', label: 'Project Manager' },
  { value: 'Sales Representative', label: 'Sales Representative' },
  { value: 'Marketing Manager', label: 'Marketing Manager' },
  { value: 'Human Resources Manager', label: 'Human Resources Manager' },
  { value: 'Data Scientist', label: 'Data Scientist' },
  { value: 'Business Analyst', label: 'Business Analyst' },
  { value: 'Customer Service Representative', label: 'Customer Service Representative' },
  { value: 'Administrative Assistant', label: 'Administrative Assistant' },
  { value: 'Executive Assistant', label: 'Executive Assistant' },
  { value: 'Physician', label: 'Physician' },
  { value: 'Attorney', label: 'Attorney' },
  { value: 'Electrician', label: 'Electrician' },
  { value: 'Mechanic', label: 'Mechanic' },
  { value: 'Construction Worker', label: 'Construction Worker' },
  { value: 'Truck Driver', label: 'Truck Driver' },
  { value: 'Chef', label: 'Chef' },
  { value: 'Waiter/Waitress', label: 'Waiter/Waitress' },
  { value: 'Cashier', label: 'Cashier' },
  { value: 'Security Guard', label: 'Security Guard' },
  { value: 'Janitor', label: 'Janitor' },
  { value: 'Other', label: 'Other' },
];

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

interface CoBorrowerPrimaryFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const BORROWER_TYPE_OPTIONS = [
  'Individual', 'Joint', 'Family Trust', 'LLC', 'C Corp / S Corp',
  'IRA / ERISA', 'Investment Fund', '401K', 'Foreign Holder W-8', 'Non-profit',
];

const CAPACITY_OPTIONS = [
  'Trustee', 'Successor Trustee', 'Authorized Signer', 'President', 'CEO',
  'Power of Attorney', 'Member', 'Manager', 'Partner', 'Attorney',
];

import { STATE_OPTIONS } from '@/lib/usStates';

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

export const CoBorrowerPrimaryForm: React.FC<CoBorrowerPrimaryFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (key: string) => values[`coborrower.${key}`] || '';
  const getBoolValue = (key: string) => values[`coborrower.${key}`] === 'true';
  const fk = (key: string) => `coborrower.${key}`;

  const handleChange = (key: string, value: string) => {
    onValueChange(`coborrower.${key}`, value);
  };

  const handleSameAsPrimaryChange = (checked: boolean) => {
    handleChange('mailing_same_as_primary', String(checked));
    if (checked) {
      handleChange('mailing_address.street', getValue('primary_address.street'));
      handleChange('mailing_address.city', getValue('primary_address.city'));
      handleChange('mailing_address.state', getValue('primary_address.state'));
      handleChange('mailing_address.zip', getValue('primary_address.zip'));
    } else {
      handleChange('mailing_address.street', '');
      handleChange('mailing_address.city', '');
      handleChange('mailing_address.state', '');
      handleChange('mailing_address.zip', '');
    }
  };

  const isSameAsPrimary = getBoolValue('mailing_same_as_primary');
  const primaryStreetVal = getValue('primary_address.street');
  const primaryCityVal = getValue('primary_address.city');
  const primaryStateVal = getValue('primary_address.state');
  const primaryZipVal = getValue('primary_address.zip');

  useEffect(() => {
    if (isSameAsPrimary) {
      const mappings: [string, string][] = [
        ['mailing_address.street', primaryStreetVal],
        ['mailing_address.city', primaryCityVal],
        ['mailing_address.state', primaryStateVal],
        ['mailing_address.zip', primaryZipVal],
      ];
      mappings.forEach(([dst, srcVal]) => {
        if (getValue(dst) !== srcVal) handleChange(dst, srcVal);
      });
    }
  }, [isSameAsPrimary, primaryStreetVal, primaryCityVal, primaryStateVal, primaryZipVal]);

  const phoneRows: { key: string; label: string; prefKey: string; prefId: string; hasPreferred?: boolean }[] = [
    { key: 'phone.home', label: 'Home', prefKey: 'preferred.home', prefId: 'prefHome' },
    { key: 'phone.home2', label: 'Home', prefKey: 'preferred.home', prefId: 'prefHome2', hasPreferred: false },
    { key: 'phone.work', label: 'Work', prefKey: 'preferred.work', prefId: 'prefWork' },
    { key: 'phone.mobile', label: 'Cell', prefKey: 'preferred.cell', prefId: 'prefCell' },
    { key: 'fax', label: 'Fax', prefKey: 'preferred.fax', prefId: 'prefFax' },
  ];

  return (
    <div className="p-4">
      <div className="grid gap-x-4 gap-y-0" style={{ gridTemplateColumns: '1.2fr 1.2fr 1.2fr auto' }}>
        {/* Column 1 - Name + Tax Info */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Name</h4>

          <InlineField label="Borrower ID" fieldKey={fk('borrower_id')}>
            <Input value={getValue('borrower_id')} onChange={(e) => handleChange('borrower_id', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Borrower Type" fieldKey={fk('borrower_type')}>
            <Select value={getValue('borrower_type')} onValueChange={(value) => handleChange('borrower_type', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{BORROWER_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <DirtyFieldWrapper fieldKey={fk('full_name')}>
            <div className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Entity Name</Label>
              <div className="flex-1">
                <Input value={getValue('full_name')} onChange={(e) => handleChange('full_name', e.target.value)} disabled={disabled} className="h-7 text-sm" />
              </div>
            </div>
          </DirtyFieldWrapper>

          <DirtyFieldWrapper fieldKey={fk('first_name')}>
            <div className="flex items-center gap-3">
              <div className="min-w-[140px] text-left shrink-0">
                <Label className="text-sm text-muted-foreground">First</Label>
                <p className="text-xs text-muted-foreground">If Entity, Use Signer</p>
              </div>
              <div className="flex-1">
                <Input value={getValue('first_name')} onChange={(e) => handleChange('first_name', e.target.value)} disabled={disabled} className="h-7 text-sm" />
              </div>
            </div>
          </DirtyFieldWrapper>

          <InlineField label="Middle" fieldKey={fk('middle_name')}>
            <Input value={getValue('middle_name')} onChange={(e) => handleChange('middle_name', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Last" fieldKey={fk('last_name')}>
            <Input value={getValue('last_name')} onChange={(e) => handleChange('last_name', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Capacity" fieldKey={fk('capacity')}>
            <Select value={getValue('capacity')} onValueChange={(value) => handleChange('capacity', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {CAPACITY_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
              </SelectContent>
            </Select>
          </InlineField>

          <InlineField label="Email" fieldKey={fk('email')}>
            <EmailInput value={getValue('email')} onValueChange={(v) => handleChange('email', v)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <div className="pt-2">
            <h4 className="font-semibold text-sm text-foreground pb-1">Delivery Options</h4>
            <div className="flex items-center gap-4">
              <DirtyFieldWrapper fieldKey={fk('delivery_print')}>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="coborrower-deliveryPrint-c1" checked={getBoolValue('delivery_print')} onCheckedChange={(checked) => handleChange('delivery_print', String(!!checked))} disabled={disabled} />
                  <Label htmlFor="coborrower-deliveryPrint-c1" className="text-sm font-normal">Print</Label>
                </div>
              </DirtyFieldWrapper>
              <DirtyFieldWrapper fieldKey={fk('delivery_email')}>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="coborrower-deliveryEmail-c1" checked={getBoolValue('delivery_email')} onCheckedChange={(checked) => handleChange('delivery_email', String(!!checked))} disabled={disabled} />
                  <Label htmlFor="coborrower-deliveryEmail-c1" className="text-sm font-normal">Email</Label>
                </div>
              </DirtyFieldWrapper>
              <DirtyFieldWrapper fieldKey={fk('delivery_sms')}>
                <div className="flex items-center gap-1.5">
                  <Checkbox id="coborrower-deliverySms-c1" checked={getBoolValue('delivery_sms')} onCheckedChange={(checked) => handleChange('delivery_sms', String(!!checked))} disabled={disabled} />
                  <Label htmlFor="coborrower-deliverySms-c1" className="text-sm font-normal">SMS</Label>
                </div>
              </DirtyFieldWrapper>
            </div>
          </div>

        </div>

        {/* Column 2 - Primary Address & Mailing Address & Delivery Options & Send */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Primary Address</h4>

          <InlineField label="Street" labelWidth="min-w-[60px]" fieldKey={fk('primary_address.street')}>
            <Input value={getValue('primary_address.street')} onChange={(e) => handleChange('primary_address.street', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="City" labelWidth="min-w-[60px]" fieldKey={fk('primary_address.city')}>
            <Input value={getValue('primary_address.city')} onChange={(e) => handleChange('primary_address.city', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="State" labelWidth="min-w-[60px]" fieldKey={fk('primary_address.state')}>
            <Select value={getValue('primary_address.state')} onValueChange={(value) => handleChange('primary_address.state', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="ZIP" labelWidth="min-w-[60px]" fieldKey={fk('primary_address.zip')}>
            <ZipInput value={getValue('primary_address.zip')} onValueChange={(v) => handleChange('primary_address.zip', v)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <h4 className="font-semibold text-sm text-foreground pb-1 pt-2 flex items-center gap-3">
            Mailing Address
            <div className="flex items-center gap-1.5 ml-4">
              <Checkbox id="mailingSameAsPrimary" checked={getBoolValue('mailing_same_as_primary')} onCheckedChange={(checked) => handleSameAsPrimaryChange(!!checked)} disabled={disabled} />
              <Label htmlFor="mailingSameAsPrimary" className="text-xs font-normal text-muted-foreground">Same as Primary</Label>
            </div>
          </h4>

          <InlineField label="Street" labelWidth="min-w-[60px]" fieldKey={fk('mailing_address.street')}>
            <Input value={getValue('mailing_address.street')} onChange={(e) => handleChange('mailing_address.street', e.target.value)} disabled={disabled || getBoolValue('mailing_same_as_primary')} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="City" labelWidth="min-w-[60px]" fieldKey={fk('mailing_address.city')}>
            <Input value={getValue('mailing_address.city')} onChange={(e) => handleChange('mailing_address.city', e.target.value)} disabled={disabled || getBoolValue('mailing_same_as_primary')} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="State" labelWidth="min-w-[60px]" fieldKey={fk('mailing_address.state')}>
            <Select value={getValue('mailing_address.state')} onValueChange={(value) => handleChange('mailing_address.state', value)} disabled={disabled || getBoolValue('mailing_same_as_primary')}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="ZIP" labelWidth="min-w-[60px]" fieldKey={fk('mailing_address.zip')}>
            <ZipInput value={getValue('mailing_address.zip')} onValueChange={(v) => handleChange('mailing_address.zip', v)} disabled={disabled || getBoolValue('mailing_same_as_primary')} className="h-7 text-sm" />
          </InlineField>

          {/* Send */}
          <div className="pt-2 space-y-2">
            <div>
              <h4 className="font-semibold text-sm text-foreground pb-1">Send</h4>
              <div className="flex items-center gap-4 flex-wrap">
                <DirtyFieldWrapper fieldKey={fk('send_payment_confirmation')}>
                  <div className="flex items-center gap-1.5">
                    <Checkbox id="coborrower-sendPaymentConfirmation" checked={getBoolValue('send_payment_confirmation')} onCheckedChange={(checked) => handleChange('send_payment_confirmation', String(!!checked))} disabled={disabled} />
                    <Label htmlFor="coborrower-sendPaymentConfirmation" className="text-sm font-normal">Payment Confirmation</Label>
                  </div>
                </DirtyFieldWrapper>
                <DirtyFieldWrapper fieldKey={fk('send_coupon_book')}>
                  <div className="flex items-center gap-1.5">
                    <Checkbox id="coborrower-sendCouponBook" checked={getBoolValue('send_coupon_book')} onCheckedChange={(checked) => handleChange('send_coupon_book', String(!!checked))} disabled={disabled} />
                    <Label htmlFor="coborrower-sendCouponBook" className="text-sm font-normal">Coupon Book</Label>
                  </div>
                </DirtyFieldWrapper>
                <DirtyFieldWrapper fieldKey={fk('send_payment_statement')}>
                  <div className="flex items-center gap-1.5">
                    <Checkbox id="coborrower-sendPaymentStatement" checked={getBoolValue('send_payment_statement')} onCheckedChange={(checked) => handleChange('send_payment_statement', String(!!checked))} disabled={disabled} />
                    <Label htmlFor="coborrower-sendPaymentStatement" className="text-sm font-normal">Payment Statement</Label>
                  </div>
                </DirtyFieldWrapper>
                <DirtyFieldWrapper fieldKey={fk('send_late_notice')}>
                  <div className="flex items-center gap-1.5">
                    <Checkbox id="coborrower-sendLateNotice" checked={getBoolValue('send_late_notice')} onCheckedChange={(checked) => handleChange('send_late_notice', String(!!checked))} disabled={disabled} />
                    <Label htmlFor="coborrower-sendLateNotice" className="text-sm font-normal">Late Notice</Label>
                  </div>
                </DirtyFieldWrapper>
                <DirtyFieldWrapper fieldKey={fk('send_maturity_notice')}>
                  <div className="flex items-center gap-1.5">
                    <Checkbox id="coborrower-sendMaturityNotice" checked={getBoolValue('send_maturity_notice')} onCheckedChange={(checked) => handleChange('send_maturity_notice', String(!!checked))} disabled={disabled} />
                    <Label htmlFor="coborrower-sendMaturityNotice" className="text-sm font-normal">Maturity Notice</Label>
                  </div>
                </DirtyFieldWrapper>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3 - Phone + Vesting + FORD */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Phone</h4>
          {phoneRows.map(({ key, label }) => (
            <DirtyFieldWrapper key={key} fieldKey={fk(key)}>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground min-w-[40px] text-left shrink-0">{label}</Label>
                <PhoneInput value={getValue(key)} onValueChange={(val) => handleChange(key, val)} disabled={disabled} className="h-7 text-sm flex-1" />
              </div>
            </DirtyFieldWrapper>
          ))}

          <h4 className="font-semibold text-sm text-foreground pb-1 pt-2">Vesting</h4>
          <DirtyFieldWrapper fieldKey={fk('vesting')}>
            <Textarea value={getValue('vesting')} onChange={(e) => handleChange('vesting', e.target.value)} disabled={disabled} className="text-sm min-h-[80px] resize-none" />
          </DirtyFieldWrapper>

          <h4 className="font-semibold text-sm text-foreground pb-1 pt-2">FORD</h4>
          <div className="space-y-1">
            {([['ford1', 'ford2'], ['ford3', 'ford4'], ['ford5', 'ford6'], ['ford7', 'ford8']] as const).map(([dropdownKey, inputKey], idx) => (
              <div key={idx} className="grid grid-cols-2 gap-1">
                <DirtyFieldWrapper fieldKey={fk(dropdownKey)}>
                  <Select value={getValue(dropdownKey)} onValueChange={(v) => handleChange(dropdownKey, v)} disabled={disabled}>
                    <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{FORD_DROPDOWN_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </DirtyFieldWrapper>
                <DirtyFieldWrapper fieldKey={fk(inputKey)}>
                  <Input value={getValue(inputKey)} onChange={(e) => handleChange(inputKey, e.target.value)} disabled={disabled} className="h-7 text-sm" />
                </DirtyFieldWrapper>
              </div>
            ))}
          </div>
        </div>

        {/* Column 4 - Issue Checkboxes */}
        <div className="space-y-2 pt-6">
          <DirtyFieldWrapper fieldKey={fk('issue_1098')}>
            <div className="flex items-center gap-1.5">
              <Checkbox id="coborrower-issue1098" checked={getBoolValue('issue_1098')} onCheckedChange={(checked) => handleChange('issue_1098', String(!!checked))} disabled={disabled} />
              <Label htmlFor="coborrower-issue1098" className="text-xs font-normal text-muted-foreground">Issue 1098</Label>
            </div>
          </DirtyFieldWrapper>
          <DirtyFieldWrapper fieldKey={fk('alternate_reporting')}>
            <div className="flex items-center gap-1.5">
              <Checkbox id="coborrower-alternateReporting" checked={getBoolValue('alternate_reporting')} onCheckedChange={(checked) => handleChange('alternate_reporting', String(!!checked))} disabled={disabled} />
              <Label htmlFor="coborrower-alternateReporting" className="text-xs font-normal text-muted-foreground">Alternate Reporting</Label>
            </div>
          </DirtyFieldWrapper>
        </div>
      </div>
    </div>
  );
};

export default CoBorrowerPrimaryForm;
