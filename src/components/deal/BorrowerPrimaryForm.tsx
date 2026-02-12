import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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
  phoneHome2: 'borrower.phone.home2',
  phoneWork: 'borrower.phone.work',
  phoneCell: 'borrower.phone.mobile',
  phoneFax: 'borrower.phone.fax',
  preferredHome: 'borrower.preferred.home',
  preferredHome2: 'borrower.preferred.home2',
  preferredWork: 'borrower.preferred.work',
  preferredCell: 'borrower.preferred.cell',
  preferredFax: 'borrower.preferred.fax',
  // Vesting & FORD
  vesting: 'borrower.vesting',
  ford1: 'borrower.ford.1',
  ford2: 'borrower.ford.2',
  ford3: 'borrower.ford.3',
  ford4: 'borrower.ford.4',
} as const;

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
            <Label className="text-xs text-muted-foreground">Same as Primary</Label>
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

        {/* Column 3: Phone Section */}
        <div className="space-y-4">
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
                <Label className="text-xs text-muted-foreground">Preferred</Label>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-sm text-muted-foreground">Home</Label>
                <Input
                  value={getValue('phoneHome2')}
                  onChange={(e) => handleChange('phoneHome2', e.target.value)}
                  disabled={disabled}
                  className="h-8"
                />
              </div>
              <div className="flex items-center gap-1 pt-5">
                <Checkbox
                  checked={getBoolValue('preferredHome2')}
                  onCheckedChange={(checked) => handleChange('preferredHome2', !!checked)}
                  disabled={disabled}
                />
                <Label className="text-xs text-muted-foreground">Preferred</Label>
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
                <Label className="text-xs text-muted-foreground">Preferred</Label>
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
                <Label className="text-xs text-muted-foreground">Preferred</Label>
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
                <Label className="text-xs text-muted-foreground">Preferred</Label>
              </div>
            </div>
            
          </div>
        </div>

        {/* Column 4: Vesting & FORD */}
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
        </div>
      </div>
    </div>
  );
};

export default BorrowerPrimaryForm;
