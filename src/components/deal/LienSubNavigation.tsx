import React from 'react';
import { cn } from '@/lib/utils';

export type LienSubSection = 'liens' | 'lien_details';

interface LienSubNavigationProps {
  activeSubSection: LienSubSection;
  onSubSectionChange: (section: LienSubSection) => void;
  isDetailView: boolean;
}

const DETAIL_TABS: { id: LienSubSection; label: string }[] = [
  { id: 'lien_details', label: 'General' },
];

export const LienSubNavigation: React.FC<LienSubNavigationProps> = ({
  activeSubSection,
  onSubSectionChange,
  isDetailView,
}) => {
  // Hide sub-navigation when in table view
  if (!isDetailView) {
    return null;
  }

  return (
    <div className="w-[180px] border-r border-border bg-muted/20 flex-shrink-0">
      <nav className="py-2">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSubSectionChange(tab.id)}
            className={cn(
              'w-full px-4 py-2 text-left text-sm transition-colors',
              'hover:bg-muted/50',
              activeSubSection === tab.id
                ? 'bg-muted/50 text-foreground font-medium border-l-2 border-primary'
                : 'text-muted-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default LienSubNavigation;
