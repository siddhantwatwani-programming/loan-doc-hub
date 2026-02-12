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

const TYPE_OPTIONS = [
  'Co-Borrower',
  'Guarantor',
  'Co-Signer',
  'Authorized User',
  'Other',
];

const RELATION_OPTIONS = ['None', 'Spouse'];

const STATE_OPTIONS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
];

const SALUTATION_OPTIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];

const GENERATION_OPTIONS = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V'];

const FORMAT_OPTIONS = ['HTML', 'Text'];

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
      <div>
        <h3 className="font-semibold text-base text-foreground">Primary Information</h3>
        <p className="text-xs text-muted-foreground">Basic co-borrower details and contact information.</p>
      </div>

      {/* Name & Salutation */}
      <div className="form-section-header">Name & Salutation</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Full Name</Label>
          <Input value={getValue('full_name')} onChange={(e) => handleChange('full_name', e.target.value)} placeholder="Enter full name" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Salutation</Label>
          <Select value={getValue('salutation')} onValueChange={(value) => handleChange('salutation', value)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{SALUTATION_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="inline-field">
          <Label className="inline-label">First Name</Label>
          <Input value={getValue('first_name')} onChange={(e) => handleChange('first_name', e.target.value)} placeholder="Enter first name" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Middle Name</Label>
          <Input value={getValue('middle_name')} onChange={(e) => handleChange('middle_name', e.target.value)} placeholder="Enter middle name" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Last Name</Label>
          <Input value={getValue('last_name')} onChange={(e) => handleChange('last_name', e.target.value)} placeholder="Enter last name" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Generation</Label>
          <Select value={getValue('generation')} onValueChange={(value) => handleChange('generation', value)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{GENERATION_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Mailing Address */}
      <div className="form-section-header">Mailing Address</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Street</Label>
          <Input value={getValue('address.street')} onChange={(e) => handleChange('address.street', e.target.value)} placeholder="Enter street" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">City / Town</Label>
          <Input value={getValue('address.city')} onChange={(e) => handleChange('address.city', e.target.value)} placeholder="Enter city" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">State</Label>
          <Select value={getValue('state')} onValueChange={(value) => handleChange('state', value)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{STATE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Zip Code</Label>
          <Input value={getValue('address.zip')} onChange={(e) => handleChange('address.zip', e.target.value)} placeholder="Enter zip" disabled={disabled} className="h-7 text-sm" />
        </div>
      </div>

      {/* Phone Numbers */}
      <div className="form-section-header">Phone Numbers</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Home Phone</Label>
          <Input value={getValue('phone.home')} onChange={(e) => handleChange('phone.home', e.target.value)} placeholder="Enter home phone" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Work Phone</Label>
          <Input value={getValue('phone.work')} onChange={(e) => handleChange('phone.work', e.target.value)} placeholder="Enter work phone" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Mobile / Cell</Label>
          <Input value={getValue('phone.mobile')} onChange={(e) => handleChange('phone.mobile', e.target.value)} placeholder="Enter mobile" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Fax</Label>
          <Input value={getValue('fax')} onChange={(e) => handleChange('fax', e.target.value)} placeholder="Enter fax" disabled={disabled} className="h-7 text-sm" />
        </div>
      </div>

      {/* E-mail & Delivery */}
      <div className="form-section-header">E-mail & Delivery Options</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Email</Label>
          <Input type="email" value={getValue('email')} onChange={(e) => handleChange('email', e.target.value)} placeholder="Enter email" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Format</Label>
          <Select value={getValue('format') || 'HTML'} onValueChange={(value) => handleChange('format', value)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{FORMAT_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Delivery</Label>
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-1.5">
              <Checkbox id="deliveryPrint" checked={getBoolValue('delivery_print') || getValue('delivery_print') !== 'false'} onCheckedChange={(checked) => handleChange('delivery_print', String(!!checked))} disabled={disabled} />
              <Label htmlFor="deliveryPrint" className="font-normal text-sm">Print</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox id="deliveryEmail" checked={getBoolValue('delivery_email')} onCheckedChange={(checked) => handleChange('delivery_email', String(!!checked))} disabled={disabled} />
              <Label htmlFor="deliveryEmail" className="font-normal text-sm">Email</Label>
            </div>
            <div className="flex items-center gap-1.5">
              <Checkbox id="deliverySms" checked={getBoolValue('delivery_sms')} onCheckedChange={(checked) => handleChange('delivery_sms', String(!!checked))} disabled={disabled} />
              <Label htmlFor="deliverySms" className="font-normal text-sm">SMS</Label>
            </div>
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label"></Label>
          <div className="flex items-center gap-1.5 flex-1">
            <Checkbox id="sendBorrowerNotifications" checked={getBoolValue('send_borrower_notifications')} onCheckedChange={(checked) => handleChange('send_borrower_notifications', String(!!checked))} disabled={disabled} />
            <Label htmlFor="sendBorrowerNotifications" className="font-normal text-sm">Send Borrower Notifications</Label>
          </div>
        </div>
      </div>

      {/* Other Information */}
      <div className="form-section-header">Other Information</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Loan Number</Label>
          <Input value={getValue('loan_number')} disabled className="h-7 text-sm bg-muted" readOnly />
        </div>
        <div className="inline-field">
          <Label className="inline-label">TIN (SSN/Tax ID)</Label>
          <Input value={getValue('tin')} onChange={(e) => handleChange('tin', e.target.value)} placeholder="Enter SSN or Tax ID" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Relation</Label>
          <Select value={getValue('relation') || 'None'} onValueChange={(value) => handleChange('relation', value)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{RELATION_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Type</Label>
          <Select value={getValue('type') || 'Co-Borrower'} onValueChange={(value) => handleChange('type', value)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="inline-field">
          <Label className="inline-label">DOB</Label>
          <Input type="date" value={getValue('dob')} onChange={(e) => handleChange('dob', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Res Code</Label>
          <Input value={getValue('res_code')} onChange={(e) => handleChange('res_code', e.target.value)} placeholder="Enter res code" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Addr Indicator</Label>
          <Input value={getValue('address_indicator')} onChange={(e) => handleChange('address_indicator', e.target.value)} placeholder="Enter indicator" disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label"></Label>
          <div className="flex items-center gap-1.5 flex-1">
            <Checkbox id="creditReporting" checked={getBoolValue('credit_reporting')} onCheckedChange={(checked) => handleChange('credit_reporting', String(!!checked))} disabled={disabled} />
            <Label htmlFor="creditReporting" className="font-normal text-sm">Credit Reporting</Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoBorrowerPrimaryForm;
