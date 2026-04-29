import React from 'react';
import LenderCharges from '@/components/contacts/lender-detail/LenderCharges';

interface BrokerChargesProps {
  brokerId: string;
  contactDbId: string;
  disabled?: boolean;
}

// Mirror of Lender > Charges. Uses identical UI + persistence
// (contact_data._charges + _charges_history on the contacts row),
// scoped to the current broker contact_id so saved data populates back.
const BrokerCharges: React.FC<BrokerChargesProps> = ({ brokerId, contactDbId, disabled }) => {
  return <LenderCharges lenderId={brokerId} contactDbId={contactDbId} disabled={disabled} />;
};

export default BrokerCharges;
