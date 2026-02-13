import React, { useState, useEffect } from 'react';
import { Building } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { TrustLedgerEntry } from './TrustLedgerTableView';

interface TrustLedgerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: TrustLedgerEntry | null;
  onSave: (entry: TrustLedgerEntry) => void;
  isEdit?: boolean;
}

const getEmptyEntry = (): TrustLedgerEntry => ({
  id: `trust_ledger_${Date.now()}`,
  date: new Date().toISOString().split('T')[0],
  reference: '',
  fromWhomReceivedPaid: '',
  memo: '',
  payment: '',
  clr: '',
  deposit: '',
  balance: '',
  category: 'all',
});

export const TrustLedgerModal: React.FC<TrustLedgerModalProps> = ({
  open, onOpenChange, entry, onSave, isEdit = false,
}) => {
  const [formData, setFormData] = useState<TrustLedgerEntry>(getEmptyEntry());

  useEffect(() => {
    if (open) setFormData(entry ? { ...entry } : getEmptyEntry());
  }, [open, entry]);

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const handleChange = (field: keyof TrustLedgerEntry, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Building className="h-4 w-4 text-primary" />
            {isEdit ? 'Edit Trust Ledger Entry' : 'Add Trust Ledger Entry'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-foreground">Date</Label>
              <Input type="date" value={formData.date} onChange={e => handleChange('date', e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-foreground">Reference</Label>
              <Input value={formData.reference} onChange={e => handleChange('reference', e.target.value)} className="h-8 text-xs" placeholder="e.g. V-Check" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-foreground">From Whom Received / Paid</Label>
            <Input value={formData.fromWhomReceivedPaid} onChange={e => handleChange('fromWhomReceivedPaid', e.target.value)} className="h-8 text-xs" />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-foreground">Memo</Label>
            <Input value={formData.memo} onChange={e => handleChange('memo', e.target.value)} className="h-8 text-xs" placeholder="e.g. Borrower Payment" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-foreground">Payment</Label>
              <Input type="number" step="0.01" value={formData.payment} onChange={e => handleChange('payment', e.target.value)} className="h-8 text-xs" placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-foreground">Deposit</Label>
              <Input type="number" step="0.01" value={formData.deposit} onChange={e => handleChange('deposit', e.target.value)} className="h-8 text-xs" placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-foreground">CLR</Label>
              <Input value={formData.clr} onChange={e => handleChange('clr', e.target.value)} className="h-8 text-xs" placeholder="e.g. R" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-foreground">Category</Label>
              <Select value={formData.category} onValueChange={v => handleChange('category', v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="reserve">Reserve</SelectItem>
                  <SelectItem value="impound">Impound</SelectItem>
                </SelectContent>
              </Select>
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

export default TrustLedgerModal;
