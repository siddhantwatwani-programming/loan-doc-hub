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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">General</span>
      </div>

      <div className="space-y-4">
        <div className="border-b border-border pb-2">
          <span className="font-semibold text-sm text-primary">Property Lien Information</span>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          <div>
            <Label className="text-sm text-foreground">Related Property</Label>
            <Input value={lien.property} onChange={(e) => onChange('property', e.target.value)} disabled={disabled} className="h-8 text-sm mt-1" placeholder="Enter property" />
          </div>
          <div>
            <Label className="text-sm text-foreground">Lien Priority Now</Label>
            <Input value={lien.lienPriorityNow} onChange={(e) => onChange('lienPriorityNow', e.target.value)} disabled={disabled} className="h-8 text-sm mt-1" placeholder="Enter priority" />
          </div>

          <div>
            <Label className="text-sm text-foreground">Lien Holder</Label>
            <Input value={lien.holder} onChange={(e) => onChange('holder', e.target.value)} disabled={disabled} className="h-8 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-sm text-foreground">Lien Priority After</Label>
            <Input value={lien.lienPriorityAfter} onChange={(e) => onChange('lienPriorityAfter', e.target.value)} disabled={disabled} className="h-8 text-sm mt-1" placeholder="Enter priority" />
          </div>

          <div>
            <Label className="text-sm text-foreground">Account Number</Label>
            <Input value={lien.account} onChange={(e) => onChange('account', e.target.value)} disabled={disabled} className="h-8 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-sm text-foreground">Interest Rate</Label>
            <div className="flex items-center gap-1 mt-1">
              <Input value={lien.interestRate} onChange={(e) => onChange('interestRate', e.target.value)} disabled={disabled} className="h-8 text-sm text-right" inputMode="decimal" placeholder="0.000" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          <div>
            <Label className="text-sm text-foreground">Phone</Label>
            <Input value={lien.phone} onChange={(e) => onChange('phone', e.target.value)} disabled={disabled} className="h-8 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-sm text-foreground">Maturity Date</Label>
            <Input type="date" value={lien.maturityDate} onChange={(e) => onChange('maturityDate', e.target.value)} disabled={disabled} className="h-8 text-sm mt-1" />
          </div>

          <div>
            <Label className="text-sm text-foreground">Fax</Label>
            <Input value={lien.fax} onChange={(e) => onChange('fax', e.target.value)} disabled={disabled} className="h-8 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-sm text-foreground">Original Balance</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input value={lien.originalBalance} onChange={(e) => onChange('originalBalance', e.target.value)} disabled={disabled} className="h-8 text-sm text-right" inputMode="decimal" placeholder="0.00" />
            </div>
          </div>

          <div>
            <Label className="text-sm text-foreground">Email</Label>
            <Input value={lien.email} onChange={(e) => onChange('email', e.target.value)} disabled={disabled} className="h-8 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-sm text-foreground">Balance After</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input value={lien.balanceAfter} onChange={(e) => onChange('balanceAfter', e.target.value)} disabled={disabled} className="h-8 text-sm text-right" inputMode="decimal" placeholder="0.00" />
            </div>
          </div>

          {/* Loan Type row */}
          <div>
            <Label className="text-sm text-foreground">Loan Type</Label>
            <Select
              value={lien.loanType}
              onValueChange={(val) => onChange('loanType', val)}
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-sm mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {LOAN_TYPE_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm text-foreground">Regular Payment</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input value={lien.regularPayment} onChange={(e) => onChange('regularPayment', e.target.value)} disabled={disabled} className="h-8 text-sm text-right" inputMode="decimal" placeholder="0.00" />
            </div>
          </div>
        </div>

        {/* Checkbox rows + right-side fields */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="anticipated"
              checked={lien.anticipated === 'true'}
              onCheckedChange={(checked) => onChange('anticipated', checked ? 'true' : 'false')}
              disabled={disabled}
            />
            <Label htmlFor="anticipated" className="text-sm text-foreground">Anticipated</Label>
          </div>
          <div>
            <Label className="text-sm text-foreground">Recording Number</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input value={lien.recordingNumber} onChange={(e) => onChange('recordingNumber', e.target.value)} disabled={disabled} className="h-8 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <Checkbox
              id="recordingNumberFlag"
              checked={lien.recordingNumberFlag === 'true'}
              onCheckedChange={(checked) => onChange('recordingNumberFlag', checked ? 'true' : 'false')}
              disabled={disabled}
            />
            <Label htmlFor="recordingNumberFlag" className="text-sm text-foreground">Recording Number Flag</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="existingRemain"
              checked={lien.existingRemain === 'true'}
              onCheckedChange={(checked) => onChange('existingRemain', checked ? 'true' : 'false')}
              disabled={disabled}
            />
            <Label htmlFor="existingRemain" className="text-sm text-foreground">Existing - Remain</Label>
          </div>
          <div>
            <Label className="text-sm text-foreground">Recording Date</Label>
            <Input type="date" value={lien.recordingDate} onChange={(e) => onChange('recordingDate', e.target.value)} disabled={disabled} className="h-8 text-sm mt-1" />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="existingPaydown"
              checked={lien.existingPaydown === 'true'}
              onCheckedChange={(checked) => onChange('existingPaydown', checked ? 'true' : 'false')}
              disabled={disabled}
            />
            <Label htmlFor="existingPaydown" className="text-sm text-foreground">Existing - Paydown</Label>
          </div>
          <div>
            <Label className="text-sm text-foreground">Paydown Amount</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input value={lien.existingPaydownAmount} onChange={(e) => onChange('existingPaydownAmount', e.target.value)} disabled={disabled} className="h-8 text-sm text-right" inputMode="decimal" placeholder="0.00" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="existingPayoff"
              checked={lien.existingPayoff === 'true'}
              onCheckedChange={(checked) => onChange('existingPayoff', checked ? 'true' : 'false')}
              disabled={disabled}
            />
            <Label htmlFor="existingPayoff" className="text-sm text-foreground">Existing - Payoff</Label>
          </div>
          <div>
            <Label className="text-sm text-foreground">Payoff Amount</Label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm text-muted-foreground">$</span>
              <Input value={lien.existingPayoffAmount} onChange={(e) => onChange('existingPayoffAmount', e.target.value)} disabled={disabled} className="h-8 text-sm text-right" inputMode="decimal" placeholder="0.00" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="seniorLienTracking"
              checked={lien.seniorLienTracking === 'true'}
              onCheckedChange={(checked) => onChange('seniorLienTracking', checked ? 'true' : 'false')}
              disabled={disabled}
            />
            <Label htmlFor="seniorLienTracking" className="text-sm text-foreground">Senior Lien Tracking</Label>
          </div>

          <div>
        </div>
          <div>
            <Label className="text-sm text-foreground">Last Verified</Label>
            <Input type="date" value={lien.lastVerified} onChange={(e) => onChange('lastVerified', e.target.value)} disabled={disabled} className="h-8 text-sm mt-1" />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Property liens are used to track existing encumbrances on the property.
        </p>
      </div>
    </div>
  );
};

export default LienDetailForm;
