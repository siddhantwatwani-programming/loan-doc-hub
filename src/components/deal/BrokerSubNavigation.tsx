import React from 'react';
import { cn } from '@/lib/utils';

export type BrokerSubSection = 'brokers' | 'broker' | 'banking';

interface BrokerSubNavigationProps {
  activeSubSection: BrokerSubSection;
  onSubSectionChange: (subSection: BrokerSubSection) => void;
  isDetailView?: boolean;
}

const BROKER_DETAIL_SECTIONS: { key: BrokerSubSection; label: string }[] = [
  { key: 'broker', label: 'Broker' },
  { key: 'banking', label: 'Banking' },
];

export const BrokerSubNavigation: React.FC<BrokerSubNavigationProps> = ({
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
      {BROKER_DETAIL_SECTIONS.map((section) => (
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

export default BrokerSubNavigation;
