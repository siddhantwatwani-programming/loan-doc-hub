import React, { useState } from 'react';
import { BorrowerSubNavigation, type BorrowerSubSection } from './BorrowerSubNavigation';
import { BorrowerPrimaryForm } from './BorrowerPrimaryForm';
import { BorrowerAdditionalGuarantorForm } from './BorrowerAdditionalGuarantorForm';
import { BorrowerBankingForm } from './BorrowerBankingForm';
import { BorrowerTaxDetailForm } from './BorrowerTaxDetailForm';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface BorrowerSectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const BorrowerSectionContent: React.FC<BorrowerSectionContentProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [activeSubSection, setActiveSubSection] = useState<BorrowerSubSection>('primary');

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'primary':
        return (
          <BorrowerPrimaryForm
            fields={fields}
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'additional_guarantor':
        return (
          <BorrowerAdditionalGuarantorForm
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
          <BorrowerBankingForm
            fields={fields}
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'tax_detail':
        return (
          <BorrowerTaxDetailForm
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
      <BorrowerSubNavigation
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

export default BorrowerSectionContent;
