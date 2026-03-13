import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
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

const TAX_ID_TYPE_OPTIONS = [
  { value: '0', label: '0 - Unknown' },
  { value: '1', label: '1 - EIN' },
  { value: '2', label: '2 - SSN' },
];

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
      capacity: '', email: '', dob: '',
      tax_id_type: '', tax_id: '', tin_verified: 'false',
      'primary_address.street': '', 'primary_address.city': '',
      'primary_address.state': '', 'primary_address.zip': '',
      'mailing.street': '', 'mailing.city': '', 'mailing.state': '', 'mailing.zip': '',
      mailing_same_as_primary: 'false',
      'phone.home': '', 'phone.work': '', 'phone.cell': '', 'phone.fax': '',
      'preferred.home': 'false', 'preferred.work': 'false', 'preferred.cell': 'false', 'preferred.fax': 'false',
      ach: 'false', servicing_agreement_on_file: 'false', freeze_outgoing_disbursements: 'false',
      investor_questionnaire_due: 'false', investor_questionnaire_due_date: '',
      'delivery.print': 'false', 'delivery.email': 'false', 'delivery.sms': 'false',
      'send_pref.payment_notification': 'false', 'send_pref.late_notice': 'false',
      'send_pref.borrower_statement': 'false', 'send_pref.maturity_notice': 'false',
      vesting: '',
    };
  }
  if (contactType === 'broker') {
    return {
      company: '', first_name: '', middle_name: '', last_name: '', full_name: '',
      email: '', License: '',
      'address.street': '', 'address.city': '', 'address.state': '', 'address.zip': '',
      'mailing.street': '', 'mailing.city': '', 'mailing.state': '', 'mailing.zip': '',
      mailing_same_as_primary: 'false',
      'phone.home': '', 'phone.work': '', 'phone.cell': '', 'phone.fax': '',
      'preferred.home': 'false', 'preferred.work': 'false', 'preferred.cell': 'false', 'preferred.fax': 'false',
      tax_id_type: '', tax_id: '', tin_verified: 'false',
      frozen: 'false', ach: 'false', agreement_on_file: 'false',
      issue_1099: 'false',
    };
  }
  // borrower
  return {
    borrower_type: '', full_name: '', first_name: '', middle_initial: '', last_name: '',
    capacity: '', email: '', dob: '',
    'address.street': '', 'address.city': '', 'address.state': '', 'address.zip': '',
    'mailing.street': '', 'mailing.city': '', 'mailing.state': '', 'mailing.zip': '',
    mailing_same_as_primary: 'false',
    'phone.home': '', 'phone.work': '', 'phone.cell': '', 'phone.fax': '',
    'preferred.home': 'false', 'preferred.work': 'false', 'preferred.cell': 'false', 'preferred.fax': 'false',
    tax_id_type: '', tax_id: '', tin_verified: 'false',
    hold: 'false', ach: 'false', agreement_on_file: 'false',
    issue_1099: 'false',
  };
};

