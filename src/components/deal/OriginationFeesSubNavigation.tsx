import React from 'react';
import { cn } from '@/lib/utils';

export type OriginationFeesSubSection =
  | 'application'
  | 'financials'
  | 'escrow_title'
  | 'document_provisions'
  | 'insurance_conditions'
  | 'servicing'
  | 'origination_fees';

const SECTIONS: { key: OriginationFeesSubSection; label: string }[] = [
  { key: 'application', label: 'Application' },
  { key: 'financials', label: 'Financials' },
  { key: 'escrow_title', label: 'Escrow & Title' },
  { key: 'document_provisions', label: 'Document Provisions' },
  { key: 'insurance_conditions', label: 'Insurance Conditions' },
  { key: 'servicing', label: 'Servicing' },
  { key: 'origination_fees', label: 'Origination Fees' },
];

interface OriginationFeesSubNavigationProps {
  activeSubSection: OriginationFeesSubSection;
  onSubSectionChange: (subSection: OriginationFeesSubSection) => void;
}

export const OriginationFeesSubNavigation: React.FC<OriginationFeesSubNavigationProps> = ({
  activeSubSection,
  onSubSectionChange,
}) => {
  return (
    <div className="flex flex-col border-r border-border bg-background min-w-[180px]">
      {SECTIONS.map((section) => (
        <button
          key={section.key}
          onClick={() => onSubSectionChange(section.key)}
          className={cn(
            'px-4 py-3 text-sm font-medium transition-colors text-left border-l-2',
            activeSubSection === section.key
              ? 'border-primary text-foreground bg-muted/30'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20'
          )}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
};

export default OriginationFeesSubNavigation;
