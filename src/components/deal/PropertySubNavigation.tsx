import React from 'react';
import { cn } from '@/lib/utils';

export type PropertySubSection = 'property_details' | 'legal_description' | 'liens' | 'insurance' | 'property_tax';

interface PropertySubNavigationProps {
  activeSubSection: PropertySubSection;
  onSubSectionChange: (subSection: PropertySubSection) => void;
}

const SUB_SECTIONS: { key: PropertySubSection; label: string }[] = [
  { key: 'property_details', label: 'Property Details' },
  { key: 'legal_description', label: 'Legal Description' },
  { key: 'liens', label: 'Liens' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'property_tax', label: 'Property Tax' },
];

export const PropertySubNavigation: React.FC<PropertySubNavigationProps> = ({
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

export default PropertySubNavigation;
