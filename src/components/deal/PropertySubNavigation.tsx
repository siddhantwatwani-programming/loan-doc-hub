import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type PropertySubSection = 'properties' | 'property_details' | 'legal_description' | 'liens' | 'insurance' | 'property_tax';

interface PropertySubNavigationProps {
  activeSubSection: PropertySubSection;
  onSubSectionChange: (subSection: PropertySubSection) => void;
  isDetailView?: boolean;
  onBackToTable?: () => void;
  detailViewName?: string;
}

const TABLE_SECTIONS: { key: PropertySubSection; label: string }[] = [
  { key: 'properties', label: 'Properties' },
];

const PROPERTY_DETAIL_SECTIONS: { key: PropertySubSection; label: string }[] = [
  { key: 'property_details', label: 'Property Details' },
  { key: 'legal_description', label: 'Legal Description' },
  { key: 'liens', label: 'Liens' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'property_tax', label: 'Property Tax' },
];

export const PropertySubNavigation: React.FC<PropertySubNavigationProps> = ({
  activeSubSection,
  onSubSectionChange,
  isDetailView = false,
  onBackToTable,
  detailViewName,
}) => {
  const sections = isDetailView ? PROPERTY_DETAIL_SECTIONS : TABLE_SECTIONS;

  return (
    <div className="flex flex-col border-r border-border bg-background min-w-[180px]">
      {/* Back button and detail name when in detail view */}
      {isDetailView && onBackToTable && (
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

export default PropertySubNavigation;
