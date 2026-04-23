import React from 'react';
import { User, MessageSquare, Paperclip, ScrollText } from 'lucide-react';

export type OtherSection = 'profile' | 'conversation-log' | 'attachments' | 'events-journal';

const SECTIONS: { id: OtherSection; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'conversation-log', label: 'Conversation Log', icon: MessageSquare },
  { id: 'attachments', label: 'Attachments', icon: Paperclip },
  { id: 'events-journal', label: 'Events Journal', icon: ScrollText },
];

interface OtherDetailSidebarProps {
  activeSection: OtherSection;
  onSectionChange: (section: OtherSection) => void;
}

const OtherDetailSidebar: React.FC<OtherDetailSidebarProps> = ({ activeSection, onSectionChange }) => {
  return (
    <div className="w-[180px] min-w-[180px] border-r border-border bg-background">
      <nav className="flex flex-col py-2">
        {SECTIONS.map((s) => {
          const isActive = activeSection === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => onSectionChange(s.id)}
              className={`flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
                ${isActive
                  ? 'border-l-2 border-primary bg-primary/10 text-primary font-medium'
                  : 'border-l-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default OtherDetailSidebar;
