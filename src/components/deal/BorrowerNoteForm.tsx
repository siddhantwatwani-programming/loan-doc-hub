import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

const FIELD_KEYS = {
  note: 'borrower.note',
} as const;

interface BorrowerNoteFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const BorrowerNoteForm: React.FC<BorrowerNoteFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getValue = (key: keyof typeof FIELD_KEYS): string => values[FIELD_KEYS[key]] || '';
  const handleChange = (key: keyof typeof FIELD_KEYS, value: string) => {
    onValueChange(FIELD_KEYS[key], value);
  };

  const fieldDef = fields.find(f => f.field_key === FIELD_KEYS.note);
  const isRequired = fieldDef?.is_required || false;
  const showError = showValidation && isRequired && !getValue('note').trim();

  return (
    <div className="p-4 space-y-4">
      <div className="border-b border-border pb-1 mb-3">
        <span className="font-semibold text-xs text-foreground">Borrower Note</span>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Note</Label>
        <Textarea
          value={getValue('note')}
          onChange={(e) => handleChange('note', e.target.value)}
          disabled={disabled}
          className={`min-h-[160px] text-xs ${showError ? 'border-destructive' : ''}`}
          placeholder="Enter borrower notes..."
        />
      </div>

      <div className="pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Use this field to add any additional notes or comments related to this borrower.
        </p>
      </div>
    </div>
  );
};

export default BorrowerNoteForm;
