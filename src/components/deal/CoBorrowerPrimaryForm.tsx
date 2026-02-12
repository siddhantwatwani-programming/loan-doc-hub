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

const TYPE_OPTIONS = ['Co-Borrower', 'Guarantor', 'Co-Signer', 'Authorized User', 'Other'];
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

  const renderInline = (label: string, children: React.ReactNode) => (
    <div className="flex items-center gap-2">
      <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0 truncate">{label}</Label>
      {children}
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold text-sm text-foreground">Primary Information</h3>
        <p className="text-xs text-muted-foreground">Basic co-borrower details and contact information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mb-2">Name & Salutation</h4>
            {renderInline('Full Name', (<Input value={getValue('full_name')} onChange={(e) => handleChange('full_name', e.target.value)} placeholder="Enter full name" disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
            {renderInline('Salutation', (
              <Select value={getValue('salutation')} onValueChange={(v) => handleChange('salutation', v)} disabled={disabled}>
                <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{SALUTATION_OPTIONS.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
              </Select>
            ))}
            {renderInline('First Name', (<Input value={getValue('first_name')} onChange={(e) => handleChange('first_name', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
            {renderInline('Middle Name', (<Input value={getValue('middle_name')} onChange={(e) => handleChange('middle_name', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
            {renderInline('Last Name', (<Input value={getValue('last_name')} onChange={(e) => handleChange('last_name', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
            {renderInline('Generation', (
              <Select value={getValue('generation')} onValueChange={(v) => handleChange('generation', v)} disabled={disabled}>
                <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{GENERATION_OPTIONS.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
              </Select>
            ))}
          </div>

          <div className="space-y-1.5">
            <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mb-2">Mailing Address</h4>
            {renderInline('Street', (<Input value={getValue('address.street')} onChange={(e) => handleChange('address.street', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
            {renderInline('City', (<Input value={getValue('address.city')} onChange={(e) => handleChange('address.city', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
            <div className="flex items-center gap-2">
              <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">State / Zip</Label>
              <Select value={getValue('state')} onValueChange={(v) => handleChange('state', v)} disabled={disabled}>
                <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="State" /></SelectTrigger>
                <SelectContent>{STATE_OPTIONS.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
              </Select>
              <Input value={getValue('address.zip')} onChange={(e) => handleChange('address.zip', e.target.value)} disabled={disabled} className="h-7 text-xs w-24" placeholder="Zip" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mb-2">E-mail & Delivery</h4>
            {renderInline('Email', (<Input type="email" value={getValue('email')} onChange={(e) => handleChange('email', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
            {renderInline('Format', (
              <Select value={getValue('format') || 'HTML'} onValueChange={(v) => handleChange('format', v)} disabled={disabled}>
                <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{FORMAT_OPTIONS.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
              </Select>
            ))}
            <div className="flex items-center gap-2">
              <Label className="w-28 min-w-[7rem] text-xs text-muted-foreground flex-shrink-0">Delivery</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Checkbox id="deliveryPrint" checked={getBoolValue('delivery_print') || getValue('delivery_print') !== 'false'} onCheckedChange={(c) => handleChange('delivery_print', String(!!c))} disabled={disabled} className="h-3.5 w-3.5" />
                  <Label htmlFor="deliveryPrint" className="text-xs font-normal">Print</Label>
                </div>
                <div className="flex items-center gap-1">
                  <Checkbox id="deliveryEmail" checked={getBoolValue('delivery_email')} onCheckedChange={(c) => handleChange('delivery_email', String(!!c))} disabled={disabled} className="h-3.5 w-3.5" />
                  <Label htmlFor="deliveryEmail" className="text-xs font-normal">Email</Label>
                </div>
                <div className="flex items-center gap-1">
                  <Checkbox id="deliverySms" checked={getBoolValue('delivery_sms')} onCheckedChange={(c) => handleChange('delivery_sms', String(!!c))} disabled={disabled} className="h-3.5 w-3.5" />
                  <Label htmlFor="deliverySms" className="text-xs font-normal">SMS</Label>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox id="sendBorrowerNotifications" checked={getBoolValue('send_borrower_notifications')} onCheckedChange={(c) => handleChange('send_borrower_notifications', String(!!c))} disabled={disabled} className="h-3.5 w-3.5" />
              <Label htmlFor="sendBorrowerNotifications" className="text-xs font-normal">Send Borrower Notifications</Label>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mb-2">Phone Numbers</h4>
            {renderInline('Home', (<Input value={getValue('phone.home')} onChange={(e) => handleChange('phone.home', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
            {renderInline('Work', (<Input value={getValue('phone.work')} onChange={(e) => handleChange('phone.work', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
            {renderInline('Mobile', (<Input value={getValue('phone.mobile')} onChange={(e) => handleChange('phone.mobile', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
            {renderInline('Fax', (<Input value={getValue('fax')} onChange={(e) => handleChange('fax', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
          </div>

          <div className="space-y-1.5">
            <h4 className="font-medium text-xs text-muted-foreground border-b pb-1 mb-2">Other Information</h4>
            {renderInline('Loan Number', (<Input value={getValue('loan_number')} onChange={(e) => handleChange('loan_number', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0 bg-muted" readOnly />))}
            {renderInline('TIN', (<Input value={getValue('tin')} onChange={(e) => handleChange('tin', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
            {renderInline('Relation', (
              <Select value={getValue('relation') || 'None'} onValueChange={(v) => handleChange('relation', v)} disabled={disabled}>
                <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{RELATION_OPTIONS.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
              </Select>
            ))}
            {renderInline('Type', (
              <Select value={getValue('type') || 'Co-Borrower'} onValueChange={(v) => handleChange('type', v)} disabled={disabled}>
                <SelectTrigger className="h-7 text-xs flex-1 min-w-0"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{TYPE_OPTIONS.map(o => (<SelectItem key={o} value={o}>{o}</SelectItem>))}</SelectContent>
              </Select>
            ))}
            {renderInline('DOB', (<Input type="date" value={getValue('dob')} onChange={(e) => handleChange('dob', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
            <div className="flex items-center gap-2">
              <Checkbox id="creditReporting" checked={getBoolValue('credit_reporting')} onCheckedChange={(c) => handleChange('credit_reporting', String(!!c))} disabled={disabled} className="h-3.5 w-3.5" />
              <Label htmlFor="creditReporting" className="text-xs font-normal">Credit Reporting</Label>
            </div>
            {renderInline('Res Code', (<Input value={getValue('res_code')} onChange={(e) => handleChange('res_code', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
            {renderInline('Addr Indicator', (<Input value={getValue('address_indicator')} onChange={(e) => handleChange('address_indicator', e.target.value)} disabled={disabled} className="h-7 text-xs flex-1 min-w-0" />))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoBorrowerPrimaryForm;
