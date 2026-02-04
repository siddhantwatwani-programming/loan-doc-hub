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
import type { LienData } from './LiensTableView';

interface LienDetailFormProps {
  lien: LienData;
  onChange: (field: keyof LienData, value: string) => void;
  disabled?: boolean;
  propertyOptions?: { id: string; label: string }[];
}

const PRIORITY_OPTIONS = ['1st', '2nd', '3rd', '4th', '5th'];

export const LienDetailForm: React.FC<LienDetailFormProps> = ({
  lien,
  onChange,
  disabled = false,
  propertyOptions = [],
}) => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Home className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">General</span>
      </div>

      {/* Property Lien Information */}
      <div className="space-y-4 max-w-xl">
        <div className="border-b border-border pb-2">
          <span className="font-semibold text-sm text-primary">Property Lien Information</span>
        </div>

        <div>
          <Label className="text-sm text-foreground">Property</Label>
          <Select
            value={lien.property}
            onValueChange={(val) => onChange('property', val)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-sm mt-1">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {propertyOptions.map(opt => (
                <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm text-foreground">Priority</Label>
          <Select
            value={lien.priority}
            onValueChange={(val) => onChange('priority', val)}
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
            value={lien.holder}
            onChange={(e) => onChange('holder', e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-sm text-foreground">Account</Label>
          <Input
            value={lien.account}
            onChange={(e) => onChange('account', e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-sm text-foreground">Contact</Label>
          <Input
            value={lien.contact}
            onChange={(e) => onChange('contact', e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-sm text-foreground">Phone</Label>
          <Input
            value={lien.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            disabled={disabled}
            className="h-8 text-sm mt-1"
          />
        </div>

        <div>
          <Label className="text-sm text-foreground">Original Balance</Label>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              value={lien.originalBalance}
              onChange={(e) => onChange('originalBalance', e.target.value)}
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
              value={lien.currentBalance}
              onChange={(e) => onChange('currentBalance', e.target.value)}
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
              value={lien.regularPayment}
              onChange={(e) => onChange('regularPayment', e.target.value)}
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
            value={lien.lastChecked}
            onChange={(e) => onChange('lastChecked', e.target.value)}
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

export default LienDetailForm;
