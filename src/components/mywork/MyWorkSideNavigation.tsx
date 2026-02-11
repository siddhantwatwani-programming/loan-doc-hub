import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubItem {
  label: string;
  path: string;
}

interface ChildSection {
  label: string;
  items: SubItem[];
}

const brokerServicesData: ChildSection[] = [
  {
    label: 'Loan Origination Services',
    items: [
      { label: 'Department Dashboard', path: '/my-work/loan-origination/dashboard' },
      { label: 'All Origination Files', path: '/my-work/loan-origination/files' },
      { label: 'Activity Journal', path: '/my-work/loan-origination/activity' },
    ],
  },
  {
    label: 'Loan Documents Processing',
    items: [
      { label: 'Department Dashboard', path: '/my-work/loan-documents/dashboard' },
      { label: 'All Loan Document Files', path: '/my-work/loan-documents/files' },
      { label: 'Loan Documents', path: '/my-work/loan-documents/documents' },
      { label: 'Document Packets', path: '/my-work/loan-documents/packets' },
      { label: 'Activity Journal', path: '/my-work/loan-documents/activity' },
    ],
  },
  {
    label: 'New Account Intake',
    items: [
      { label: 'Department Dashboard', path: '/my-work/new-account/dashboard' },
      { label: 'All Loan Servicing Files', path: '/my-work/new-account/files' },
      { label: 'Messages', path: '/my-work/new-account/messages' },
      { label: 'Activity Journal', path: '/my-work/new-account/activity' },
    ],
  },
  {
    label: 'Loan Servicing',
    items: [
      { label: 'Management Dashboard', path: '/my-work/loan-servicing/management' },
      { label: 'Department Alerts', path: '/my-work/loan-servicing/alerts' },
      { label: 'Department Dashboard', path: '/my-work/loan-servicing/dashboard' },
      { label: 'All Loan Servicing Files', path: '/my-work/loan-servicing/files' },
      { label: 'Custom Views', path: '/my-work/loan-servicing/custom-views' },
      { label: 'Activity Journal', path: '/my-work/loan-servicing/activity' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Management Dashboard', path: '/my-work/operations/management' },
      { label: 'Department Alerts', path: '/my-work/operations/alerts' },
      { label: 'Department Dashboard', path: '/my-work/operations/dashboard' },
      { label: 'Senior Lien Tracking', path: '/my-work/operations/senior-lien' },
      { label: 'Insurance Tracking', path: '/my-work/operations/insurance' },
      { label: 'Tax Tracking', path: '/my-work/operations/tax' },
      { label: 'Account Maintenance', path: '/my-work/operations/maintenance' },
      { label: 'Outstanding / Missing Items', path: '/my-work/operations/outstanding' },
      { label: 'Activity Journal', path: '/my-work/operations/activity' },
    ],
  },
  {
    label: 'Default Services',
    items: [
      { label: 'Management Dashboard', path: '/my-work/default-services/management' },
      { label: 'Department Alerts', path: '/my-work/default-services/alerts' },
      { label: 'Department Dashboard', path: '/my-work/default-services/dashboard' },
      { label: 'Mod & Forbearance Wizard', path: '/my-work/default-services/mod-forbearance' },
      { label: 'Foreclosure Processing', path: '/my-work/default-services/foreclosure' },
      { label: 'Bankruptcy Monitoring', path: '/my-work/default-services/bankruptcy' },
      { label: 'Activity Journal', path: '/my-work/default-services/activity' },
    ],
  },
];

export const MyWorkSideNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<string[]>(() => {
    // Auto-expand the section that contains the current route
    const currentSection = brokerServicesData.find((section) =>
      section.items.some((item) => item.path === location.pathname)
    );
    return currentSection ? [currentSection.label] : [];
  });

  const toggleSection = (label: string) => {
    setExpandedSections((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-[240px] min-w-[240px] border-r border-border bg-card overflow-y-auto h-full">
      {/* Parent Heading */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-bold tracking-wider text-foreground uppercase">
          BROKER SERVICES
        </h2>
      </div>

      {/* Child Sections */}
      <div className="py-1">
        {brokerServicesData.map((section) => {
          const isExpanded = expandedSections.includes(section.label);
          const hasActiveItem = section.items.some((item) => isActive(item.path));

          return (
            <div key={section.label}>
              {/* Child Heading - Semi-Bold */}
              <button
                onClick={() => toggleSection(section.label)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors',
                  'hover:bg-muted/50',
                  hasActiveItem && 'bg-muted/30'
                )}
              >
                <span className="text-sm font-semibold text-foreground">
                  {section.label}
                </span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              {/* Sub-Items */}
              {isExpanded && (
                <div className="pb-1">
                  {section.items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={cn(
                        'w-full text-left pl-8 pr-4 py-1.5 text-sm transition-colors',
                        'hover:bg-muted/50',
                        isActive(item.path)
                          ? 'text-primary font-medium border-l-2 border-primary bg-primary/5'
                          : 'text-muted-foreground'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
