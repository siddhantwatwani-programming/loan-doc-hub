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

// Field key mapping as specified
const FIELD_KEYS = {
  property: 'property1.lien_property',
  priority: 'property1.lien_priority',
  holder: 'property1.lien_holder',
  account: 'property1.lien_account',
  contact: 'property1.lien_contact',
  phone: 'property1.lien_phone',
  originalBalance: 'property1.lien_original_balance',
  currentBalance: 'property1.lien_current_balance',
  regularPayment: 'property1.lien_regular_payment',
  lastChecked: 'property1.lien_last_checked',
} as const;

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
            value={getFieldValue(FIELD_KEYS.property)}
            onValueChange={(val) => onValueChange(FIELD_KEYS.property, val)}
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
            value={getFieldValue(FIELD_KEYS.priority)}
            onValueChange={(val) => onValueChange(FIELD_KEYS.priority, val)}
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
            value={getFieldValue(FIELD_KEYS.holder)}
            onChange={(e) => onValueChange(FIELD_KEYS.holder, e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-sm text-foreground">Account</Label>
          <Input
            value={getFieldValue(FIELD_KEYS.account)}
            onChange={(e) => onValueChange(FIELD_KEYS.account, e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-sm text-foreground">Contact</Label>
          <Input
            value={getFieldValue(FIELD_KEYS.contact)}
            onChange={(e) => onValueChange(FIELD_KEYS.contact, e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-sm text-foreground">Phone</Label>
          <Input
            value={getFieldValue(FIELD_KEYS.phone)}
            onChange={(e) => onValueChange(FIELD_KEYS.phone, e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-sm text-foreground">Original Balance</Label>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              value={getFieldValue(FIELD_KEYS.originalBalance)}
              onChange={(e) => onValueChange(FIELD_KEYS.originalBalance, e.target.value)}
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
              value={getFieldValue(FIELD_KEYS.currentBalance)}
              onChange={(e) => onValueChange(FIELD_KEYS.currentBalance, e.target.value)}
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
              value={getFieldValue(FIELD_KEYS.regularPayment)}
              onChange={(e) => onValueChange(FIELD_KEYS.regularPayment, e.target.value)}
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
            value={getFieldValue(FIELD_KEYS.lastChecked)}
            onChange={(e) => onValueChange(FIELD_KEYS.lastChecked, e.target.value)}
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
