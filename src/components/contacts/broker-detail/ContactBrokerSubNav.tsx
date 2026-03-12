import React from 'react';
import { cn } from '@/lib/utils';

export type ContactBrokerSubSection = 'broker_info' | 'banking';

interface ContactBrokerSubNavProps {
  activeSubSection: ContactBrokerSubSection;
  onSubSectionChange: (sub: ContactBrokerSubSection) => void;
}

const SECTIONS: { key: ContactBrokerSubSection; label: string }[] = [
  { key: 'broker_info', label: 'Broker' },
  { key: 'banking', label: 'Banking' },
];

export const ContactBrokerSubNav: React.FC<ContactBrokerSubNavProps> = ({
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
