import React from 'react';
import { cn } from '@/lib/utils';

export type PropertySubSection = 'properties_grid' | 'property_details' | 'legal_description' | 'liens' | 'insurance' | 'property_tax';

interface PropertySubNavigationProps {
  activeSubSection: PropertySubSection;
  onSubSectionChange: (subSection: PropertySubSection) => void;
  showGridOption?: boolean;
}

const SUB_SECTIONS: { key: PropertySubSection; label: string; gridOnly?: boolean }[] = [
  { key: 'properties_grid', label: 'Properties', gridOnly: true },
  { key: 'property_details', label: 'Property Details' },
  { key: 'legal_description', label: 'Legal Description' },
  { key: 'liens', label: 'Liens' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'property_tax', label: 'Property Tax' },
];

export const PropertySubNavigation: React.FC<PropertySubNavigationProps> = ({
  activeSubSection,
  onSubSectionChange,
  showGridOption = true,
}) => {
  const visibleSections = showGridOption 
    ? SUB_SECTIONS 
    : SUB_SECTIONS.filter(s => !s.gridOnly);

  return (
    <div className="flex flex-col border-r border-border bg-background min-w-[180px]">
      {visibleSections.map((section) => (
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
