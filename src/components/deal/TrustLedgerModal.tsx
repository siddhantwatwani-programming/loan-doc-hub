import React, { useState, useEffect } from 'react';
import { Building, CalendarIcon } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { ModalSaveConfirmation } from './ModalSaveConfirmation';
import { hasModalFormData } from '@/lib/modalFormValidation';
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const safeParseDateStr = (val: string): Date | undefined => {
    if (!val) return undefined;
    try {
      const d = parse(val, 'yyyy-MM-dd', new Date());
      return isValid(d) ? d : undefined;
    } catch { return undefined; }
  };

  useEffect(() => {
    if (open) setFormData(entry ? { ...entry } : getEmptyEntry());
  }, [open, entry]);

  const isFormFilled = hasModalFormData(formData, ['id', 'date', 'category']);

  const handleSaveClick = () => setShowConfirm(true);
  const handleConfirmSave = () => {
    setShowConfirm(false);
    onSave(formData);
    onOpenChange(false);
  };

  const handleChange = (field: keyof TrustLedgerEntry, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
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
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('h-8 text-xs w-full justify-start text-left font-normal', !formData.date && 'text-muted-foreground')}>
                      {formData.date && safeParseDateStr(formData.date) ? format(safeParseDateStr(formData.date)!, 'MM/dd/yyyy') : 'mm/dd/yyyy'}
                      <CalendarIcon className="ml-auto h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                    <EnhancedCalendar
                      mode="single"
                      selected={safeParseDateStr(formData.date)}
                      onSelect={(date) => { if (date) handleChange('date', format(date, 'yyyy-MM-dd')); setDateOpen(false); }}
                      onClear={() => { handleChange('date', ''); setDateOpen(false); }}
                      onToday={() => { handleChange('date', format(new Date(), 'yyyy-MM-dd')); setDateOpen(false); }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
            <Button size="sm" onClick={handleSaveClick} disabled={!isFormFilled}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ModalSaveConfirmation open={showConfirm} onConfirm={handleConfirmSave} onCancel={() => setShowConfirm(false)} />
    </>
  );
};

export default TrustLedgerModal;
