import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type BrokerSubSection = 'brokers' | 'broker' | 'banking';

interface BrokerSubNavigationProps {
  activeSubSection: BrokerSubSection;
  onSubSectionChange: (subSection: BrokerSubSection) => void;
  isDetailView?: boolean;
  onBackToTable?: () => void;
  detailViewName?: string;
}

const TABLE_SECTIONS: { key: BrokerSubSection; label: string }[] = [
  { key: 'brokers', label: 'Brokers' },
];

const BROKER_DETAIL_SECTIONS: { key: BrokerSubSection; label: string }[] = [
  { key: 'broker', label: 'Broker' },
  { key: 'banking', label: 'Banking' },
];

export const BrokerSubNavigation: React.FC<BrokerSubNavigationProps> = ({
  activeSubSection,
  onSubSectionChange,
  isDetailView = false,
  onBackToTable,
  detailViewName,
}) => {
  const sections = isDetailView ? BROKER_DETAIL_SECTIONS : TABLE_SECTIONS;

  return (
    <div className="flex flex-col border-r border-border bg-background min-w-[180px]">
      {/* Back button and detail name in breadcrumb style when in detail view */}
      {isDetailView && onBackToTable && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToTable}
              className="gap-1 p-0 h-auto text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {detailViewName && (
              <span className="font-medium text-sm text-foreground truncate">
                {detailViewName}
              </span>
            )}
          </div>
        </div>
      )}

      {sections.map((section) => (
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
