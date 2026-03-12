import React, { useState, useCallback } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactLenderSubNav, type ContactLenderSubSection } from './ContactLenderSubNav';
import { LenderInfoForm } from '@/components/deal/LenderInfoForm';
import { LenderAuthorizedPartyForm } from '@/components/deal/LenderAuthorizedPartyForm';
import { LenderBankingForm } from '@/components/deal/LenderBankingForm';
import { LenderTaxInfoForm } from '@/components/deal/LenderTaxInfoForm';
import { DirtyFieldsProvider } from '@/contexts/DirtyFieldsContext';
import type { ContactRecord } from '@/hooks/useContactsCrud';

interface ContactLenderDetailLayoutProps {
  contact: ContactRecord;
  onBack: () => void;
  onSave: (id: string, contactData: Record<string, string>) => Promise<boolean>;
}

const ContactLenderDetailLayout: React.FC<ContactLenderDetailLayoutProps> = ({
  contact,
  onBack,
  onSave,
}) => {
  const [activeSection, setActiveSection] = useState<ContactLenderSubSection>('lender_info');
  const [values, setValues] = useState<Record<string, string>>(() => {
    // Map contact_data keys to lender-prefixed keys for the forms
    const result: Record<string, string> = {};
    Object.entries(contact.contact_data || {}).forEach(([key, value]) => {
      // The deal forms expect keys like "lender.full_name" etc.
      result[`lender.${key}`] = value;
    });
    return result;
  });

  const handleValueChange = useCallback((fieldKey: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    // Strip the "lender." prefix and save back to contact_data
    const contactData: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      const stripped = key.replace(/^lender\./, '');
      contactData[stripped] = value;
    });
    await onSave(contact.id, contactData);
  }, [values, contact.id, onSave]);

  const emptyFields: any[] = [];
  const emptyDirty = new Set<string>();

  const renderContent = () => {
    switch (activeSection) {
      case 'lender_info':
        return (
          <LenderInfoForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      case 'authorized_party':
        return (
          <LenderAuthorizedPartyForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      case 'banking':
        return (
          <LenderBankingForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      case 'tax_info':
        return (
          <LenderTaxInfoForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Lenders
          </Button>
          <h3 className="font-semibold text-lg text-foreground">
            {contact.full_name || 'Lender Detail'} — {contact.contact_id}
          </h3>
        </div>
        <Button size="sm" onClick={handleSave} className="gap-1">
          <Save className="h-4 w-4" /> Save Draft
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <ContactLenderSubNav activeSubSection={activeSection} onSubSectionChange={setActiveSection} />
        <div className="flex-1 overflow-auto">
          <DirtyFieldsProvider dirtyFieldKeys={emptyDirty}>
            {renderContent()}
          </DirtyFieldsProvider>
        </div>
      </div>
    </div>
  );
};

export default ContactLenderDetailLayout;
