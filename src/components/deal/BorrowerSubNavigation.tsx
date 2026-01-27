import React from 'react';
import { cn } from '@/lib/utils';

export type BorrowerSubSection = 'primary' | 'additional_guarantor' | 'banking' | 'tax_detail';

interface BorrowerSubNavigationProps {
  activeSubSection: BorrowerSubSection;
  onSubSectionChange: (subSection: BorrowerSubSection) => void;
}

const SUB_SECTIONS: { key: BorrowerSubSection; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'additional_guarantor', label: 'Additional Guarantor' },
  { key: 'banking', label: 'Banking' },
  { key: 'tax_detail', label: 'Tax Details' },
];

export const BorrowerSubNavigation: React.FC<BorrowerSubNavigationProps> = ({
  activeSubSection,
  onSubSectionChange,
}) => {
  return (
    <div className="flex border-b border-border bg-background">
      {SUB_SECTIONS.map((section) => (
        <button
          key={section.key}
          onClick={() => onSubSectionChange(section.key)}
          className={cn(
            'px-6 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
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

export default BorrowerSubNavigation;
