import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BrokerDetailSidebar, { type BrokerSection } from './BrokerDetailSidebar';
import BrokerDashboard from './BrokerDashboard';
import BrokerPortfolio from './BrokerPortfolio';
import BrokerHistory from './BrokerHistory';
import BrokerCharges from './BrokerCharges';
import BrokerTrustLedger from './BrokerTrustLedger';
import BrokerConversationLog from './BrokerConversationLog';
import BrokerBanking from './BrokerBanking';
import Broker1099 from './Broker1099';
import BrokerAuthorizedParty from './BrokerAuthorizedParty';
import BrokerAttachments from './BrokerAttachments';
import BrokerEventsJournal from './BrokerEventsJournal';
import type { ContactBroker } from '@/pages/contacts/ContactBrokersPage';

interface BrokerDetailLayoutProps {
  broker: ContactBroker;
  onBack: () => void;
  onUpdate: (updated: ContactBroker) => void;
}

const BrokerDetailLayout: React.FC<BrokerDetailLayoutProps> = ({ broker, onBack, onUpdate }) => {
  const [activeSection, setActiveSection] = useState<BrokerSection>('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <BrokerDashboard broker={broker} onUpdate={onUpdate} />;
      case 'portfolio': return <BrokerPortfolio brokerId={broker.brokerId} />;
      case 'history': return <BrokerHistory brokerId={broker.brokerId} />;
      case 'charges': return <BrokerCharges brokerId={broker.brokerId} contactDbId="" />;
      case 'trust-ledger': return <BrokerTrustLedger brokerId={broker.brokerId} />;
      case 'conversation-log': return <BrokerConversationLog brokerId={broker.brokerId} contactDbId="" />;
      case 'banking': return <BrokerBanking broker={broker} onUpdate={onUpdate} />;
      case '1099': return <Broker1099 broker={broker} onUpdate={onUpdate} />;
      case 'authorized-party': return <BrokerAuthorizedParty brokerId={broker.brokerId} />;
      case 'attachments': return <BrokerAttachments brokerId={broker.brokerId} />;
      case 'events-journal': return <BrokerEventsJournal brokerId={broker.brokerId} />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Brokers
        </Button>
        <h3 className="font-semibold text-lg text-foreground">
          {broker.fullName || 'Broker Detail'} — {broker.brokerId}
        </h3>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <BrokerDetailSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        <div className="flex-1 overflow-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default BrokerDetailLayout;
