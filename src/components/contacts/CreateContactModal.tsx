import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmailInput } from '@/components/ui/email-input';
import { ZipInput } from '@/components/ui/zip-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PhoneInput } from '@/components/ui/phone-input';
import { hasAtLeastOneFieldFilled, validatePhoneFields, hasValidContactEmails } from '@/lib/contactFormValidation';
import { toast } from 'sonner';

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



const TAX_ID_TYPE_OPTIONS = [
  { value: '0', label: '0 - Unknown' },
  { value: '1', label: '1 - EIN' },
  { value: '2', label: '2 - SSN' },
];

const BORROWER_TYPE_OPTIONS = [
  'Individual', 'Joint', 'Family Trust', 'LLC', 'C Corp / S Corp',
  'IRA / ERISA', 'Investment Fund', '401K', 'Foreign Holder W-8', 'Non-profit',
];


const getInitialForm = (contactType: string): Record<string, string> => {
  if (contactType === 'lender') {
    return {
      type: '', full_name: '', first_name: '', middle_name: '', last_name: '',
      email: '', dob: '',
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
    email: '', dob: '',
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
  const [confirmOpen, setConfirmOpen] = useState(false);

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
    // Check at least one meaningful field is filled
    const skipKeys = ['mailing_same_as_primary', 'preferred.home', 'preferred.work', 'preferred.cell', 'preferred.fax',
      'delivery.print', 'delivery.email', 'delivery.sms', 'send_pref.payment_notification',
      'send_pref.late_notice', 'send_pref.borrower_statement', 'send_pref.maturity_notice'];
    if (!hasAtLeastOneFieldFilled(form, skipKeys)) {
      toast.error('Please fill at least one field before saving');
      return;
    }
    // Validate phone fields
    const phoneErrors = validatePhoneFields([
      { label: 'Home Phone', value: form['phone.home'] || '' },
      { label: 'Work Phone', value: form['phone.work'] || '' },
      { label: 'Cell Phone', value: form['phone.cell'] || '' },
      { label: 'Fax', value: form['phone.fax'] || '' },
    ]);
    if (phoneErrors.length > 0) {
      toast.error(phoneErrors[0]);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
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
        <SelectContent className="bg-background border border-border z-[200]">
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

  const [dobOpen, setDobOpen] = useState(false);
  const [borrowerDobOpen, setBorrowerDobOpen] = useState(false);

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        contactType === 'lender' ? "max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" : "max-w-4xl max-h-[85vh] overflow-y-auto"
      )}>
        <DialogHeader className={contactType === 'lender' ? "shrink-0" : undefined}>
          <DialogTitle>Create New {typeLabel}</DialogTitle>
        </DialogHeader>

        {contactType === 'lender' && (
          <>
          <div className="flex-1 overflow-y-auto min-h-0 sleek-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-0">
            {/* Column 1: Name / Details */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Name</h3>
              {renderSelect('Lender Type', 'type', LENDER_TYPE_OPTIONS)}
              {renderInline('Full Name', 'full_name')}
              {renderInline('First', 'first_name')}
              {renderInline('Middle', 'middle_name')}
              {renderInline('Last', 'last_name')}
              
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">Email</Label>
                <EmailInput value={form['email'] || ''} onValueChange={(v) => set('email', v)} className="h-7 text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">DOB</Label>
                <Popover open={dobOpen} onOpenChange={setDobOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-7 text-xs flex-1 justify-start font-normal", !form['dob'] && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {form['dob'] || 'MM/DD/YYYY'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[200]" align="start">
                    <Calendar
                      mode="single"
                      selected={form['dob'] ? new Date(form['dob']) : undefined}
                      onSelect={(date) => {
                        set('dob', date ? format(date, 'dd-MM-yyyy') : '');
                        setDobOpen(false);
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="pt-2 space-y-1">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Tax Info</h3>
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs">Tax ID Type</Label>
                  <Select value={form['tax_id_type'] || ''} onValueChange={(v) => set('tax_id_type', v)}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-background border border-border z-[200]">
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

            {/* Column 2: Primary Address + Mailing + Options */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Primary Address</h3>
              {renderInline('Street', 'primary_address.street')}
              {renderInline('City', 'primary_address.city')}
              {renderInline('State', 'primary_address.state')}
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">ZIP</Label>
                <ZipInput value={form['primary_address.zip'] || ''} onValueChange={(val) => set('primary_address.zip', val)} className="h-7 text-xs" />
              </div>
              <div className="pt-2 space-y-1.5">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Mailing Address</h3>
                {renderCheckbox('Same as Primary', 'mailing_same_as_primary')}
                {renderInline('Street', 'mailing.street', 'text', isSameAsPrimary)}
                {renderInline('City', 'mailing.city', 'text', isSameAsPrimary)}
                {renderInline('State', 'mailing.state', 'text', isSameAsPrimary)}
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs">ZIP</Label>
                  <ZipInput value={form['mailing.zip'] || ''} onValueChange={(val) => set('mailing.zip', val)} disabled={isSameAsPrimary} className="h-7 text-xs" />
                </div>
              </div>
              <div className="pt-2 space-y-1">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Options</h3>
                {renderCheckbox('ACH', 'ach')}
                {renderCheckbox('Agreement on File', 'servicing_agreement_on_file')}
                {renderCheckbox('Frozen', 'freeze_outgoing_disbursements')}
                {renderCheckbox('Investor Questionnaire Due', 'investor_questionnaire_due')}
              </div>
            </div>

            {/* Column 3: Phone + Delivery + Send */}
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
                  <PhoneInput
                    value={form[p.phoneKey] || ''}
                    onValueChange={(v) => set(p.phoneKey, v)}
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
          </div>

          {/* Vesting - full width at bottom */}
          <div className="mt-4 space-y-1.5">
            <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Vesting</h3>
            <Textarea
              value={form['vesting'] || ''}
              onChange={(e) => set('vesting', e.target.value)}
              rows={3}
              className="resize-none w-full text-xs"
            />
          </div>
          </div>
          </>
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
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">Email</Label>
                <EmailInput value={form['email'] || ''} onValueChange={(v) => set('email', v)} className="h-7 text-xs" />
              </div>
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
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">ZIP</Label>
                <ZipInput value={form['address.zip'] || ''} onValueChange={(val) => set('address.zip', val)} className="h-7 text-xs" />
              </div>
              <div className="pt-2 space-y-1.5">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Mailing Address</h3>
                {renderCheckbox('Same as Primary', 'mailing_same_as_primary')}
                {renderInline('Street', 'mailing.street', 'text', isSameAsPrimary)}
                {renderInline('City', 'mailing.city', 'text', isSameAsPrimary)}
                {renderInline('State', 'mailing.state', 'text', isSameAsPrimary)}
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs">ZIP</Label>
                  <ZipInput value={form['mailing.zip'] || ''} onValueChange={(val) => set('mailing.zip', val)} disabled={isSameAsPrimary} className="h-7 text-xs" />
                </div>
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
                  <PhoneInput
                    value={form[p.phoneKey] || ''}
                    onValueChange={(v) => set(p.phoneKey, v)}
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
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">Tax ID Type</Label>
                <Select value={form['tax_id_type'] || ''} onValueChange={(v) => set('tax_id_type', v)}>
                  <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-background border border-border z-[200]">
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
        )}

        {contactType === 'borrower' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-6 gap-y-0">
            {/* Column 1: Name / Details */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Name</h3>
              {renderSelect('Borrower Type', 'borrower_type', BORROWER_TYPE_OPTIONS)}
              {renderInline('Full Name', 'full_name')}
              {renderInline('First', 'first_name')}
              {renderInline('Middle', 'middle_initial')}
              {renderInline('Last', 'last_name')}
              
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">Email</Label>
                <EmailInput value={form['email'] || ''} onValueChange={(v) => set('email', v)} className="h-7 text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">DOB</Label>
                <Popover open={borrowerDobOpen} onOpenChange={setBorrowerDobOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-7 text-xs flex-1 justify-start font-normal", !form['dob'] && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {form['dob'] || 'dd-mm-yyyy'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[200]" align="start">
                    <Calendar
                      mode="single"
                      selected={form['dob'] ? new Date(form['dob']) : undefined}
                      onSelect={(date) => {
                        set('dob', date ? format(date, 'dd-MM-yyyy') : '');
                        setBorrowerDobOpen(false);
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="pt-2 space-y-1">
                {renderCheckbox('Hold', 'hold')}
                {renderCheckbox('ACH', 'ach')}
                {renderCheckbox('Agreement on File', 'agreement_on_file')}
                {renderCheckbox('Send 1099', 'issue_1099')}
              </div>
            </div>

            {/* Column 2: Primary Address + Mailing */}
            <div className="space-y-1.5">
              <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Primary Address</h3>
              {renderInline('Street', 'address.street')}
              {renderInline('City', 'address.city')}
              {renderInline('State', 'address.state')}
              <div className="flex items-center gap-2">
                <Label className="w-[100px] shrink-0 text-xs">ZIP</Label>
                <ZipInput value={form['address.zip'] || ''} onValueChange={(val) => set('address.zip', val)} className="h-7 text-xs" />
              </div>
              <div className="pt-2 space-y-1.5">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Mailing Address</h3>
                {renderCheckbox('Same as Primary', 'mailing_same_as_primary')}
                {renderInline('Street', 'mailing.street', 'text', isSameAsPrimary)}
                {renderInline('City', 'mailing.city', 'text', isSameAsPrimary)}
                {renderInline('State', 'mailing.state', 'text', isSameAsPrimary)}
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs">ZIP</Label>
                  <ZipInput value={form['mailing.zip'] || ''} onValueChange={(val) => set('mailing.zip', val)} disabled={isSameAsPrimary} className="h-7 text-xs" />
                </div>
              </div>
            </div>

            {/* Column 3: Phone + Tax Info */}
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
                  <PhoneInput
                    value={form[p.phoneKey] || ''}
                    onValueChange={(v) => set(p.phoneKey, v)}
                    className="h-7 text-xs flex-1"
                  />
                  <Checkbox
                    checked={form[p.prefKey] === 'true'}
                    onCheckedChange={(checked) => set(p.prefKey, String(!!checked))}
                  />
                </div>
              ))}
              <div className="pt-2 space-y-1">
                <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-1">Tax Info</h3>
                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-xs">Tax ID Type</Label>
                  <Select value={form['tax_id_type'] || ''} onValueChange={(v) => set('tax_id_type', v)}>
                    <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-background border border-border z-[200]">
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
          </div>
        )}

        <DialogFooter className={contactType === 'lender' ? "shrink-0" : undefined}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!hasAtLeastOneFieldFilled(form, ['mailing_same_as_primary', 'preferred.home', 'preferred.work', 'preferred.cell', 'preferred.fax', 'delivery.print', 'delivery.email', 'delivery.sms', 'send_pref.payment_notification', 'send_pref.late_notice', 'send_pref.borrower_statement', 'send_pref.maturity_notice']) || !hasValidContactEmails(form)}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent className="z-[9999]">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Create {typeLabel}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to create this new {contactType} contact? Please verify the entered data is correct.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};