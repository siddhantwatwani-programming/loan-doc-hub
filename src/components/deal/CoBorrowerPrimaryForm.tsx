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
    <div className="p-6 space-y-6">
      <div>
        <h3 className="font-semibold text-lg text-foreground">Primary Information</h3>
        <p className="text-sm text-muted-foreground">
          Basic co-borrower details and contact information.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Name & Salutation Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Name & Salutation</h4>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={getValue('full_name')}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Enter full name"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salutation">Salutation</Label>
              <Select
                value={getValue('salutation')}
                onValueChange={(value) => handleChange('salutation', value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select salutation" />
                </SelectTrigger>
                <SelectContent>
                  {SALUTATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={getValue('first_name')}
                onChange={(e) => handleChange('first_name', e.target.value)}
                placeholder="Enter first name"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                value={getValue('middle_name')}
                onChange={(e) => handleChange('middle_name', e.target.value)}
                placeholder="Enter middle name"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={getValue('last_name')}
                onChange={(e) => handleChange('last_name', e.target.value)}
                placeholder="Enter last name"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="generation">Generation</Label>
              <Select
                value={getValue('generation')}
                onValueChange={(value) => handleChange('generation', value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select generation" />
                </SelectTrigger>
                <SelectContent>
                  {GENERATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mailing Address Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Mailing Address</h4>
            
            <div className="space-y-2">
              <Label htmlFor="street">Street (Address 1)</Label>
              <Input
                id="street"
                value={getValue('address.street')}
                onChange={(e) => handleChange('address.street', e.target.value)}
                placeholder="Enter street address"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City / Town</Label>
              <Input
                id="city"
                value={getValue('address.city')}
                onChange={(e) => handleChange('address.city', e.target.value)}
                placeholder="Enter city"
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State / Province</Label>
                <Select
                  value={getValue('state')}
                  onValueChange={(value) => handleChange('state', value)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATE_OPTIONS.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={getValue('address.zip')}
                  onChange={(e) => handleChange('address.zip', e.target.value)}
                  placeholder="Enter zip code"
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Phone Numbers Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Phone Numbers</h4>
            
            <div className="space-y-2">
              <Label htmlFor="homePhone">Home Phone</Label>
              <Input
                id="homePhone"
                value={getValue('phone.home')}
                onChange={(e) => handleChange('phone.home', e.target.value)}
                placeholder="Enter home phone"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workPhone">Work Phone</Label>
              <Input
                id="workPhone"
                value={getValue('phone.work')}
                onChange={(e) => handleChange('phone.work', e.target.value)}
                placeholder="Enter work phone"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobilePhone">Mobile / Cell Phone</Label>
              <Input
                id="mobilePhone"
                value={getValue('phone.mobile')}
                onChange={(e) => handleChange('phone.mobile', e.target.value)}
                placeholder="Enter mobile phone"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fax">Fax</Label>
              <Input
                id="fax"
                value={getValue('fax')}
                onChange={(e) => handleChange('fax', e.target.value)}
                placeholder="Enter fax number"
                disabled={disabled}
              />
            </div>
          </div>

          {/* E-mail & Delivery Options Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">E-mail & Delivery Options</h4>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={getValue('email')}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter email address"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select
                value={getValue('format') || 'HTML'}
                onValueChange={(value) => handleChange('format', value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAT_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Delivery</Label>
              <div className="flex items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="deliveryPrint"
                    checked={getBoolValue('delivery_print') || getValue('delivery_print') !== 'false'}
                    onCheckedChange={(checked) => handleChange('delivery_print', String(!!checked))}
                    disabled={disabled}
                  />
                  <Label htmlFor="deliveryPrint" className="font-normal">Print</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="deliveryEmail"
                    checked={getBoolValue('delivery_email')}
                    onCheckedChange={(checked) => handleChange('delivery_email', String(!!checked))}
                    disabled={disabled}
                  />
                  <Label htmlFor="deliveryEmail" className="font-normal">Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="deliverySms"
                    checked={getBoolValue('delivery_sms')}
                    onCheckedChange={(checked) => handleChange('delivery_sms', String(!!checked))}
                    disabled={disabled}
                  />
                  <Label htmlFor="deliverySms" className="font-normal">SMS</Label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="sendBorrowerNotifications"
                checked={getBoolValue('send_borrower_notifications')}
                onCheckedChange={(checked) => handleChange('send_borrower_notifications', String(!!checked))}
                disabled={disabled}
              />
              <Label htmlFor="sendBorrowerNotifications" className="font-normal">Send Borrower Notifications</Label>
            </div>
          </div>

          {/* Other Information Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground border-b pb-2">Other Information</h4>
            
            <div className="space-y-2">
              <Label htmlFor="loanNumber">Loan Number</Label>
              <Input
                id="loanNumber"
                value={getValue('loan_number')}
                onChange={(e) => handleChange('loan_number', e.target.value)}
                placeholder="Enter loan number"
                disabled={disabled}
                className="bg-muted"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tin">TIN (SSN or Tax ID)</Label>
              <Input
                id="tin"
                value={getValue('tin')}
                onChange={(e) => handleChange('tin', e.target.value)}
                placeholder="Enter SSN or Tax ID"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="relation">Relation</Label>
              <Select
                value={getValue('relation') || 'None'}
                onValueChange={(value) => handleChange('relation', value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relation" />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={getValue('type') || 'Co-Borrower'}
                onValueChange={(value) => handleChange('type', value)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">DOB</Label>
              <Input
                id="dob"
                type="date"
                value={getValue('dob')}
                onChange={(e) => handleChange('dob', e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="creditReporting"
                checked={getBoolValue('credit_reporting')}
                onCheckedChange={(checked) => handleChange('credit_reporting', String(!!checked))}
                disabled={disabled}
              />
              <Label htmlFor="creditReporting" className="font-normal">Credit Reporting</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resCode">Res Code</Label>
              <Input
                id="resCode"
                value={getValue('res_code')}
                onChange={(e) => handleChange('res_code', e.target.value)}
                placeholder="Enter res code"
                disabled={disabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressIndicator">Address Indicator</Label>
              <Input
                id="addressIndicator"
                value={getValue('address_indicator')}
                onChange={(e) => handleChange('address_indicator', e.target.value)}
                placeholder="Enter address indicator"
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoBorrowerPrimaryForm;
