import React from 'react';
import { cn } from '@/lib/utils';

export type LenderSubSection = 'lender' | 'authorized_party' | 'funding' | 'banking';

interface LenderSubNavigationProps {
  activeSubSection: LenderSubSection;
  onSubSectionChange: (subSection: LenderSubSection) => void;
}

const SUB_SECTIONS: { key: LenderSubSection; label: string }[] = [
  { key: 'lender', label: 'Lender' },
  { key: 'authorized_party', label: 'Authorized Party' },
  { key: 'funding', label: 'Funding' },
  { key: 'banking', label: 'Banking' },
];

export const LenderSubNavigation: React.FC<LenderSubNavigationProps> = ({
  activeSubSection,
  onSubSectionChange,
}) => {
  return (
    <div className="flex flex-col border-r border-border bg-background min-w-[180px]">
      {SUB_SECTIONS.map((section) => (
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
