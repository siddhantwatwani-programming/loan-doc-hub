import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';

const FIELD_KEYS = {
  brokerId: 'broker.id',
  license: 'broker.License',
  company: 'broker.company',
  firstName: 'broker.first_name',
  middleName: 'broker.middle_name',
  lastName: 'broker.last_name',
  email: 'broker.email',
  street: 'broker.address.street',
  city: 'broker.address.city',
  state: 'broker.address.state',
  zip: 'broker.address.zip',
  taxIdType: 'broker.tax_id_type',
  taxId: 'broker.tax_id',
  issue1099: 'broker.issue_1099',
  phoneHome: 'broker.phone.home',
  phoneWork: 'broker.phone.work',
  phoneCell: 'broker.phone.cell',
  phoneFax: 'broker.phone.fax',
  paymentNotification: 'broker.send_pref.payment_notification',
  lateNotice: 'broker.send_pref.late_notice',
  lenderStatement: 'broker.send_pref.lender_statement',
  borrowerStatement: 'broker.send_pref.borrower_statement',
  maturityNotice: 'broker.send_pref.maturity_notice',
} as const;

interface BrokerInfoFormProps {
  disabled?: boolean;
  values?: Record<string, string>;
  onValueChange?: (fieldKey: string, value: string) => void;
}

export const BrokerInfoForm: React.FC<BrokerInfoFormProps> = ({ 
  disabled = false,
  values = {},
  onValueChange,
}) => {
  const getValue = (key: keyof typeof FIELD_KEYS): string => values[FIELD_KEYS[key]] || '';
  const getBoolValue = (key: keyof typeof FIELD_KEYS): boolean => values[FIELD_KEYS[key]] === 'true';

  const handleChange = (key: keyof typeof FIELD_KEYS, value: string | boolean) => {
    if (onValueChange) onValueChange(FIELD_KEYS[key], String(value));
  };

  const requiredFieldsStatus = useMemo(() => {
    const requiredFields: (keyof typeof FIELD_KEYS)[] = ['brokerId'];
    const filledCount = requiredFields.filter(field => getValue(field).trim() !== '').length;
    return { filledCount, totalRequired: requiredFields.length, missingCount: requiredFields.length - filledCount };
  }, [values]);

  const renderInlineField = (key: keyof typeof FIELD_KEYS, label: string, required = false) => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs">{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input value={getValue(key)} onChange={(e) => handleChange(key, e.target.value)} disabled={disabled} className="h-7 text-xs flex-1" />
    </div>
  );

  const renderPhoneField = (key: keyof typeof FIELD_KEYS, label: string) => (
    <div className="flex items-center gap-2">
      <Label className="w-14 shrink-0 text-xs">{label}</Label>
      <Input type="tel" value={getValue(key)} onChange={(e) => handleChange(key, e.target.value)} disabled={disabled} className="h-7 text-xs flex-1" />
    </div>
  );

  return (
    <div className="space-y-4">
      {requiredFieldsStatus.missingCount > 0 && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-1.5 text-amber-500">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{requiredFieldsStatus.missingCount} required field{requiredFieldsStatus.missingCount !== 1 ? 's' : ''} missing</span>
          </div>
          <span className="text-xs text-muted-foreground">{requiredFieldsStatus.filledCount}/{requiredFieldsStatus.totalRequired} filled</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-6 gap-y-0">
        {/* Column 1 - Name */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Name</h3>
          {renderInlineField('brokerId', 'Broker ID', true)}
          {renderInlineField('license', 'License')}
          {renderInlineField('company', 'Company')}
          {renderInlineField('firstName', 'First')}
          {renderInlineField('middleName', 'Middle')}
          {renderInlineField('lastName', 'Last')}
          {renderInlineField('email', 'Email')}
        </div>

        {/* Column 2 - Address */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Primary Address</h3>
          {renderInlineField('street', 'Street')}
          {renderInlineField('city', 'City')}
          {renderInlineField('state', 'State')}
          {renderInlineField('zip', 'ZIP')}
          {renderInlineField('taxIdType', 'Tax ID Type')}
          {renderInlineField('taxId', 'Tax ID')}
          {renderInlineField('issue1099', 'Issue 1099')}
        </div>

        {/* Column 3 - Phone */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Phone</h3>
          {renderPhoneField('phoneHome', 'Home')}
          {renderPhoneField('phoneWork', 'Work')}
          {renderPhoneField('phoneCell', 'Cell')}
          {renderPhoneField('phoneFax', 'Fax')}

          <div className="space-y-1.5 pt-3">
            <Label className="text-xs font-medium">Send:</Label>
            {[
              { key: 'paymentNotification' as const, label: 'Payment Notification' },
              { key: 'lateNotice' as const, label: 'Late Notice' },
              { key: 'lenderStatement' as const, label: 'Lender Statement' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox id={key} checked={getBoolValue(key)} onCheckedChange={(checked) => handleChange(key, !!checked)} disabled={disabled} className="h-3.5 w-3.5" />
                <Label htmlFor={key} className="text-xs font-normal cursor-pointer">{label}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Column 4 - Send Preferences */}
        <div className="space-y-1.5">
          <h3 className="font-semibold text-xs text-foreground border-b border-border pb-1 mb-2">Send Preferences</h3>
          {[
            { key: 'borrowerStatement' as const, label: 'Borrower Statement' },
            { key: 'maturityNotice' as const, label: 'Maturity Notice' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox id={key} checked={getBoolValue(key)} onCheckedChange={(checked) => handleChange(key, !!checked)} disabled={disabled} className="h-3.5 w-3.5" />
              <Label htmlFor={key} className="text-xs font-normal cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrokerInfoForm;
