import React from 'react';
import { cn } from '@/lib/utils';

export type NotesSubSection = 'notes' | 'detail';

interface NotesSubNavigationProps {
  activeSubSection: NotesSubSection;
  onSubSectionChange: (subSection: NotesSubSection) => void;
  isDetailView?: boolean;
}

const NOTES_DETAIL_SECTIONS: { key: NotesSubSection; label: string }[] = [
  { key: 'detail', label: 'Conversation Log Details' },
];

export const NotesSubNavigation: React.FC<NotesSubNavigationProps> = ({
  activeSubSection,
  onSubSectionChange,
  isDetailView = false,
}) => {
  if (!isDetailView) {
    return null;
  }

  return (
    <div className="flex flex-col border-r border-border bg-background min-w-[220px]">
      {NOTES_DETAIL_SECTIONS.map((section) => (
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

export default NotesSubNavigation;
