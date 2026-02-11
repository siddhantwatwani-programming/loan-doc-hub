import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
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
  path?: string;
  items: SubItem[];
}

const systemAdminData: ChildSection[] = [
  {
    label: 'Platform Management',
    items: [
      {
        label: 'System Settings',
        path: '/system-admin/platform/system-settings',
        children: [
          { label: 'Company Details', path: '/system-admin/platform/system-settings/company-details' },
          { label: 'Banking Information', path: '/system-admin/platform/system-settings/banking' },
          { label: 'Communication Settings', path: '/system-admin/platform/system-settings/communication' },
        ],
      },
      { label: 'Customer Portal Manager', path: '/system-admin/platform/customer-portal' },
    ],
  },
  {
    label: 'User Management',
    path: '/users',
    items: [],
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Letter Management', path: '/system-admin/config/letter-management' },
      { label: 'Report Builder', path: '/system-admin/config/report-builder' },
      { label: 'Chart & Dashboard Builder', path: '/system-admin/config/chart-builder' },
      {
        label: 'Document Builder',
        path: '/system-admin/config/document-builder',
        children: [
          { label: 'Current Library', path: '/system-admin/config/document-builder/library' },
          { label: 'Templates', path: '/system-admin/config/document-builder/templates' },
          { label: 'Field Directory', path: '/system-admin/config/document-builder/field-directory' },
          { label: 'Field Mapping', path: '/system-admin/config/document-builder/field-mapping' },
        ],
      },
    ],
  },
  {
    label: 'API Management',
    items: [],
  },
];

interface SystemAdminNavProps {
  isCollapsed: boolean;
  searchQuery: string;
}

function getAllPaths(sections: ChildSection[]): string[] {
  const paths: string[] = [];
  for (const s of sections) {
    if (s.path) {
      paths.push(s.path);
    }
    for (const item of s.items) {
      paths.push(item.path);
      if (item.children) {
        for (const child of item.children) {
          paths.push(child.path);
        }
      }
    }
  }
  return paths;
}

export const SystemAdminNav: React.FC<SystemAdminNavProps> = ({ isCollapsed, searchQuery }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openParent, setOpenParent] = React.useState(false);
  const [openChildren, setOpenChildren] = React.useState<string[]>([]);
  const [openSubNav, setOpenSubNav] = React.useState<string[]>([]);

  const toggleChild = (label: string) => {
    setOpenChildren((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const toggleSubNav = (label: string) => {
    setOpenSubNav((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const matchesSearch = (label: string) =>
    !searchQuery || label.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredSections = systemAdminData
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          matchesSearch(item.label) ||
          (item.children && item.children.some((c) => matchesSearch(c.label)))
      ),
    }))
    .filter(
      (section) =>
        section.items.length > 0 || matchesSearch(section.label)
    );

  const parentMatchesSearch =
    !searchQuery || 'system administration'.includes(searchQuery.toLowerCase());

  if (!parentMatchesSearch && filteredSections.length === 0) {
    return null;
  }

  const allPaths = getAllPaths(systemAdminData);
  const isAnyActive = allPaths.some((p) => location.pathname === p);

  if (isCollapsed) {
    return null;
  }

  return (
    <>
      <div className="my-3 border-t border-sidebar-border" />
      <Collapsible open={openParent} onOpenChange={setOpenParent}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'sidebar-item w-full justify-between',
              isAnyActive && 'text-sidebar-primary-foreground bg-sidebar-accent'
            )}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5" />
              <span>System Administration</span>
            </div>
            {openParent ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-3 pt-1 space-y-0.5">
          {filteredSections.map((section) =>
            section.path && section.items.length === 0 ? (
              <button
                key={section.label}
                onClick={() => navigate(section.path!)}
                className={cn(
                  'sidebar-item w-full text-sm',
                  location.pathname === section.path && 'text-sidebar-primary-foreground bg-sidebar-accent'
                )}
              >
                <span>{section.label}</span>
              </button>
            ) : (
            <Collapsible
              key={section.label}
              open={openChildren.includes(section.label)}
              onOpenChange={() => toggleChild(section.label)}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    'sidebar-item w-full justify-between text-sm',
                    section.items.some(
                      (i) =>
                        location.pathname === i.path ||
                        (i.children && i.children.some((c) => location.pathname === c.path))
                    ) && 'text-sidebar-primary-foreground bg-sidebar-accent'
                  )}
                >
                  <span>{section.label}</span>
                  {openChildren.includes(section.label) ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              </CollapsibleTrigger>
              {section.items.length > 0 && (
                <CollapsibleContent className="pl-4 pt-0.5 space-y-0.5">
                  {section.items.map((item) =>
                    item.children && item.children.length > 0 ? (
                      <Collapsible
                        key={item.path}
                        open={openSubNav.includes(item.label)}
                        onOpenChange={() => toggleSubNav(item.label)}
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            className={cn(
                              'sidebar-item w-full justify-between text-sm',
                              (location.pathname === item.path ||
                                item.children.some((c) => location.pathname === c.path)) &&
                                'sidebar-item-active'
                            )}
                          >
                            <span>{item.label}</span>
                            {openSubNav.includes(item.label) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-4 pt-0.5 space-y-0.5">
                          {item.children.map((child) => (
                            <button
                              key={child.path}
                              onClick={() => navigate(child.path)}
                              className={cn(
                                'sidebar-item w-full text-sm',
                                location.pathname === child.path && 'sidebar-item-active'
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
                        onClick={() => navigate(item.path)}
                        className={cn(
                          'sidebar-item w-full text-sm',
                          location.pathname === item.path && 'sidebar-item-active'
                        )}
                      >
                        <span>{item.label}</span>
                      </button>
                    )
                  )}
                </CollapsibleContent>
              )}
            </Collapsible>
            )
          )}
        </CollapsibleContent>
      </Collapsible>
    </>
  );
};
