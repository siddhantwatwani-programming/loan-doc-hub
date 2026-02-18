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
const STATUS_OPTIONS = ['Current', 'Unable to Verify', '30-90', '90+', 'Foreclosure', 'Modification', 'Paid'];

export const LienDetailForm: React.FC<LienDetailFormProps> = ({
  lien,
  onChange,
  disabled = false,
  propertyOptions = [],
}) => {
  const isThisLoan = lien.thisLoan === 'true';

  const renderField = (field: keyof LienData, label: string, props: Record<string, any> = {}, forceDisabled = false) => (
    <div className="flex items-center gap-3">
      <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">{label}</Label>
      <Input value={lien[field]} onChange={(e) => onChange(field, e.target.value)} disabled={disabled || forceDisabled} className={`h-7 text-sm flex-1 ${forceDisabled ? 'opacity-50 bg-muted' : ''}`} {...props} />
    </div>
  );

  const renderCurrency = (field: keyof LienData, label: string, forceDisabled = false) => (
    <div className="flex items-center gap-3">
      <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">{label}</Label>
      <div className="flex items-center gap-1 flex-1">
        <span className="text-sm text-muted-foreground">$</span>
        <Input value={lien[field]} onChange={(e) => onChange(field, e.target.value)} disabled={disabled || forceDisabled} className={`h-7 text-sm text-right ${forceDisabled ? 'opacity-50 bg-muted' : ''}`} inputMode="decimal" placeholder="0.00" />
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

        {/* Related Property + This Loan checkbox */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          {renderField('property', 'Related Property', { placeholder: 'Enter property' })}
          {renderField('lienPriorityNow', 'Lien Priority Now', { placeholder: 'Enter priority' })}

          <div className="flex items-center gap-2">
            <Checkbox id="thisLoan" checked={isThisLoan} onCheckedChange={(checked) => onChange('thisLoan', checked ? 'true' : 'false')} disabled={disabled} />
            <Label htmlFor="thisLoan" className="text-sm text-foreground">This Loan</Label>
          </div>
          {renderField('lienPriorityAfter', 'Lien Priority After', { placeholder: 'Enter priority' })}

          {renderField('holder', 'Lien Holder', {}, isThisLoan)}
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Interest Rate</Label>
            <div className="flex items-center gap-1 flex-1">
              <Input value={lien.interestRate} onChange={(e) => onChange('interestRate', e.target.value)} disabled={disabled || isThisLoan} className={`h-7 text-sm text-right ${isThisLoan ? 'opacity-50 bg-muted' : ''}`} inputMode="decimal" placeholder="0.000" />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          {renderField('account', 'Account Number', {}, isThisLoan)}
          {renderField('maturityDate', 'Maturity Date', { type: 'date' }, isThisLoan)}

          {renderField('phone', 'Phone', {}, isThisLoan)}
          {renderCurrency('originalBalance', 'Original Balance', isThisLoan)}

          {renderField('fax', 'Fax', {}, isThisLoan)}
          {renderCurrency('balanceAfter', 'Balance After', isThisLoan)}

          {renderField('email', 'Email', {}, isThisLoan)}
          {renderCurrency('regularPayment', 'Regular Payment', isThisLoan)}

          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Loan Type</Label>
            <Select value={lien.loanType} onValueChange={(val) => onChange('loanType', val)} disabled={disabled || isThisLoan}>
              <SelectTrigger className={`h-7 text-sm ${isThisLoan ? 'opacity-50 bg-muted' : ''}`}><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {LOAN_TYPE_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div /> {/* spacer */}
        </div>

        {/* Loan type checkboxes + right-side fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-2">
          <div className="flex items-center gap-2">
            <Checkbox id="anticipated" checked={lien.anticipated === 'true'} onCheckedChange={(checked) => onChange('anticipated', checked ? 'true' : 'false')} disabled={disabled} />
            <Label htmlFor="anticipated" className="text-sm text-foreground">Anticipated</Label>
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Recording Number</Label>
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
              {lien.existingPaydown === 'true' && (
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input value={lien.existingPaydownAmount} onChange={(e) => onChange('existingPaydownAmount', e.target.value)} disabled={disabled} className="h-7 text-sm text-right w-32" inputMode="decimal" placeholder="0.00" />
                </div>
              )}
            </div>
          </div>
          {/* Senior Lien Tracking section */}
          <div className="flex items-center gap-2">
            <Checkbox id="seniorLienTracking" checked={lien.seniorLienTracking === 'true'} onCheckedChange={(checked) => onChange('seniorLienTracking', checked ? 'true' : 'false')} disabled={disabled} />
            <Label htmlFor="seniorLienTracking" className="text-sm text-foreground">Senior Lien Tracking</Label>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Checkbox id="existingPayoff" checked={lien.existingPayoff === 'true'} onCheckedChange={(checked) => onChange('existingPayoff', checked ? 'true' : 'false')} disabled={disabled} />
              <Label htmlFor="existingPayoff" className="text-sm text-foreground">Existing - Payoff</Label>
              {lien.existingPayoff === 'true' && (
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input value={lien.existingPayoffAmount} onChange={(e) => onChange('existingPayoffAmount', e.target.value)} disabled={disabled} className="h-7 text-sm text-right w-32" inputMode="decimal" placeholder="0.00" />
                </div>
              )}
              {lien.existingPayoff === 'true' && (
                <div className="flex items-center gap-2 ml-2">
                  <Checkbox id="estimate" checked={lien.estimate === 'true'} onCheckedChange={(checked) => onChange('estimate', checked ? 'true' : 'false')} disabled={disabled} />
                  <Label htmlFor="estimate" className="text-sm text-foreground">Estimate</Label>
                </div>
              )}
            </div>
          </div>
          {/* Last Verified + Status when Senior Lien Tracking is enabled */}
          {lien.seniorLienTracking === 'true' ? (
            <div className="space-y-2">
              {renderField('lastVerified', 'Last Verified', { type: 'date' })}
              <div className="flex items-center gap-3">
                <Label className="text-sm text-muted-foreground min-w-[120px] text-left shrink-0">Status</Label>
                <Select value={lien.status} onValueChange={(val) => onChange('status', val)} disabled={disabled}>
                  <SelectTrigger className="h-7 text-sm"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    {STATUS_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div>{renderField('lastVerified', 'Last Verified', { type: 'date' })}</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default LienDetailForm;