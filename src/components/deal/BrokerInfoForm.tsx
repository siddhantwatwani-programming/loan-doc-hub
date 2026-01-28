import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';

// Field key mapping for broker info fields
const FIELD_KEYS = {
  brokerId: 'broker.id',
  license: 'broker.License',
  company: 'broker.company',
  firstName: 'broker.first_name',
  middleName: 'broker.middle_name',
  lastName: 'broker.last_name',
  email: 'broker.email',
  street: 'broker.address.street',
  city: 'broker.address.city',
  state: 'broker.address.state',
  zip: 'broker.address.zip',
  taxIdType: 'broker.tax_id_type',
  taxId: 'broker.tax_id',
  issue1099: 'broker.issue_1099',
  phoneHome: 'broker.phone.home',
  phoneWork: 'broker.phone.work',
  phoneCell: 'broker.phone.cell',
  phoneFax: 'broker.phone.fax',
  paymentNotification: 'broker.send_pref.payment_notification',
  lateNotice: 'broker.send_pref.late_notice',
  lenderStatement: 'broker.send_pref.lender_statement',
  borrowerStatement: 'broker.send_pref.borrower_statement',
  maturityNotice: 'broker.send_pref.maturity_notice',
} as const;

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
  const getValue = (key: keyof typeof FIELD_KEYS): string => {
    return values[FIELD_KEYS[key]] || '';
  };

  const getBoolValue = (key: keyof typeof FIELD_KEYS): boolean => {
    return values[FIELD_KEYS[key]] === 'true';
  };

  const handleChange = (key: keyof typeof FIELD_KEYS, value: string | boolean) => {
    if (onValueChange) {
      onValueChange(FIELD_KEYS[key], String(value));
    }
  };

  // Calculate required fields status
  const requiredFieldsStatus = useMemo(() => {
    const requiredFields: (keyof typeof FIELD_KEYS)[] = ['brokerId'];
    const filledCount = requiredFields.filter(field => getValue(field).trim() !== '').length;
    const totalRequired = requiredFields.length;
    const missingCount = totalRequired - filledCount;
    return { filledCount, totalRequired, missingCount };
  }, [values]);

  return (
    <div className="space-y-6">
      {/* Required fields alert banner */}
      {requiredFieldsStatus.missingCount > 0 && (
        <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 text-amber-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {requiredFieldsStatus.missingCount} required field{requiredFieldsStatus.missingCount !== 1 ? 's' : ''} missing
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {requiredFieldsStatus.filledCount}/{requiredFieldsStatus.totalRequired} required fields filled
          </span>
        </div>
      )}

      {/* Form grid layout matching screenshot */}
      {/* Form grid layout matching screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Column 1 - Name Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Name</h3>
          
          <div className="space-y-2">
            <Label htmlFor="brokerId" className="text-sm">Broker ID <span className="text-destructive">*</span></Label>
            <Input
              id="brokerId"
              value={getValue('brokerId')}
              onChange={(e) => handleChange('brokerId', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter broker ID"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="license" className="text-sm">License:</Label>
            <Input
              id="license"
              value={getValue('license')}
              onChange={(e) => handleChange('license', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter license number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm">Company</Label>
            <Input
              id="company"
              value={getValue('company')}
              onChange={(e) => handleChange('company', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter company name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-sm">First</Label>
            <Input
              id="firstName"
              value={getValue('firstName')}
              onChange={(e) => handleChange('firstName', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter first name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="middleName" className="text-sm">Middle</Label>
            <Input
              id="middleName"
              value={getValue('middleName')}
              onChange={(e) => handleChange('middleName', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter middle name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-sm">Last</Label>
            <Input
              id="lastName"
              value={getValue('lastName')}
              onChange={(e) => handleChange('lastName', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter last name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              value={getValue('email')}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter email address"
            />
          </div>
        </div>

        {/* Column 2 - Primary Address Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Primary Address</h3>
          
          <div className="space-y-2">
            <Label htmlFor="street" className="text-sm">Street</Label>
            <Input
              id="street"
              value={getValue('street')}
              onChange={(e) => handleChange('street', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter street address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm">City</Label>
            <Input
              id="city"
              value={getValue('city')}
              onChange={(e) => handleChange('city', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter city"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm">State</Label>
            <Input
              id="state"
              value={getValue('state')}
              onChange={(e) => handleChange('state', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter state"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip" className="text-sm">ZIP</Label>
            <Input
              id="zip"
              value={getValue('zip')}
              onChange={(e) => handleChange('zip', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter ZIP code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxIdType" className="text-sm">Tax ID Type</Label>
            <Input
              id="taxIdType"
              value={getValue('taxIdType')}
              onChange={(e) => handleChange('taxIdType', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter tax ID type"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId" className="text-sm">Tax ID</Label>
            <Input
              id="taxId"
              value={getValue('taxId')}
              onChange={(e) => handleChange('taxId', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter tax ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue1099" className="text-sm">Issue 1099</Label>
            <Input
              id="issue1099"
              value={getValue('issue1099')}
              onChange={(e) => handleChange('issue1099', e.target.value)}
              disabled={disabled}
              className="h-9"
              placeholder="Enter 1099 status"
            />
          </div>
        </div>

        {/* Column 3 - Phone Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Phone</h3>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="phoneHome" className="text-sm">Home</Label>
              <Input
                id="phoneHome"
                type="tel"
                value={getValue('phoneHome')}
                onChange={(e) => handleChange('phoneHome', e.target.value)}
                disabled={disabled}
                className="h-9"
                placeholder="Enter home phone"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="phoneWork" className="text-sm">Work</Label>
              <Input
                id="phoneWork"
                type="tel"
                value={getValue('phoneWork')}
                onChange={(e) => handleChange('phoneWork', e.target.value)}
                disabled={disabled}
                className="h-9"
                placeholder="Enter work phone"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="phoneCell" className="text-sm">Cell</Label>
              <Input
                id="phoneCell"
                type="tel"
                value={getValue('phoneCell')}
                onChange={(e) => handleChange('phoneCell', e.target.value)}
                disabled={disabled}
                className="h-9"
                placeholder="Enter cell phone"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="phoneFax" className="text-sm">Fax</Label>
              <Input
                id="phoneFax"
                type="tel"
                value={getValue('phoneFax')}
                onChange={(e) => handleChange('phoneFax', e.target.value)}
                disabled={disabled}
                className="h-9"
                placeholder="Enter fax number"
              />
            </div>
          </div>

          {/* Send section */}
          <div className="space-y-3 pt-4">
            <Label className="text-sm font-medium">Send:</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="paymentNotification"
                checked={getBoolValue('paymentNotification')}
                onCheckedChange={(checked) => handleChange('paymentNotification', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="paymentNotification" className="text-sm font-normal cursor-pointer">
                Payment Notification
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lateNotice"
                checked={getBoolValue('lateNotice')}
                onCheckedChange={(checked) => handleChange('lateNotice', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="lateNotice" className="text-sm font-normal cursor-pointer">
                Late Notice
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="lenderStatement"
                checked={getBoolValue('lenderStatement')}
                onCheckedChange={(checked) => handleChange('lenderStatement', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="lenderStatement" className="text-sm font-normal cursor-pointer">
                Lender Statement
              </Label>
            </div>
          </div>
        </div>

        {/* Column 4 - Preferred Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-foreground border-b border-border pb-2">Send Preferences</h3>
          
          {/* Additional Send checkboxes in column 4 */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="borrowerStatement"
                checked={getBoolValue('borrowerStatement')}
                onCheckedChange={(checked) => handleChange('borrowerStatement', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="borrowerStatement" className="text-sm font-normal cursor-pointer">
                Borrower Statement
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="maturityNotice"
                checked={getBoolValue('maturityNotice')}
                onCheckedChange={(checked) => handleChange('maturityNotice', !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="maturityNotice" className="text-sm font-normal cursor-pointer">
                Maturity Notice
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerInfoForm;
