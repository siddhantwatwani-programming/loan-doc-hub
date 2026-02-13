import React from 'react';
import { Input } from '@/components/ui/input';
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

interface CoBorrowerPrimaryFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

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

const TAX_ID_TYPE_OPTIONS = [
  '0 – Unknown',
  '1 – EIN',
  '2 – SSN',
];

const STATE_OPTIONS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
];

const InlineField = ({ label, children, labelWidth = 'min-w-[140px]' }: { label: string; children: React.ReactNode; labelWidth?: string }) => (
  <div className="flex items-center gap-3">
    <Label className={`text-sm text-muted-foreground ${labelWidth} text-left shrink-0`}>{label}</Label>
    <div className="flex-1">{children}</div>
  </div>
);

export const CoBorrowerPrimaryForm: React.FC<CoBorrowerPrimaryFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (key: string) => values[`coborrower.${key}`] || '';
  const getBoolValue = (key: string) => values[`coborrower.${key}`] === 'true';

  const handleChange = (key: string, value: string) => {
    onValueChange(`coborrower.${key}`, value);
  };

  const phoneRows = [
    { key: 'phone.home', label: 'Home', prefKey: 'preferred.home', prefId: 'prefHome' },
    { key: 'phone.home2', label: 'Home', prefKey: 'preferred.home2', prefId: 'prefHome2' },
    { key: 'phone.work', label: 'Work', prefKey: 'preferred.work', prefId: 'prefWork' },
    { key: 'phone.mobile', label: 'Cell', prefKey: 'preferred.cell', prefId: 'prefCell' },
    { key: 'fax', label: 'Fax', prefKey: 'preferred.fax', prefId: 'prefFax' },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Top section - 5 visual columns using custom grid */}
      <div className="grid gap-x-4 gap-y-0" style={{ gridTemplateColumns: '1.2fr 1.2fr 1.2fr auto' }}>
        {/* Column 1 - Name */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Name</h4>

          <InlineField label="Borrower ID">
            <Input value={getValue('borrower_id')} onChange={(e) => handleChange('borrower_id', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Borrower Type">
            <Select value={getValue('borrower_type')} onValueChange={(value) => handleChange('borrower_type', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{BORROWER_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="Full Name: If Entity, Use Entity">
            <Input value={getValue('full_name')} onChange={(e) => handleChange('full_name', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="First: If Entity, Use Signer">
            <Input value={getValue('first_name')} onChange={(e) => handleChange('first_name', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Middle">
            <Input value={getValue('middle_name')} onChange={(e) => handleChange('middle_name', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Last">
            <Input value={getValue('last_name')} onChange={(e) => handleChange('last_name', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Capacity">
            <Input value={getValue('capacity')} onChange={(e) => handleChange('capacity', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Email">
            <Input type="email" value={getValue('email')} onChange={(e) => handleChange('email', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <div className="h-1" />

          <InlineField label="Credit Score">
            <Input value={getValue('credit_score')} onChange={(e) => handleChange('credit_score', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>
        </div>

        {/* Column 2 - Primary Address & Mailing Address */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Primary Address</h4>

          <InlineField label="Street" labelWidth="min-w-[60px]">
            <Input value={getValue('primary_address.street')} onChange={(e) => handleChange('primary_address.street', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="City" labelWidth="min-w-[60px]">
            <Input value={getValue('primary_address.city')} onChange={(e) => handleChange('primary_address.city', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="State" labelWidth="min-w-[60px]">
            <Select value={getValue('primary_address.state')} onValueChange={(value) => handleChange('primary_address.state', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="ZIP" labelWidth="min-w-[60px]">
            <Input value={getValue('primary_address.zip')} onChange={(e) => handleChange('primary_address.zip', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <h4 className="font-semibold text-sm text-foreground pb-1 pt-2 flex items-center gap-3">
            Mailing Address
            <div className="flex items-center gap-1.5 ml-4">
              <Checkbox id="mailingSameAsPrimary" checked={getBoolValue('mailing_same_as_primary')} onCheckedChange={(checked) => handleChange('mailing_same_as_primary', String(!!checked))} disabled={disabled} />
              <Label htmlFor="mailingSameAsPrimary" className="text-xs font-normal text-muted-foreground">Same as Primary</Label>
            </div>
          </h4>

          <InlineField label="Street" labelWidth="min-w-[60px]">
            <Input value={getValue('mailing_address.street')} onChange={(e) => handleChange('mailing_address.street', e.target.value)} disabled={disabled || getBoolValue('mailing_same_as_primary')} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="City" labelWidth="min-w-[60px]">
            <Input value={getValue('mailing_address.city')} onChange={(e) => handleChange('mailing_address.city', e.target.value)} disabled={disabled || getBoolValue('mailing_same_as_primary')} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="State" labelWidth="min-w-[60px]">
            <Select value={getValue('mailing_address.state')} onValueChange={(value) => handleChange('mailing_address.state', value)} disabled={disabled || getBoolValue('mailing_same_as_primary')}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="ZIP" labelWidth="min-w-[60px]">
            <Input value={getValue('mailing_address.zip')} onChange={(e) => handleChange('mailing_address.zip', e.target.value)} disabled={disabled || getBoolValue('mailing_same_as_primary')} className="h-7 text-sm" />
          </InlineField>
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
            {['ford1', 'ford2', 'ford3', 'ford4', 'ford5', 'ford6', 'ford7', 'ford8'].map((key) => (
              <Input key={key} value={getValue(key)} onChange={(e) => handleChange(key, e.target.value)} disabled={disabled} className="h-7 text-sm" />
            ))}
          </div>
        </div>

        {/* Column 4 - Preferred (narrow) */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Preferred</h4>
          {phoneRows.map(({ prefKey, prefId }) => (
            <div key={prefId} className="flex items-center justify-center h-7">
              <Checkbox id={prefId} checked={getBoolValue(prefKey)} onCheckedChange={(checked) => handleChange(prefKey, String(!!checked))} disabled={disabled} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section - Tax, Delivery, FORD continuation */}
      <div className="grid gap-x-4 gap-y-0" style={{ gridTemplateColumns: '1.2fr 1.2fr 1.2fr auto' }}>
        {/* Tax Info */}
        <div className="space-y-2">
          <InlineField label="Tax ID Type">
            <Select value={getValue('tax_id_type')} onValueChange={(value) => handleChange('tax_id_type', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{TAX_ID_TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="TIN">
            <Input value={getValue('tin')} onChange={(e) => handleChange('tin', e.target.value)} placeholder="SSN or Tax ID" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <div className="flex items-center gap-2">
            <Checkbox id="issue1098" checked={getBoolValue('issue_1098')} onCheckedChange={(checked) => handleChange('issue_1098', String(!!checked))} disabled={disabled} />
            <Label htmlFor="issue1098" className="text-sm font-normal">Issue 1098</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="alternateReporting" checked={getBoolValue('alternate_reporting')} onCheckedChange={(checked) => handleChange('alternate_reporting', String(!!checked))} disabled={disabled} />
            <Label htmlFor="alternateReporting" className="text-sm font-normal">Alternate Reporting</Label>
          </div>
        </div>

        {/* Delivery */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground pb-1">Delivery</h4>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground min-w-[60px] text-left shrink-0">Online</Label>
            <Checkbox id="deliveryOnline" checked={getBoolValue('delivery_online')} onCheckedChange={(checked) => handleChange('delivery_online', String(!!checked))} disabled={disabled} />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground min-w-[60px] text-left shrink-0">Mail</Label>
            <Checkbox id="deliveryMail" checked={getBoolValue('delivery_mail')} onCheckedChange={(checked) => handleChange('delivery_mail', String(!!checked))} disabled={disabled} />
          </div>
        </div>

        {/* Empty spacer columns */}
        <div />
        <div />
      </div>
    </div>
  );
};

export default CoBorrowerPrimaryForm;
