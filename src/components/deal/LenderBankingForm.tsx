import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface LenderBankingFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const LenderBankingForm: React.FC<LenderBankingFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ACH Section */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">ACH Status</Label>
              <Input
                value={values['lender_ach_status'] || ''}
                onChange={(e) => onValueChange('lender_ach_status', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Bank</Label>
              <Input
                value={values['lender_bank_name'] || ''}
                onChange={(e) => onValueChange('lender_bank_name', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Routing Number</Label>
              <Input
                value={values['lender_routing_number'] || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  onValueChange('lender_routing_number', value);
                }}
                disabled={disabled}
                className="h-8"
                maxLength={9}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Account Number</Label>
              <Input
                value={values['lender_account_number'] || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  onValueChange('lender_account_number', value);
                }}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Type</Label>
              <Input
                value={values['lender_account_type'] || ''}
                onChange={(e) => onValueChange('lender_account_type', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Name</Label>
              <Input
                value={values['lender_account_name'] || ''}
                onChange={(e) => onValueChange('lender_account_name', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">ID</Label>
              <Input
                value={values['lender_account_id'] || ''}
                onChange={(e) => onValueChange('lender_account_id', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Further Credit To</Label>
              <Input
                value={values['lender_further_credit_to'] || ''}
                onChange={(e) => onValueChange('lender_further_credit_to', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Check/Mailing Section */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">By Check</Label>
              <Checkbox
                checked={values['lender_by_check'] === 'true'}
                onCheckedChange={(checked) => onValueChange('lender_by_check', checked ? 'true' : 'false')}
                disabled={disabled}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Same as Mailing</Label>
              <Checkbox
                checked={values['lender_same_as_mailing'] === 'true'}
                onCheckedChange={(checked) => onValueChange('lender_same_as_mailing', checked ? 'true' : 'false')}
                disabled={disabled}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Address</Label>
              <Input
                value={values['lender_check_address'] || ''}
                onChange={(e) => onValueChange('lender_check_address', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={values['lender_check_city'] || ''}
                onChange={(e) => onValueChange('lender_check_city', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Zip Code</Label>
              <Input
                value={values['lender_check_zip'] || ''}
                onChange={(e) => onValueChange('lender_check_zip', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Add ACH Email</Label>
              <Input
                type="email"
                value={values['lender_ach_email_1'] || ''}
                onChange={(e) => onValueChange('lender_ach_email_1', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Add ACH Email</Label>
              <Input
                type="email"
                value={values['lender_ach_email_2'] || ''}
                onChange={(e) => onValueChange('lender_ach_email_2', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Credit Card Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Credit Card</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Name</Label>
              <Input
                value={values['lender_cc_name'] || ''}
                onChange={(e) => onValueChange('lender_cc_name', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Card Number</Label>
              <Input
                value={values['lender_cc_number'] || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  onValueChange('lender_cc_number', value);
                }}
                disabled={disabled}
                className="h-8"
                maxLength={16}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Security Code</Label>
              <Input
                value={values['lender_cc_security_code'] || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  onValueChange('lender_cc_security_code', value);
                }}
                disabled={disabled}
                className="h-8"
                maxLength={4}
                type="password"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Expiration</Label>
              <Input
                value={values['lender_cc_expiration'] || ''}
                onChange={(e) => onValueChange('lender_cc_expiration', e.target.value)}
                disabled={disabled}
                className="h-8"
                placeholder="MM/YY"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Zip Code</Label>
              <Input
                value={values['lender_cc_zip'] || ''}
                onChange={(e) => onValueChange('lender_cc_zip', e.target.value)}
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

export default LenderBankingForm;
