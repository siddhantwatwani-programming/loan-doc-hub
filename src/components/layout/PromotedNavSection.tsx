import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface PromotedSubItem {
  label: string;
  path: string;
}

export interface PromotedNavSectionProps {
  label: string;
  icon: React.ElementType;
  items: PromotedSubItem[];
  /** If set, section is a direct link (no children) */
  directPath?: string;
  isCollapsed: boolean;
  searchQuery: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showSeparator?: boolean;
}

export const PromotedNavSection: React.FC<PromotedNavSectionProps> = ({
  label,
  icon: Icon,
  items,
  directPath,
  isCollapsed,
  searchQuery,
  isOpen,
  onOpenChange,
  showSeparator = true,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  if (isCollapsed) return null;

  const matchesSearch = (text: string) =>
    !searchQuery || text.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredItems = items.filter((item) => matchesSearch(item.label));
  const parentMatches = matchesSearch(label);

  if (!parentMatches && filteredItems.length === 0 && !directPath) return null;
  if (!parentMatches && directPath) return null;

  const isAnyActive =
    (directPath && location.pathname === directPath) ||
    items.some((i) => location.pathname === i.path);

  // Direct link (no sub-items)
  if (directPath || items.length === 0) {
    return (
      <>
        {showSeparator && <div className="my-3 border-t border-sidebar-border" />}
        <button
          onClick={() => directPath && navigate(directPath)}
          className={cn(
            'sidebar-item w-full',
            isAnyActive && 'sidebar-item-active'
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0" />
            <span>{label}</span>
          </div>
        </button>
      </>
    );
  }

  // Collapsible with sub-items
  return (
    <>
      {showSeparator && <div className="my-3 border-t border-sidebar-border" />}
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'sidebar-item w-full justify-between',
              isAnyActive && 'text-sidebar-primary-foreground bg-sidebar-accent'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 pt-1 space-y-0.5">
          {filteredItems.map((item) => (
            <button
              key={item.path + item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                'sidebar-item w-full text-sm',
                location.pathname === item.path && 'sidebar-item-active'
              )}
            >
              <span>{item.label}</span>
            </button>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </>
  );
};
