import React from 'react';
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

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {/* Column 1 - Name */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2">Name</h4>

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
            <Input value={getValue('full_name')} onChange={(e) => handleChange('full_name', e.target.value)} placeholder="Enter full name" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="First: If Entity, Use Signer">
            <Input value={getValue('first_name')} onChange={(e) => handleChange('first_name', e.target.value)} placeholder="Enter first name" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Middle">
            <Input value={getValue('middle_name')} onChange={(e) => handleChange('middle_name', e.target.value)} placeholder="Enter middle name" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Last">
            <Input value={getValue('last_name')} onChange={(e) => handleChange('last_name', e.target.value)} placeholder="Enter last name" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Capacity">
            <Input value={getValue('capacity')} onChange={(e) => handleChange('capacity', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Email">
            <Input type="email" value={getValue('email')} onChange={(e) => handleChange('email', e.target.value)} placeholder="Enter email" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Credit Score">
            <Input value={getValue('credit_score')} onChange={(e) => handleChange('credit_score', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>
        </div>

        {/* Column 2 - Primary Address & Mailing Address & Delivery */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2">Primary Address</h4>

          <InlineField label="Street">
            <Input value={getValue('primary_address.street')} onChange={(e) => handleChange('primary_address.street', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="City">
            <Input value={getValue('primary_address.city')} onChange={(e) => handleChange('primary_address.city', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="State">
            <Select value={getValue('primary_address.state')} onValueChange={(value) => handleChange('primary_address.state', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="ZIP">
            <Input value={getValue('primary_address.zip')} onChange={(e) => handleChange('primary_address.zip', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2 pt-2 flex items-center gap-3">
            Mailing Address
            <div className="flex items-center gap-1.5 ml-4">
              <Checkbox id="mailingSameAsPrimary" checked={getBoolValue('mailing_same_as_primary')} onCheckedChange={(checked) => handleChange('mailing_same_as_primary', String(!!checked))} disabled={disabled} />
              <Label htmlFor="mailingSameAsPrimary" className="text-xs font-normal text-muted-foreground">Same as Primary</Label>
            </div>
          </h4>

          <InlineField label="Street">
            <Input value={getValue('mailing_address.street')} onChange={(e) => handleChange('mailing_address.street', e.target.value)} disabled={disabled || getBoolValue('mailing_same_as_primary')} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="City">
            <Input value={getValue('mailing_address.city')} onChange={(e) => handleChange('mailing_address.city', e.target.value)} disabled={disabled || getBoolValue('mailing_same_as_primary')} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="State">
            <Select value={getValue('mailing_address.state')} onValueChange={(value) => handleChange('mailing_address.state', value)} disabled={disabled || getBoolValue('mailing_same_as_primary')}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="ZIP">
            <Input value={getValue('mailing_address.zip')} onChange={(e) => handleChange('mailing_address.zip', e.target.value)} disabled={disabled || getBoolValue('mailing_same_as_primary')} className="h-7 text-sm" />
          </InlineField>
        </div>

        {/* Column 3 - Phone & Vesting & FORD */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2">Phone</h4>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Home</Label>
            <Input value={getValue('phone.home')} onChange={(e) => handleChange('phone.home', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Home</Label>
            <Input value={getValue('phone.home2')} onChange={(e) => handleChange('phone.home2', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Work</Label>
            <Input value={getValue('phone.work')} onChange={(e) => handleChange('phone.work', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Cell</Label>
            <Input value={getValue('phone.mobile')} onChange={(e) => handleChange('phone.mobile', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[140px] text-left shrink-0">Fax</Label>
            <Input value={getValue('fax')} onChange={(e) => handleChange('fax', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
          </div>

          <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2 pt-2">Vesting</h4>
          <Input value={getValue('vesting')} onChange={(e) => handleChange('vesting', e.target.value)} disabled={disabled} className="h-7 text-sm" />

          <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2 pt-2">FORD</h4>
          <Input value={getValue('ford')} onChange={(e) => handleChange('ford', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>

        {/* Column 4 - Preferred & Tax & Delivery */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2">Preferred</h4>

          <div className="flex items-center gap-2 h-7">
            <Checkbox id="prefHome" checked={getBoolValue('preferred.home')} onCheckedChange={(checked) => handleChange('preferred.home', String(!!checked))} disabled={disabled} />
            <Label htmlFor="prefHome" className="text-xs font-normal">Home</Label>
          </div>
          <div className="flex items-center gap-2 h-7">
            <Checkbox id="prefHome2" checked={getBoolValue('preferred.home2')} onCheckedChange={(checked) => handleChange('preferred.home2', String(!!checked))} disabled={disabled} />
            <Label htmlFor="prefHome2" className="text-xs font-normal">Home 2</Label>
          </div>
          <div className="flex items-center gap-2 h-7">
            <Checkbox id="prefWork" checked={getBoolValue('preferred.work')} onCheckedChange={(checked) => handleChange('preferred.work', String(!!checked))} disabled={disabled} />
            <Label htmlFor="prefWork" className="text-xs font-normal">Work</Label>
          </div>
          <div className="flex items-center gap-2 h-7">
            <Checkbox id="prefCell" checked={getBoolValue('preferred.cell')} onCheckedChange={(checked) => handleChange('preferred.cell', String(!!checked))} disabled={disabled} />
            <Label htmlFor="prefCell" className="text-xs font-normal">Cell</Label>
          </div>
          <div className="flex items-center gap-2 h-7">
            <Checkbox id="prefFax" checked={getBoolValue('preferred.fax')} onCheckedChange={(checked) => handleChange('preferred.fax', String(!!checked))} disabled={disabled} />
            <Label htmlFor="prefFax" className="text-xs font-normal">Fax</Label>
          </div>
        </div>
      </div>

      {/* Bottom Section - Tax & Delivery spanning full width */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 pt-4 border-t border-border">
        {/* Tax Info */}
        <div className="space-y-3">
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
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2">Delivery</h4>

          <div className="flex items-center gap-2">
            <Checkbox id="deliveryOnline" checked={getBoolValue('delivery_online')} onCheckedChange={(checked) => handleChange('delivery_online', String(!!checked))} disabled={disabled} />
            <Label htmlFor="deliveryOnline" className="text-sm font-normal">Online</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="deliveryMail" checked={getBoolValue('delivery_mail')} onCheckedChange={(checked) => handleChange('delivery_mail', String(!!checked))} disabled={disabled} />
            <Label htmlFor="deliveryMail" className="text-sm font-normal">Mail</Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoBorrowerPrimaryForm;
