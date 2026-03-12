import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface CreateContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactType: 'lender' | 'broker' | 'borrower';
  onSubmit: (data: Record<string, string>) => void;
}

const LENDER_TYPE_OPTIONS = [
  'Individual', 'Joint', 'Family Trust', 'LLC', 'C Corp / S Corp',
  'IRA / ERISA', 'Investment Fund', '401k', 'Foreign Holder W-8', 'Non-profit',
];

const LENDER_CAPACITY_OPTIONS = ['Broker', 'Primary Lender', 'Authorized Party'];

const BORROWER_TYPE_OPTIONS = [
  'Individual', 'Joint', 'Family Trust', 'LLC', 'C Corp / S Corp',
  'IRA / ERISA', 'Investment Fund', '401K', 'Foreign Holder W-8', 'Non-profit',
];

const BORROWER_CAPACITY_OPTIONS = [
  'Borrower', 'Co-borrower', 'Trustee', 'Co-Trustee',
  'Managing Member', 'Authorized Signer', 'Additional Guarantor',
];

const getInitialForm = (contactType: string): Record<string, string> => {
  if (contactType === 'lender') {
    return {
      type: '', full_name: '', first_name: '', middle_name: '', last_name: '',
      capacity: '', email: '',
      'primary_address.street': '', 'primary_address.city': '',
      'primary_address.state': '', 'primary_address.zip': '',
    };
  }
  if (contactType === 'broker') {
    return {
      company: '', first_name: '', middle_name: '', last_name: '',
      email: '', License: '',
      'address.street': '', 'address.city': '', 'address.state': '', 'address.zip': '',
    };
  }
  // borrower
  return {
    borrower_type: '', full_name: '', first_name: '', middle_initial: '', last_name: '',
    capacity: '', email: '',
    'address.street': '', 'address.city': '', state: '', 'address.zip': '',
  };
};

export const CreateContactModal: React.FC<CreateContactModalProps> = ({
  open, onOpenChange, contactType, onSubmit,
}) => {
  const [form, setForm] = useState<Record<string, string>>(() => getInitialForm(contactType));

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    const data = { ...form };
    // Derive full_name if not set
    if (!data.full_name) {
      const mid = data.middle_name || data.middle_initial || '';
      data.full_name = [data.first_name, mid, data.last_name].filter(Boolean).join(' ');
    }
    onSubmit(data);
    setForm(getInitialForm(contactType));
  };

  const typeLabel = contactType.charAt(0).toUpperCase() + contactType.slice(1);

  const renderInline = (label: string, key: string, type = 'text') => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs">{label}</Label>
      <Input
        type={type}
        value={form[key] || ''}
        onChange={(e) => set(key, e.target.value)}
        className="h-7 text-xs flex-1"
      />
    </div>
  );

  const renderSelect = (label: string, key: string, options: string[]) => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs">{label}</Label>
      <Select value={form[key] || ''} onValueChange={(v) => set(key, v)}>
        <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New {typeLabel}</DialogTitle>
        </DialogHeader>

        {contactType === 'lender' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-0">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Lender Details</h3>
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">Lender ID</Label>
                <Input value="Auto-generated" disabled className="h-7 text-xs flex-1 bg-muted" />
              </div>
              {renderSelect('Lender Type', 'type', LENDER_TYPE_OPTIONS)}
              {renderInline('Full Name', 'full_name')}
              {renderInline('First', 'first_name')}
              {renderInline('Middle', 'middle_name')}
              {renderInline('Last', 'last_name')}
              {renderSelect('Capacity', 'capacity', LENDER_CAPACITY_OPTIONS)}
              {renderInline('Email', 'email', 'email')}
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Primary Address</h3>
              {renderInline('Street', 'primary_address.street')}
              {renderInline('City', 'primary_address.city')}
              {renderInline('State', 'primary_address.state')}
              {renderInline('ZIP', 'primary_address.zip')}
            </div>
          </div>
        )}

        {contactType === 'broker' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-0">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Name</h3>
              {renderInline('License', 'License')}
              {renderInline('Company', 'company')}
              {renderInline('First', 'first_name')}
              {renderInline('Middle', 'middle_name')}
              {renderInline('Last', 'last_name')}
              {renderInline('Email', 'email', 'email')}
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Primary Address</h3>
              {renderInline('Street', 'address.street')}
              {renderInline('City', 'address.city')}
              {renderInline('State', 'address.state')}
              {renderInline('ZIP', 'address.zip')}
            </div>
          </div>
        )}

        {contactType === 'borrower' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-0">
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Name</h3>
              {renderSelect('Borrower Type', 'borrower_type', BORROWER_TYPE_OPTIONS)}
              {renderInline('Full Name', 'full_name')}
              {renderInline('First', 'first_name')}
              {renderInline('Middle', 'middle_initial')}
              {renderInline('Last', 'last_name')}
              {renderSelect('Capacity', 'capacity', BORROWER_CAPACITY_OPTIONS)}
              {renderInline('Email', 'email', 'email')}
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Primary Address</h3>
              {renderInline('Street', 'address.street')}
              {renderInline('City', 'address.city')}
              {renderInline('State', 'state')}
              {renderInline('ZIP', 'address.zip')}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
