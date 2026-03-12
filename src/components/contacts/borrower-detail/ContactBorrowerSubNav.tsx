import React from 'react';
import { cn } from '@/lib/utils';

export type ContactBorrowerSubSection = 'primary' | 'additional_guarantor' | 'authorized_party' | 'banking' | 'tax_detail' | 'note';

interface ContactBorrowerSubNavProps {
  activeSubSection: ContactBorrowerSubSection;
  onSubSectionChange: (sub: ContactBorrowerSubSection) => void;
}

const SECTIONS: { key: ContactBorrowerSubSection; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'additional_guarantor', label: 'Additional Guarantor' },
  { key: 'authorized_party', label: 'Authorized Party' },
  { key: 'banking', label: 'Banking' },
  { key: 'tax_detail', label: '1098' },
  { key: 'note', label: 'Notes' },
];

export const ContactBorrowerSubNav: React.FC<ContactBorrowerSubNavProps> = ({
  activeSubSection,
  onSubSectionChange,
}) => (
  <div className="flex flex-col border-r border-border bg-background min-w-[180px]">
    {SECTIONS.map((section) => (
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
