import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface LenderAuthorizedPartyFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const LenderAuthorizedPartyForm: React.FC<LenderAuthorizedPartyFormProps> = ({
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
        {/* Name Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Name</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">First</Label>
              <Input
                value={values['authorized_party_first_name'] || ''}
                onChange={(e) => onValueChange('authorized_party_first_name', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Middle</Label>
              <Input
                value={values['authorized_party_middle_name'] || ''}
                onChange={(e) => onValueChange('authorized_party_middle_name', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Last</Label>
              <Input
                value={values['authorized_party_last_name'] || ''}
                onChange={(e) => onValueChange('authorized_party_last_name', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Relationship</Label>
              <Input
                value={values['authorized_party_relationship'] || ''}
                onChange={(e) => onValueChange('authorized_party_relationship', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={values['authorized_party_email'] || ''}
                onChange={(e) => onValueChange('authorized_party_email', e.target.value)}
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
                checked={values['authorized_party_send_payment_notification'] === 'true'}
                onCheckedChange={(checked) => onValueChange('authorized_party_send_payment_notification', checked ? 'true' : 'false')}
                disabled={disabled}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Late Notice</Label>
              <Checkbox
                checked={values['authorized_party_send_late_notice'] === 'true'}
                onCheckedChange={(checked) => onValueChange('authorized_party_send_late_notice', checked ? 'true' : 'false')}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Address & Details Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Address</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Street</Label>
              <Input
                value={values['authorized_party_street'] || ''}
                onChange={(e) => onValueChange('authorized_party_street', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">City</Label>
              <Input
                value={values['authorized_party_city'] || ''}
                onChange={(e) => onValueChange('authorized_party_city', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">State</Label>
              <Input
                value={values['authorized_party_state'] || ''}
                onChange={(e) => onValueChange('authorized_party_state', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">ZIP</Label>
              <Input
                value={values['authorized_party_zip'] || ''}
                onChange={(e) => onValueChange('authorized_party_zip', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-foreground border-b pb-2 mt-6">Details</h3>
          
          <div className="space-y-3">
            <Input
              value={values['authorized_party_details_1'] || ''}
              onChange={(e) => onValueChange('authorized_party_details_1', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
            <Input
              value={values['authorized_party_details_2'] || ''}
              onChange={(e) => onValueChange('authorized_party_details_2', e.target.value)}
              disabled={disabled}
              className="h-8"
            />
          </div>

          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Borrower Statement</Label>
              <Checkbox
                checked={values['authorized_party_send_borrower_statement'] === 'true'}
                onCheckedChange={(checked) => onValueChange('authorized_party_send_borrower_statement', checked ? 'true' : 'false')}
                disabled={disabled}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Maturity Notice</Label>
              <Checkbox
                checked={values['authorized_party_send_maturity_notice'] === 'true'}
                onCheckedChange={(checked) => onValueChange('authorized_party_send_maturity_notice', checked ? 'true' : 'false')}
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* Phone & FORD Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Phone</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Home</Label>
              <Input
                type="tel"
                value={values['authorized_party_phone_home'] || ''}
                onChange={(e) => onValueChange('authorized_party_phone_home', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Work</Label>
              <Input
                type="tel"
                value={values['authorized_party_phone_work'] || ''}
                onChange={(e) => onValueChange('authorized_party_phone_work', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Cell</Label>
              <Input
                type="tel"
                value={values['authorized_party_phone_cell'] || ''}
                onChange={(e) => onValueChange('authorized_party_phone_cell', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2 items-center">
              <Label className="text-sm text-muted-foreground">Fax</Label>
              <Input
                type="tel"
                value={values['authorized_party_fax'] || ''}
                onChange={(e) => onValueChange('authorized_party_fax', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-foreground border-b pb-2 mt-6">FORD</h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={values['authorized_party_ford_1'] || ''}
                onChange={(e) => onValueChange('authorized_party_ford_1', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
              <Input
                value={values['authorized_party_ford_2'] || ''}
                onChange={(e) => onValueChange('authorized_party_ford_2', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={values['authorized_party_ford_3'] || ''}
                onChange={(e) => onValueChange('authorized_party_ford_3', e.target.value)}
                disabled={disabled}
                className="h-8"
              />
              <Input
                value={values['authorized_party_ford_4'] || ''}
                onChange={(e) => onValueChange('authorized_party_ford_4', e.target.value)}
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

export default LenderAuthorizedPartyForm;
