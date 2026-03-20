import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ZipInput } from '@/components/ui/zip-input';
import { EmailInput } from '@/components/ui/email-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { hasAtLeastOneFieldFilled, validatePhoneFields } from '@/lib/contactFormValidation';
import { toast } from 'sonner';
import type { ContactLender } from '@/pages/contacts/ContactLendersPage';

interface Props {
  lender: ContactLender;
  onSave: (lender: ContactLender) => void;
  onCancel: () => void;
}

export const ContactLenderDetailForm: React.FC<Props> = ({ lender, onSave, onCancel }) => {
  const [form, setForm] = useState<ContactLender>({ ...lender });

  const set = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Same as primary address sync
  useEffect(() => {
    if (form.sameAsPrimary) {
      setForm((prev) => ({
        ...prev,
        mailingStreet: prev.street,
        mailingCity: prev.city,
        mailingState: prev.state,
        mailingZip: prev.zip,
      }));
    }
  }, [form.sameAsPrimary, form.street, form.city, form.state, form.zip]);

  const handleSameAsPrimaryChange = (checked: boolean) => {
    if (checked) {
      set('sameAsPrimary', true);
    } else {
      setForm((prev) => ({
        ...prev,
        sameAsPrimary: false,
        mailingStreet: '',
        mailingCity: '',
        mailingState: '',
        mailingZip: '',
      }));
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Basic Information */}
      <div>
        <h4 className="font-semibold text-base text-foreground mb-3">Basic Information</h4>
        <Separator className="mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Lender ID</Label>
            <Input value={form.lenderId} disabled className="bg-muted/50" />
          </div>
          <div />
          <div className="col-span-2">
            <Label>Full Name</Label>
            <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} />
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
                <SelectItem value="IRA">IRA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div />
          <div className="flex items-center gap-2">
            <Checkbox checked={form.frozen} onCheckedChange={(v) => set('frozen', !!v)} />
            <Label>Frozen</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.verified} onCheckedChange={(v) => set('verified', !!v)} />
            <Label>Verified</Label>
          </div>
          <div className="col-span-2">
            <Label>Investor Questionnaire</Label>
            <Input
              value={form.investorQuestionnaire}
              onChange={(e) => set('investorQuestionnaire', e.target.value)}
              placeholder="Upload file or enter link"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h4 className="font-semibold text-base text-foreground mb-3">Contact Information</h4>
        <Separator className="mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Email</Label>
            <EmailInput value={form.email} onValueChange={(v) => set('email', v)} />
          </div>
          <div>
            <Label>Home Phone</Label>
            <PhoneInput value={form.homePhone} onValueChange={(v) => set('homePhone', v)} />
          </div>
          <div>
            <Label>Work Phone</Label>
            <PhoneInput value={form.workPhone} onValueChange={(v) => set('workPhone', v)} />
          </div>
          <div>
            <Label>Cell Phone</Label>
            <PhoneInput value={form.cellPhone} onValueChange={(v) => set('cellPhone', v)} />
          </div>
          <div>
            <Label>Fax</Label>
            <PhoneInput value={form.fax} onValueChange={(v) => set('fax', v)} />
          </div>
          <div className="col-span-2">
            <Label className="mb-2 block">Preferred Phone</Label>
            <RadioGroup
              value={form.preferredPhone}
              onValueChange={(v) => set('preferredPhone', v)}
              className="flex items-center gap-6"
            >
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="Home" id="pref-home" />
                <Label htmlFor="pref-home" className="font-normal">Home</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="Work" id="pref-work" />
                <Label htmlFor="pref-work" className="font-normal">Work</Label>
              </div>
              <div className="flex items-center gap-1.5">
                <RadioGroupItem value="Cell" id="pref-cell" />
                <Label htmlFor="pref-cell" className="font-normal">Cell</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* Financial / Compliance */}
      <div>
        <h4 className="font-semibold text-base text-foreground mb-3">Financial / Compliance</h4>
        <Separator className="mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>TIN</Label>
            <Input value={form.tin} onChange={(e) => set('tin', e.target.value)} />
          </div>
          <div />
          <div className="flex items-center gap-2">
            <Checkbox checked={form.ach} onCheckedChange={(v) => set('ach', !!v)} />
            <Label>ACH</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.send1099} onCheckedChange={(v) => set('send1099', !!v)} />
            <Label>Send 1099</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.agreement} onCheckedChange={(v) => set('agreement', !!v)} />
            <Label>Agreement on File</Label>
          </div>
        </div>
      </div>

      {/* Primary Address */}
      <div>
        <h4 className="font-semibold text-base text-foreground mb-3">Primary Address</h4>
        <Separator className="mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Street</Label>
            <Input value={form.street} onChange={(e) => set('street', e.target.value)} />
          </div>
          <div>
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>State</Label>
              <Input value={form.state} onChange={(e) => set('state', e.target.value)} />
            </div>
            <div>
              <Label>ZIP</Label>
              <ZipInput value={form.zip} onValueChange={(v) => set('zip', v)} />
            </div>
          </div>
        </div>
      </div>

      {/* Mailing Address */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <h4 className="font-semibold text-base text-foreground">Mailing Address</h4>
          <div className="flex items-center gap-1.5">
            <Checkbox
              checked={form.sameAsPrimary}
              onCheckedChange={(v) => handleSameAsPrimaryChange(!!v)}
            />
            <Label className="font-normal text-sm">Same as Primary Address</Label>
          </div>
        </div>
        <Separator className="mb-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label>Mailing Street</Label>
            <Input
              value={form.mailingStreet}
              onChange={(e) => set('mailingStreet', e.target.value)}
              readOnly={form.sameAsPrimary}
              className={form.sameAsPrimary ? 'bg-muted/50' : ''}
            />
          </div>
          <div>
            <Label>Mailing City</Label>
            <Input
              value={form.mailingCity}
              onChange={(e) => set('mailingCity', e.target.value)}
              readOnly={form.sameAsPrimary}
              className={form.sameAsPrimary ? 'bg-muted/50' : ''}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Mailing State</Label>
              <Input
                value={form.mailingState}
                onChange={(e) => set('mailingState', e.target.value)}
                readOnly={form.sameAsPrimary}
                className={form.sameAsPrimary ? 'bg-muted/50' : ''}
              />
            </div>
            <div>
              <Label>Mailing ZIP</Label>
              <ZipInput
                value={form.mailingZip}
                onValueChange={(v) => set('mailingZip', v)}
                readOnly={form.sameAsPrimary}
                className={form.sameAsPrimary ? 'bg-muted/50' : ''}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={() => {
          if (!hasAtLeastOneFieldFilled(form as any, ['lenderId', 'preferredPhone', 'type'])) {
            toast.error('Please fill at least one field before saving');
            return;
          }
          const phoneErrors = validatePhoneFields([
            { label: 'Home Phone', value: form.homePhone },
            { label: 'Work Phone', value: form.workPhone },
            { label: 'Cell Phone', value: form.cellPhone },
            { label: 'Fax', value: form.fax },
          ]);
          if (phoneErrors.length > 0) { toast.error(phoneErrors[0]); return; }
          onSave(form);
        }}>Save</Button>
      </div>
    </div>
  );
};
