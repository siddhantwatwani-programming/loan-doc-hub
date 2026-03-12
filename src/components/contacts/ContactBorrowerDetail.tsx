import React, { useState, useCallback } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BorrowerPrimaryForm } from '@/components/deal/BorrowerPrimaryForm';
import { BorrowerBankingForm } from '@/components/deal/BorrowerBankingForm';
import { BorrowerTaxDetailForm } from '@/components/deal/BorrowerTaxDetailForm';
import { BorrowerAuthorizedPartyForm } from '@/components/deal/BorrowerAuthorizedPartyForm';
import { DirtyFieldsProvider } from '@/contexts/DirtyFieldsContext';
import { updateContact, type ContactRecord } from '@/hooks/useContactsList';
import { toast } from '@/hooks/use-toast';

type SubSection = 'primary' | 'authorized_party' | 'banking' | 'tax_detail';

const SECTIONS: { key: SubSection; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'authorized_party', label: 'Authorized Party' },
  { key: 'banking', label: 'Banking' },
  { key: 'tax_detail', label: '1098' },
];

interface Props {
  contact: ContactRecord;
  onBack: () => void;
  onUpdated: (contact: ContactRecord) => void;
}

export const ContactBorrowerDetail: React.FC<Props> = ({ contact, onBack, onUpdated }) => {
  const [activeSection, setActiveSection] = useState<SubSection>('primary');
  const [values, setValues] = useState<Record<string, string>>(() => {
    const data = contact.contact_data || {};
    const result: Record<string, string> = {};
    Object.entries(data).forEach(([k, v]) => {
      result[k] = String(v ?? '');
    });
    return result;
  });
  const [saving, setSaving] = useState(false);

  const handleValueChange = useCallback((fieldKey: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const fullName = values['borrower.full_name'] || '';
      const firstName = values['borrower.first_name'] || '';
      const lastName = values['borrower.last_name'] || '';
      const email = values['borrower.email'] || '';
      const phone = values['borrower.phone.mobile'] || values['borrower.phone.home'] || '';
      const city = values['borrower.address.city'] || '';
      const state = values['borrower.state'] || '';

      const updated = await updateContact(contact.id, {
        full_name: fullName || `${firstName} ${lastName}`.trim(),
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        city,
        state,
        contact_data: values,
      });
      if (updated) {
        onUpdated(updated);
        toast({ title: 'Contact saved', description: 'Borrower contact updated successfully.' });
      }
    } catch (err) {
      console.error('Error saving contact:', err);
      toast({ title: 'Error', description: 'Failed to save contact.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }, [contact.id, values, onUpdated]);

  const renderContent = () => {
    const commonProps = { fields: [] as any[], values, onValueChange: handleValueChange, disabled: false, calculationResults: {} };
    switch (activeSection) {
      case 'primary': return <BorrowerPrimaryForm {...commonProps} />;
      case 'authorized_party': return <BorrowerAuthorizedPartyForm {...commonProps} />;
      case 'banking': return <BorrowerBankingForm {...commonProps} />;
      case 'tax_detail': return <BorrowerTaxDetailForm {...commonProps} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 h-8">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <span className="text-sm font-medium text-foreground">
            {contact.full_name || contact.contact_id}
          </span>
          <span className="text-xs text-muted-foreground">({contact.contact_id})</span>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-col border-r border-border bg-background min-w-[180px]">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors text-left border-l-2',
                activeSection === s.key
                  ? 'border-primary text-foreground bg-muted/30'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex-1 min-w-0 overflow-auto">
          <DirtyFieldsProvider dirtyFieldKeys={new Set()}>
            {renderContent()}
          </DirtyFieldsProvider>
        </div>
      </div>
    </div>
  );
};
