import React from 'react';
import { OriginationFeesForm } from './OriginationFeesForm';
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
  return (
    <div className="min-h-[500px]">
      <OriginationFeesForm
        values={values}
        onValueChange={onValueChange}
        showValidation={showValidation}
        disabled={disabled}
        calculationResults={calculationResults}
      />
    </div>
  );
};

export default OriginationFeesSectionContent;
