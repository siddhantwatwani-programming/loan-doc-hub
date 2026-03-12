import React, { useState, useCallback } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactBrokerSubNav, type ContactBrokerSubSection } from './ContactBrokerSubNav';
import { BrokerInfoForm } from '@/components/deal/BrokerInfoForm';
import { BrokerBankingForm } from '@/components/deal/BrokerBankingForm';
import { DirtyFieldsProvider } from '@/contexts/DirtyFieldsContext';
import type { ContactRecord } from '@/hooks/useContactsCrud';

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
  const [activeSection, setActiveSection] = useState<ContactBrokerSubSection>('broker_info');
  const [values, setValues] = useState<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    Object.entries(contact.contact_data || {}).forEach(([key, value]) => {
      result[`broker.${key}`] = value;
    });
    return result;
  });

  const handleValueChange = useCallback((fieldKey: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldKey]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    const contactData: Record<string, string> = {};
    Object.entries(values).forEach(([key, value]) => {
      const stripped = key.replace(/^broker\./, '');
      contactData[stripped] = value;
    });
    await onSave(contact.id, contactData);
  }, [values, contact.id, onSave]);

  const emptyDirty = new Set<string>();

  const renderContent = () => {
    switch (activeSection) {
      case 'broker_info':
        return (
          <div className="p-6">
            <BrokerInfoForm
              disabled={false}
              values={values}
              onValueChange={handleValueChange}
            />
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
            {contact.full_name || 'Broker Detail'} — {contact.contact_id}
          </h3>
        </div>
        <Button size="sm" onClick={handleSave} className="gap-1">
          <Save className="h-4 w-4" /> Save Draft
        </Button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <ContactBrokerSubNav activeSubSection={activeSection} onSubSectionChange={setActiveSection} />
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
