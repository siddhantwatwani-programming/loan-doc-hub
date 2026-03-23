import React, { useState, useEffect, useCallback } from 'react';
import { Home } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmailInput } from '@/components/ui/email-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ModalSaveConfirmation } from './ModalSaveConfirmation';
import { hasModalFormData } from '@/lib/modalFormValidation';
import type { LienData } from './LiensTableView';
import { sanitizeInterestInput, normalizeInterestOnBlur } from '@/lib/interestValidation';

interface LienModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lien: LienData | null;
  onSave: (lien: LienData) => void;
  isEdit: boolean;
  propertyOptions?: { id: string; label: string }[];
  loanValues?: Record<string, string>;
}

const LOAN_TYPE_OPTIONS = ['Conventional', 'Private Lender', 'Judgement', 'Other'];
const STATUS_OPTIONS = ['Current', 'Unable to Verify', '30-90', '90+', 'Foreclosure', 'Modification', 'Paid'];

const getThisLoanAutofillValues = (loanValues: Record<string, string>) => ({
  account: loanValues['Terms.LoanNumber'] || loanValues['loan_terms.loan_number'] || '',
  balanceAfter: loanValues['loan_terms.loan_amount'] || '',
  regularPayment: loanValues['loan_terms.regular_payment'] || '',
});

const getDefaultLien = (): LienData => ({
  id: '', property: '', priority: '1st', holder: '', account: '', contact: '', phone: '', fax: '', email: '',
  loanType: '', anticipated: 'false', existingRemain: 'false', existingPaydown: 'false', existingPayoff: 'false',
  existingPaydownAmount: '', existingPayoffAmount: '', lienPriorityNow: '', lienPriorityAfter: '', interestRate: '',
  maturityDate: '', originalBalance: '', balanceAfter: '', currentBalance: '', regularPayment: '',
  recordingNumber: '', recordingNumberFlag: 'false', recordingDate: '', seniorLienTracking: 'false',
  lastVerified: '', lastChecked: '', note: '', thisLoan: 'false', estimate: 'false', status: '',
});

