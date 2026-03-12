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

export const CreateContactModal: React.FC<CreateContactModalProps> = ({
  open, onOpenChange, contactType, onSubmit,
}) => {
  const [form, setForm] = useState<Record<string, string>>({
    full_name: '',
    first_name: '',
    last_name: '',
    email: '',
    type: 'Individual',
    company: '',
    city: '',
    state: '',
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    const data = {
      ...form,
      full_name: form.full_name || `${form.first_name} ${form.last_name}`.trim(),
    };
    onSubmit(data);
    setForm({ full_name: '', first_name: '', last_name: '', email: '', type: 'Individual', company: '', city: '', state: '' });
  };

  const typeLabel = contactType.charAt(0).toUpperCase() + contactType.slice(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New {typeLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Individual">Individual</SelectItem>
                  <SelectItem value="Entity">Entity</SelectItem>
                  <SelectItem value="Trust">Trust</SelectItem>
                  <SelectItem value="LLC">LLC</SelectItem>
                  <SelectItem value="IRA">IRA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>First Name</Label>
              <Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <Label>Company</Label>
              <Input value={form.company} onChange={(e) => set('company', e.target.value)} />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => set('state', e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
