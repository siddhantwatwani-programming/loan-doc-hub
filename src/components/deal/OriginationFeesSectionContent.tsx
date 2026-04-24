import React from 'react';
import { useDealNavigationOptional } from '@/contexts/DealNavigationContext';
import { OriginationFeesForm } from './OriginationFeesForm';
import { OriginationApplicationForm } from './OriginationApplicationForm';
import { OriginationInsuranceConditionsForm } from './OriginationInsuranceConditionsForm';
import { OriginationServicingForm } from './OriginationServicingForm';
import { OriginationEscrowTitleForm } from './OriginationEscrowTitleForm';
import { OriginationFeesSubNavigation, type OriginationFeesSubSection } from './OriginationFeesSubNavigation';
import { Clock } from 'lucide-react';
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

const ComingSoonPlaceholder: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">Coming Soon</p>
    </div>
  </div>
);

export const OriginationFeesSectionContent: React.FC<OriginationFeesSectionContentProps> = ({
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
}) => {
  const nav = useDealNavigationOptional();
  const activeSubSection = (nav?.getSubSection('origination_fees') ?? 'application') as OriginationFeesSubSection;
  const setActiveSubSection = (sub: OriginationFeesSubSection) => nav?.setSubSection('origination_fees', sub);

  const renderContent = () => {
    switch (activeSubSection) {
      case 'application':
        return (
          <OriginationApplicationForm
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'insurance_conditions':
        return (
          <OriginationInsuranceConditionsForm
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'servicing':
        return (
          <OriginationServicingForm
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'origination_fees':
        return (
          <OriginationFeesForm
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'escrow_title':
        return (
          <OriginationEscrowTitleForm
            values={values}
            onValueChange={onValueChange}
            showValidation={showValidation}
            disabled={disabled}
            calculationResults={calculationResults}
          />
        );
      case 'document_provisions':
        return <ComingSoonPlaceholder title="Document Provisions" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col border border-border rounded-lg bg-background overflow-hidden">
      <div className="flex flex-1">
        <OriginationFeesSubNavigation
          activeSubSection={activeSubSection}
          onSubSectionChange={setActiveSubSection}
        />
        <div className="flex-1 min-w-0 overflow-auto min-h-[500px]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default OriginationFeesSectionContent;
