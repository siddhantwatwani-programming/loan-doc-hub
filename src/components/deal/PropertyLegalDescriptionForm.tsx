import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Home } from 'lucide-react';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface PropertyLegalDescriptionFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const FIELD_KEYS = {
  apn: 'property1.apn',
  legalDescription: 'property1.legal_description',
  lot: 'property1.lot',
  block: 'property1.block',
  tract: 'property1.tract',
  unit: 'property1.unit',
} as const;

export const PropertyLegalDescriptionForm: React.FC<PropertyLegalDescriptionFormProps> = ({
  fields, values, onValueChange, showValidation = false, disabled = false,
}) => {
  const getFieldValue = (key: string) => values[key] || '';

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-base text-foreground">New Property</span>
      </div>

      <div className="form-section-header">Property Legal Description</div>
      <div className="form-grid-compact">
        <div className="inline-field">
          <Label className="inline-label">APN</Label>
          <Input value={getFieldValue(FIELD_KEYS.apn)} onChange={(e) => onValueChange(FIELD_KEYS.apn, e.target.value)} disabled={disabled} className="h-7 text-sm" placeholder="Enter APN" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Lot</Label>
          <Input value={getFieldValue(FIELD_KEYS.lot)} onChange={(e) => onValueChange(FIELD_KEYS.lot, e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Block</Label>
          <Input value={getFieldValue(FIELD_KEYS.block)} onChange={(e) => onValueChange(FIELD_KEYS.block, e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Tract</Label>
          <Input value={getFieldValue(FIELD_KEYS.tract)} onChange={(e) => onValueChange(FIELD_KEYS.tract, e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field">
          <Label className="inline-label">Unit</Label>
          <Input value={getFieldValue(FIELD_KEYS.unit)} onChange={(e) => onValueChange(FIELD_KEYS.unit, e.target.value)} disabled={disabled} className="h-7 text-sm" />
        </div>
        <div className="inline-field col-span-full">
          <Label className="inline-label">Legal Desc</Label>
          <Textarea value={getFieldValue(FIELD_KEYS.legalDescription)} onChange={(e) => onValueChange(FIELD_KEYS.legalDescription, e.target.value)} disabled={disabled} className="min-h-[120px] text-sm" placeholder="Enter the legal description of the property..." />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">The legal description identifies the property in legal documents such as deeds and mortgages.</p>
      </div>
    </div>
  );
};

export default PropertyLegalDescriptionForm;
