import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type LenderSubSection = 'lenders' | 'lender' | 'authorized_party' | 'funding' | 'banking';

interface LenderSubNavigationProps {
  activeSubSection: LenderSubSection;
  onSubSectionChange: (subSection: LenderSubSection) => void;
  isDetailView?: boolean;
  onBackToTable?: () => void;
  detailViewName?: string;
}

const LENDER_DETAIL_SECTIONS: { key: LenderSubSection; label: string }[] = [
  { key: 'lender', label: 'Lender Info' },
  { key: 'authorized_party', label: 'Authorized Party' },
  { key: 'funding', label: 'Funding' },
  { key: 'banking', label: 'Banking' },
];

export const LenderSubNavigation: React.FC<LenderSubNavigationProps> = ({
  activeSubSection,
  onSubSectionChange,
  isDetailView = false,
  onBackToTable,
  detailViewName,
}) => {
  // Only show navigation when in detail view
  if (!isDetailView) {
    return null;
  }

  return (
    <div className="flex flex-col border-r border-border bg-background min-w-[180px]">
      {/* Back button and detail name */}
      {onBackToTable && (
        <div className="px-4 py-3 border-b border-border">
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
            <div className="mt-2 font-medium text-sm text-foreground truncate">
              {detailViewName}
            </div>
          )}
        </div>
      )}

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
