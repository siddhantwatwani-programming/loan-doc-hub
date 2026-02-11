import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  FolderOpen,
  Activity,
  FileText,
  Package,
  MessageSquare,
  Bell,
  Eye,
  Search,
  Wrench,
  Shield,
  ClipboardList,
  AlertTriangle,
  Landmark,
  Building2,
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
}

interface ChildSection {
  label: string;
  items: SubItem[];
}

const brokerServicesTopItems = [
  { label: 'Management Dashboard', path: '/dashboard' },
  { label: 'Department Alerts', path: '/broker-services/department-alerts' },
];

const brokerServicesData: ChildSection[] = [
  {
    label: 'Loan Origination Services',
    items: [
      { label: 'Department Dashboard', path: '/broker-services/origination/dashboard' },
      { label: 'All Origination Files', path: '/broker-services/origination/files' },
      { label: 'Activity Journal', path: '/broker-services/origination/activity' },
    ],
  },
  {
    label: 'Loan Documents Processing',
    items: [
      { label: 'Department Dashboard', path: '/broker-services/documents/dashboard' },
      { label: 'All Loan Document Files', path: '/deals' },
      { label: 'Loan Documents', path: '/broker-services/documents/loan-documents' },
      { label: 'Document Packets', path: '/broker-services/documents/packets' },
      { label: 'Activity Journal', path: '/broker-services/documents/activity' },
    ],
  },
  {
    label: 'New Account Intake',
    items: [
      { label: 'Department Dashboard', path: '/broker-services/intake/dashboard' },
      { label: 'All Loan Document Files', path: '/deals' },
      { label: 'Messages', path: '/broker-services/intake/messages' },
      { label: 'Activity Journal', path: '/broker-services/intake/activity' },
    ],
  },
  {
    label: 'Loan Servicing',
    items: [
      { label: 'Management Dashboard', path: '/broker-services/servicing/management' },
      { label: 'Department Alerts', path: '/broker-services/servicing/alerts' },
      { label: 'Department Dashboard', path: '/broker-services/servicing/dashboard' },
      { label: 'All Loan Document Files', path: '/deals' },
      { label: 'Custom Views', path: '/broker-services/servicing/custom-views' },
      { label: 'Activity Journal', path: '/broker-services/servicing/activity' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Management Dashboard', path: '/broker-services/operations/management' },
      { label: 'Department Alerts', path: '/broker-services/operations/alerts' },
      { label: 'Department Dashboard', path: '/broker-services/operations/dashboard' },
      { label: 'Senior Lien Tracking', path: '/broker-services/operations/senior-lien' },
      { label: 'Insurance Tracking', path: '/broker-services/operations/insurance' },
      { label: 'Tax Tracking', path: '/broker-services/operations/tax' },
      { label: 'Account Maintenance', path: '/broker-services/operations/maintenance' },
      { label: 'Outstanding / Missing Items', path: '/broker-services/operations/outstanding' },
      { label: 'Activity Journal', path: '/broker-services/operations/activity' },
    ],
  },
  {
    label: 'Default Services',
    items: [
      { label: 'Management Dashboard', path: '/broker-services/default/management' },
      { label: 'Department Alerts', path: '/broker-services/default/alerts' },
      { label: 'Department Dashboard', path: '/broker-services/default/dashboard' },
      { label: 'Mod & Forbearance Wizard', path: '/broker-services/default/mod-forbearance' },
      { label: 'Foreclosure Processing', path: '/broker-services/default/foreclosure' },
      { label: 'Bankruptcy Monitoring', path: '/broker-services/default/bankruptcy' },
      { label: 'Activity Journal', path: '/broker-services/default/activity' },
    ],
  },
];

interface BrokerServicesNavProps {
  isCollapsed: boolean;
  searchQuery: string;
}

export const BrokerServicesNav: React.FC<BrokerServicesNavProps> = ({ isCollapsed, searchQuery }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openParent, setOpenParent] = React.useState(false);
  const [openChildren, setOpenChildren] = React.useState<string[]>([]);

  const toggleChild = (label: string) => {
    setOpenChildren((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  // Filter sections based on search
  const filteredSections = brokerServicesData
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(
      (section) =>
        section.items.length > 0 ||
        (!searchQuery || section.label.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const parentMatchesSearch =
    !searchQuery || 'broker services'.includes(searchQuery.toLowerCase());

  if (!parentMatchesSearch && filteredSections.length === 0) {
    return null;
  }

  const isAnyActive = brokerServicesData.some((s) =>
    s.items.some((i) => location.pathname === i.path)
  );

  if (isCollapsed) {
    return null; // Too complex for collapsed view; hidden when collapsed
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
              <Building2 className="h-5 w-5" />
              <span className="font-semibold text-sm">Broker Services</span>
            </div>
            {openParent ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-3 pt-1 space-y-0.5">
          {brokerServicesTopItems
            .filter((item) => !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((item) => (
              <button
                key={item.path + item.label}
                onClick={() => navigate(item.path)}
                className={cn(
                  'sidebar-item w-full text-xs',
                  location.pathname === item.path && 'sidebar-item-active'
                )}
              >
                <span>{item.label}</span>
              </button>
            ))}
          {filteredSections.map((section) => (
            <Collapsible
              key={section.label}
              open={openChildren.includes(section.label)}
              onOpenChange={() => toggleChild(section.label)}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    'sidebar-item w-full justify-between text-sm',
                    section.items.some((i) => location.pathname === i.path) &&
                      'text-sidebar-primary-foreground bg-sidebar-accent'
                  )}
                >
                  <span className="font-medium text-xs">{section.label}</span>
                  {openChildren.includes(section.label) ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 pt-0.5 space-y-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'sidebar-item w-full text-xs',
                      location.pathname === item.path && 'sidebar-item-active'
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
    </>
  );
};
