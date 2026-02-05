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
  changeType: '',
  deferred: '',
  originalAmount: '',
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {isEdit ? 'Edit Charge' : 'Add New Charge'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="border-b border-border pb-2">
            <span className="font-semibold text-sm text-primary">Charge Information</span>
          </div>

          {/* Row 1: Unpaid Balance | Owed To */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground">Unpaid Balance</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.unpaidBalance}
                onChange={(e) => handleFieldChange('unpaidBalance', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="0.00"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground">Owed To</Label>
              <Input
                value={formData.owedTo}
                onChange={(e) => handleFieldChange('owedTo', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter owed to"
              />
            </div>
          </div>

          {/* Row 2: Owed From | Total Due */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground">Owed From</Label>
              <Input
                value={formData.owedFrom}
                onChange={(e) => handleFieldChange('owedFrom', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter owed from"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground">Total Due</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.totalDue}
                onChange={(e) => handleFieldChange('totalDue', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Row 3: Date of Charge | Change Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground">Date of Charge</Label>
              <Input
                type="date"
                value={formData.dateOfCharge}
                onChange={(e) => handleFieldChange('dateOfCharge', e.target.value)}
                className="h-8 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground">Change Type</Label>
              <Input
                value={formData.changeType}
                onChange={(e) => handleFieldChange('changeType', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter change type"
              />
            </div>
          </div>

          {/* Row 4: Description | Deferred */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground">Description <span className="text-destructive">*</span></Label>
              <Input
                value={formData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter charge description"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground">Deferred</Label>
              <Input
                value={formData.deferred}
                onChange={(e) => handleFieldChange('deferred', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter deferred"
              />
            </div>
          </div>

          {/* Row 5: Interest Rate | Interest From */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground">Interest Rate</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.interestRate}
                onChange={(e) => handleFieldChange('interestRate', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="0.00"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground">Interest From</Label>
              <Input
                type="date"
                value={formData.interestFrom}
                onChange={(e) => handleFieldChange('interestFrom', e.target.value)}
                className="h-8 text-sm mt-1"
              />
            </div>
          </div>

          {/* Row 6: Notes | Original Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground">Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter notes"
              />
            </div>
            <div>
              <Label className="text-sm text-foreground">Original Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.originalAmount}
                onChange={(e) => handleFieldChange('originalAmount', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Row 7: Reference (single column) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-foreground">Reference</Label>
              <Input
                value={formData.reference}
                onChange={(e) => handleFieldChange('reference', e.target.value)}
                className="h-8 text-sm mt-1"
                placeholder="Enter reference"
              />
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
