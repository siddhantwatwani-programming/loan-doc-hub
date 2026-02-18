import React, { useState, useEffect } from 'react';
import { Home } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { LienData } from './LiensTableView';

interface LienModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lien: LienData | null;
  onSave: (lien: LienData) => void;
  isEdit: boolean;
  propertyOptions?: { id: string; label: string }[];
}

const LOAN_TYPE_OPTIONS = ['Conventional', 'Private Lender', 'Judgement', 'Other'];
const STATUS_OPTIONS = ['Current', 'Unable to Verify', '30-90', '90+', 'Foreclosure', 'Modification', 'Paid'];

const getDefaultLien = (): LienData => ({
  id: '', property: '', priority: '1st', holder: '', account: '', contact: '', phone: '', fax: '', email: '',
  loanType: '', anticipated: 'false', existingRemain: 'false', existingPaydown: 'false', existingPayoff: 'false',
  existingPaydownAmount: '', existingPayoffAmount: '', lienPriorityNow: '', lienPriorityAfter: '', interestRate: '',
  maturityDate: '', originalBalance: '', balanceAfter: '', currentBalance: '', regularPayment: '',
  recordingNumber: '', recordingNumberFlag: 'false', recordingDate: '', seniorLienTracking: 'false',
  lastVerified: '', lastChecked: '', note: '', thisLoan: 'false', estimate: 'false', status: '',
});

