import React from 'react';
import {
  LayoutDashboard, Briefcase, History, DollarSign, BookOpen,
  MessageSquare, Building2, FileText, UserCheck, Paperclip, ScrollText, Receipt,
} from 'lucide-react';

export type LenderSection =
  | 'dashboard' | 'portfolio' | 'history' | 'charges' | 'trust-ledger'
  | 'conversation-log' | 'lender-info' | 'authorized-party' | 'banking' | '1099'
  | 'tax-reporting' | 'attachments' | 'events-journal';

const SECTIONS: { id: LenderSection; label: string; icon: React.ElementType }[] = [
  { id: 'lender-info', label: 'Lender Info', icon: FileText },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
  { id: 'history', label: 'History', icon: History },
  { id: 'charges', label: 'Charges', icon: DollarSign },
  { id: 'trust-ledger', label: 'Trust Ledger', icon: BookOpen },
  { id: 'conversation-log', label: 'Conversation Log', icon: MessageSquare },
  { id: 'authorized-party', label: 'Authorized Party', icon: UserCheck },
  { id: 'banking', label: 'Banking', icon: Building2 },
  { id: '1099', label: '1099', icon: FileText },
  { id: 'attachments', label: 'Attachments', icon: Paperclip },
  { id: 'events-journal', label: 'Events Journal', icon: ScrollText },
];

interface LenderDetailSidebarProps {
  activeSection: LenderSection;
  onSectionChange: (section: LenderSection) => void;
}

const LenderDetailSidebar: React.FC<LenderDetailSidebarProps> = ({ activeSection, onSectionChange }) => {
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

export default LenderDetailSidebar;
