import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { InsuranceData } from './InsuranceTableView';

interface InsuranceDetailFormProps {
  insurance: InsuranceData;
  onChange: (field: keyof InsuranceData, value: string | boolean) => void;
  disabled?: boolean;
  propertyOptions?: { id: string; label: string }[];
}

const INSURANCE_DESCRIPTION_OPTIONS = [
  'Earthquake Insurance',
  'Fire Insurance',
  'Flood Insurance',
  'Hurricane',
  'Force-Placed CPI',
  'Hazard',
  'Flood',
  'Wind'
];

const TRACKING_STATUS_OPTIONS = [
  'Unable to Verify',
  'Current - Active',
  'Pending Cancellation',
  'Cancelled - Payment',
  'Cancelled - Other',
  'Force Placed Coverage',
];

export const InsuranceDetailForm: React.FC<InsuranceDetailFormProps> = ({
  insurance,
  onChange,
  disabled = false,
  propertyOptions = [],
}) => {
  const renderField = (field: keyof InsuranceData, label: string, props: Record<string, any> = {}) => (
    <div className="flex items-center gap-3">
      <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">{label}</Label>
      <Input value={String(insurance[field] || '')} onChange={(e) => onChange(field, e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" {...props} />
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">General</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-3">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">Insurance Policy Information</span>
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Property</Label>
            <Select value={insurance.property} onValueChange={(val) => onChange('property', val)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {propertyOptions.map(opt => (<SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Description</Label>
            <Select value={insurance.description} onValueChange={(val) => onChange('description', val)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {INSURANCE_DESCRIPTION_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {renderField('insuredName', "Insured's Name")}
          {renderField('companyName', 'Insurance Company')}
          {renderField('policyNumber', 'Policy Number')}
          {renderField('expiration', 'Expiration', { type: 'date' })}

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Coverage</Label>
            <div className="flex items-center gap-1 flex-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input value={insurance.coverage} onChange={(e) => onChange('coverage', e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.00" />
            </div>
          </div>

          {/* Payment Mailing Address */}
          <div className="border-b border-border pb-2 pt-2">
            <span className="font-semibold text-sm text-primary">Payment Mailing Address</span>
          </div>
          {renderField('paymentMailingStreet', 'Street')}
          {renderField('paymentMailingCity', 'City')}
          {renderField('paymentMailingState', 'State')}
          {renderField('paymentMailingZip', 'ZIP')}

          <div className="flex items-center gap-2 pt-1">
            <Checkbox id="detail-insurance-active" checked={insurance.active} onCheckedChange={(checked) => onChange('active', !!checked)} disabled={disabled} className="h-4 w-4" />
            <Label htmlFor="detail-insurance-active" className="text-sm text-foreground">Active</Label>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">Insurance Agent Information</span>
          </div>

          {renderField('agentName', "Agent's Name")}
          {renderField('businessAddress', 'Bus. Address')}
          {renderField('businessAddressCity', 'City')}
          {renderField('businessAddressState', 'State')}
          {renderField('businessAddressZip', 'ZIP')}
          {renderField('phoneNumber', 'Phone Number')}
          {renderField('faxNumber', 'Fax Number')}
          {renderField('email', 'E-mail', { type: 'email' })}

          {/* Insurance Tracking */}
          <div className="border-b border-border pb-2 pt-2">
            <span className="font-semibold text-sm text-primary">Insurance Tracking</span>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="detail-insurance-tracking" checked={insurance.insuranceTracking} onCheckedChange={(checked) => onChange('insuranceTracking', !!checked)} disabled={disabled} className="h-4 w-4" />
            <Label htmlFor="detail-insurance-tracking" className="text-sm text-foreground">Insurance Tracking</Label>
          </div>

          {insurance.insuranceTracking && (
            <>
              {renderField('lastVerified', 'Last Verified', { type: 'date' })}
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Status</Label>
                <Select value={insurance.trackingStatus} onValueChange={(val) => onChange('trackingStatus', val)} disabled={disabled}>
                  <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {TRACKING_STATUS_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default InsuranceDetailForm;
