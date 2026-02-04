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
    <div className="p-6">
      {/* Horizontal 4-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Column 1: Name Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Name</h3>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Borrower Type</Label>
              <Input
                value={getValue('borrowerType')}
                onChange={(e) => handleChange('borrowerType', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Borrower ID</Label>
              <Input
                value={getValue('borrowerId')}
                onChange={(e) => handleChange('borrowerId', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Full Name: If Entity, Use Entity</Label>
              <Input
                value={getValue('fullName')}
                onChange={(e) => handleChange('fullName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">First: If Entity, Use Signer</Label>
              <Input
                value={getValue('firstName')}
                onChange={(e) => handleChange('firstName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Middle</Label>
              <Input
                value={getValue('middleName')}
                onChange={(e) => handleChange('middleName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Last</Label>
              <Input
                value={getValue('lastName')}
                onChange={(e) => handleChange('lastName', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Salutation</Label>
              <Input
                value={getValue('salutation')}
                onChange={(e) => handleChange('salutation', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Capacity</Label>
              <Input
                value={getValue('capacity')}
                onChange={(e) => handleChange('capacity', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={getValue('email')}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Credit Score</Label>
              <Input
                value={getValue('creditScore')}
                onChange={(e) => handleChange('creditScore', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Tax ID Type</Label>
              <Input
                value={getValue('taxIdType')}
                onChange={(e) => handleChange('taxIdType', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">TIN</Label>
              <Input
                value={getValue('taxId')}
                onChange={(e) => handleChange('taxId', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Column 2: Addresses */}
        <div className="space-y-4">
          {/* Primary Address */}
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Primary Address</h3>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Street</Label>
              <Input
                value={getValue('primaryStreet')}
                onChange={(e) => handleChange('primaryStreet', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={getValue('primaryCity')}
                onChange={(e) => handleChange('primaryCity', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">State</Label>
              <Input
                value={getValue('primaryState')}
                onChange={(e) => handleChange('primaryState', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">ZIP</Label>
              <Input
                value={getValue('primaryZip')}
                onChange={(e) => handleChange('primaryZip', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>

          {/* Mailing Address */}
          <div className="flex items-center gap-2 border-b border-border pb-2 mt-6">
            <h4 className="text-sm font-semibold text-foreground">Mailing Address</h4>
            <Checkbox
              checked={getBoolValue('mailingSameAsPrimary')}
              onCheckedChange={(checked) => handleSameAsPrimaryChange(!!checked)}
              disabled={disabled}
            />
            <Label className="text-xs text-muted-foreground">(Same as Primary)</Label>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Street</Label>
              <Input
                value={getValue('mailingStreet')}
                onChange={(e) => handleChange('mailingStreet', e.target.value)}
                disabled={disabled || getBoolValue('mailingSameAsPrimary')}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={getValue('mailingCity')}
                onChange={(e) => handleChange('mailingCity', e.target.value)}
                disabled={disabled || getBoolValue('mailingSameAsPrimary')}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">State</Label>
              <Input
                value={getValue('mailingState')}
                onChange={(e) => handleChange('mailingState', e.target.value)}
                disabled={disabled || getBoolValue('mailingSameAsPrimary')}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">ZIP</Label>
              <Input
                value={getValue('mailingZip')}
                onChange={(e) => handleChange('mailingZip', e.target.value)}
                disabled={disabled || getBoolValue('mailingSameAsPrimary')}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Column 3: Phone + Account Info */}
        <div className="space-y-4">
          {/* Phone Section */}
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Phone</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-sm text-muted-foreground">Home</Label>
                <Input
                  value={getValue('phoneHome')}
                  onChange={(e) => handleChange('phoneHome', e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
              </div>
              <div className="flex items-center gap-1 pt-5">
                <Checkbox
                  checked={getBoolValue('preferredHome')}
                  onCheckedChange={(checked) => handleChange('preferredHome', !!checked)}
                  disabled={disabled}
                />
                <Label className="text-xs text-muted-foreground">Pref</Label>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-sm text-muted-foreground">Work</Label>
                <Input
                  value={getValue('phoneWork')}
                  onChange={(e) => handleChange('phoneWork', e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
              </div>
              <div className="flex items-center gap-1 pt-5">
                <Checkbox
                  checked={getBoolValue('preferredWork')}
                  onCheckedChange={(checked) => handleChange('preferredWork', !!checked)}
                  disabled={disabled}
                />
                <Label className="text-xs text-muted-foreground">Pref</Label>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-sm text-muted-foreground">Cell</Label>
                <Input
                  value={getValue('phoneCell')}
                  onChange={(e) => handleChange('phoneCell', e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
              </div>
              <div className="flex items-center gap-1 pt-5">
                <Checkbox
                  checked={getBoolValue('preferredCell')}
                  onCheckedChange={(checked) => handleChange('preferredCell', !!checked)}
                  disabled={disabled}
                />
                <Label className="text-xs text-muted-foreground">Pref</Label>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-sm text-muted-foreground">Fax</Label>
                <Input
                  value={getValue('phoneFax')}
                  onChange={(e) => handleChange('phoneFax', e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
              </div>
              <div className="flex items-center gap-1 pt-5">
                <Checkbox
                  checked={getBoolValue('preferredFax')}
                  onCheckedChange={(checked) => handleChange('preferredFax', !!checked)}
                  disabled={disabled}
                />
                <Label className="text-xs text-muted-foreground">Pref</Label>
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="issue1098"
                checked={getBoolValue('issue1098')}
                onCheckedChange={(checked) => handleChange('issue1098', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="issue1098" className="text-sm text-muted-foreground">Issue 1098</Label>
            </div>
          </div>

          {/* Account Information */}
          <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2 mt-6">Account Information</h4>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Account</Label>
              <Input
                value={getValue('account')}
                onChange={(e) => handleChange('account', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">DOB</Label>
              <Input
                type="date"
                value={getValue('dob')}
                onChange={(e) => handleChange('dob', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hold"
                  checked={getBoolValue('hold')}
                  onCheckedChange={(checked) => handleChange('hold', !!checked)}
                  disabled={disabled}
                />
                <Label htmlFor="hold" className="text-sm text-muted-foreground">Hold</Label>
              </div>
              <Button
                variant="link"
                size="sm"
                className="text-sm text-primary p-0 h-auto"
                onClick={() => setAltTaxModalOpen(true)}
                disabled={disabled}
              >
                Alternate Tax Info
              </Button>
            </div>
          </div>

          {/* Notices & Forms */}
          <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2 mt-6">Notices & Forms</h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="taxReporting"
                checked={getBoolValue('taxReporting')}
                onCheckedChange={(checked) => handleChange('taxReporting', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="taxReporting" className="text-sm text-muted-foreground">Tax Reporting</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="sendLateNotices"
                checked={getBoolValue('sendLateNotices')}
                onCheckedChange={(checked) => handleChange('sendLateNotices', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="sendLateNotices" className="text-sm text-muted-foreground">Send Late Notices</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="sendPaymentReceipts"
                checked={getBoolValue('sendPaymentReceipts')}
                onCheckedChange={(checked) => handleChange('sendPaymentReceipts', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="sendPaymentReceipts" className="text-sm text-muted-foreground">Send Payment Receipts</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="sendPaymentStatements"
                checked={getBoolValue('sendPaymentStatements')}
                onCheckedChange={(checked) => handleChange('sendPaymentStatements', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="sendPaymentStatements" className="text-sm text-muted-foreground">Send Payment Statements</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="printRolodexCards"
                checked={getBoolValue('printRolodexCards')}
                onCheckedChange={(checked) => handleChange('printRolodexCards', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="printRolodexCards" className="text-sm text-muted-foreground">Print Rolodex Cards</Label>
            </div>
          </div>
        </div>

        {/* Column 4: Vesting, FORD, Email & Delivery */}
        <div className="space-y-4">
          {/* Vesting Section */}
          <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Vesting</h3>
          
          <Textarea
            value={getValue('vesting')}
            onChange={(e) => handleChange('vesting', e.target.value)}
            disabled={disabled}
            className="min-h-[100px] text-sm"
          />

          {/* FORD Section */}
          <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2 mt-6">FORD</h4>
          
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={getValue('ford1')}
                onChange={(e) => handleChange('ford1', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
              <Input
                value={getValue('ford2')}
                onChange={(e) => handleChange('ford2', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={getValue('ford3')}
                onChange={(e) => handleChange('ford3', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
              <Input
                value={getValue('ford4')}
                onChange={(e) => handleChange('ford4', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>

          {/* Email & Delivery Options */}
          <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2 mt-6">Email & Delivery</h4>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Format</Label>
              <Select
                value={getValue('format')}
                onValueChange={(value) => handleChange('format', value)}
                disabled={disabled}
              >
                <SelectTrigger className="h-8">
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
            
            <div className="pt-2">
              <Label className="text-sm text-muted-foreground mb-2 block">Delivery</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="deliveryPrint"
                    checked={getBoolValue('deliveryPrint')}
                    onCheckedChange={(checked) => handleChange('deliveryPrint', !!checked)}
                    disabled={disabled}
                  />
                  <Label htmlFor="deliveryPrint" className="text-sm text-muted-foreground">Print</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="deliveryEmail"
                    checked={getBoolValue('deliveryEmail')}
                    onCheckedChange={(checked) => handleChange('deliveryEmail', !!checked)}
                    disabled={disabled}
                  />
                  <Label htmlFor="deliveryEmail" className="text-sm text-muted-foreground">Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="deliverySms"
                    checked={getBoolValue('deliverySms')}
                    onCheckedChange={(checked) => handleChange('deliverySms', !!checked)}
                    disabled={disabled}
                  />
                  <Label htmlFor="deliverySms" className="text-sm text-muted-foreground">SMS</Label>
                </div>
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
