import React from 'react';
import { cn } from '@/lib/utils';

export type ChargesSubSection = 'charges' | 'detail';

interface ChargesSubNavigationProps {
  activeSubSection: ChargesSubSection;
  onSubSectionChange: (subSection: ChargesSubSection) => void;
  isDetailView?: boolean;
}

const CHARGES_DETAIL_SECTIONS: { key: ChargesSubSection; label: string }[] = [
  { key: 'detail', label: 'Charge Details' },
];

export const ChargesSubNavigation: React.FC<ChargesSubNavigationProps> = ({
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
      {CHARGES_DETAIL_SECTIONS.map((section) => (
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

export default ChargesSubNavigation;
