import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EmailInput } from '@/components/ui/email-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { ZipInput } from '@/components/ui/zip-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { US_STATES } from '@/lib/usStates';

interface OtherProfileFormProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  disabled?: boolean;
  contactIdLabel: string;
  contactIdValue: string;
}

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <div className="space-y-1">
    <Label className="text-xs">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
  </div>
);

export const OtherProfileForm: React.FC<OtherProfileFormProps> = ({
  values,
  onValueChange,
  disabled = false,
  contactIdLabel,
  contactIdValue,
}) => {
  const v = (k: string) => values[`other.${k}`] || '';
  const set = (k: string, val: string) => onValueChange(`other.${k}`, val);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Identity */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Identity</h4>
        <div className="grid grid-cols-3 gap-4">
          <Field label={contactIdLabel}>
            <Input value={contactIdValue} disabled className="h-9 text-sm bg-muted" />
          </Field>
          <Field label="Full Name">
            <Input
              value={v('full_name')}
              onChange={(e) => set('full_name', e.target.value.slice(0, 100))}
              disabled={disabled}
              maxLength={100}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="Company">
            <Input
              value={v('company')}
              onChange={(e) => set('company', e.target.value.slice(0, 100))}
              disabled={disabled}
              maxLength={100}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="First Name">
            <Input
              value={v('first_name')}
              onChange={(e) => set('first_name', e.target.value.slice(0, 50))}
              disabled={disabled}
              maxLength={50}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="Middle Name">
            <Input
              value={v('middle_name')}
              onChange={(e) => set('middle_name', e.target.value.slice(0, 50))}
              disabled={disabled}
              maxLength={50}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="Last Name">
            <Input
              value={v('last_name')}
              onChange={(e) => set('last_name', e.target.value.slice(0, 50))}
              disabled={disabled}
              maxLength={50}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="Title / Role">
            <Input
              value={v('title')}
              onChange={(e) => set('title', e.target.value.slice(0, 100))}
              disabled={disabled}
              maxLength={100}
              className="h-9 text-sm"
            />
          </Field>
        </div>
      </section>

      {/* Contact */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Contact</h4>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Email">
            <EmailInput
              value={v('email')}
              onValueChange={(val) => set('email', val)}
              disabled={disabled}
            />
          </Field>
          <Field label="Cell Phone">
            <PhoneInput
              value={v('phone.cell')}
              onValueChange={(val) => set('phone.cell', val)}
              disabled={disabled}
            />
          </Field>
          <Field label="Work Phone">
            <PhoneInput
              value={v('phone.work')}
              onValueChange={(val) => set('phone.work', val)}
              disabled={disabled}
            />
          </Field>
          <Field label="Home Phone">
            <PhoneInput
              value={v('phone.home')}
              onValueChange={(val) => set('phone.home', val)}
              disabled={disabled}
            />
          </Field>
          <Field label="Fax">
            <PhoneInput
              value={v('phone.fax')}
              onValueChange={(val) => set('phone.fax', val)}
              disabled={disabled}
            />
          </Field>
        </div>
      </section>

      {/* Address */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Address</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <Field label="Street">
              <Input
                value={v('address.street')}
                onChange={(e) => set('address.street', e.target.value.slice(0, 200))}
                disabled={disabled}
                maxLength={200}
                className="h-9 text-sm"
              />
            </Field>
          </div>
          <Field label="City">
            <Input
              value={v('address.city')}
              onChange={(e) => set('address.city', e.target.value.slice(0, 100))}
              disabled={disabled}
              maxLength={100}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="State">
            <Select
              value={v('address.state') || undefined}
              onValueChange={(val) => set('address.state', val)}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="ZIP">
            <ZipInput
              value={v('address.zip')}
              onValueChange={(val) => set('address.zip', val)}
              disabled={disabled}
            />
          </Field>
        </div>
      </section>

      {/* Notes */}
      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Notes</h4>
        <Textarea
          value={v('notes')}
          onChange={(e) => set('notes', e.target.value.slice(0, 2000))}
          disabled={disabled}
          maxLength={2000}
          rows={4}
          placeholder="Additional notes..."
          className="text-sm"
        />
      </section>
    </div>
  );
};

export default OtherProfileForm;
