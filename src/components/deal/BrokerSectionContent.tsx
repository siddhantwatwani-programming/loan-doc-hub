import React, { useState } from 'react';
import { BrokerSubNavigation, BrokerSubSection } from './BrokerSubNavigation';
import { BrokerInfoForm } from './BrokerInfoForm';
import { BrokerBankingForm } from './BrokerBankingForm';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface BrokerSectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const BrokerSectionContent: React.FC<BrokerSectionContentProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [activeSubSection, setActiveSubSection] = useState<BrokerSubSection>('broker');

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'broker':
        return <BrokerInfoForm disabled={disabled} />;
      case 'banking':
        return <BrokerBankingForm disabled={disabled} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex overflow-hidden rounded-lg border border-border">
      <BrokerSubNavigation
        activeSubSection={activeSubSection}
        onSubSectionChange={setActiveSubSection}
      />
      <div className="flex-1 p-6 overflow-y-auto">
        {renderSubSectionContent()}
      </div>
    </div>
  );
};

export default BrokerSectionContent;
