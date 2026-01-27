import React, { useState } from 'react';
import { LenderSubNavigation, type LenderSubSection } from './LenderSubNavigation';
import { LenderInfoForm } from './LenderInfoForm';
import { LenderAuthorizedPartyForm } from './LenderAuthorizedPartyForm';
import { LenderFundingForm } from './LenderFundingForm';
import { LenderBankingForm } from './LenderBankingForm';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface LenderSectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const LenderSectionContent: React.FC<LenderSectionContentProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [activeSubSection, setActiveSubSection] = useState<LenderSubSection>('lender');

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'lender':
        return (
          <LenderInfoForm
            fields={fields}
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'authorized_party':
        return (
          <LenderAuthorizedPartyForm
            fields={fields}
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'funding':
        return (
          <LenderFundingForm
            fields={fields}
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'banking':
        return (
          <LenderBankingForm
            fields={fields}
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex border border-border rounded-lg bg-background overflow-hidden">
      {/* Sub-navigation tabs on the left */}
      <LenderSubNavigation
        activeSubSection={activeSubSection}
        onSubSectionChange={setActiveSubSection}
      />

      {/* Sub-section content on the right */}
      <div className="flex-1">
        {renderSubSectionContent()}
      </div>
    </div>
  );
};

export default LenderSectionContent;
