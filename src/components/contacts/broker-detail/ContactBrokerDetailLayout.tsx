import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { SaveConfirmationDialog } from '@/components/workspace/SaveConfirmationDialog';
import { ArrowLeft, Save } from 'lucide-react';
import { useContactWorkspaceOptional } from '@/contexts/ContactWorkspaceContext';
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
import BrokerTaxInfo from './BrokerTaxInfo';
import BrokerAuthorizedParty from './BrokerAuthorizedParty';
import BrokerAttachments from './BrokerAttachments';
import BrokerEventsJournal from './BrokerEventsJournal';
import { DirtyFieldsProvider } from '@/contexts/DirtyFieldsContext';
import type { ContactRecord } from '@/hooks/useContactsCrud';
import type { ContactBroker } from '@/pages/contacts/ContactBrokersPage';
import { useFormPermissions } from '@/hooks/useFormPermissions';

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
  const { loading: permissionsLoading, isFormViewOnly } = useFormPermissions();
  const [activeSection, setActiveSection] = useState<BrokerSection>('broker');
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const isReadOnly = permissionsLoading || isFormViewOnly('broker');
  const [values, setValues] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    Object.entries(contact.contact_data || {}).forEach(([key, value]) => {
      result[`broker.${key}`] = value;
    });
    if (!result['broker.id']) {
      result['broker.id'] = contact.contact_id;
    }
    return result;
  });

  const initialValuesRef = useRef<Record<string, string>>({ ...values });
  const isDirty = useMemo(() => JSON.stringify(values) !== JSON.stringify(initialValuesRef.current), [values]);

  const handleValueChange = useCallback((fieldKey: string, value: string) => {
    if (isReadOnly) return;
    setValues(prev => ({ ...prev, [fieldKey]: value }));
  }, [isReadOnly]);

  const handleSave = useCallback(async (): Promise<boolean> => {
    if (isReadOnly) return false;
    const contactData: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      const stripped = key.replace(/^broker\./, '');
      contactData[stripped] = value;
    });
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
    }
    if (saved) initialValuesRef.current = { ...values };
    return !!saved;
  }, [values, contact.id, onSave, isReadOnly]);

  const contactWs = useContactWorkspaceOptional();
  useEffect(() => { if (contactWs) contactWs.setContactDirty(contact.id, isDirty); }, [isDirty, contact.id, contactWs]);
  useEffect(() => {
    if (!contactWs) return;
    contactWs.registerSaveFn(contact.id, handleSave);
    return () => contactWs.unregisterSaveFn(contact.id);
  }, [contactWs, contact.id, handleSave]);

  // Build a ContactBroker object from contact_data for components that need it
  const brokerObj: ContactBroker = {
    id: contact.id,
    brokerId: contact.contact_id || '',
    hold: (contact.contact_data as any)?.hold === 'true',
    type: (contact.contact_data as any)?.company || (contact.contact_data as any)?.type || '',
    ach: (contact.contact_data as any)?.ach === 'true',
    email: contact.email || '',
    agreement: (contact.contact_data as any)?.agreement_on_file === 'true',
    repPhone: (contact.contact_data as any)?.rep_phone || '',
    repEmail: (contact.contact_data as any)?.rep_email || '',
    repLicense: (contact.contact_data as any)?.rep_license || '',
    firstName: contact.first_name || '',
    lastName: contact.last_name || '',
    city: contact.city || '',
    state: contact.state || '',
    cellPhone: (contact.contact_data as any)?.['phone.cell'] || '',
    homePhone: (contact.contact_data as any)?.['phone.home'] || '',
    workPhone: (contact.contact_data as any)?.['phone.work'] || '',
    fax: (contact.contact_data as any)?.['phone.fax'] || '',
    preferredPhone: (() => {
      const cd = contact.contact_data as any;
      if (cd?.['preferred.home'] === 'true') return 'Home';
      if (cd?.['preferred.work'] === 'true') return 'Work';
      if (cd?.['preferred.cell'] === 'true') return 'Cell';
      if (cd?.['preferred.fax'] === 'true') return 'Fax';
      return cd?.preferred_phone || '';
    })(),
    verified: (contact.contact_data as any)?.tin_verified === 'true',
    send1099: (contact.contact_data as any)?.send_1099 === 'true',
    
    street: (contact.contact_data as any)?.['address.street'] || (contact.contact_data as any)?.['primary_address.street'] || '',
    zip: (contact.contact_data as any)?.['address.zip'] || (contact.contact_data as any)?.['primary_address.zip'] || '',
    mailingStreet: (contact.contact_data as any)?.['mailing_address.street'] || '',
    mailingCity: (contact.contact_data as any)?.['mailing_address.city'] || '',
    mailingState: (contact.contact_data as any)?.['mailing_address.state'] || '',
    mailingZip: (contact.contact_data as any)?.['mailing_address.zip'] || '',
    sameAsPrimary: (contact.contact_data as any)?.mailing_same_as_primary === 'true',
    company: (contact.contact_data as any)?.company || contact.company || '',
    license: (contact.contact_data as any)?.License || (contact.contact_data as any)?.license || '',
    brokersRepresentative: (contact.contact_data as any)?.brokers_representative || '',
  };

  const emptyDirty = new Set<string>();

  const renderContent = () => {
    switch (activeSection) {
      case 'broker':
        return (
          <div className="p-6">
            <BrokerInfoForm
              disabled={isReadOnly}
              values={values}
              onValueChange={handleValueChange}
            />
          </div>
        );
      case 'dashboard':
        return (
          <div className="p-6">
            <BrokerDashboard broker={brokerObj} onUpdate={() => {}} />
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
            <BrokerHistory brokerId={contact.contact_id} contactDbId={contact.id} />
          </div>
        );
      case 'charges':
        return (
          <div className="p-6">
            <BrokerCharges brokerId={contact.contact_id} contactDbId={contact.id} disabled={isReadOnly} />
          </div>
        );
      case 'trust-ledger':
        return (
          <div className="p-6">
            <BrokerTrustLedger brokerId={contact.contact_id} contactDbId={contact.id} disabled={isReadOnly} />
          </div>
        );
      case 'conversation-log':
        return (
          <div className="p-6">
            <BrokerConversationLog brokerId={contact.contact_id} contactDbId={contact.id} disabled={isReadOnly} />
          </div>
        );
      case 'banking':
        return (
          <div className="p-6">
            <BrokerBankingForm
              disabled={isReadOnly}
              values={values}
              onValueChange={handleValueChange}
            />
          </div>
        );
      case 'tax-info':
        return (
          <div className="p-6">
            <BrokerTaxInfo
              values={values}
              onValueChange={handleValueChange}
              disabled={isReadOnly}
            />
          </div>
        );
      case '1099':
        return (
          <div className="p-6">
            <Broker1099
              values={values}
              onValueChange={handleValueChange}
              onSave={async () => { await handleSave(); }}
              disabled={isReadOnly}
            />
          </div>
        );
      case 'authorized-party':
        return (
          <div className="p-6">
            <BrokerAuthorizedParty brokerId={contact.contact_id} disabled={isReadOnly} />
          </div>
        );
      case 'attachments':
        return (
          <div className="p-6">
            <BrokerAttachments brokerId={contact.contact_id} contactDbId={contact.id} disabled={isReadOnly} />
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
            Broker — {contact.contact_id}
          </h3>
        </div>
        {!isReadOnly && isDirty && (
          <Button size="sm" onClick={() => setShowSaveConfirm(true)} className="gap-1">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        )}
      </div>
      <div className="flex flex-1 overflow-hidden">
        <BrokerDetailSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 overflow-auto">
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

export default ContactBrokerDetailLayout;
