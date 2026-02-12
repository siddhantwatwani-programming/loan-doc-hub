import React from 'react';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface LenderFundingFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const LenderFundingForm: React.FC<LenderFundingFormProps> = () => {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Brush Script MT', cursive" }}>
          Coming
        </h1>
        <p className="text-3xl font-extrabold uppercase tracking-widest text-foreground/80">
          SOON
        </p>
        <p className="text-sm text-muted-foreground pt-2">
          This section is under development. Data will be available soon.
        </p>
      </div>
    </div>
  );
};

export default LenderFundingForm;
