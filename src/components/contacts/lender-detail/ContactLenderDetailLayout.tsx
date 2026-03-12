import React, { useState, useCallback } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LenderDetailSidebar, { type LenderSection } from './LenderDetailSidebar';
import { LenderInfoForm } from '@/components/deal/LenderInfoForm';
import { LenderAuthorizedPartyForm } from '@/components/deal/LenderAuthorizedPartyForm';
import { LenderBankingForm } from '@/components/deal/LenderBankingForm';
import { LenderTaxInfoForm } from '@/components/deal/LenderTaxInfoForm';
import LenderDashboard from './LenderDashboard';
import LenderPortfolio from './LenderPortfolio';
import LenderHistory from './LenderHistory';
import LenderCharges from './LenderCharges';
import LenderTrustLedger from './LenderTrustLedger';
import LenderConversationLog from './LenderConversationLog';
import LenderAttachments from './LenderAttachments';
import LenderEventsJournal from './LenderEventsJournal';
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
  const [activeSection, setActiveSection] = useState<LenderSection>('dashboard');
  const [values, setValues] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    Object.entries(contact.contact_data || {}).forEach(([key, value]) => {
      result[`lender.${key}`] = value;
    });
    return result;
  });

  const handleValueChange = useCallback((fieldKey: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  const handleSave = useCallback(async () => {
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
      case 'dashboard':
        return (
          <div className="p-6">
            <LenderDashboard contact={contact} />
          </div>
        );
      case 'portfolio':
        return (
          <div className="p-6">
            <LenderPortfolio lenderId={contact.contact_id} />
          </div>
        );
      case 'history':
        return (
          <div className="p-6">
            <LenderHistory lenderId={contact.contact_id} />
          </div>
        );
      case 'charges':
        return (
          <div className="p-6">
            <LenderCharges lenderId={contact.contact_id} contactDbId={contact.id} />
          </div>
        );
      case 'trust-ledger':
        return (
          <div className="p-6">
            <LenderTrustLedger lenderId={contact.contact_id} />
          </div>
        );
      case 'conversation-log':
        return (
          <div className="p-6">
            <LenderConversationLog lenderId={contact.contact_id} />
          </div>
        );
      case 'lender-info':
        return (
          <LenderInfoForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      case 'authorized-party':
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
      case '1099':
        return (
          <LenderTaxInfoForm
            fields={emptyFields}
            values={values}
            onValueChange={handleValueChange}
            disabled={false}
          />
        );
      case 'attachments':
        return (
          <div className="p-6">
            <LenderAttachments lenderId={contact.contact_id} />
          </div>
        );
      case 'events-journal':
        return (
          <div className="p-6">
            <LenderEventsJournal lenderId={contact.contact_id} />
          </div>
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
            Lender Details — {contact.contact_id}
          </h3>
        </div>
        <Button size="sm" onClick={handleSave} className="gap-1">
          <Save className="h-4 w-4" /> Save Draft
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <LenderDetailSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
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
