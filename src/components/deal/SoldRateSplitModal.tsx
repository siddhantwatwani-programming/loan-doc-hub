import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { sanitizeInterestInput, normalizeInterestOnBlur } from '@/lib/interestValidation';
import { LOAN_TERMS_BALANCES_KEYS } from '@/lib/fieldKeyMap';

const FIELD_KEYS = LOAN_TERMS_BALANCES_KEYS;

interface SoldRateSplitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}

const SPLIT_FIELDS = [
  { key: FIELD_KEYS.soldRateOriginatingVendor, label: 'Originating Vendor' },
  { key: FIELD_KEYS.soldRateCompany, label: 'Company' },
  { key: FIELD_KEYS.soldRateOtherClient1, label: 'Other - Client List' },
  { key: FIELD_KEYS.soldRateOtherClient2, label: 'Other - Client List 2' },
];

export const SoldRateSplitModal: React.FC<SoldRateSplitModalProps> = ({
  open,
  onOpenChange,
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (key: string) => values[key] || '';

  const getTotal = useCallback(() => {
    return SPLIT_FIELDS.reduce((sum, f) => {
      const val = parseFloat((values[f.key] || '').replace(/,/g, ''));
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [values]);

  const total = getTotal();
  const isValid = Math.abs(total - 100) < 0.005;
  const hasAnyValue = SPLIT_FIELDS.some(f => getValue(f.key).trim() !== '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[9999]">
        <DialogHeader>
          <DialogTitle>Sold Rate Split</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Allocate the sold rate percentage across parties. Total must equal 100%.
          </p>
          {SPLIT_FIELDS.map((field) => (
            <div key={field.key} className="flex items-center gap-3">
              <Label className="text-sm text-muted-foreground min-w-[150px] shrink-0">
                {field.label}
              </Label>
              <div className="relative flex-1">
                <Input
                  value={getValue(field.key)}
                  onChange={(e) => onValueChange(field.key, sanitizeInterestInput(e.target.value))}
                  onBlur={() => {
                    const v = normalizeInterestOnBlur(getValue(field.key), 2);
                    if (v !== getValue(field.key)) onValueChange(field.key, v);
                  }}
                  disabled={disabled}
                  className="h-8 text-sm pr-7"
                  placeholder="0.00"
                  inputMode="decimal"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
              </div>
            </div>
          ))}

          {/* Total row */}
          <div className="flex items-center gap-3 border-t border-border pt-2">
            <Label className="text-sm font-semibold min-w-[150px] shrink-0">Total</Label>
            <div className="flex-1 flex items-center gap-2">
              <span className={`text-sm font-semibold ${isValid ? 'text-green-600' : 'text-destructive'}`}>
                {total.toFixed(2)}%
              </span>
              {hasAnyValue && !isValid && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="text-xs">Sold Rate must total 100%</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} size="sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SoldRateSplitModal;