export const CreateContactModal: React.FC<CreateContactModalProps> = ({
  open, onOpenChange, contactType, onSubmit,
}) => {
  const [form, setForm] = useState<Record<string, string>>(() => getInitialForm(contactType));

  // Determine primary address key prefix based on contact type
  const primaryPrefix = contactType === 'lender' ? 'primary_address' : 'address';

  const set = useCallback((field: string, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };

      // When "Same as Primary" is checked, copy primary to mailing
      if (field === 'mailing_same_as_primary') {
        const prefix = updated['primary_address.street'] !== undefined ? 'primary_address' : 'address';
        if (value === 'true') {
          updated['mailing.street'] = updated[`${prefix}.street`] || '';
          updated['mailing.city'] = updated[`${prefix}.city`] || '';
          updated['mailing.state'] = updated[`${prefix}.state`] || '';
          updated['mailing.zip'] = updated[`${prefix}.zip`] || '';
        } else {
          updated['mailing.street'] = '';
          updated['mailing.city'] = '';
          updated['mailing.state'] = '';
          updated['mailing.zip'] = '';
        }
      }

      return updated;
    });
  }, []);

  // Reactive sync: when primary address changes while "Same as Primary" is checked
  const primaryStreet = form[`${primaryPrefix}.street`] || '';
  const primaryCity = form[`${primaryPrefix}.city`] || '';
  const primaryState = form[`${primaryPrefix}.state`] || '';
  const primaryZip = form[`${primaryPrefix}.zip`] || '';
  const isSameAsPrimary = form.mailing_same_as_primary === 'true';

  useEffect(() => {
    if (isSameAsPrimary) {
      setForm((prev) => ({
        ...prev,
        'mailing.street': primaryStreet,
        'mailing.city': primaryCity,
        'mailing.state': primaryState,
        'mailing.zip': primaryZip,
      }));
    }
  }, [isSameAsPrimary, primaryStreet, primaryCity, primaryState, primaryZip]);

  const handleSubmit = () => {
    const data = { ...form };
    if (!data.full_name) {
      const mid = data.middle_name || data.middle_initial || '';
      data.full_name = [data.first_name, mid, data.last_name].filter(Boolean).join(' ');
    }
    onSubmit(data);
    setForm(getInitialForm(contactType));
  };

  const typeLabel = contactType.charAt(0).toUpperCase() + contactType.slice(1);

  const renderInline = (label: string, key: string, type = 'text', forceDisabled = false) => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs">{label}</Label>
      <Input
        type={type}
        value={form[key] || ''}
        onChange={(e) => set(key, e.target.value)}
        disabled={forceDisabled}
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

  const renderCheckbox = (label: string, key: string) => (
    <div className="flex items-center gap-2">
      <Checkbox
        checked={form[key] === 'true'}
        onCheckedChange={(checked) => set(key, String(!!checked))}
      />
      <Label className="text-xs">{label}</Label>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New {typeLabel}</DialogTitle>
        </DialogHeader>

        {contactType === 'lender' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-6 gap-y-0">
            {/* Column 1: Name / Details */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Name</h3>
              {renderSelect('Lender Type', 'type', LENDER_TYPE_OPTIONS)}
              {renderInline('Full Name', 'full_name')}
              {renderInline('First', 'first_name')}
              {renderInline('Middle', 'middle_name')}
              {renderInline('Last', 'last_name')}
              {renderSelect('Capacity', 'capacity', LENDER_CAPACITY_OPTIONS)}
              {renderInline('Email', 'email', 'email')}
              {renderInline('DOB', 'dob', 'date')}
              <div className="pt-2 space-y-1">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Tax Info</h3>
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs">Tax ID Type</Label>
                  <Select value={form['tax_id_type'] || ''} onValueChange={(v) => set('tax_id_type', v)}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {TAX_ID_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {renderInline('TIN', 'tax_id')}
                {renderCheckbox('TIN Verified', 'tin_verified')}
              </div>
            </div>

            {/* Column 2: Primary Address + Mailing */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Primary Address</h3>
              {renderInline('Street', 'primary_address.street')}
              {renderInline('City', 'primary_address.city')}
              {renderInline('State', 'primary_address.state')}
              {renderInline('ZIP', 'primary_address.zip')}
              <div className="pt-2 space-y-1.5">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Mailing Address</h3>
                {renderCheckbox('Same as Primary', 'mailing_same_as_primary')}
                {renderInline('Street', 'mailing.street', 'text', isSameAsPrimary)}
                {renderInline('City', 'mailing.city', 'text', isSameAsPrimary)}
                {renderInline('State', 'mailing.state', 'text', isSameAsPrimary)}
                {renderInline('ZIP', 'mailing.zip', 'text', isSameAsPrimary)}
              </div>
              <div className="pt-2 space-y-1">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Options</h3>
                {renderCheckbox('ACH', 'ach')}
                {renderCheckbox('Agreement on File', 'servicing_agreement_on_file')}
                {renderCheckbox('Frozen', 'freeze_outgoing_disbursements')}
                {renderCheckbox('Investor Questionnaire Due', 'investor_questionnaire_due')}
              </div>
            </div>

            {/* Column 3: Phone + Preferred + Delivery + Send */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-border pb-1 mb-2">
                <h3 className="font-semibold text-xs text-foreground">Phone</h3>
                <span className="font-semibold text-xs text-foreground">Pref</span>
              </div>
              {[
                { label: 'Home', phoneKey: 'phone.home', prefKey: 'preferred.home' },
                { label: 'Work', phoneKey: 'phone.work', prefKey: 'preferred.work' },
                { label: 'Cell', phoneKey: 'phone.cell', prefKey: 'preferred.cell' },
                { label: 'Fax', phoneKey: 'phone.fax', prefKey: 'preferred.fax' },
              ].map((p) => (
                <div key={p.label} className="flex items-center gap-2">
                  <Label className="w-[40px] shrink-0 text-xs">{p.label}</Label>
                  <Input
                    type="tel"
                    value={form[p.phoneKey] || ''}
                    onChange={(e) => set(p.phoneKey, e.target.value)}
                    className="h-7 text-xs flex-1"
                  />
                  <Checkbox
                    checked={form[p.prefKey] === 'true'}
                    onCheckedChange={(checked) => set(p.prefKey, String(!!checked))}
                  />
                </div>
              ))}
              <div className="pt-2 space-y-1">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Delivery Options</h3>
                <div className="flex items-center gap-3">
                  {renderCheckbox('Print', 'delivery.print')}
                  {renderCheckbox('Email', 'delivery.email')}
                  {renderCheckbox('SMS', 'delivery.sms')}
                </div>
              </div>
              <div className="pt-2 space-y-1">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Send</h3>
                {renderCheckbox('Payment Notification', 'send_pref.payment_notification')}
                {renderCheckbox('Late Notice', 'send_pref.late_notice')}
                {renderCheckbox('Borrower Statement', 'send_pref.borrower_statement')}
                {renderCheckbox('Maturity Notice', 'send_pref.maturity_notice')}
              </div>
            </div>

            {/* Column 4: Vesting */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Vesting</h3>
              <Textarea
                value={form['vesting'] || ''}
                onChange={(e) => set('vesting', e.target.value)}
                rows={4}
                className="resize-none w-full text-xs"
              />
            </div>
          </div>
        )}

        {contactType === 'broker' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-6 gap-y-0">
            {/* Column 1: Name */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Name</h3>
              {renderInline('License', 'License')}
              {renderInline('Company', 'company')}
              {renderInline('Full Name', 'full_name')}
              {renderInline('First', 'first_name')}
              {renderInline('Middle', 'middle_name')}
              {renderInline('Last', 'last_name')}
              {renderInline('Email', 'email', 'email')}
              <div className="pt-2 space-y-1">
                {renderCheckbox('Frozen', 'frozen')}
                {renderCheckbox('ACH', 'ach')}
                {renderCheckbox('Agreement on File', 'agreement_on_file')}
                {renderCheckbox('Send 1099', 'issue_1099')}
              </div>
            </div>

            {/* Column 2: Address */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Primary Address</h3>
              {renderInline('Street', 'address.street')}
              {renderInline('City', 'address.city')}
              {renderInline('State', 'address.state')}
              {renderInline('ZIP', 'address.zip')}
              <div className="pt-2 space-y-1.5">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Mailing Address</h3>
                {renderCheckbox('Same as Primary', 'mailing_same_as_primary')}
                {renderInline('Street', 'mailing.street', 'text', isSameAsPrimary)}
                {renderInline('City', 'mailing.city', 'text', isSameAsPrimary)}
                {renderInline('State', 'mailing.state', 'text', isSameAsPrimary)}
                {renderInline('ZIP', 'mailing.zip', 'text', isSameAsPrimary)}
              </div>
            </div>

            {/* Column 3: Phone */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-border pb-1 mb-2">
                <h3 className="font-semibold text-xs text-foreground">Phone</h3>
                <span className="font-semibold text-xs text-foreground">Pref</span>
              </div>
              {[
                { label: 'Home', phoneKey: 'phone.home', prefKey: 'preferred.home' },
                { label: 'Work', phoneKey: 'phone.work', prefKey: 'preferred.work' },
                { label: 'Cell', phoneKey: 'phone.cell', prefKey: 'preferred.cell' },
                { label: 'Fax', phoneKey: 'phone.fax', prefKey: 'preferred.fax' },
              ].map((p) => (
                <div key={p.label} className="flex items-center gap-2">
                  <Label className="w-[40px] shrink-0 text-xs">{p.label}</Label>
                  <Input
                    type="tel"
                    value={form[p.phoneKey] || ''}
                    onChange={(e) => set(p.phoneKey, e.target.value)}
                    className="h-7 text-xs flex-1"
                  />
                  <Checkbox
                    checked={form[p.prefKey] === 'true'}
                    onCheckedChange={(checked) => set(p.prefKey, String(!!checked))}
                  />
                </div>
              ))}
            </div>

            {/* Column 4: Tax Info */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Tax Info</h3>
              {renderInline('Tax ID Type', 'tax_id_type')}
              {renderInline('TIN', 'tax_id')}
              {renderCheckbox('TIN Verified', 'tin_verified')}
            </div>
          </div>
        )}

        {contactType === 'borrower' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-6 gap-y-0">
            {/* Column 1: Name / Details */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Name</h3>
              {renderSelect('Borrower Type', 'borrower_type', BORROWER_TYPE_OPTIONS)}
              {renderInline('Full Name', 'full_name')}
              {renderInline('First', 'first_name')}
              {renderInline('Middle', 'middle_initial')}
              {renderInline('Last', 'last_name')}
              {renderSelect('Capacity', 'capacity', BORROWER_CAPACITY_OPTIONS)}
              {renderInline('Email', 'email', 'email')}
              {renderInline('DOB', 'dob', 'date')}
              <div className="pt-2 space-y-1">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Tax Info</h3>
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs">Tax ID Type</Label>
                  <Select value={form['tax_id_type'] || ''} onValueChange={(v) => set('tax_id_type', v)}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {TAX_ID_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {renderInline('TIN', 'tax_id')}
                {renderCheckbox('TIN Verified', 'tin_verified')}
              </div>
              <div className="pt-2 space-y-1">
                {renderCheckbox('Hold', 'hold')}
                {renderCheckbox('ACH', 'ach')}
                {renderCheckbox('Agreement on File', 'agreement_on_file')}
                {renderCheckbox('Send 1099', 'issue_1099')}
              </div>
            </div>

            {/* Column 2: Address */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Primary Address</h3>
              {renderInline('Street', 'address.street')}
              {renderInline('City', 'address.city')}
              {renderInline('State', 'address.state')}
              {renderInline('ZIP', 'address.zip')}
              <div className="pt-2 space-y-1.5">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Mailing Address</h3>
                {renderCheckbox('Same as Primary', 'mailing_same_as_primary')}
                {renderInline('Street', 'mailing.street', 'text', isSameAsPrimary)}
                {renderInline('City', 'mailing.city', 'text', isSameAsPrimary)}
                {renderInline('State', 'mailing.state', 'text', isSameAsPrimary)}
                {renderInline('ZIP', 'mailing.zip', 'text', isSameAsPrimary)}
              </div>
            </div>

            {/* Column 3: Phone */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-border pb-1 mb-2">
                <h3 className="font-semibold text-xs text-foreground">Phone</h3>
                <span className="font-semibold text-xs text-foreground">Pref</span>
              </div>
              {[
                { label: 'Home', phoneKey: 'phone.home', prefKey: 'preferred.home' },
                { label: 'Work', phoneKey: 'phone.work', prefKey: 'preferred.work' },
                { label: 'Cell', phoneKey: 'phone.cell', prefKey: 'preferred.cell' },
                { label: 'Fax', phoneKey: 'phone.fax', prefKey: 'preferred.fax' },
              ].map((p) => (
                <div key={p.label} className="flex items-center gap-2">
                  <Label className="w-[40px] shrink-0 text-xs">{p.label}</Label>
                  <Input
                    type="tel"
                    value={form[p.phoneKey] || ''}
                    onChange={(e) => set(p.phoneKey, e.target.value)}
                    className="h-7 text-xs flex-1"
                  />
                  <Checkbox
                    checked={form[p.prefKey] === 'true'}
                    onCheckedChange={(checked) => set(p.prefKey, String(!!checked))}
                  />
                </div>
              ))}
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