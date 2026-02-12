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

const InlineField = ({ label, children, labelWidth = 'min-w-[120px]' }: { label: string; children: React.ReactNode; labelWidth?: string }) => (
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
        {/* Column 1 - Name & Salutation */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2">Name & Salutation</h4>
          
          <InlineField label="Full Name">
            <Input id="fullName" value={getValue('full_name')} onChange={(e) => handleChange('full_name', e.target.value)} placeholder="Enter full name" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Salutation">
            <Select value={getValue('salutation')} onValueChange={(value) => handleChange('salutation', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{SALUTATION_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="First Name">
            <Input id="firstName" value={getValue('first_name')} onChange={(e) => handleChange('first_name', e.target.value)} placeholder="Enter first name" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Middle Name">
            <Input id="middleName" value={getValue('middle_name')} onChange={(e) => handleChange('middle_name', e.target.value)} placeholder="Enter middle name" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Last Name">
            <Input id="lastName" value={getValue('last_name')} onChange={(e) => handleChange('last_name', e.target.value)} placeholder="Enter last name" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Generation">
            <Select value={getValue('generation')} onValueChange={(value) => handleChange('generation', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{GENERATION_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>
        </div>

        {/* Column 2 - Mailing Address */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2">Mailing Address</h4>
          
          <InlineField label="Street">
            <Input id="street" value={getValue('address.street')} onChange={(e) => handleChange('address.street', e.target.value)} placeholder="Enter street" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="City">
            <Input id="city" value={getValue('address.city')} onChange={(e) => handleChange('address.city', e.target.value)} placeholder="Enter city" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="State">
            <Select value={getValue('state')} onValueChange={(value) => handleChange('state', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{STATE_OPTIONS.map((state) => (<SelectItem key={state} value={state}>{state}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="Zip Code">
            <Input id="zipCode" value={getValue('address.zip')} onChange={(e) => handleChange('address.zip', e.target.value)} placeholder="Enter zip" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          {/* Phone Numbers */}
          <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2 pt-2">Phone Numbers</h4>
          
          <InlineField label="Home Phone">
            <Input id="homePhone" value={getValue('phone.home')} onChange={(e) => handleChange('phone.home', e.target.value)} placeholder="Enter home phone" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Work Phone">
            <Input id="workPhone" value={getValue('phone.work')} onChange={(e) => handleChange('phone.work', e.target.value)} placeholder="Enter work phone" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Cell Phone">
            <Input id="mobilePhone" value={getValue('phone.mobile')} onChange={(e) => handleChange('phone.mobile', e.target.value)} placeholder="Enter cell phone" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Fax">
            <Input id="fax" value={getValue('fax')} onChange={(e) => handleChange('fax', e.target.value)} placeholder="Enter fax" disabled={disabled} className="h-7 text-sm" />
          </InlineField>
        </div>

        {/* Column 3 - E-mail & Delivery */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2">E-mail & Delivery</h4>
          
          <InlineField label="Email">
            <Input id="email" type="email" value={getValue('email')} onChange={(e) => handleChange('email', e.target.value)} placeholder="Enter email" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Format">
            <Select value={getValue('format') || 'HTML'} onValueChange={(value) => handleChange('format', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{FORMAT_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Delivery</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Checkbox id="deliveryPrint" checked={getBoolValue('delivery_print') || getValue('delivery_print') !== 'false'} onCheckedChange={(checked) => handleChange('delivery_print', String(!!checked))} disabled={disabled} />
                <Label htmlFor="deliveryPrint" className="text-xs font-normal">Print</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Checkbox id="deliveryEmail" checked={getBoolValue('delivery_email')} onCheckedChange={(checked) => handleChange('delivery_email', String(!!checked))} disabled={disabled} />
                <Label htmlFor="deliveryEmail" className="text-xs font-normal">Email</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <Checkbox id="deliverySms" checked={getBoolValue('delivery_sms')} onCheckedChange={(checked) => handleChange('delivery_sms', String(!!checked))} disabled={disabled} />
                <Label htmlFor="deliverySms" className="text-xs font-normal">SMS</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pl-[132px]">
            <Checkbox id="sendBorrowerNotifications" checked={getBoolValue('send_borrower_notifications')} onCheckedChange={(checked) => handleChange('send_borrower_notifications', String(!!checked))} disabled={disabled} />
            <Label htmlFor="sendBorrowerNotifications" className="text-xs font-normal">Send Borrower Notifications</Label>
          </div>
        </div>

        {/* Column 4 - Other Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-foreground border-b border-border pb-2">Other Information</h4>
          
          <InlineField label="Loan Number">
            <Input id="loanNumber" value={getValue('loan_number')} onChange={(e) => handleChange('loan_number', e.target.value)} placeholder="Loan number" disabled={disabled} className="h-7 text-sm bg-muted" readOnly />
          </InlineField>

          <InlineField label="TIN">
            <Input id="tin" value={getValue('tin')} onChange={(e) => handleChange('tin', e.target.value)} placeholder="SSN or Tax ID" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Relation">
            <Select value={getValue('relation') || 'None'} onValueChange={(value) => handleChange('relation', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{RELATION_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="Type">
            <Select value={getValue('type') || 'Co-Borrower'} onValueChange={(value) => handleChange('type', value)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{TYPE_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
            </Select>
          </InlineField>

          <InlineField label="DOB">
            <Input id="dob" type="date" value={getValue('dob')} onChange={(e) => handleChange('dob', e.target.value)} disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <div className="flex items-center gap-2">
            <Checkbox id="creditReporting" checked={getBoolValue('credit_reporting')} onCheckedChange={(checked) => handleChange('credit_reporting', String(!!checked))} disabled={disabled} />
            <Label htmlFor="creditReporting" className="text-sm font-normal">Credit Reporting</Label>
          </div>

          <InlineField label="Res Code">
            <Input id="resCode" value={getValue('res_code')} onChange={(e) => handleChange('res_code', e.target.value)} placeholder="Enter res code" disabled={disabled} className="h-7 text-sm" />
          </InlineField>

          <InlineField label="Address Indicator">
            <Input id="addressIndicator" value={getValue('address_indicator')} onChange={(e) => handleChange('address_indicator', e.target.value)} placeholder="Enter indicator" disabled={disabled} className="h-7 text-sm" />
          </InlineField>
        </div>
      </div>
    </div>
  );
};

export default CoBorrowerPrimaryForm;
