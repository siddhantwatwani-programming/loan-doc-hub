import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlternateTaxInfoModal } from './AlternateTaxInfoModal';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

// Field key mapping for primary borrower fields
const FIELD_KEYS = {
  // Borrower Details
  borrowerType: 'borrower.borrower_type',
  borrowerId: 'borrower.borrower_id',
  fullName: 'borrower.full_name',
  firstName: 'borrower.first_name',
  middleName: 'borrower.middle_initial',
  lastName: 'borrower.last_name',
  salutation: 'borrower.salutation',
  capacity: 'borrower.capacity',
  email: 'borrower.email',
  creditScore: 'borrower.credit_score',
  taxIdType: 'borrower.tax_id_type',
  taxId: 'borrower.tax_id',
  issue1098: 'borrower.issue_1098',
  // Primary Address
  primaryStreet: 'borrower.address.street',
  primaryCity: 'borrower.address.city',
  primaryState: 'borrower.state',
  primaryZip: 'borrower.address.zip',
  // Mailing Address
  mailingSameAsPrimary: 'borrower.mailing_same_as_primary',
  mailingStreet: 'borrower.mailing.street',
  mailingCity: 'borrower.mailing.city',
  mailingState: 'borrower.mailing.state',
  mailingZip: 'borrower.mailing.zip',
  // Phone
  phoneHome: 'borrower.phone.home',
  phoneWork: 'borrower.phone.work',
  phoneCell: 'borrower.phone.mobile',
  phoneFax: 'borrower.phone.fax',
  preferredHome: 'borrower.preferred.home',
  preferredWork: 'borrower.preferred.work',
  preferredCell: 'borrower.preferred.cell',
  preferredFax: 'borrower.preferred.fax',
  // Account Information
  account: 'borrower.account',
  dob: 'borrower.dob',
  hold: 'borrower.hold',
  // Notices & Forms
  taxReporting: 'borrower.tax_reporting',
  sendLateNotices: 'borrower.send_late_notices',
  sendPaymentReceipts: 'borrower.send_payment_receipts',
  sendPaymentStatements: 'borrower.send_payment_statements',
  printRolodexCards: 'borrower.print_rolodex_cards',
  // Email & Delivery Options
  format: 'borrower.format',
  deliveryPrint: 'borrower.delivery_print',
  deliveryEmail: 'borrower.delivery_email',
  deliverySms: 'borrower.delivery_sms',
  // Vesting & FORD
  vesting: 'borrower.vesting',
  ford1: 'borrower.ford.1',
  ford2: 'borrower.ford.2',
  ford3: 'borrower.ford.3',
  ford4: 'borrower.ford.4',
  // Alternate Tax Info
  altTaxSsn: 'borrower.alt_tax.ssn',
  altTaxName: 'borrower.alt_tax.name',
  altTaxStreet: 'borrower.alt_tax.street',
  altTaxCity: 'borrower.alt_tax.city',
  altTaxState: 'borrower.alt_tax.state',
  altTaxZip: 'borrower.alt_tax.zip',
  altTaxAccount: 'borrower.alt_tax.account',
  altTaxRecipientType: 'borrower.alt_tax.recipient_type',
  altTaxAutoSync: 'borrower.alt_tax.auto_sync',
} as const;

const FORMAT_OPTIONS = [
  { value: 'HTML', label: 'HTML' },
  { value: 'PDF', label: 'PDF' },
  { value: 'Text', label: 'Text' },
];

const RECIPIENT_TYPE_OPTIONS = [
  { value: '2-SSN', label: '2-SSN' },
  { value: '1-EIN', label: '1-EIN' },
];