export const LienModal: React.FC<LienModalProps> = ({ open, onOpenChange, lien, onSave, isEdit, propertyOptions = [], loanValues = {} }) => {
  const [formData, setFormData] = useState<LienData>(getDefaultLien());
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (open) setFormData(lien ? lien : getDefaultLien());
  }, [open, lien]);

  const handleChange = (field: keyof LienData, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const isFormFilled = hasModalFormData(formData, ['id', 'priority'], { anticipated: 'false', existingRemain: 'false', existingPaydown: 'false', existingPayoff: 'false', thisLoan: 'false', estimate: 'false', recordingNumberFlag: 'false', seniorLienTracking: 'false' });

  const handleSaveClick = () => setShowConfirm(true);
  const handleConfirmSave = () => { setShowConfirm(false); onSave(formData); onOpenChange(false); };

  const isThisLoan = formData.thisLoan === 'true';
  const isAnticipated = formData.anticipated === 'true';
  const isPayoff = formData.existingPayoff === 'true';
  const isPaydown = formData.existingPaydown === 'true';

  const handleLienTypeSelect = useCallback((type: 'anticipated' | 'existingRemain' | 'existingPaydown' | 'existingPayoff', checked: boolean) => {
    setFormData(prev => {
      const next = {
        ...prev,
        anticipated: 'false',
        existingRemain: 'false',
        existingPaydown: 'false',
        existingPayoff: 'false',
      };
      if (checked) {
        next[type] = 'true';
        if (type === 'existingPayoff') next.balanceAfter = '0.00';
        if (type === 'anticipated') { next.originalBalance = ''; next.currentBalance = ''; }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!open || !isThisLoan) return;
    const { account, balanceAfter, regularPayment } = getThisLoanAutofillValues(loanValues);
    setFormData(prev => {
      if (prev.account === account && prev.balanceAfter === balanceAfter && prev.regularPayment === regularPayment) {
        return prev;
      }
      return { ...prev, account, balanceAfter, regularPayment };
    });
  }, [open, isThisLoan, loanValues]);

  const handleThisLoanToggle = (checked: boolean) => {
    if (checked) {
      const { account, balanceAfter, regularPayment } = getThisLoanAutofillValues(loanValues);
      setFormData(prev => ({
        ...prev,
        thisLoan: 'true',
        account,
        balanceAfter,
        regularPayment,
      }));
      return;
    }

    setFormData(prev => ({ ...prev, thisLoan: 'false' }));
  };

  const renderInlineField = (field: keyof LienData, label: string, type = 'text', forceDisabled = false) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
      <Input value={formData[field]} onChange={(e) => handleChange(field, e.target.value)} className={`h-7 text-xs flex-1 ${forceDisabled ? 'opacity-50 bg-muted' : ''}`} type={type} disabled={forceDisabled} />
    </div>
  );

  const renderCurrencyField = (field: keyof LienData, label: string, forceDisabled = false) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
        <Input value={formData[field]} onChange={(e) => handleChange(field, e.target.value)} className={`h-7 text-xs pl-7 ${forceDisabled ? 'opacity-50 bg-muted' : ''}`} inputMode="decimal" placeholder="0.00" disabled={forceDisabled} />
      </div>
    </div>
  );

  const renderPercentageField = (field: keyof LienData, label: string, forceDisabled = false) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs text-foreground">{label}</Label>
      <div className="relative flex-1">
        <Input value={formData[field]} onChange={(e) => handleChange(field, sanitizeInterestInput(e.target.value))} onBlur={() => { const v = normalizeInterestOnBlur(formData[field], 3); if (v !== formData[field]) handleChange(field, v); }} className={`h-7 text-xs text-right pr-6 ${forceDisabled ? 'opacity-50 bg-muted' : ''}`} inputMode="decimal" placeholder="0.000" disabled={forceDisabled} />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Home className="h-4 w-4 text-primary" />
              {isEdit ? 'Edit Property Lien' : 'New Property Lien'}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 sleek-scrollbar space-y-3 mt-3">
            <div className="border-b border-border pb-1">
              <span className="font-semibold text-xs text-primary">Property Lien Information</span>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="w-[110px] shrink-0 text-xs text-foreground">Related Property</Label>
                 <Select value={formData.property || undefined} onValueChange={(val) => handleChange('property', val)}>
                   <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select property" /></SelectTrigger>
                   <SelectContent className="bg-background border border-border z-[200]">
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {propertyOptions.map(opt => (
                      <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {renderInlineField('lienPriorityNow', 'Lien Priority Now')}

              <div className="flex items-center gap-2">
                <Checkbox id="modal-thisLoan" checked={isThisLoan} onCheckedChange={(c) => handleThisLoanToggle(!!c)} className="h-3.5 w-3.5" />
                <Label htmlFor="modal-thisLoan" className="text-xs text-foreground">This Loan</Label>
              </div>
              {renderInlineField('lienPriorityAfter', 'Lien Priority After')}

              {renderInlineField('holder', 'Lien Holder', 'text', isThisLoan)}
              {renderPercentageField('interestRate', 'Interest Rate', isThisLoan)}
              {renderInlineField('account', 'Account Number', 'text', isThisLoan)}
              {renderInlineField('maturityDate', 'Maturity Date', 'date', isThisLoan)}
              {renderInlineField('phone', 'Phone', 'text', isThisLoan)}
              {renderCurrencyField('originalBalance', 'Original Balance', isThisLoan || isAnticipated)}
              {renderInlineField('fax', 'Fax', 'text', isThisLoan)}
              {renderCurrencyField('currentBalance', 'Current Balance', isThisLoan || isAnticipated)}
              <div className="flex items-center gap-2">
                <Label className="w-[110px] shrink-0 text-xs text-foreground">Email</Label>
                <EmailInput value={String(formData.email || '')} onValueChange={(v) => handleChange('email', v)} className="h-7 text-xs" disabled={isThisLoan} />
              </div>
              {renderCurrencyField('balanceAfter', 'Balance After', isThisLoan || isPayoff)}
              {renderInlineField('contact', 'Contact', 'text', isThisLoan)}
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
              <div />
            </div>

            <div className="grid grid-cols-4 gap-x-4 gap-y-1.5 mt-2">
              <div className="flex items-center gap-2">
                <Checkbox id="modal-anticipated" checked={isAnticipated} onCheckedChange={(c) => handleLienTypeSelect('anticipated', !!c)} className="h-3.5 w-3.5" />
                <Label htmlFor="modal-anticipated" className="text-xs text-foreground">Anticipated</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="modal-existingRemain" checked={formData.existingRemain === 'true'} onCheckedChange={(c) => handleLienTypeSelect('existingRemain', !!c)} className="h-3.5 w-3.5" />
                <Label htmlFor="modal-existingRemain" className="text-xs text-foreground">Existing - Remain</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="modal-existingPaydown" checked={isPaydown} onCheckedChange={(c) => handleLienTypeSelect('existingPaydown', !!c)} className="h-3.5 w-3.5" />
                <Label htmlFor="modal-existingPaydown" className="text-xs text-foreground">Existing - Paydown</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="modal-existingPayoff" checked={isPayoff} onCheckedChange={(c) => handleLienTypeSelect('existingPayoff', !!c)} className="h-3.5 w-3.5" />
                <Label htmlFor="modal-existingPayoff" className="text-xs text-foreground">Existing - Payoff</Label>
              </div>
            </div>

            {isPaydown && (
              <div className="flex items-center gap-2 ml-1">
                <Label className="w-[110px] shrink-0 text-xs text-foreground">Paydown Amount</Label>
                <div className="relative flex-1 max-w-[160px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                  <Input value={formData.existingPaydownAmount} onChange={(e) => handleChange('existingPaydownAmount', e.target.value)} className="h-7 text-xs pl-7" inputMode="decimal" placeholder="0.00" />
                </div>
              </div>
            )}
            {isPayoff && (
              <div className="flex items-center gap-4 ml-1">
                <div className="flex items-center gap-2">
                  <Label className="w-[110px] shrink-0 text-xs text-foreground">Payoff Amount</Label>
                  <div className="relative max-w-[160px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                    <Input value={formData.existingPayoffAmount} onChange={(e) => handleChange('existingPayoffAmount', e.target.value)} className="h-7 text-xs pl-7" inputMode="decimal" placeholder="0.00" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="modal-estimate" checked={formData.estimate === 'true'} onCheckedChange={(c) => handleChange('estimate', c ? 'true' : 'false')} className="h-3.5 w-3.5" />
                  <Label htmlFor="modal-estimate" className="text-xs text-foreground">Estimate</Label>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
              <div className="flex items-center gap-2">
                <Label className="w-[110px] shrink-0 text-xs text-foreground">Recording Number</Label>
                <div className="flex items-center gap-1 flex-1">
                  <Input value={formData.recordingNumber} onChange={(e) => handleChange('recordingNumber', e.target.value)} className="h-7 text-xs" />
                  <Checkbox id="modal-recFlag" checked={formData.recordingNumberFlag === 'true'} onCheckedChange={(c) => handleChange('recordingNumberFlag', c ? 'true' : 'false')} className="h-3.5 w-3.5" />
                </div>
              </div>
              {renderInlineField('recordingDate', 'Recording Date', 'date')}

              <div className="flex items-center gap-2">
                <Checkbox id="modal-seniorLien" checked={formData.seniorLienTracking === 'true'} onCheckedChange={(c) => handleChange('seniorLienTracking', c ? 'true' : 'false')} className="h-3.5 w-3.5" />
                <Label htmlFor="modal-seniorLien" className="text-xs text-foreground">Senior Lien Tracking</Label>
              </div>
              <div />
            </div>

            {formData.seniorLienTracking === 'true' && (
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-2">
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
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border shrink-0 mt-0">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSaveClick} disabled={!isFormFilled}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>
      <ModalSaveConfirmation open={showConfirm} onConfirm={handleConfirmSave} onCancel={() => setShowConfirm(false)} />
    </>
  );
};

export default LienModal;
