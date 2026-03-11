import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { ContactBroker } from '@/pages/contacts/ContactBrokersPage';

type CreatePayload = Omit<ContactBroker, 'id' | 'brokerId'>;

const EMPTY: CreatePayload = {
  hold: false, type: 'Individual', ach: false, email: '', agreement: false,
  fullName: '', firstName: '', lastName: '', city: '', state: '', cellPhone: '',
  homePhone: '', workPhone: '', fax: '', preferredPhone: 'Cell', verified: false,
  send1099: false, tin: '', street: '', zip: '',
  mailingStreet: '', mailingCity: '', mailingState: '', mailingZip: '', sameAsPrimary: false,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePayload) => void;
}

export const ContactBrokerModal: React.FC<Props> = ({ open, onOpenChange, onSubmit }) => {
  const [form, setForm] = useState<CreatePayload>({ ...EMPTY });

  const set = (field: keyof CreatePayload, value: string | boolean) =>
    setForm((p) => {
      const updated = { ...p, [field]: value };
      if (field === 'firstName' || field === 'lastName') {
        const fn = field === 'firstName' ? String(value) : p.firstName;
        const ln = field === 'lastName' ? String(value) : p.lastName;
        updated.fullName = [fn, ln].filter(Boolean).join(' ');
      }
      return updated;
    });

  const handleSubmit = () => {
    onSubmit(form);
    setForm({ ...EMPTY });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Contact Broker</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name</Label>
              <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Individual">Individual</SelectItem>
                <SelectItem value="Entity">Entity</SelectItem>
                <SelectItem value="Trust">Trust</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <Label>Cell Phone</Label>
            <Input value={form.cellPhone} onChange={(e) => set('cellPhone', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => set('state', e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.hold} onCheckedChange={(v) => set('hold', !!v)} /> Hold
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.ach} onCheckedChange={(v) => set('ach', !!v)} /> ACH
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.agreement} onCheckedChange={(v) => set('agreement', !!v)} /> Agreement
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.verified} onCheckedChange={(v) => set('verified', !!v)} /> Verified
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.send1099} onCheckedChange={(v) => set('send1099', !!v)} /> 1099
            </label>
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
