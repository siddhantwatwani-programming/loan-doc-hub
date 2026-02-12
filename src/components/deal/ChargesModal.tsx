import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { ChargeData } from './ChargesTableView';

interface ChargesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  charge?: ChargeData | null;
  onSave: (charge: ChargeData) => void;
  isEdit?: boolean;
}

const generateChargeId = () => `charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getEmptyCharge = (): ChargeData => ({
  id: generateChargeId(), description: '', unpaidBalance: '', owedTo: '', owedFrom: '', totalDue: '',
  interestFrom: '', dateOfCharge: '', interestRate: '', notes: '', reference: '', chargeType: '',
  deferred: '', originalAmount: '', account: '', borrowerFullName: '', advancedByAccount: '',
  advancedByLenderName: '', advancedByAmount: '', onBehalfOfAccount: '', onBehalfOfLenderName: '',
  onBehalfOfAmount: '', amountOwedByBorrower: '', accruedInterest: '', distributeBetweenAllLenders: '',
});

export const ChargesModal: React.FC<ChargesModalProps> = ({ open, onOpenChange, charge, onSave, isEdit = false }) => {
  const [formData, setFormData] = useState<ChargeData>(getEmptyCharge());

  useEffect(() => {
    if (open) setFormData(charge ? charge : getEmptyCharge());
  }, [open, charge]);

  const handleFieldChange = (field: keyof ChargeData, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleSave = () => { onSave(formData); onOpenChange(false); };

  const renderInlineField = (field: keyof ChargeData, label: string, type = 'text') => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs font-semibold text-foreground">{label}</Label>
      <Input value={formData[field]} onChange={(e) => handleFieldChange(field, e.target.value)} className="h-7 text-xs flex-1" type={type} />
    </div>
  );

  const renderCurrencyField = (field: keyof ChargeData, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs font-semibold text-foreground">{label}</Label>
      <div className="relative flex-1">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <Input type="number" step="0.01" value={formData[field]} onChange={(e) => handleFieldChange(field, e.target.value)} className="h-7 text-xs pl-5" placeholder="0.00" />
      </div>
    </div>
  );

  const renderPercentageField = (field: keyof ChargeData, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-[110px] shrink-0 text-xs font-semibold text-foreground">{label}</Label>
      <div className="relative flex-1">
        <Input type="number" step="0.01" value={formData[field]} onChange={(e) => handleFieldChange(field, e.target.value)} className="h-7 text-xs pr-5" placeholder="0.00" />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-primary" />
            {isEdit ? 'Edit Charge' : 'New Charge'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* Loan Information */}
          <div>
            <div className="bg-primary/10 border border-primary/20 rounded px-2 py-1 mb-2">
              <span className="font-semibold text-xs text-primary">Loan Information</span>
            </div>
            <div className="space-y-1.5 px-1">
              {renderInlineField('account', 'Account')}
              {renderInlineField('borrowerFullName', 'Borrower Name')}
            </div>
          </div>

          {/* Charge Information */}
          <div>
            <div className="bg-primary/10 border border-primary/20 rounded px-2 py-1 mb-2">
              <span className="font-semibold text-xs text-primary">Charge Information</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-1">
              {renderInlineField('dateOfCharge', 'Date of Charge', 'date')}
              {renderInlineField('interestFrom', 'Interest From', 'date')}
              {renderInlineField('reference', 'Reference')}
              {renderInlineField('chargeType', 'Charge Type')}
              {renderCurrencyField('originalAmount', 'Original Amount')}
              {renderInlineField('description', 'Description')}
              {renderPercentageField('interestRate', 'Interest Rate')}
              {renderInlineField('owedTo', 'Owed To')}
              {renderInlineField('owedFrom', 'Owed From')}
              {renderCurrencyField('unpaidBalance', 'Unpaid Balance')}
              {renderCurrencyField('totalDue', 'Total Due')}
              <div className="flex items-center gap-2">
                <Label className="w-[110px] shrink-0 text-xs font-semibold text-foreground">Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => handleFieldChange('notes', e.target.value)} className="text-xs min-h-[40px] flex-1" />
              </div>
            </div>
            <div className="flex items-center gap-2 px-1 pt-1.5">
              <Checkbox id="deferred" checked={formData.deferred === 'true'} onCheckedChange={(checked) => handleFieldChange('deferred', checked ? 'true' : 'false')} className="h-3.5 w-3.5" />
              <Label htmlFor="deferred" className="text-xs font-semibold text-foreground cursor-pointer">Deferred</Label>
            </div>
          </div>

          {/* Distribution */}
          <div>
            <div className="bg-primary/10 border border-primary/20 rounded px-2 py-1 mb-2">
              <span className="font-semibold text-xs text-primary">Distribution</span>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] bg-muted/50 border-b border-border">
                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground"></div>
                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">ACCOUNT</div>
                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">LENDER NAME</div>
                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground">AMOUNT</div>
              </div>
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] border-b border-border items-center">
                <div className="px-2 py-1 text-xs font-medium text-foreground">Advanced By</div>
                <div className="px-1.5 py-1"><Input value={formData.advancedByAccount} onChange={(e) => handleFieldChange('advancedByAccount', e.target.value)} className="h-6 text-xs" /></div>
                <div className="px-1.5 py-1"><Input value={formData.advancedByLenderName} onChange={(e) => handleFieldChange('advancedByLenderName', e.target.value)} className="h-6 text-xs" /></div>
                <div className="px-1.5 py-1"><div className="relative"><span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span><Input type="number" step="0.01" value={formData.advancedByAmount} onChange={(e) => handleFieldChange('advancedByAmount', e.target.value)} className="h-6 text-xs pl-4" placeholder="0.00" /></div></div>
              </div>
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] border-b border-border items-center">
                <div className="px-2 py-1 text-xs font-medium text-foreground">On Behalf Of</div>
                <div className="px-1.5 py-1"><Input value={formData.onBehalfOfAccount} onChange={(e) => handleFieldChange('onBehalfOfAccount', e.target.value)} className="h-6 text-xs" /></div>
                <div className="px-1.5 py-1"><Input value={formData.onBehalfOfLenderName} onChange={(e) => handleFieldChange('onBehalfOfLenderName', e.target.value)} className="h-6 text-xs" /></div>
                <div className="px-1.5 py-1"><div className="relative"><span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span><Input type="number" step="0.01" value={formData.onBehalfOfAmount} onChange={(e) => handleFieldChange('onBehalfOfAmount', e.target.value)} className="h-6 text-xs pl-4" placeholder="0.00" /></div></div>
              </div>
              <div className="grid grid-cols-[120px_1fr_1fr_1fr] items-center">
                <div className="px-2 py-1 flex items-center gap-1">
                  <Checkbox id="distributeAll" checked={formData.distributeBetweenAllLenders === 'true'} onCheckedChange={(checked) => handleFieldChange('distributeBetweenAllLenders', checked ? 'true' : 'false')} className="h-3 w-3" />
                  <Label htmlFor="distributeAll" className="text-[10px] font-medium text-foreground cursor-pointer whitespace-nowrap">Distribute All</Label>
                </div>
                <div className="px-2 py-1 text-xs font-medium text-foreground col-span-2 text-right pr-3">Amt Owed by Borrower:</div>
                <div className="px-1.5 py-1"><div className="relative"><span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span><Input type="number" step="0.01" value={formData.amountOwedByBorrower} onChange={(e) => handleFieldChange('amountOwedByBorrower', e.target.value)} className="h-6 text-xs pl-4" placeholder="0.00" /></div></div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChargesModal;
