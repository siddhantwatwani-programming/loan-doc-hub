import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface SubItem {
  label: string;
  path: string;
  children?: SubItem[];
}

interface ChildSection {
  label: string;
  items: SubItem[];
}

const executiveDashboardChildren: SubItem[] = [
  { label: 'Portfolio Details', path: '/c-level/executive-dashboard/portfolio-details' },
  { label: 'Performance Metrics', path: '/c-level/executive-dashboard/performance-metrics' },
  { label: 'Financial Metrics', path: '/c-level/executive-dashboard/financial-metrics' },
];

const topLevelItems: SubItem[] = [
  { label: 'Executive Dashboard', path: '/c-level/executive-dashboard', children: executiveDashboardChildren },
  { label: 'Alerts', path: '/c-level/alerts' },
];

const childSections: ChildSection[] = [
  {
    label: 'Human Resources',
    items: [
      { label: 'Time Off Requests', path: '/c-level/hr/time-off-requests' },
      { label: 'Payroll', path: '/c-level/hr/payroll' },
      { label: 'Employee Files', path: '/c-level/hr/employee-files' },
      { label: 'Company Events Journal', path: '/c-level/hr/company-events-journal' },
    ],
  },
];

interface CLevelModuleNavProps {
  isCollapsed: boolean;
  searchQuery: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const CLevelModuleNav: React.FC<CLevelModuleNavProps> = ({ isCollapsed, searchQuery, isOpen, onOpenChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const openParent = isOpen !== undefined ? isOpen : internalOpen;
  const handleOpenChange = onOpenChange || setInternalOpen;
  const [openSections, setOpenSections] = React.useState<string[]>([]);
  const [openSubNavs, setOpenSubNavs] = React.useState<string[]>([]);

  if (isCollapsed) return null;

  const searchFilter = (label: string) =>
    !searchQuery || label.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredTopItems = topLevelItems.filter(item => {
    if (searchFilter(item.label)) return true;
    if (item.children) return item.children.some(c => searchFilter(c.label));
    return false;
  });

  const filteredSections = childSections.map(section => ({
    ...section,
    items: section.items.filter(item => searchFilter(item.label)),
  })).filter(section => searchFilter(section.label) || section.items.length > 0);

  if (filteredTopItems.length === 0 && filteredSections.length === 0) return null;

  const collapseAllExcept = (keepSection?: string, keepSubNav?: string) => {
    setOpenSections(keepSection ? [keepSection] : []);
    setOpenSubNavs(keepSubNav ? [keepSubNav] : []);
  };

  const toggleSection = (label: string) => {
    setOpenSections(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    );
  };

  const toggleSubNav = (label: string) => {
    setOpenSubNavs(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <React.Fragment>
      <Collapsible open={openParent} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger asChild>
          <button className="sidebar-item w-full justify-between px-3 py-2">
            <div className="flex items-center gap-3">
              <Crown className="h-5 w-5" />
              <span className="text-sidebar-foreground">C Level Module</span>
            </div>
            {openParent ? (
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/70" />
            ) : (
              <ChevronRight className="h-4 w-4 text-sidebar-foreground/70" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-3 pt-0.5 space-y-0.5">
          {/* Top-level items */}
          {filteredTopItems.map(item =>
            item.children ? (
              <Collapsible
                key={item.label}
                open={openSubNavs.includes(item.label)}
                onOpenChange={() => toggleSubNav(item.label)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      'sidebar-item w-full justify-between text-sm pl-2',
                      isActive(item.path) && 'sidebar-item-active'
                    )}
                  >
                    <span>{item.label}</span>
                    {openSubNavs.includes(item.label) ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 pt-0.5 space-y-0.5">
                  {item.children
                    .filter(c => searchFilter(c.label))
                    .map(child => (
                      <button
                        key={child.path}
                        onClick={() => { collapseAllExcept(undefined, item.label); navigate(child.path); }}
                        className={cn(
                          'sidebar-item w-full text-sm pl-2',
                          isActive(child.path) && 'sidebar-item-active'
                        )}
                      >
                        <span>{child.label}</span>
                      </button>
                    ))}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <button
                key={item.path}
                onClick={() => { collapseAllExcept(); navigate(item.path); }}
                className={cn(
                  'sidebar-item w-full text-sm pl-2',
                  isActive(item.path) && 'sidebar-item-active'
                )}
              >
                <span>{item.label}</span>
              </button>
            )
          )}

          {/* Child Sections */}
          {filteredSections.map(section => (
            <Collapsible
              key={section.label}
              open={openSections.includes(section.label)}
              onOpenChange={() => toggleSection(section.label)}
            >
              <CollapsibleTrigger asChild>
                <button className="sidebar-item w-full justify-between pl-2 py-1.5">
                  <span className="text-sidebar-foreground">
                    {section.label}
                  </span>
                  {openSections.includes(section.label) ? (
                    <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/70" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/70" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 pt-0.5 space-y-0.5">
                {section.items.map(item => (
                  <button
                    key={item.path}
                    onClick={() => { collapseAllExcept(section.label); navigate(item.path); }}
                    className={cn(
                      'sidebar-item w-full text-sm pl-2',
                      isActive(item.path) && 'sidebar-item-active'
                    )}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </CollapsibleContent>
      </Collapsible>
      <div className="my-3 border-t border-sidebar-border" />
    </React.Fragment>
  );
};
