import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ZipInput } from '@/components/ui/zip-input';
import { EmailInput } from '@/components/ui/email-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { ContactBroker } from '@/pages/contacts/ContactBrokersPage';

interface Props {
  broker: ContactBroker;
  onSave: (updated: ContactBroker) => void;
  onCancel: () => void;
}

export const ContactBrokerDetailForm: React.FC<Props> = ({ broker, onSave, onCancel }) => {
  const [form, setForm] = useState<ContactBroker>({ ...broker });

  const set = (field: keyof ContactBroker, value: string | boolean) =>
    setForm((p) => {
      const updated = { ...p, [field]: value };
      if (field === 'firstName' || field === 'lastName') {
        const fn = field === 'firstName' ? String(value) : p.firstName;
        const ln = field === 'lastName' ? String(value) : p.lastName;
        updated.fullName = [fn, ln].filter(Boolean).join(' ');
      }
      return updated;
    });

  useEffect(() => {
    if (form.sameAsPrimary) {
      setForm((p) => ({
        ...p,
        mailingStreet: p.street,
        mailingCity: p.city,
        mailingState: p.state,
        mailingZip: p.zip,
      }));
    }
  }, [form.sameAsPrimary, form.street, form.city, form.state, form.zip]);

  useEffect(() => {
    if (!form.sameAsPrimary) {
      setForm((p) => ({
        ...p,
        mailingStreet: '',
        mailingCity: '',
        mailingState: '',
        mailingZip: '',
      }));
    }
    // only on toggle off
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.sameAsPrimary]);

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1 mb-3 mt-6 first:mt-0">{children}</h4>
  );

  return (
    <div className="max-w-3xl space-y-2">
      {/* Basic Information */}
      <SectionTitle>Basic Information</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Broker ID</Label>
          <Input value={form.brokerId} disabled className="bg-muted" />
        </div>
        <div />
        <div className="col-span-2">
          <Label>Full Name</Label>
          <Input value={form.fullName} disabled className="bg-muted" />
        </div>
        <div>
          <Label>First Name</Label>
          <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
        </div>
        <div>
          <Label>Last Name</Label>
          <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
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
        <div className="flex items-end gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.hold} onCheckedChange={(v) => set('hold', !!v)} /> Hold
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.verified} onCheckedChange={(v) => set('verified', !!v)} /> Verified
          </label>
        </div>
      </div>

      {/* Contact Information */}
      <SectionTitle>Contact Information</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Email</Label>
          <EmailInput value={form.email} onValueChange={(v) => set('email', v)} />
        </div>
        <div>
          <Label>Home Phone</Label>
          <Input value={form.homePhone} onChange={(e) => set('homePhone', e.target.value)} />
        </div>
        <div>
          <Label>Work Phone</Label>
          <Input value={form.workPhone} onChange={(e) => set('workPhone', e.target.value)} />
        </div>
        <div>
          <Label>Cell Phone</Label>
          <Input value={form.cellPhone} onChange={(e) => set('cellPhone', e.target.value)} />
        </div>
        <div>
          <Label>Fax</Label>
          <Input value={form.fax} onChange={(e) => set('fax', e.target.value)} />
        </div>
        <div className="col-span-2">
          <Label>Preferred Phone</Label>
          <RadioGroup value={form.preferredPhone} onValueChange={(v) => set('preferredPhone', v)} className="flex gap-4 mt-1">
            <label className="flex items-center gap-1.5 text-sm"><RadioGroupItem value="Home" /> Home</label>
            <label className="flex items-center gap-1.5 text-sm"><RadioGroupItem value="Work" /> Work</label>
            <label className="flex items-center gap-1.5 text-sm"><RadioGroupItem value="Cell" /> Cell</label>
          </RadioGroup>
        </div>
      </div>

      {/* Financial / Compliance */}
      <SectionTitle>Financial / Compliance</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>TIN</Label>
          <Input value={form.tin} onChange={(e) => set('tin', e.target.value)} />
        </div>
        <div className="flex items-end gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.ach} onCheckedChange={(v) => set('ach', !!v)} /> ACH
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.send1099} onCheckedChange={(v) => set('send1099', !!v)} /> Send 1099
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.agreement} onCheckedChange={(v) => set('agreement', !!v)} /> Agreement on File
          </label>
        </div>
      </div>

      {/* Primary Address */}
      <SectionTitle>Primary Address</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Street</Label>
          <Input value={form.street} onChange={(e) => set('street', e.target.value)} />
        </div>
        <div>
          <Label>City</Label>
          <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>State</Label>
            <Input value={form.state} onChange={(e) => set('state', e.target.value)} />
          </div>
          <div>
            <Label>ZIP</Label>
            <Input value={form.zip} onChange={(e) => set('zip', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Mailing Address */}
      <SectionTitle>Mailing Address</SectionTitle>
      <label className="flex items-center gap-2 text-sm mb-3">
        <Checkbox checked={form.sameAsPrimary} onCheckedChange={(v) => set('sameAsPrimary', !!v)} />
        Same as Primary Address
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Mailing Street</Label>
          <Input value={form.mailingStreet} onChange={(e) => set('mailingStreet', e.target.value)} readOnly={form.sameAsPrimary} className={form.sameAsPrimary ? 'bg-muted' : ''} />
        </div>
        <div>
          <Label>Mailing City</Label>
          <Input value={form.mailingCity} onChange={(e) => set('mailingCity', e.target.value)} readOnly={form.sameAsPrimary} className={form.sameAsPrimary ? 'bg-muted' : ''} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Mailing State</Label>
            <Input value={form.mailingState} onChange={(e) => set('mailingState', e.target.value)} readOnly={form.sameAsPrimary} className={form.sameAsPrimary ? 'bg-muted' : ''} />
          </div>
          <div>
            <Label>Mailing ZIP</Label>
            <Input value={form.mailingZip} onChange={(e) => set('mailingZip', e.target.value)} readOnly={form.sameAsPrimary} className={form.sameAsPrimary ? 'bg-muted' : ''} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-6">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSave(form)}>Save</Button>
      </div>
    </div>
  );
};
