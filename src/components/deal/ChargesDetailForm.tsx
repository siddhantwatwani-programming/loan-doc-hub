import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ChargesDetailFormProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
}

const FIELD_KEYS = {
  description: 'charges.description',
  unpaidBalance: 'charges.unpaid_balance',
  owedTo: 'charges.owed_to',
  owedFrom: 'charges.owed_from',
  totalDue: 'charges.total_due',
  interestFrom: 'charges.interest_from',
  dateOfCharge: 'charges.date_of_charge',
  interestRate: 'charges.interest_rate',
  notes: 'charges.notes',
  reference: 'charges.reference',
  changeType: 'charges.change_type',
  deferred: 'charges.deferred',
  originalAmount: 'charges.original_amount',
};

export const ChargesDetailForm: React.FC<ChargesDetailFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-6">
      {/* Charge Information Section */}
      <div className="space-y-4">
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
              value={values[FIELD_KEYS.unpaidBalance] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.unpaidBalance, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="0.00"
            />
          </div>
          <div>
            <Label className="text-sm text-foreground">Owed To</Label>
            <Input
              value={values[FIELD_KEYS.owedTo] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.owedTo, e.target.value)}
              disabled={disabled}
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
              value={values[FIELD_KEYS.owedFrom] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.owedFrom, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="Enter owed from"
            />
          </div>
          <div>
            <Label className="text-sm text-foreground">Total Due</Label>
            <Input
              type="number"
              step="0.01"
              value={values[FIELD_KEYS.totalDue] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.totalDue, e.target.value)}
              disabled={disabled}
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
              value={values[FIELD_KEYS.dateOfCharge] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.dateOfCharge, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>
          <div>
            <Label className="text-sm text-foreground">Change Type</Label>
            <Input
              value={values[FIELD_KEYS.changeType] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.changeType, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="Enter change type"
            />
          </div>
        </div>

        {/* Row 4: Description | Deferred */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-foreground">Description</Label>
            <Input
              value={values[FIELD_KEYS.description] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.description, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="Enter description"
            />
          </div>
          <div>
            <Label className="text-sm text-foreground">Deferred</Label>
            <Input
              value={values[FIELD_KEYS.deferred] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.deferred, e.target.value)}
              disabled={disabled}
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
              value={values[FIELD_KEYS.interestRate] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.interestRate, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="0.00"
            />
          </div>
          <div>
            <Label className="text-sm text-foreground">Interest From</Label>
            <Input
              type="date"
              value={values[FIELD_KEYS.interestFrom] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.interestFrom, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
            />
          </div>
        </div>

        {/* Row 6: Notes | Original Amount */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-foreground">Notes</Label>
            <Input
              value={values[FIELD_KEYS.notes] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.notes, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="Enter notes"
            />
          </div>
          <div>
            <Label className="text-sm text-foreground">Original Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={values[FIELD_KEYS.originalAmount] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.originalAmount, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Row 7: Reference */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-foreground">Reference</Label>
            <Input
              value={values[FIELD_KEYS.reference] || ''}
              onChange={(e) => onValueChange(FIELD_KEYS.reference, e.target.value)}
              disabled={disabled}
              className="h-8 text-sm mt-1"
              placeholder="Enter reference"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargesDetailForm;
