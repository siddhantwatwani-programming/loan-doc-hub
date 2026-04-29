import React from 'react';
import LenderConversationLog from '@/components/contacts/lender-detail/LenderConversationLog';

interface BrokerConversationLogProps {
  brokerId: string;
  contactDbId: string;
  disabled?: boolean;
}

// Mirror of Lender > Conversation Log. Uses identical UI + persistence
// (contact_data._conversation_logs on the contacts row), scoped to the
// current broker contact_id so saved entries populate back.
const BrokerConversationLog: React.FC<BrokerConversationLogProps> = ({ brokerId, contactDbId, disabled }) => {
  return <LenderConversationLog lenderId={brokerId} contactDbId={contactDbId} disabled={disabled} />;
};

export default BrokerConversationLog;
