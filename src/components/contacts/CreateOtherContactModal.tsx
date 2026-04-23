import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmailInput } from '@/components/ui/email-input';
import { PhoneInput, isValidUSPhone } from '@/components/ui/phone-input';
import { ZipInput } from '@/components/ui/zip-input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { US_STATES } from '@/lib/usStates';
import { validateEmail } from '@/lib/emailValidation';
import { toast } from 'sonner';

interface CreateOtherContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kindLabel: string;
  onSubmit: (data: Record<string, string>) => void;
}

const sanitizeName = (v: string) => v.replace(/[^a-zA-Z\s'\-]/g, '').slice(0, 100);

const initialForm = (): Record<string, string> => ({
  full_name: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  company: '',
  title: '',
  email: '',
  'phone.cell': '',
  'phone.work': '',
  'phone.home': '',
  'phone.fax': '',
  'address.street': '',
  'address.city': '',
  'address.state': '',
  'address.zip': '',
  notes: '',
});

export const CreateOtherContactModal: React.FC<CreateOtherContactModalProps> = ({
  open,
  onOpenChange,
  kindLabel,
  onSubmit,
}) => {
  const [form, setForm] = useState<Record<string, string>>(() => initialForm());
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    const fullName =
      form.full_name.trim() ||
      [form.first_name, form.middle_name, form.last_name].filter(Boolean).join(' ').trim();
    if (!fullName && !form.company.trim()) {
      toast.error('Please enter a name or company');
      return;
    }
    if (form.email && validateEmail(form.email) !== null) {
      toast.error('Enter a valid email');
      return;
    }
    const phones = ['phone.cell', 'phone.work', 'phone.home', 'phone.fax'];
    for (const p of phones) {
      if (!isValidUSPhone(form[p] || '')) {
        toast.error('Enter a valid US phone number');
        return;
      }
    }
    const data = { ...form, full_name: fullName };
    onSubmit(data);
    setForm(initialForm());
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setForm(initialForm()); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add {kindLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <section className="space-y-2">
            <h4 className="text-sm font-semibold border-b border-border pb-1">Identity</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Full Name</Label>
                <Input value={form.full_name} onChange={(e) => set('full_name', sanitizeName(e.target.value))} maxLength={100} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Company</Label>
                <Input value={form.company} onChange={(e) => set('company', e.target.value.slice(0, 100))} maxLength={100} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Title / Role</Label>
                <Input value={form.title} onChange={(e) => set('title', e.target.value.slice(0, 100))} maxLength={100} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">First Name</Label>
                <Input value={form.first_name} onChange={(e) => set('first_name', sanitizeName(e.target.value).slice(0, 50))} maxLength={50} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Middle Name</Label>
                <Input value={form.middle_name} onChange={(e) => set('middle_name', sanitizeName(e.target.value).slice(0, 50))} maxLength={50} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Last Name</Label>
                <Input value={form.last_name} onChange={(e) => set('last_name', sanitizeName(e.target.value).slice(0, 50))} maxLength={50} className="h-9 text-sm" />
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-semibold border-b border-border pb-1">Contact</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Email</Label>
                <EmailInput value={form.email} onValueChange={(v) => set('email', v)} />
              </div>
              <div>
                <Label className="text-xs">Cell Phone</Label>
                <PhoneInput value={form['phone.cell']} onValueChange={(v) => set('phone.cell', v)} />
              </div>
              <div>
                <Label className="text-xs">Work Phone</Label>
                <PhoneInput value={form['phone.work']} onValueChange={(v) => set('phone.work', v)} />
              </div>
              <div>
                <Label className="text-xs">Home Phone</Label>
                <PhoneInput value={form['phone.home']} onValueChange={(v) => set('phone.home', v)} />
              </div>
              <div>
                <Label className="text-xs">Fax</Label>
                <PhoneInput value={form['phone.fax']} onValueChange={(v) => set('phone.fax', v)} />
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-semibold border-b border-border pb-1">Address</h4>
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Street</Label>
                <Input value={form['address.street']} onChange={(e) => set('address.street', e.target.value.slice(0, 200))} maxLength={200} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">City</Label>
                <Input value={form['address.city']} onChange={(e) => set('address.city', e.target.value.slice(0, 100))} maxLength={100} className="h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Select value={form['address.state'] || undefined} onValueChange={(v) => set('address.state', v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>{s.code} - {s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">ZIP</Label>
                <ZipInput value={form['address.zip']} onValueChange={(v) => set('address.zip', v)} />
              </div>
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Create {kindLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOtherContactModal;
