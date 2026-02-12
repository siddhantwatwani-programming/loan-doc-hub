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
  const renderField = (field: keyof LienData, label: string, props: Record<string, any> = {}) => (
    <div className="flex items-center gap-3">
      <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">{label}</Label>
      <Input value={lien[field]} onChange={(e) => onChange(field, e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" {...props} />
    </div>
  );

  const renderCurrency = (field: keyof LienData, label: string) => (
    <div className="flex items-center gap-3">
      <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">{label}</Label>
      <div className="flex items-center gap-1 flex-1">
        <span className="text-sm text-muted-foreground">$</span>
        <Input value={lien[field]} onChange={(e) => onChange(field, e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.00" />
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">General</span>
      </div>

      <div className="space-y-3">
        <div className="border-b border-border pb-2">
          <span className="font-semibold text-sm text-primary">Property Lien Information</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          {renderField('property', 'Related Property', { placeholder: 'Enter property' })}
          {renderField('lienPriorityNow', 'Priority Now', { placeholder: 'Enter priority' })}
          {renderField('holder', 'Lien Holder')}
          {renderField('lienPriorityAfter', 'Priority After', { placeholder: 'Enter priority' })}
          {renderField('account', 'Account Number')}
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Interest Rate</Label>
            <div className="flex items-center gap-1 flex-1">
              <Input value={lien.interestRate} onChange={(e) => onChange('interestRate', e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.000" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
          {renderField('phone', 'Phone')}
          {renderField('maturityDate', 'Maturity Date', { type: 'date' })}
          {renderField('fax', 'Fax')}
          {renderCurrency('originalBalance', 'Original Balance')}
          {renderField('email', 'Email')}
          {renderCurrency('balanceAfter', 'Balance After')}
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Loan Type</Label>
            <Select value={lien.loanType} onValueChange={(val) => onChange('loanType', val)} disabled={disabled}>
              <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {LOAN_TYPE_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          {renderCurrency('regularPayment', 'Regular Payment')}
        </div>

        {/* Checkbox rows + right-side fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-2">
          <div className="flex items-center gap-2">
            <Checkbox id="anticipated" checked={lien.anticipated === 'true'} onCheckedChange={(checked) => onChange('anticipated', checked ? 'true' : 'false')} disabled={disabled} />
            <Label htmlFor="anticipated" className="text-sm text-foreground">Anticipated</Label>
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Recording #</Label>
            <div className="flex items-center gap-2 flex-1">
              <Input value={lien.recordingNumber} onChange={(e) => onChange('recordingNumber', e.target.value)} disabled={disabled} className="h-7 text-sm flex-1" />
              <Checkbox id="recordingNumberFlag" checked={lien.recordingNumberFlag === 'true'} onCheckedChange={(checked) => onChange('recordingNumberFlag', checked ? 'true' : 'false')} disabled={disabled} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="existingRemain" checked={lien.existingRemain === 'true'} onCheckedChange={(checked) => onChange('existingRemain', checked ? 'true' : 'false')} disabled={disabled} />
            <Label htmlFor="existingRemain" className="text-sm text-foreground">Existing - Remain</Label>
          </div>
          {renderField('recordingDate', 'Recording Date', { type: 'date' })}

          <div>
            <div className="flex items-center gap-2">
              <Checkbox id="existingPaydown" checked={lien.existingPaydown === 'true'} onCheckedChange={(checked) => onChange('existingPaydown', checked ? 'true' : 'false')} disabled={disabled} />
              <Label htmlFor="existingPaydown" className="text-sm text-foreground">Existing - Paydown</Label>
            </div>
            <div className="flex items-center gap-1 mt-1 pl-6">
              <span className="text-sm text-muted-foreground">$</span>
              <Input value={lien.existingPaydownAmount} onChange={(e) => onChange('existingPaydownAmount', e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.00" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="seniorLienTracking" checked={lien.seniorLienTracking === 'true'} onCheckedChange={(checked) => onChange('seniorLienTracking', checked ? 'true' : 'false')} disabled={disabled} />
            <Label htmlFor="seniorLienTracking" className="text-sm text-foreground">Senior Lien Tracking</Label>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Checkbox id="existingPayoff" checked={lien.existingPayoff === 'true'} onCheckedChange={(checked) => onChange('existingPayoff', checked ? 'true' : 'false')} disabled={disabled} />
              <Label htmlFor="existingPayoff" className="text-sm text-foreground">Existing - Payoff</Label>
            </div>
            <div className="flex items-center gap-1 mt-1 pl-6">
              <span className="text-sm text-muted-foreground">$</span>
              <Input value={lien.existingPayoffAmount} onChange={(e) => onChange('existingPayoffAmount', e.target.value)} disabled={disabled} className="h-7 text-sm text-right" inputMode="decimal" placeholder="0.00" />
            </div>
          </div>
          {renderField('lastVerified', 'Last Verified', { type: 'date' })}
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Property liens are used to track existing encumbrances on the property.
        </p>
      </div>
    </div>
  );
};

export default LienDetailForm;
