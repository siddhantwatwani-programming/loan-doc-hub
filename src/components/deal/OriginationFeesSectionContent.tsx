import React, { useState } from 'react';
import { OriginationFeesForm } from './OriginationFeesForm';
import { OriginationFeesSubNavigation, type OriginationFeesSubSection } from './OriginationFeesSubNavigation';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface OriginationFeesSectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const OriginationFeesSectionContent: React.FC<OriginationFeesSectionContentProps> = ({
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const [activeSubSection, setActiveSubSection] = useState<OriginationFeesSubSection>('origination_fees');

  return (
    <div className="flex flex-col border border-border rounded-lg bg-background overflow-hidden">
      <div className="flex flex-1">
        <OriginationFeesSubNavigation
          activeSubSection={activeSubSection}
          onSubSectionChange={setActiveSubSection}
        />
        <div className="flex-1 min-w-0 overflow-auto min-h-[500px]">
          <OriginationFeesForm
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        </div>
      </div>
    </div>
  );
};

export default OriginationFeesSectionContent;
