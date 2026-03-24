import React, { useState, useCallback } from 'react';
import { SaveConfirmationDialog } from '@/components/workspace/SaveConfirmationDialog';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BorrowerDetailSidebar, { type BorrowerSection } from './BorrowerDetailSidebar';
import { BorrowerPrimaryForm } from '@/components/deal/BorrowerPrimaryForm';
import { BorrowerAdditionalGuarantorForm } from '@/components/deal/BorrowerAdditionalGuarantorForm';
import { BorrowerAuthorizedPartyForm } from '@/components/deal/BorrowerAuthorizedPartyForm';
import { BorrowerBankingForm } from '@/components/deal/BorrowerBankingForm';
import { BorrowerTaxDetailForm } from '@/components/deal/BorrowerTaxDetailForm';
import BorrowerTrustLedger from './BorrowerTrustLedger';
import BorrowerDashboard from './BorrowerDashboard';
import BorrowerPortfolio from './BorrowerPortfolio';
import BorrowerHistory from './BorrowerHistory';
import BorrowerCharges from './BorrowerCharges';
import BorrowerConversationLog from './BorrowerConversationLog';
import BorrowerAttachments from './BorrowerAttachments';
import BorrowerEventsJournal from './BorrowerEventsJournal';
import { DirtyFieldsProvider } from '@/contexts/DirtyFieldsContext';
import type { ContactRecord } from '@/hooks/useContactsCrud';
import { logContactEvent, type ContactFieldChange } from '@/hooks/useContactEventJournal';

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
  const [activeSection, setActiveSection] = useState<BorrowerSection>('borrower');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const NON_BORROWER_PREFIXES = ['ach.', 'coborrower.', 'borrower.guarantor.', 'borrower.authorized_party.', 'borrower.1098.'];

  const [values, setValues] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    Object.entries(contact.contact_data || {}).forEach(([key, value]) => {
      if (typeof value !== 'string') return;
      const needsPrefix = !NON_BORROWER_PREFIXES.some(p => key.startsWith(p)) && !key.startsWith('borrower.');
      result[needsPrefix ? `borrower.${key}` : key] = value;
    });
    if (!result['borrower.borrower_id']) {
      result['borrower.borrower_id'] = contact.contact_id;
    }
    return result;
  });

  const handleValueChange = useCallback((fieldKey: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    const contactData: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      const stripped = NON_BORROWER_PREFIXES.some(p => key.startsWith(p)) ? key : key.replace(/^borrower\./, '');
      contactData[stripped] = value;
    });
    await onSave(contact.id, contactData);
  }, [values, contact.id, onSave]);

  const emptyFields: any[] = [];
  const emptyDirty = new Set<string>();

  const renderContent = () => {
    switch (activeSection) {
      case 'borrower':
        return (
          <BorrowerPrimaryForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      case 'dashboard':
        return <BorrowerDashboard contact={contact} />;
      case 'portfolio':
        return <BorrowerPortfolio borrowerId={contact.contact_id} contactDbId={contact.id} />;
      case 'history':
        return <BorrowerHistory borrowerId={contact.contact_id} contactDbId={contact.id} />;
      case 'charges':
        return <BorrowerCharges borrowerId={contact.contact_id} contactDbId={contact.id} />;
      case 'banking':
        return (
          <BorrowerBankingForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      case '1098':
        return (
          <BorrowerTaxDetailForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      case 'authorized-party':
        return (
          <BorrowerAuthorizedPartyForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      case 'trust-ledger':
        return (
          <BorrowerTrustLedger
            borrowerId={contact.contact_id}
            contactDbId={contact.id}
          />
        );
      case 'conversation-log':
        return <BorrowerConversationLog borrowerId={contact.contact_id} contactDbId={contact.id} />;
      case 'attachments':
        return <BorrowerAttachments borrowerId={contact.contact_id} contactDbId={contact.id} />;
      case 'events-journal':
        return <BorrowerEventsJournal borrowerId={contact.contact_id} contactDbId={contact.id} />;
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
          Borrower — {contact.contact_id}
          </h3>
        </div>
        <Button size="sm" onClick={() => setShowSaveConfirm(true)} className="gap-1">
          <Save className="h-4 w-4" /> Save Draft
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <BorrowerDetailSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 overflow-auto p-4">
          <DirtyFieldsProvider dirtyFieldKeys={emptyDirty}>
            {renderContent()}
          </DirtyFieldsProvider>
        </div>
      </div>
      <SaveConfirmationDialog
        open={showSaveConfirm}
        onConfirm={() => { setShowSaveConfirm(false); handleSave(); }}
        onCancel={() => setShowSaveConfirm(false)}
      />
    </div>
  );
};

export default ContactBorrowerDetailLayout;