export const LienModal: React.FC<LienModalProps> = ({ open, onOpenChange, lien, onSave, isEdit, propertyOptions = [] }) => {
  const [formData, setFormData] = useState<LienData>(getDefaultLien());

  useEffect(() => {
    if (open) setFormData(lien ? lien : getDefaultLien());
  }, [open, lien]);

  const handleChange = (field: keyof LienData, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSave = () => { onSave(formData); onOpenChange(false); };

  const isThisLoan = formData.thisLoan === 'true';

  const renderInlineField = (field: keyof LienData, label: string, type = 'text', forceDisabled = false) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
      <Input value={formData[field]} onChange={(e) => handleChange(field, e.target.value)} className={`h-7 text-xs flex-1 ${forceDisabled ? 'opacity-50 bg-muted' : ''}`} type={type} disabled={forceDisabled} />
    </div>
  );

  const renderCurrencyField = (field: keyof LienData, label: string, forceDisabled = false) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
      <div className="flex items-center gap-1 flex-1">
        <span className="text-xs text-muted-foreground">$</span>
        <Input value={formData[field]} onChange={(e) => handleChange(field, e.target.value)} className={`h-7 text-xs text-right ${forceDisabled ? 'opacity-50 bg-muted' : ''}`} inputMode="decimal" placeholder="0.00" disabled={forceDisabled} />
      </div>
    </div>
  );

  const renderPercentageField = (field: keyof LienData, label: string, forceDisabled = false) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
      <div className="flex items-center gap-1 flex-1">
        <Input value={formData[field]} onChange={(e) => handleChange(field, e.target.value)} className={`h-7 text-xs text-right ${forceDisabled ? 'opacity-50 bg-muted' : ''}`} inputMode="decimal" placeholder="0.000" disabled={forceDisabled} />
        <span className="text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Home className="h-4 w-4 text-primary" />
            {isEdit ? 'Edit Property Lien' : 'New Property Lien'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-3 overflow-y-auto flex-1">
          <div className="border-b border-border pb-1">
            <span className="font-semibold text-xs text-primary">Property Lien Information</span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {renderInlineField('property', 'Related Property')}
            {renderInlineField('lienPriorityNow', 'Lien Priority Now')}

            <div className="flex items-center gap-2">
              <Checkbox id="modal-thisLoan" checked={isThisLoan} onCheckedChange={(c) => handleChange('thisLoan', c ? 'true' : 'false')} className="h-3.5 w-3.5" />
              <Label htmlFor="modal-thisLoan" className="text-xs text-foreground">This Loan</Label>
            </div>
            {renderInlineField('lienPriorityAfter', 'Lien Priority After')}

            {renderInlineField('holder', 'Lien Holder', 'text', isThisLoan)}
            {renderPercentageField('interestRate', 'Interest Rate', isThisLoan)}
            {renderInlineField('account', 'Account Number', 'text', isThisLoan)}
            {renderInlineField('maturityDate', 'Maturity Date', 'date', isThisLoan)}
            {renderInlineField('phone', 'Phone', 'text', isThisLoan)}
            {renderCurrencyField('originalBalance', 'Original Balance', isThisLoan)}
            {renderInlineField('fax', 'Fax', 'text', isThisLoan)}
            {renderCurrencyField('balanceAfter', 'Balance After', isThisLoan)}
            {renderInlineField('email', 'Email', 'text', isThisLoan)}
            {renderCurrencyField('regularPayment', 'Regular Payment', isThisLoan)}
            <div className="flex items-center gap-2">
              <Label className="w-[110px] shrink-0 text-xs text-foreground">Loan Type</Label>
              <Select value={formData.loanType} onValueChange={(val) => handleChange('loanType', val)} disabled={isThisLoan}>
                <SelectTrigger className={`h-7 text-xs flex-1 ${isThisLoan ? 'opacity-50 bg-muted' : ''}`}><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {LOAN_TYPE_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div /> {/* spacer */}
          </div>

          {/* Checkboxes + remaining */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
            <div className="flex items-center gap-2">
              <Checkbox id="modal-anticipated" checked={formData.anticipated === 'true'} onCheckedChange={(c) => handleChange('anticipated', c ? 'true' : 'false')} className="h-3.5 w-3.5" />
              <Label htmlFor="modal-anticipated" className="text-xs text-foreground">Anticipated</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-[110px] shrink-0 text-xs text-foreground">Recording Number</Label>
              <div className="flex items-center gap-1 flex-1">
                <Input value={formData.recordingNumber} onChange={(e) => handleChange('recordingNumber', e.target.value)} className="h-7 text-xs" />
                <Checkbox id="modal-recFlag" checked={formData.recordingNumberFlag === 'true'} onCheckedChange={(c) => handleChange('recordingNumberFlag', c ? 'true' : 'false')} className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="modal-existingRemain" checked={formData.existingRemain === 'true'} onCheckedChange={(c) => handleChange('existingRemain', c ? 'true' : 'false')} className="h-3.5 w-3.5" />
              <Label htmlFor="modal-existingRemain" className="text-xs text-foreground">Existing - Remain</Label>
            </div>
            {renderInlineField('recordingDate', 'Recording Date', 'date')}

            <div>
              <div className="flex items-center gap-2">
                <Checkbox id="modal-existingPaydown" checked={formData.existingPaydown === 'true'} onCheckedChange={(c) => handleChange('existingPaydown', c ? 'true' : 'false')} className="h-3.5 w-3.5" />
                <Label htmlFor="modal-existingPaydown" className="text-xs text-foreground">Existing - Paydown</Label>
                {formData.existingPaydown === 'true' && (
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-xs text-muted-foreground">$</span>
                    <Input value={formData.existingPaydownAmount} onChange={(e) => handleChange('existingPaydownAmount', e.target.value)} className="h-7 text-xs text-right w-28" inputMode="decimal" placeholder="0.00" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="modal-seniorLien" checked={formData.seniorLienTracking === 'true'} onCheckedChange={(c) => handleChange('seniorLienTracking', c ? 'true' : 'false')} className="h-3.5 w-3.5" />
              <Label htmlFor="modal-seniorLien" className="text-xs text-foreground">Senior Lien Tracking</Label>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Checkbox id="modal-existingPayoff" checked={formData.existingPayoff === 'true'} onCheckedChange={(c) => handleChange('existingPayoff', c ? 'true' : 'false')} className="h-3.5 w-3.5" />
                <Label htmlFor="modal-existingPayoff" className="text-xs text-foreground">Existing - Payoff</Label>
                {formData.existingPayoff === 'true' && (
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-xs text-muted-foreground">$</span>
                    <Input value={formData.existingPayoffAmount} onChange={(e) => handleChange('existingPayoffAmount', e.target.value)} className="h-7 text-xs text-right w-28" inputMode="decimal" placeholder="0.00" />
                  </div>
                )}
                {formData.existingPayoff === 'true' && (
                  <div className="flex items-center gap-2 ml-2">
                    <Checkbox id="modal-estimate" checked={formData.estimate === 'true'} onCheckedChange={(c) => handleChange('estimate', c ? 'true' : 'false')} className="h-3.5 w-3.5" />
                    <Label htmlFor="modal-estimate" className="text-xs text-foreground">Estimate</Label>
                  </div>
                )}
              </div>
            </div>
            {formData.seniorLienTracking === 'true' ? (
              <div className="space-y-1.5">
                {renderInlineField('lastVerified', 'Last Verified', 'date')}
                <div className="flex items-center gap-2">
                  <Label className="w-[110px] shrink-0 text-xs text-foreground">Status</Label>
                  <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent className="bg-background border border-border z-50">
                      {STATUS_OPTIONS.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div>{renderInlineField('lastVerified', 'Last Verified', 'date')}</div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>OK</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LienModal;