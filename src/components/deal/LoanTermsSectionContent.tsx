import React, { useState } from 'react';
import { LoanTermsSubNavigation, type LoanTermsSubSection } from './LoanTermsSubNavigation';
import { LoanTermsBalancesForm } from './LoanTermsBalancesForm';
import { LoanTermsDetailsForm } from './LoanTermsDetailsForm';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface LoanTermsSectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const LoanTermsSectionContent: React.FC<LoanTermsSectionContentProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [activeSubSection, setActiveSubSection] = useState<LoanTermsSubSection>('balances_loan_details');

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'balances_loan_details':
        return (
          <LoanTermsBalancesForm
            fields={fields}
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'details':
        return (
          <LoanTermsDetailsForm
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
    <div className="flex border border-border rounded-lg bg-background">
      {/* Sub-navigation tabs on the left */}
      <LoanTermsSubNavigation
        activeSubSection={activeSubSection}
        onSubSectionChange={setActiveSubSection}
      />

      {/* Sub-section content on the right */}
      <div className="flex-1 min-w-0 overflow-auto">
        {renderSubSectionContent()}
      </div>
    </div>
  );
};

export default LoanTermsSectionContent;
