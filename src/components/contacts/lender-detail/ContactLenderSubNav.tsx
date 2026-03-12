import React from 'react';
import { cn } from '@/lib/utils';

export type ContactLenderSubSection = 'lender_info' | 'authorized_party' | 'banking' | 'tax_info';

interface ContactLenderSubNavProps {
  activeSubSection: ContactLenderSubSection;
  onSubSectionChange: (sub: ContactLenderSubSection) => void;
}

const SECTIONS: { key: ContactLenderSubSection; label: string }[] = [
  { key: 'lender_info', label: 'Lender Info' },
  { key: 'authorized_party', label: 'Authorized Party' },
  { key: 'banking', label: 'Banking' },
  { key: 'tax_info', label: '1099' },
];

export const ContactLenderSubNav: React.FC<ContactLenderSubNavProps> = ({
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
