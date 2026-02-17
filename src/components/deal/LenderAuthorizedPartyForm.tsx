import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

const FIELD_KEYS = {
  firstName: 'lender.authorized_party.first_name',
  middleName: 'lender.authorized_party.middle_name',
  lastName: 'lender.authorized_party.last_name',
  capacity: 'lender.authorized_party.capacity',
  email: 'lender.authorized_party.email',
  sendPaymentNotification: 'lender.authorized_party.send_pref.payment_notification',
  sendLateNotice: 'lender.authorized_party.send_pref.late_notice',
  sendMaturityNotice: 'lender.authorized_party.send_pref.maturity_notice',
  sendBorrowerStatement: 'lender.authorized_party.send_pref.borrower_statement',
  street: 'lender.authorized_party.address.street',
  city: 'lender.authorized_party.address.city',
  state: 'lender.authorized_party.address.state',
  zip: 'lender.authorized_party.address.zip',
  details: 'lender.authorized_party.address.details',
  phoneHome: 'lender.authorized_party.phone.home',
  phoneWork: 'lender.authorized_party.phone.work',
  phoneCell: 'lender.authorized_party.phone.cell',
  phoneFax: 'lender.authorized_party.phone.fax',
  deliveryEmail: 'lender.authorized_party.delivery.email',
  deliveryMail: 'lender.authorized_party.delivery.mail',
  deliverySms: 'lender.authorized_party.delivery.sms',
} as const;

const CAPACITY_OPTIONS = [
  { value: 'attorney', label: 'Attorney' },
  { value: 'cfo_cpa', label: 'CFO / CPA' },
  { value: 'broker', label: 'Broker' },
  { value: 'family', label: 'Family' },
  { value: 'bankruptcy_trustee', label: 'Bankruptcy Trustee' },
  { value: 'other', label: 'Other' },
];

interface LenderAuthorizedPartyFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const LenderAuthorizedPartyForm: React.FC<LenderAuthorizedPartyFormProps> = ({
  values,
  onValueChange,
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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="border-b border-border pb-2 mb-4">
        <span className="font-semibold text-base text-foreground">Authorized Party</span>
      </div>

      {/* Top 3-column: Name | Address | Phone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Name */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Name</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[60px]">First</Label>
              <Input value={getValue('firstName')} onChange={(e) => handleChange('firstName', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[60px]">Middle</Label>
              <Input value={getValue('middleName')} onChange={(e) => handleChange('middleName', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[60px]">Last</Label>
              <Input value={getValue('lastName')} onChange={(e) => handleChange('lastName', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[60px]">Capacity</Label>
              <Select value={getValue('capacity')} onValueChange={(v) => handleChange('capacity', v)} disabled={disabled}>
                <SelectTrigger className="h-7 text-sm flex-1 bg-background">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {CAPACITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[60px]">Email</Label>
              <Input type="email" value={getValue('email')} onChange={(e) => handleChange('email', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Address</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[50px]">Street</Label>
              <Input value={getValue('street')} onChange={(e) => handleChange('street', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[50px]">City</Label>
              <Input value={getValue('city')} onChange={(e) => handleChange('city', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[50px]">State</Label>
              <Input value={getValue('state')} onChange={(e) => handleChange('state', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[50px]">ZIP</Label>
              <Input value={getValue('zip')} onChange={(e) => handleChange('zip', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Phone</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[40px]">Home</Label>
              <Input type="tel" value={getValue('phoneHome')} onChange={(e) => handleChange('phoneHome', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[40px]">Work</Label>
              <Input type="tel" value={getValue('phoneWork')} onChange={(e) => handleChange('phoneWork', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[40px]">Cell</Label>
              <Input type="tel" value={getValue('phoneCell')} onChange={(e) => handleChange('phoneCell', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[40px]">Fax</Label>
              <Input type="tel" value={getValue('phoneFax')} onChange={(e) => handleChange('phoneFax', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Send | Delivery | Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Send */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Send:</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Payment Notification</Label>
              <Checkbox checked={getBoolValue('sendPaymentNotification')} onCheckedChange={(c) => handleChange('sendPaymentNotification', !!c)} disabled={disabled} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Borrower Statement</Label>
              <Checkbox checked={getBoolValue('sendBorrowerStatement')} onCheckedChange={(c) => handleChange('sendBorrowerStatement', !!c)} disabled={disabled} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Late Notice</Label>
              <Checkbox checked={getBoolValue('sendLateNotice')} onCheckedChange={(c) => handleChange('sendLateNotice', !!c)} disabled={disabled} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Maturity Notice</Label>
              <Checkbox checked={getBoolValue('sendMaturityNotice')} onCheckedChange={(c) => handleChange('sendMaturityNotice', !!c)} disabled={disabled} />
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Delivery</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[40px]">Email</Label>
              <Checkbox checked={getBoolValue('deliveryEmail')} onCheckedChange={(c) => handleChange('deliveryEmail', !!c)} disabled={disabled} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[40px]">Mail</Label>
              <Checkbox checked={getBoolValue('deliveryMail')} onCheckedChange={(c) => handleChange('deliveryMail', !!c)} disabled={disabled} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground min-w-[40px]">SMS</Label>
              <Checkbox checked={getBoolValue('deliverySms')} onCheckedChange={(c) => handleChange('deliverySms', !!c)} disabled={disabled} />
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">Details</h4>
          <Textarea
            value={getValue('details')}
            onChange={(e) => handleChange('details', e.target.value)}
            disabled={disabled}
            className="min-h-[80px] text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default LenderAuthorizedPartyForm;
