import React, { useState, useCallback } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactBorrowerSubNav, type ContactBorrowerSubSection } from './ContactBorrowerSubNav';
import { BorrowerPrimaryForm } from '@/components/deal/BorrowerPrimaryForm';
import { BorrowerAdditionalGuarantorForm } from '@/components/deal/BorrowerAdditionalGuarantorForm';
import { BorrowerAuthorizedPartyForm } from '@/components/deal/BorrowerAuthorizedPartyForm';
import { BorrowerBankingForm } from '@/components/deal/BorrowerBankingForm';
import { BorrowerTaxDetailForm } from '@/components/deal/BorrowerTaxDetailForm';
import { CoBorrowerPrimaryForm } from '@/components/deal/CoBorrowerPrimaryForm';
import BorrowerTrustLedger from './BorrowerTrustLedger';
import { DirtyFieldsProvider } from '@/contexts/DirtyFieldsContext';
import type { ContactRecord } from '@/hooks/useContactsCrud';

interface ContactBorrowerDetailLayoutProps {
  contact: ContactRecord;
  onBack: () => void;
  onSave: (id: string, contactData: Record<string, string>) => Promise<boolean>;
}

const ContactBorrowerDetailLayout: React.FC<ContactBorrowerDetailLayoutProps> = ({
  contact,
  onBack,
  onSave,
}) => {
  const [activeSection, setActiveSection] = useState<ContactBorrowerSubSection>('primary');
  const NON_BORROWER_PREFIXES = ['ach.', 'coborrower.', 'borrower.guarantor.', 'borrower.authorized_party.', 'borrower.1098.'];

  const [values, setValues] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    Object.entries(contact.contact_data || {}).forEach(([key, value]) => {
      if (typeof value !== 'string') return;
      const needsPrefix = !NON_BORROWER_PREFIXES.some(p => key.startsWith(p)) && !key.startsWith('borrower.');
      result[needsPrefix ? `borrower.${key}` : key] = value;
    });
    return result;
  });

  const handleValueChange = useCallback((fieldKey: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    const contactData: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      // Strip borrower. prefix only for primary borrower keys; keep ach.*, coborrower.*, etc. as-is
      const stripped = NON_BORROWER_PREFIXES.some(p => key.startsWith(p)) ? key : key.replace(/^borrower\./, '');
      contactData[stripped] = value;
    });
    await onSave(contact.id, contactData);
  }, [values, contact.id, onSave]);

  const emptyFields: any[] = [];
  const emptyDirty = new Set<string>();

  // Co-borrower values use coborrower.* prefix mapped from contact_data
  const coBorrowerValues = React.useMemo(() => {
    const result: Record<string, string> = {};
    Object.entries(contact.contact_data || {}).forEach(([key, value]) => {
      if (key.startsWith('coborrower.')) {
        result[`borrower.${key}`] = value;
      }
    });
    return { ...values, ...result };
  }, [contact.contact_data, values]);

  const handleCoBorrowerValueChange = useCallback((fieldKey: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  const renderContent = () => {
    switch (activeSection) {
      case 'primary':
        return (
          <BorrowerPrimaryForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      case 'co_borrower':
        return (
          <CoBorrowerPrimaryForm
            fields={emptyFields}
            values={coBorrowerValues}
            onValueChange={handleCoBorrowerValueChange}
            disabled={false}
          />
        );
      case 'additional_guarantor':
        return (
          <BorrowerAdditionalGuarantorForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      case 'authorized_party':
        return (
          <BorrowerAuthorizedPartyForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      case 'trust_ledger':
        return (
          <BorrowerTrustLedger
            borrowerId={contact.contact_id}
            contactDbId={contact.id}
          />
        );
      case 'banking':
        return (
          <BorrowerBankingForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      case 'tax_detail':
        return (
          <BorrowerTaxDetailForm
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
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Borrowers
          </Button>
          <h3 className="font-semibold text-lg text-foreground">
            Borrower Details — {contact.contact_id}
          </h3>
        </div>
        <Button size="sm" onClick={handleSave} className="gap-1">
          <Save className="h-4 w-4" /> Save Draft
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <ContactBorrowerSubNav activeSubSection={activeSection} onSubSectionChange={setActiveSection} />
        <div className="flex-1 overflow-auto">
          <DirtyFieldsProvider dirtyFieldKeys={emptyDirty}>
            {renderContent()}
          </DirtyFieldsProvider>
        </div>
      </div>
    </div>
  );
};

export default ContactBorrowerDetailLayout;
