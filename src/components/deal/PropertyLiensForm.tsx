import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Home } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface PropertyLiensFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

const PRIORITY_OPTIONS = ['1st', '2nd', '3rd', '4th', '5th'];

export const PropertyLiensForm: React.FC<PropertyLiensFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
}) => {
  const getFieldValue = (key: string) => values[key] || '';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">New Property Lien</span>
      </div>

      {/* Property Lien Information */}
      <div className="space-y-4 max-w-xl">
        <div className="border-b border-border pb-2">
          <span className="font-semibold text-sm text-primary">Property Lien Information</span>
        </div>

        <div>
          <Label className="text-sm text-foreground">Property</Label>
          <Select
            value={getFieldValue('Property.Lien.Property')}
            onValueChange={(val) => onValueChange('Property.Lien.Property', val)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-sm mt-1">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="primary">Primary Property</SelectItem>
              <SelectItem value="secondary">Secondary Property</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm text-foreground">Priority</Label>
          <Select
            value={getFieldValue('Property.Lien.Priority')}
            onValueChange={(val) => onValueChange('Property.Lien.Priority', val)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-sm mt-1">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {PRIORITY_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm text-foreground">Lien Holder</Label>
          <Input
            value={getFieldValue('Property.Lien.Holder')}
            onChange={(e) => onValueChange('Property.Lien.Holder', e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-sm text-foreground">Account</Label>
          <Input
            value={getFieldValue('Property.Lien.Account')}
            onChange={(e) => onValueChange('Property.Lien.Account', e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-sm text-foreground">Contact</Label>
          <Input
            value={getFieldValue('Property.Lien.Contact')}
            onChange={(e) => onValueChange('Property.Lien.Contact', e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-sm text-foreground">Phone</Label>
          <Input
            value={getFieldValue('Property.Lien.Phone')}
            onChange={(e) => onValueChange('Property.Lien.Phone', e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-sm text-foreground">Original Balance</Label>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              value={getFieldValue('Property.Lien.OriginalBalance')}
              onChange={(e) => onValueChange('Property.Lien.OriginalBalance', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm text-right"
              inputMode="decimal"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm text-foreground">Current Balance</Label>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              value={getFieldValue('Property.Lien.CurrentBalance')}
              onChange={(e) => onValueChange('Property.Lien.CurrentBalance', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm text-right"
              inputMode="decimal"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm text-foreground">Regular Payment</Label>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              value={getFieldValue('Property.Lien.RegularPayment')}
              onChange={(e) => onValueChange('Property.Lien.RegularPayment', e.target.value)}
              disabled={disabled}
              className="h-8 text-sm text-right"
              inputMode="decimal"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm text-foreground">Last Checked</Label>
          <Input
            type="date"
            value={getFieldValue('Property.Lien.LastChecked')}
            onChange={(e) => onValueChange('Property.Lien.LastChecked', e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>
      </div>

      <div className="pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Property liens are used to track existing encumbrances on the property.
        </p>
      </div>
    </div>
  );
};

export default PropertyLiensForm;
