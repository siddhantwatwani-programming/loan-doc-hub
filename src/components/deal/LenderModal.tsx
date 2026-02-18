import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { LenderData } from './LendersTableView';

const LENDER_TYPE_OPTIONS = [
  { value: 'Individual', label: 'Individual' },
  { value: 'Joint', label: 'Joint' },
  { value: 'Family Trust', label: 'Family Trust' },
  { value: 'LLC', label: 'LLC' },
  { value: 'C Corp / S Corp', label: 'C Corp / S Corp' },
  { value: 'IRA / ERISA', label: 'IRA / ERISA' },
  { value: 'Investment Fund', label: 'Investment Fund' },
  { value: '401k', label: '401k' },
  { value: 'Foreign Holder W-8', label: 'Foreign Holder W-8' },
  { value: 'Non-profit', label: 'Non-profit' },
];

const TAX_ID_TYPE_OPTIONS = [
  { value: '0', label: '0 - Unknown' },
  { value: '1', label: '1 - EIN' },
  { value: '2', label: '2 - SSN' },
];

interface LenderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lender: LenderData | null;
  onSave: (lenderData: LenderData) => void;
  isEdit?: boolean;
}

const getDefaultLenderData = (): LenderData => ({
  id: '', isPrimary: false, type: '', fullName: '', firstName: '', lastName: '',
  email: '', phone: '', street: '', city: '', state: '', zip: '', taxId: '', taxIdType: '',
});

export const LenderModal: React.FC<LenderModalProps> = ({ open, onOpenChange, lender, onSave, isEdit = false }) => {
  const [formData, setFormData] = useState<LenderData>(getDefaultLenderData());
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setFormData(lender ? { ...getDefaultLenderData(), ...lender } : getDefaultLenderData());
      setErrors({});
    }
  }, [open, lender]);

  const handleChange = (field: keyof LenderData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim() && !formData.firstName.trim()) newErrors.fullName = 'Full Name or First Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => { if (validateForm()) onSave(formData); };

  const renderInlineField = (field: keyof LenderData, label: string, props: Record<string, any> = {}) => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs">{label}</Label>
      <Input value={String(formData[field] || '')} onChange={(e) => handleChange(field, e.target.value)} className={`h-7 text-xs flex-1 ${errors[field] ? 'border-destructive' : ''}`} {...props} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-sm">{isEdit ? 'Edit Lender' : 'Add Lender'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-1.5 py-3">
            <div className="flex items-center gap-2 pb-2">
              <Checkbox id="isPrimary" checked={formData.isPrimary} onCheckedChange={(checked) => handleChange('isPrimary', !!checked)} className="h-3.5 w-3.5" />
              <Label htmlFor="isPrimary" className="text-xs font-medium">Primary Lender</Label>
            </div>

            {/* Lender Type dropdown */}
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs">Lender Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
              >
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {LENDER_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div>
                {renderInlineField('fullName', 'Full Name *')}
                {errors.fullName && <p className="text-[10px] text-destructive pl-[108px]">{errors.fullName}</p>}
              </div>
              {renderInlineField('firstName', 'First Name')}
            </div>

            {renderInlineField('lastName', 'Last Name')}

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {renderInlineField('email', 'Email', { type: 'email' })}
              {renderInlineField('phone', 'Phone', { type: 'tel' })}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {renderInlineField('city', 'City')}
              {renderInlineField('state', 'State')}
            </div>

            {/* Tax ID Type dropdown */}
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs">Tax ID</Label>
              <Select
                value={formData.taxIdType}
                onValueChange={(value) => handleChange('taxIdType', value)}
              >
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TAX_ID_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>{isEdit ? 'Save Changes' : 'Add Lender'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LenderModal;
