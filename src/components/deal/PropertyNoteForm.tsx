import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface PropertyNoteFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const PropertyNoteForm: React.FC<PropertyNoteFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (key: string): string => {
    return values[`property1.${key}`] || '';
  };

  const handleChange = (key: string, value: string) => {
    onValueChange(`property1.${key}`, value);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-2 mb-4">
        <span className="font-semibold text-base text-primary">Property Notes</span>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-foreground">Note</Label>
        <Textarea
          value={getValue('note')}
          onChange={(e) => handleChange('note', e.target.value)}
          disabled={disabled}
          className="min-h-[300px] text-sm"
          placeholder="Enter property notes..."
        />
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Use this field to add any additional notes or comments related to this property.
        </p>
      </div>
    </div>
  );
};

export default PropertyNoteForm;
