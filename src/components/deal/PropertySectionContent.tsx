import React, { useState } from 'react';
import { PropertySubNavigation, type PropertySubSection } from './PropertySubNavigation';
import { PropertyDetailsForm } from './PropertyDetailsForm';
import { PropertyLegalDescriptionForm } from './PropertyLegalDescriptionForm';
import { PropertyLiensForm } from './PropertyLiensForm';
import { PropertyInsuranceForm } from './PropertyInsuranceForm';
import { PropertyTaxForm } from './PropertyTaxForm';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface PropertySectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const PropertySectionContent: React.FC<PropertySectionContentProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [activeSubSection, setActiveSubSection] = useState<PropertySubSection>('property_details');

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'property_details':
        return (
          <PropertyDetailsForm
            fields={fields}
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'legal_description':
        return (
          <PropertyLegalDescriptionForm
            fields={fields}
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'liens':
        return (
          <PropertyLiensForm
            fields={fields}
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'insurance':
        return (
          <PropertyInsuranceForm
            fields={fields}
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'property_tax':
        return (
          <PropertyTaxForm
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
      <PropertySubNavigation
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

export default PropertySectionContent;
