import React, { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ChargeData } from './ChargesTableView';

interface ChargesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  charge?: ChargeData | null;
  onSave: (charge: ChargeData) => void;
  isEdit?: boolean;
}

const CHARGE_TYPE_OPTIONS = [
  'Account Close Out',
  'Account Maintenance',
  'Administrative Services',
  'Beneficiary Origination',
  'Beneficiary Wire',
  'Demand Fee',
  'Extension / Modification Doc Prep',
  'Foreclosure Processing Fees - Trustee\'s Fees',
  'Holdback',
  'Modification Doc Prep',
  'New Account Setup',
  'NSF Charge',
  'Online Payment Fee',
  'Origination Doc Prep',
  'Pay By Phone',
  'Professional Services',
  'Setup Fee',
  'SO110-Servicing Fee',
  'Wire Processing',
];

const generateChargeId = () => `charge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getEmptyCharge = (): ChargeData => ({
  id: generateChargeId(),
  description: '',
  unpaidBalance: '',
  owedTo: '',
  owedFrom: '',
  totalDue: '',
  interestFrom: '',
  dateOfCharge: '',
  interestRate: '',
  notes: '',
  reference: '',
  chargeType: '',
  deferred: '',
  originalAmount: '',
  account: '',
  borrowerFullName: '',
  advancedByAccount: '',
  advancedByLenderName: '',
  advancedByAmount: '',
  onBehalfOfAccount: '',
  onBehalfOfLenderName: '',
  onBehalfOfAmount: '',
  amountOwedByBorrower: '',
});

export const ChargesModal: React.FC<ChargesModalProps> = ({
  open,
  onOpenChange,
  charge,
  onSave,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState<ChargeData>(getEmptyCharge());

  useEffect(() => {
    if (open) {
      if (charge) {
        setFormData(charge);
      } else {
        setFormData(getEmptyCharge());
      }
    }
  }, [open, charge]);

  const handleFieldChange = (field: keyof ChargeData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit Charge' : 'Add New Charge'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* === Loan Information Section === */}
          <div>
            <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
              <span className="font-semibold text-sm text-primary">Loan Information</span>
            </div>
            <div className="space-y-3 px-1">
              <div>
                <Label className="text-sm font-semibold text-foreground">Account</Label>
                <Input
                  value={formData.account}
                  onChange={(e) => handleFieldChange('account', e.target.value)}
                  className="h-8 text-sm mt-1"
                  placeholder="Enter account"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-foreground">Borrower Full Name</Label>
                <Input
                  value={formData.borrowerFullName}
                  onChange={(e) => handleFieldChange('borrowerFullName', e.target.value)}
                  className="h-8 text-sm mt-1"
                  placeholder="Enter borrower full name"
                />
              </div>
            </div>
          </div>

          {/* === Charge Information Section === */}
          <div>
            <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
              <span className="font-semibold text-sm text-primary">Charge Information</span>
            </div>
            <div className="space-y-3 px-1">
              {/* Row 1: Date of Charge | Interest From */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-foreground">Date of Charge</Label>
                  <Input
                    type="date"
                    value={formData.dateOfCharge}
                    onChange={(e) => handleFieldChange('dateOfCharge', e.target.value)}
                    className="h-8 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">Interest From</Label>
                  <Input
                    type="date"
                    value={formData.interestFrom}
                    onChange={(e) => handleFieldChange('interestFrom', e.target.value)}
                    className="h-8 text-sm mt-1"
                  />
                </div>
              </div>

              {/* Row 2: Reference | Charge Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-foreground">Reference</Label>
                  <Input
                    value={formData.reference}
                    onChange={(e) => handleFieldChange('reference', e.target.value)}
                    className="h-8 text-sm mt-1"
                    placeholder="Enter reference"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">Charge Type</Label>
                  <Select
                    value={formData.chargeType}
                    onValueChange={(value) => handleFieldChange('chargeType', value)}
                  >
                    <SelectTrigger className="h-8 text-sm mt-1 bg-background">
                      <SelectValue placeholder="Select charge type" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {CHARGE_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Original Amount | Description */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-foreground">Original Amount</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.originalAmount}
                      onChange={(e) => handleFieldChange('originalAmount', e.target.value)}
                      className="h-8 text-sm pl-6"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    className="h-8 text-sm mt-1"
                    placeholder="Enter description"
                  />
                </div>
              </div>

              {/* Row 4: Interest Rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-foreground">Interest Rate</Label>
                  <div className="relative mt-1">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.interestRate}
                      onChange={(e) => handleFieldChange('interestRate', e.target.value)}
                      className="h-8 text-sm pr-6"
                      placeholder="0.00"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>

              {/* Row 5: Unpaid Balance | Owed To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-foreground">Unpaid Balance</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.unpaidBalance}
                      onChange={(e) => handleFieldChange('unpaidBalance', e.target.value)}
                      className="h-8 text-sm pl-6"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">Owed To</Label>
                  <Input
                    value={formData.owedTo}
                    onChange={(e) => handleFieldChange('owedTo', e.target.value)}
                    className="h-8 text-sm mt-1"
                    placeholder="Enter owed to"
                  />
                </div>
              </div>

              {/* Row 6: Owed From | Total Due */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-foreground">Owed From</Label>
                  <Input
                    value={formData.owedFrom}
                    onChange={(e) => handleFieldChange('owedFrom', e.target.value)}
                    className="h-8 text-sm mt-1"
                    placeholder="Enter owed from"
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-foreground">Total Due</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.totalDue}
                      onChange={(e) => handleFieldChange('totalDue', e.target.value)}
                      className="h-8 text-sm pl-6"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Row 7: Notes */}
              <div>
                <Label className="text-sm font-semibold text-foreground">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="text-sm mt-1 min-h-[60px]"
                  placeholder="Enter notes"
                />
              </div>

              {/* Row 8: Deferred checkbox */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="deferred"
                  checked={formData.deferred === 'true'}
                  onCheckedChange={(checked) => handleFieldChange('deferred', checked ? 'true' : 'false')}
                />
                <Label htmlFor="deferred" className="text-sm font-semibold text-foreground cursor-pointer">
                  Deferred
                </Label>
              </div>
            </div>
          </div>

          {/* === Distribution Section === */}
          <div>
            <div className="bg-primary/10 border border-primary/20 rounded px-3 py-1.5 mb-3">
              <span className="font-semibold text-sm text-primary">Distribution</span>
            </div>
            <div className="px-1">
              {/* Distribution table-like grid */}
              <div className="border border-border rounded-lg overflow-hidden">
                {/* Header row */}
                <div className="grid grid-cols-[140px_1fr_1fr_1fr] bg-muted/50 border-b border-border">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground"></div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">ACCOUNT</div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">LENDER NAME</div>
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">AMOUNT</div>
                </div>

                {/* Advanced By row */}
                <div className="grid grid-cols-[140px_1fr_1fr_1fr] border-b border-border items-center">
                  <div className="px-3 py-2 text-sm font-medium text-foreground">Advanced By</div>
                  <div className="px-2 py-1.5">
                    <Input
                      value={formData.advancedByAccount}
                      onChange={(e) => handleFieldChange('advancedByAccount', e.target.value)}
                      className="h-7 text-sm"
                      placeholder=""
                    />
                  </div>
                  <div className="px-2 py-1.5">
                    <Input
                      value={formData.advancedByLenderName}
                      onChange={(e) => handleFieldChange('advancedByLenderName', e.target.value)}
                      className="h-7 text-sm"
                      placeholder=""
                    />
                  </div>
                  <div className="px-2 py-1.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.advancedByAmount}
                        onChange={(e) => handleFieldChange('advancedByAmount', e.target.value)}
                        className="h-7 text-sm pl-6"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* On Behalf Of row */}
                <div className="grid grid-cols-[140px_1fr_1fr_1fr] border-b border-border items-center">
                  <div className="px-3 py-2 text-sm font-medium text-foreground">On Behalf Of</div>
                  <div className="px-2 py-1.5">
                    <Input
                      value={formData.onBehalfOfAccount}
                      onChange={(e) => handleFieldChange('onBehalfOfAccount', e.target.value)}
                      className="h-7 text-sm"
                      placeholder=""
                    />
                  </div>
                  <div className="px-2 py-1.5">
                    <Input
                      value={formData.onBehalfOfLenderName}
                      onChange={(e) => handleFieldChange('onBehalfOfLenderName', e.target.value)}
                      className="h-7 text-sm"
                      placeholder=""
                    />
                  </div>
                  <div className="px-2 py-1.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.onBehalfOfAmount}
                        onChange={(e) => handleFieldChange('onBehalfOfAmount', e.target.value)}
                        className="h-7 text-sm pl-6"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Amount Owed by Borrower row */}
                <div className="grid grid-cols-[140px_1fr_1fr_1fr] items-center">
                  <div className="px-3 py-2 text-sm font-medium text-foreground col-span-3 text-right pr-4">
                    Amount Owed by Borrower:
                  </div>
                  <div className="px-2 py-1.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.amountOwedByBorrower}
                        onChange={(e) => handleFieldChange('amountOwedByBorrower', e.target.value)}
                        className="h-7 text-sm pl-6"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChargesModal;
