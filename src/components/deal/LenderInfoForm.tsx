import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface LenderInfoFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const LenderInfoForm: React.FC<LenderInfoFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [sameAsPrimary, setSameAsPrimary] = useState(false);

  const handleSameAsPrimaryChange = (checked: boolean) => {
    setSameAsPrimary(checked);
    if (checked) {
      // Copy primary address to mailing address
      onValueChange('lender_mailing_street', values['lender_primary_street'] || '');
      onValueChange('lender_mailing_city', values['lender_primary_city'] || '');
      onValueChange('lender_mailing_state', values['lender_primary_state'] || '');
      onValueChange('lender_mailing_zip', values['lender_primary_zip'] || '');
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Name Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Name</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Lender Type</Label>
              <Input
                value={values['lender_type'] || ''}
                onChange={(e) => onValueChange('lender_type', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Lender ID</Label>
              <Input
                value={values['lender_id'] || ''}
                onChange={(e) => onValueChange('lender_id', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Full Name: If Entity, Use Entity</Label>
              <Input
                value={values['lender_full_name'] || ''}
                onChange={(e) => onValueChange('lender_full_name', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">First: If Entity, Use Signer</Label>
              <Input
                value={values['lender_first_name'] || ''}
                onChange={(e) => onValueChange('lender_first_name', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Middle</Label>
              <Input
                value={values['lender_middle_name'] || ''}
                onChange={(e) => onValueChange('lender_middle_name', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Last</Label>
              <Input
                value={values['lender_last_name'] || ''}
                onChange={(e) => onValueChange('lender_last_name', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Capacity</Label>
              <Input
                value={values['lender_capacity'] || ''}
                onChange={(e) => onValueChange('lender_capacity', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={values['lender_email'] || ''}
                onChange={(e) => onValueChange('lender_email', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Tax ID Type</Label>
              <Input
                value={values['lender_tax_id_type'] || ''}
                onChange={(e) => onValueChange('lender_tax_id_type', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Tax ID</Label>
              <Input
                value={values['lender_tax_id'] || ''}
                onChange={(e) => onValueChange('lender_tax_id', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Issue 1099</Label>
              <Checkbox
                checked={values['lender_issue_1099'] === 'true'}
                onCheckedChange={(checked) => onValueChange('lender_issue_1099', checked ? 'true' : 'false')}
                disabled={disabled}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Prepare CA 881</Label>
              <Checkbox
                checked={values['lender_prepare_ca_881'] === 'true'}
                onCheckedChange={(checked) => onValueChange('lender_prepare_ca_881', checked ? 'true' : 'false')}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Primary Address & Phone Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Primary Address</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Street</Label>
              <Input
                value={values['lender_primary_street'] || ''}
                onChange={(e) => onValueChange('lender_primary_street', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={values['lender_primary_city'] || ''}
                onChange={(e) => onValueChange('lender_primary_city', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">State</Label>
              <Input
                value={values['lender_primary_state'] || ''}
                onChange={(e) => onValueChange('lender_primary_state', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">ZIP</Label>
              <Input
                value={values['lender_primary_zip'] || ''}
                onChange={(e) => onValueChange('lender_primary_zip', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-foreground border-b pb-2 mt-6">Phone</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Home</Label>
              <Input
                type="tel"
                value={values['lender_phone_home'] || ''}
                onChange={(e) => onValueChange('lender_phone_home', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Work</Label>
              <Input
                type="tel"
                value={values['lender_phone_work'] || ''}
                onChange={(e) => onValueChange('lender_phone_work', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Cell</Label>
              <Input
                type="tel"
                value={values['lender_phone_cell'] || ''}
                onChange={(e) => onValueChange('lender_phone_cell', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Fax</Label>
              <Input
                type="tel"
                value={values['lender_fax'] || ''}
                onChange={(e) => onValueChange('lender_fax', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Send:</h4>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Payment Notification</Label>
              <Checkbox
                checked={values['lender_send_payment_notification'] === 'true'}
                onCheckedChange={(checked) => onValueChange('lender_send_payment_notification', checked ? 'true' : 'false')}
                disabled={disabled}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Late Notice</Label>
              <Checkbox
                checked={values['lender_send_late_notice'] === 'true'}
                onCheckedChange={(checked) => onValueChange('lender_send_late_notice', checked ? 'true' : 'false')}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Preferred Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Preferred</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Preferred Phone</Label>
              <Input
                value={values['lender_preferred_phone'] || ''}
                onChange={(e) => onValueChange('lender_preferred_phone', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Borrower Statement</Label>
              <Checkbox
                checked={values['lender_send_borrower_statement'] === 'true'}
                onCheckedChange={(checked) => onValueChange('lender_send_borrower_statement', checked ? 'true' : 'false')}
                disabled={disabled}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Maturity Notice</Label>
              <Checkbox
                checked={values['lender_send_maturity_notice'] === 'true'}
                onCheckedChange={(checked) => onValueChange('lender_send_maturity_notice', checked ? 'true' : 'false')}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Mailing Address & Vesting Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 border-b pb-2">
            <h3 className="text-sm font-semibold text-foreground">Mailing Address</h3>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">(Same as Primary)</Label>
              <Checkbox
                checked={sameAsPrimary}
                onCheckedChange={handleSameAsPrimaryChange}
                disabled={disabled}
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Street</Label>
              <Input
                value={values['lender_mailing_street'] || ''}
                onChange={(e) => onValueChange('lender_mailing_street', e.target.value)}
                disabled={disabled || sameAsPrimary}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={values['lender_mailing_city'] || ''}
                onChange={(e) => onValueChange('lender_mailing_city', e.target.value)}
                disabled={disabled || sameAsPrimary}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">State</Label>
              <Input
                value={values['lender_mailing_state'] || ''}
                onChange={(e) => onValueChange('lender_mailing_state', e.target.value)}
                disabled={disabled || sameAsPrimary}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">ZIP</Label>
              <Input
                value={values['lender_mailing_zip'] || ''}
                onChange={(e) => onValueChange('lender_mailing_zip', e.target.value)}
                disabled={disabled || sameAsPrimary}
                className="h-8"
              />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-foreground border-b pb-2 mt-6">Vesting</h3>
          
          <div className="space-y-3">
            <Textarea
              value={values['lender_vesting'] || ''}
              onChange={(e) => onValueChange('lender_vesting', e.target.value)}
              disabled={disabled}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-foreground mb-3">FORD</h4>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={values['lender_ford_1'] || ''}
                onChange={(e) => onValueChange('lender_ford_1', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
              <Input
                value={values['lender_ford_2'] || ''}
                onChange={(e) => onValueChange('lender_ford_2', e.target.value)}
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

export default LenderInfoForm;
