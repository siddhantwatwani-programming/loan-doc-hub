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
      </div>
    </div>
  );
};

export default ChargesDetailForm;
