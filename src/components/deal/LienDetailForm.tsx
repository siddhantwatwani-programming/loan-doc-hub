import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Home } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { LienData } from './LiensTableView';

interface LienDetailFormProps {
  lien: LienData;
  onChange: (field: keyof LienData, value: string) => void;
  disabled?: boolean;
  propertyOptions?: { id: string; label: string }[];
}

const LOAN_TYPE_OPTIONS = ['Conventional', 'Private Lender', 'Judgement', 'Other'];

export const LienDetailForm: React.FC<LienDetailFormProps> = ({
  lien,
  onChange,
  disabled = false,
  propertyOptions = [],
}) => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base text-foreground">General</span>
      </div>

      <div className="form-section-header">Property Lien Information</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">Related Property</Label>
          <Input value={lien.property} onChange={(e) => onChange('property', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter property" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Priority Now</Label>
          <Input value={lien.lienPriorityNow} onChange={(e) => onChange('lienPriorityNow', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter priority" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Lien Holder</Label>
          <Input value={lien.holder} onChange={(e) => onChange('holder', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Priority After</Label>
          <Input value={lien.lienPriorityAfter} onChange={(e) => onChange('lienPriorityAfter', e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter priority" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Account Number</Label>
          <Input value={lien.account} onChange={(e) => onChange('account', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Interest Rate</Label>
          <div className="flex items-center gap-1 flex-1">
            <Input value={lien.interestRate} onChange={(e) => onChange('interestRate', e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.000" />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Phone</Label>
          <Input value={lien.phone} onChange={(e) => onChange('phone', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Maturity Date</Label>
          <Input type="date" value={lien.maturityDate} onChange={(e) => onChange('maturityDate', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Fax</Label>
          <Input value={lien.fax} onChange={(e) => onChange('fax', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Original Balance</Label>
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input value={lien.originalBalance} onChange={(e) => onChange('originalBalance', e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.00" />
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Email</Label>
          <Input value={lien.email} onChange={(e) => onChange('email', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Balance After</Label>
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input value={lien.balanceAfter} onChange={(e) => onChange('balanceAfter', e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.00" />
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Loan Type</Label>
          <Select value={lien.loanType} onValueChange={(val) => onChange('loanType', val)} disabled={disabled}>
            <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">{LOAN_TYPE_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Regular Payment</Label>
          <div className="flex items-center gap-1 flex-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input value={lien.regularPayment} onChange={(e) => onChange('regularPayment', e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.00" />
          </div>
        </div>
      </div>

      {/* Checkbox rows */}
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label"></Label>
          <div className="flex items-center gap-1.5 flex-1">
            <Checkbox id="anticipated" checked={lien.anticipated === 'true'} onCheckedChange={(checked) => onChange('anticipated', checked ? 'true' : 'false')} disabled={disabled} />
            <Label htmlFor="anticipated" className="text-sm">Anticipated</Label>
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Recording #</Label>
          <div className="flex items-center gap-2 flex-1">
            <Input value={lien.recordingNumber} onChange={(e) => onChange('recordingNumber', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
            <Checkbox id="recordingNumberFlag" checked={lien.recordingNumberFlag === 'true'} onCheckedChange={(checked) => onChange('recordingNumberFlag', checked ? 'true' : 'false')} disabled={disabled} />
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label"></Label>
          <div className="flex items-center gap-1.5 flex-1">
            <Checkbox id="existingRemain" checked={lien.existingRemain === 'true'} onCheckedChange={(checked) => onChange('existingRemain', checked ? 'true' : 'false')} disabled={disabled} />
            <Label htmlFor="existingRemain" className="text-sm">Existing - Remain</Label>
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Recording Date</Label>
          <Input type="date" value={lien.recordingDate} onChange={(e) => onChange('recordingDate', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label"></Label>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <Checkbox id="existingPaydown" checked={lien.existingPaydown === 'true'} onCheckedChange={(checked) => onChange('existingPaydown', checked ? 'true' : 'false')} disabled={disabled} />
              <Label htmlFor="existingPaydown" className="text-sm">Existing - Paydown</Label>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input value={lien.existingPaydownAmount} onChange={(e) => onChange('existingPaydownAmount', e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.00" />
            </div>
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label"></Label>
          <div className="flex items-center gap-1.5 flex-1">
            <Checkbox id="seniorLienTracking" checked={lien.seniorLienTracking === 'true'} onCheckedChange={(checked) => onChange('seniorLienTracking', checked ? 'true' : 'false')} disabled={disabled} />
            <Label htmlFor="seniorLienTracking" className="text-sm">Senior Lien Tracking</Label>
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label"></Label>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-1.5">
              <Checkbox id="existingPayoff" checked={lien.existingPayoff === 'true'} onCheckedChange={(checked) => onChange('existingPayoff', checked ? 'true' : 'false')} disabled={disabled} />
              <Label htmlFor="existingPayoff" className="text-sm">Existing - Payoff</Label>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input value={lien.existingPayoffAmount} onChange={(e) => onChange('existingPayoffAmount', e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.00" />
            </div>
          </div>
        </div>
        <div className="inline-field">
          <Label className="inline-label">Last Verified</Label>
          <Input type="date" value={lien.lastVerified} onChange={(e) => onChange('lastVerified', e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">Property liens are used to track existing encumbrances on the property.</p>
      </div>
    </div>
  );
};

export default LienDetailForm;
