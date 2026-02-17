import React from 'react';
import { cn } from '@/lib/utils';

export type LenderSubSection = 'lenders' | 'lender' | 'authorized_party' | 'funding' | 'banking' | 'tax_info';

interface LenderSubNavigationProps {
  activeSubSection: LenderSubSection;
  onSubSectionChange: (subSection: LenderSubSection) => void;
  isDetailView?: boolean;
}

const LENDER_DETAIL_SECTIONS: { key: LenderSubSection; label: string }[] = [
  { key: 'lender', label: 'Lender Info' },
  { key: 'authorized_party', label: 'Authorized Party' },
  { key: 'banking', label: 'Banking' },
  { key: 'tax_info', label: '1099' },
];

export const LenderSubNavigation: React.FC<LenderSubNavigationProps> = ({
  activeSubSection,
  onSubSectionChange,
  isDetailView = false,
}) => {
  // Only show navigation when in detail view
  if (!isDetailView) {
    return null;
  }

  return (
    <div className="flex flex-col border-r border-border bg-background min-w-[180px]">
      {LENDER_DETAIL_SECTIONS.map((section) => (
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

export default LenderSubNavigation;
