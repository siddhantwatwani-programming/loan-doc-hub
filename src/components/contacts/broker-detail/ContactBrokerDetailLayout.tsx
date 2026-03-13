import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logContactEvent, type ContactFieldChange } from '@/hooks/useContactEventJournal';
import BrokerDetailSidebar, { type BrokerSection } from './BrokerDetailSidebar';
import { BrokerInfoForm } from '@/components/deal/BrokerInfoForm';
import { BrokerBankingForm } from '@/components/deal/BrokerBankingForm';
import BrokerDashboard from './BrokerDashboard';
import BrokerPortfolio from './BrokerPortfolio';
import BrokerHistory from './BrokerHistory';
import BrokerCharges from './BrokerCharges';
import BrokerTrustLedger from './BrokerTrustLedger';
import BrokerConversationLog from './BrokerConversationLog';
import Broker1099 from './Broker1099';
import BrokerAuthorizedParty from './BrokerAuthorizedParty';
import BrokerAttachments from './BrokerAttachments';
import BrokerEventsJournal from './BrokerEventsJournal';
import { DirtyFieldsProvider } from '@/contexts/DirtyFieldsContext';
import type { ContactRecord } from '@/hooks/useContactsCrud';
import type { ContactBroker } from '@/pages/contacts/ContactBrokersPage';

interface ContactBrokerDetailLayoutProps {
  contact: ContactRecord;
  onBack: () => void;
  onSave: (id: string, contactData: Record<string, string>) => Promise<boolean>;
}

const ContactBrokerDetailLayout: React.FC<ContactBrokerDetailLayoutProps> = ({
  contact,
  onBack,
  onSave,
}) => {
  const [activeSection, setActiveSection] = useState<BrokerSection>('broker');
  const [values, setValues] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    Object.entries(contact.contact_data || {}).forEach(([key, value]) => {
      result[`broker.${key}`] = value;
    });
    return result;
  });

  const initialValuesRef = useRef<Record<string, string>>({ ...values });

  const handleValueChange = useCallback((fieldKey: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    const contactData: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      const stripped = key.replace(/^broker\./, '');
      contactData[stripped] = value;
    });

    // Detect changes for event journal
    const changes: ContactFieldChange[] = [];
    const allKeys = new Set([...Object.keys(values), ...Object.keys(initialValuesRef.current)]);
    allKeys.forEach(key => {
      const oldVal = initialValuesRef.current[key] || '';
      const newVal = values[key] || '';
      if (oldVal !== newVal) {
        const label = key.replace(/^broker\./, '').replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        changes.push({ fieldLabel: label, oldValue: oldVal, newValue: newVal });
      }
    });

    const saved = await onSave(contact.id, contactData);
    if (saved && changes.length > 0) {
      await logContactEvent(contact.id, 'Broker Info', changes);
      initialValuesRef.current = { ...values };
    }
  }, [values, contact.id, onSave]);

  // Build a ContactBroker object from contact_data for components that need it
  const brokerObj: ContactBroker = {
    id: contact.id,
    brokerId: contact.contact_id || '',
    hold: (contact.contact_data as any)?.hold === 'true',
    type: (contact.contact_data as any)?.type || '',
    ach: (contact.contact_data as any)?.ach === 'true',
    email: contact.email || '',
    agreement: (contact.contact_data as any)?.agreement_on_file === 'true',
    fullName: contact.full_name || '',
    firstName: contact.first_name || '',
    lastName: contact.last_name || '',
    city: contact.city || '',
    state: contact.state || '',
    cellPhone: (contact.contact_data as any)?.['phone.cell'] || '',
    homePhone: (contact.contact_data as any)?.['phone.home'] || '',
    workPhone: (contact.contact_data as any)?.['phone.work'] || '',
    fax: (contact.contact_data as any)?.['phone.fax'] || '',
    preferredPhone: (contact.contact_data as any)?.preferred_phone || '',
    verified: (contact.contact_data as any)?.tin_verified === 'true',
    send1099: (contact.contact_data as any)?.send_1099 === 'true',
    tin: (contact.contact_data as any)?.tin || '',
    street: (contact.contact_data as any)?.['primary_address.street'] || '',
    zip: (contact.contact_data as any)?.['primary_address.zip'] || '',
    mailingStreet: (contact.contact_data as any)?.['mailing_address.street'] || '',
    mailingCity: (contact.contact_data as any)?.['mailing_address.city'] || '',
    mailingState: (contact.contact_data as any)?.['mailing_address.state'] || '',
    mailingZip: (contact.contact_data as any)?.['mailing_address.zip'] || '',
    sameAsPrimary: (contact.contact_data as any)?.mailing_same_as_primary === 'true',
  };

  const emptyDirty = new Set<string>();

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="p-6">
            <BrokerInfoForm
              disabled={false}
              values={values}
              onValueChange={handleValueChange}
            />
          </div>
        );
      case 'portfolio':
        return (
          <div className="p-6">
            <BrokerPortfolio brokerId={contact.contact_id} contactDbId={contact.id} />
          </div>
        );
      case 'history':
        return (
          <div className="p-6">
            <BrokerHistory brokerId={contact.contact_id} />
          </div>
        );
      case 'charges':
        return (
          <div className="p-6">
            <BrokerCharges brokerId={contact.contact_id} contactDbId={contact.id} />
          </div>
        );
      case 'trust-ledger':
        return (
          <div className="p-6">
            <BrokerTrustLedger brokerId={contact.contact_id} contactDbId={contact.id} />
          </div>
        );
      case 'conversation-log':
        return (
          <div className="p-6">
            <BrokerConversationLog brokerId={contact.contact_id} contactDbId={contact.id} />
          </div>
        );
      case 'banking':
        return (
          <div className="p-6">
            <BrokerBankingForm
              disabled={false}
              values={values}
              onValueChange={handleValueChange}
            />
          </div>
        );
      case '1099':
        return (
          <div className="p-6">
            <Broker1099 broker={brokerObj} onUpdate={() => {}} />
          </div>
        );
      case 'authorized-party':
        return (
          <div className="p-6">
            <BrokerAuthorizedParty brokerId={contact.contact_id} />
          </div>
        );
      case 'attachments':
        return (
          <div className="p-6">
            <BrokerAttachments brokerId={contact.contact_id} contactDbId={contact.id} />
          </div>
        );
      case 'events-journal':
        return (
          <div className="p-6">
            <BrokerEventsJournal brokerId={contact.contact_id} contactDbId={contact.id} />
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
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Brokers
          </Button>
          <h3 className="font-semibold text-lg text-foreground">
            Broker Details — {contact.contact_id}
          </h3>
        </div>
        <Button size="sm" onClick={handleSave} className="gap-1">
          <Save className="h-4 w-4" /> Save Draft
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <BrokerDetailSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 overflow-auto">
          <DirtyFieldsProvider dirtyFieldKeys={emptyDirty}>
            {renderContent()}
          </DirtyFieldsProvider>
        </div>
      </div>
    </div>
  );
};

export default ContactBrokerDetailLayout;
