import React from 'react';
import { Printer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type PropertySubSection = 'properties' | 'property_details' | 'legal_description' | 'insurance' | 'property_tax_detail' | 'liens';

const PROPERTY_DETAIL_SECTIONS: { key: PropertySubSection; label: string }[] = [
  { key: 'property_details', label: 'Property Details' },
  { key: 'liens', label: 'Liens' },
  { key: 'legal_description', label: 'Legal Description' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'property_tax_detail', label: 'Property Tax' },
];

interface PropertySubNavigationProps {
  activeSubSection: PropertySubSection;
  onSubSectionChange: (subSection: PropertySubSection) => void;
  isDetailView?: boolean;
  onPrint?: () => void;
}

export const PropertySubNavigation: React.FC<PropertySubNavigationProps> = ({
  activeSubSection,
  onSubSectionChange,
  isDetailView = false,
  onPrint,
}) => {
  // Only show navigation when in detail view (matching Lender pattern)
  if (!isDetailView) {
    return null;
  }

  return (
    <div className="flex flex-col border-r border-border bg-background min-w-[180px]">
      {PROPERTY_DETAIL_SECTIONS.map((section) => (
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

      {/* Print button at the bottom of the sub-navigation */}
      {onPrint && (
        <div className="mt-auto px-3 py-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1 text-xs"
            onClick={onPrint}
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      )}
    </div>
  );
};

export default PropertySubNavigation;