interface BorrowerPrimaryFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const BorrowerPrimaryForm: React.FC<BorrowerPrimaryFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const [altTaxModalOpen, setAltTaxModalOpen] = React.useState(false);

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

  const renderField = (key: keyof typeof FIELD_KEYS, label: string) => {
    const value = getValue(key);
    const fieldDef = fields.find(f => f.field_key === FIELD_KEYS[key]);
    const isRequired = fieldDef?.is_required || false;
    const showError = showValidation && isRequired && !value.trim();

    return (
      <div key={key} className="flex items-center gap-2">
        <Label className="w-44 text-xs text-foreground flex-shrink-0">
          {label}
        </Label>
        <Input
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          disabled={disabled}
          className={`h-7 text-xs flex-1 ${showError ? 'border-destructive' : ''}`}
        />
      </div>
    );
  };

  const renderPhoneField = (key: keyof typeof FIELD_KEYS, preferredKey: keyof typeof FIELD_KEYS, label: string) => {
    const value = getValue(key);

    return (
      <div key={key} className="flex items-center gap-2">
        <Label className="w-16 text-xs text-foreground flex-shrink-0">{label}</Label>
        <Checkbox
          checked={getBoolValue(preferredKey)}
          onCheckedChange={(checked) => handleChange(preferredKey, !!checked)}
          disabled={disabled}
          className="h-4 w-4"
        />
        <Input
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          disabled={disabled}
          className="h-7 text-xs flex-1"
        />
      </div>
    );
  };

  const handleSaveAltTaxInfo = (data: {
    ssn: string;
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    account: string;
    recipientType: string;
    autoSync: boolean;
  }) => {
    handleChange('altTaxSsn', data.ssn);
    handleChange('altTaxName', data.name);
    handleChange('altTaxStreet', data.street);
    handleChange('altTaxCity', data.city);
    handleChange('altTaxState', data.state);
    handleChange('altTaxZip', data.zip);
    handleChange('altTaxAccount', data.account);
    handleChange('altTaxRecipientType', data.recipientType);
    handleChange('altTaxAutoSync', data.autoSync);
  };

  return (
    <div className="p-4 space-y-6">
      {/* Main Grid Layout */}
      <div className="grid grid-cols-4 gap-x-6 gap-y-0">
        {/* Column 1: Name Fields */}
        <div className="space-y-2">
          <div className="border-b border-border pb-1 mb-3">
            <span className="font-semibold text-sm text-foreground">Name</span>
          </div>
          <div className="space-y-1.5">
            {renderField('borrowerType', 'Borrower Type')}
            {renderField('borrowerId', 'Borrower ID')}
            {renderField('fullName', 'Full Name: If Entity, Use Entity')}
            {renderField('firstName', 'First: If Entity, Use Signer')}
            {renderField('middleName', 'Middle')}
            {renderField('lastName', 'Last')}
            {renderField('salutation', 'Salutation')}
            {renderField('capacity', 'Capacity')}
            {renderField('email', 'Email')}
            {renderField('creditScore', 'Credit Score')}
            {renderField('taxIdType', 'Tax ID Type')}
            {renderField('taxId', 'TIN')}
          </div>
        </div>

        {/* Column 2: Primary Address + Mailing Address */}
        <div className="space-y-4">
          {/* Primary Address */}
          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Primary Address</span>
            </div>
            <div className="space-y-1.5">
              {renderField('primaryStreet', 'Street')}
              {renderField('primaryCity', 'City')}
              {renderField('primaryState', 'State')}
              {renderField('primaryZip', 'ZIP')}
            </div>
          </div>

          {/* Mailing Address */}
          <div>
            <div className="border-b border-border pb-1 mb-3 flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground">Mailing Address</span>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="mailingSameAsPrimary"
                  checked={getBoolValue('mailingSameAsPrimary')}
                  onCheckedChange={(checked) => handleSameAsPrimaryChange(!!checked)}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label htmlFor="mailingSameAsPrimary" className="text-xs text-foreground">Same as Primary</Label>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="w-16 text-xs text-foreground flex-shrink-0">Street</Label>
                <Input
                  value={getValue('mailingStreet')}
                  onChange={(e) => handleChange('mailingStreet', e.target.value)}
                  disabled={disabled || getBoolValue('mailingSameAsPrimary')}
                  className="h-7 text-xs flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-16 text-xs text-foreground flex-shrink-0">City</Label>
                <Input
                  value={getValue('mailingCity')}
                  onChange={(e) => handleChange('mailingCity', e.target.value)}
                  disabled={disabled || getBoolValue('mailingSameAsPrimary')}
                  className="h-7 text-xs flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-16 text-xs text-foreground flex-shrink-0">State</Label>
                <Input
                  value={getValue('mailingState')}
                  onChange={(e) => handleChange('mailingState', e.target.value)}
                  disabled={disabled || getBoolValue('mailingSameAsPrimary')}
                  className="h-7 text-xs flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-16 text-xs text-foreground flex-shrink-0">ZIP</Label>
                <Input
                  value={getValue('mailingZip')}
                  onChange={(e) => handleChange('mailingZip', e.target.value)}
                  disabled={disabled || getBoolValue('mailingSameAsPrimary')}
                  className="h-7 text-xs flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Phone + Account Information + Notices & Forms */}
        <div className="space-y-4">
          {/* Phone Section */}
          <div>
            <div className="border-b border-border pb-1 mb-3 flex items-center gap-4">
              <span className="font-semibold text-sm text-foreground">Phone</span>
              <span className="text-xs text-muted-foreground">Preferred</span>
            </div>
            <div className="space-y-1.5">
              {renderPhoneField('phoneHome', 'preferredHome', 'Home')}
              {renderPhoneField('phoneWork', 'preferredWork', 'Work')}
              {renderPhoneField('phoneCell', 'preferredCell', 'Cell')}
              {renderPhoneField('phoneFax', 'preferredFax', 'Fax')}
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="issue1098"
                  checked={getBoolValue('issue1098')}
                  onCheckedChange={(checked) => handleChange('issue1098', !!checked)}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label htmlFor="issue1098" className="text-xs text-foreground">Issue 1098</Label>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Account Information</span>
            </div>
            <div className="space-y-1.5">
              {renderField('account', 'Account')}
              <div className="flex items-center gap-2">
                <Label className="w-44 text-xs text-foreground flex-shrink-0">DOB</Label>
                <Input
                  type="date"
                  value={getValue('dob')}
                  onChange={(e) => handleChange('dob', e.target.value)}
                  disabled={disabled}
                  className="h-7 text-xs flex-1"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="hold"
                  checked={getBoolValue('hold')}
                  onCheckedChange={(checked) => handleChange('hold', !!checked)}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label htmlFor="hold" className="text-xs text-foreground">Hold</Label>
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs text-primary p-0 h-auto ml-auto"
                  onClick={() => setAltTaxModalOpen(true)}
                  disabled={disabled}
                >
                  Alternate Tax Info
                </Button>
              </div>
            </div>
          </div>

          {/* Notices & Forms */}
          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Notices & Forms</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="taxReporting"
                  checked={getBoolValue('taxReporting')}
                  onCheckedChange={(checked) => handleChange('taxReporting', !!checked)}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label htmlFor="taxReporting" className="text-xs text-foreground">Tax Reporting</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sendLateNotices"
                  checked={getBoolValue('sendLateNotices')}
                  onCheckedChange={(checked) => handleChange('sendLateNotices', !!checked)}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label htmlFor="sendLateNotices" className="text-xs text-foreground">Send Late Notices</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sendPaymentReceipts"
                  checked={getBoolValue('sendPaymentReceipts')}
                  onCheckedChange={(checked) => handleChange('sendPaymentReceipts', !!checked)}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label htmlFor="sendPaymentReceipts" className="text-xs text-foreground">Send Payment Receipts</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sendPaymentStatements"
                  checked={getBoolValue('sendPaymentStatements')}
                  onCheckedChange={(checked) => handleChange('sendPaymentStatements', !!checked)}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label htmlFor="sendPaymentStatements" className="text-xs text-foreground">Send Payment Statements</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="printRolodexCards"
                  checked={getBoolValue('printRolodexCards')}
                  onCheckedChange={(checked) => handleChange('printRolodexCards', !!checked)}
                  disabled={disabled}
                  className="h-4 w-4"
                />
                <Label htmlFor="printRolodexCards" className="text-xs text-foreground">Print Rolodex Cards</Label>
              </div>
            </div>
          </div>

          {/* Email & Delivery Options */}
          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Email & Delivery Options</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="w-16 text-xs text-foreground flex-shrink-0">Format</Label>
                <Select
                  value={getValue('format')}
                  onValueChange={(value) => handleChange('format', value)}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-7 text-xs flex-1">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="border-b border-border pb-1 mt-2 mb-2">
                <span className="text-xs text-muted-foreground">Delivery</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Checkbox
                    id="deliveryPrint"
                    checked={getBoolValue('deliveryPrint')}
                    onCheckedChange={(checked) => handleChange('deliveryPrint', !!checked)}
                    disabled={disabled}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="deliveryPrint" className="text-xs text-foreground">Print</Label>
                </div>
                <div className="flex items-center gap-1">
                  <Checkbox
                    id="deliveryEmail"
                    checked={getBoolValue('deliveryEmail')}
                    onCheckedChange={(checked) => handleChange('deliveryEmail', !!checked)}
                    disabled={disabled}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="deliveryEmail" className="text-xs text-foreground">Email</Label>
                </div>
                <div className="flex items-center gap-1">
                  <Checkbox
                    id="deliverySms"
                    checked={getBoolValue('deliverySms')}
                    onCheckedChange={(checked) => handleChange('deliverySms', !!checked)}
                    disabled={disabled}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="deliverySms" className="text-xs text-foreground">SMS</Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Vesting + FORD */}
        <div className="space-y-4">
          {/* Vesting Section */}
          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">Vesting</span>
            </div>
            <div className="space-y-1.5">
              <Textarea
                value={getValue('vesting')}
                onChange={(e) => handleChange('vesting', e.target.value)}
                disabled={disabled}
                className="min-h-[80px] text-xs"
              />
            </div>
          </div>

          {/* FORD Section */}
          <div>
            <div className="border-b border-border pb-1 mb-3">
              <span className="font-semibold text-sm text-foreground">FORD</span>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={getValue('ford1')}
                  onChange={(e) => handleChange('ford1', e.target.value)}
                  disabled={disabled}
                  className="h-7 text-xs"
                />
                <Input
                  value={getValue('ford2')}
                  onChange={(e) => handleChange('ford2', e.target.value)}
                  disabled={disabled}
                  className="h-7 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={getValue('ford3')}
                  onChange={(e) => handleChange('ford3', e.target.value)}
                  disabled={disabled}
                  className="h-7 text-xs"
                />
                <Input
                  value={getValue('ford4')}
                  onChange={(e) => handleChange('ford4', e.target.value)}
                  disabled={disabled}
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alternate Tax Info Modal */}
      <AlternateTaxInfoModal
        open={altTaxModalOpen}
        onOpenChange={setAltTaxModalOpen}
        values={{
          ssn: getValue('altTaxSsn'),
          name: getValue('altTaxName'),
          street: getValue('altTaxStreet'),
          city: getValue('altTaxCity'),
          state: getValue('altTaxState'),
          zip: getValue('altTaxZip'),
          account: getValue('altTaxAccount'),
          recipientType: getValue('altTaxRecipientType'),
          autoSync: getBoolValue('altTaxAutoSync'),
        }}
        onSave={handleSaveAltTaxInfo}
      />
    </div>
  );
};

export default BorrowerPrimaryForm;
