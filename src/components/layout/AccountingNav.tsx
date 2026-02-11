import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronRight,
  Calculator,
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

const accountingData: ChildSection[] = [
  {
    label: 'Cash Management',
    items: [
      { label: 'Payment Processing', path: '/accounting/cash/payment-processing' },
      { label: 'Deposit', path: '/accounting/cash/deposit' },
      { label: 'Lockbox', path: '/accounting/cash/lockbox' },
      { label: 'Remote Deposit', path: '/accounting/cash/remote-deposit' },
      { label: 'Positive Pay', path: '/accounting/cash/positive-pay' },
      { label: 'Activity Journal', path: '/accounting/cash/activity' },
    ],
  },
  {
    label: 'Disbursements',
    items: [
      { label: 'Print Checks', path: '/accounting/disbursements/print-checks' },
      { label: 'ACH / NACHA', path: '/accounting/disbursements/ach-nacha' },
      { label: 'Escheat', path: '/accounting/disbursements/escheat' },
      { label: 'Activity Journal', path: '/accounting/disbursements/activity' },
    ],
  },
  {
    label: 'Trust Accounting',
    items: [
      { label: 'Trust Accounts', path: '/accounting/trust/accounts' },
      { label: 'Activity Journal', path: '/accounting/trust/activity' },
    ],
  },
  {
    label: 'Billing',
    items: [
      { label: 'Issue Invoices', path: '/accounting/billing/invoices' },
      { label: 'AR Balance & Activity', path: '/accounting/billing/ar-balance' },
      { label: 'Activity Journal', path: '/accounting/billing/activity' },
    ],
  },
  {
    label: 'Operating General Ledger',
    items: [
      { label: 'Export to QuickBooks', path: '/accounting/gl/quickbooks' },
      { label: 'Fee Waivers / Settlements', path: '/accounting/gl/fee-waivers' },
      { label: 'Activity Journal', path: '/accounting/gl/activity' },
    ],
  },
  {
    label: 'Regulatory Reporting',
    items: [
      { label: 'Department Dashboard', path: '/accounting/regulatory/dashboard' },
      { label: 'Calendar', path: '/accounting/regulatory/calendar' },
      { label: 'Prepare Reports', path: '/accounting/regulatory/reports', children: [
        { label: 'State / Authority', path: '/accounting/regulatory/reports/state-authority', children: [
          { label: 'California DRE', path: '/accounting/regulatory/reports/state-authority/california-dre', children: [
            { label: 'Quarterly', path: '/accounting/regulatory/reports/state-authority/california-dre/quarterly' },
            { label: 'Multi-lender', path: '/accounting/regulatory/reports/state-authority/california-dre/multi-lender' },
            { label: 'Annual 881', path: '/accounting/regulatory/reports/state-authority/california-dre/annual-881' },
          ]},
        ]},
      ]},
      { label: 'Activity Journal', path: '/accounting/regulatory/activity' },
    ],
  },
  {
    label: 'Tax Reporting',
    items: [
      { label: 'Accounts', path: '/accounting/tax/accounts' },
      { label: 'Validation Wizard', path: '/accounting/tax/validation' },
      { label: 'Generate Tax Files', path: '/accounting/tax/generate' },
      { label: 'Form Management', path: '/accounting/tax/forms' },
      { label: 'Error Report', path: '/accounting/tax/errors' },
      { label: 'Activity Journal', path: '/accounting/tax/activity' },
    ],
  },
  {
    label: 'Knowledge Center',
    items: [
      { label: 'Fee Sheet', path: '/accounting/knowledge/fee-sheet' },
      { label: 'Policies & Processes', path: '/accounting/knowledge/policies' },
      { label: 'Industry News', path: '/accounting/knowledge/news' },
      { label: 'Smart AI', path: '/accounting/knowledge/smart-ai' },
    ],
  },
  {
    label: 'Legal',
    items: [
      { label: 'Management Dashboard', path: '/accounting/legal/management' },
      { label: 'Department Alerts', path: '/accounting/legal/alerts' },
      { label: 'Department Dashboard', path: '/accounting/legal/dashboard' },
      { label: 'Accounts', path: '/accounting/legal/accounts' },
      { label: 'Calendar', path: '/accounting/legal/calendar' },
      { label: 'Activity Journal', path: '/accounting/legal/activity' },
    ],
  },
  {
    label: 'Documents Vault',
    path: '/documents',
    items: [],
  },
  {
    label: 'Contacts',
    items: [],
  },
  {
    label: 'Statements & Reports',
    items: [],
  },
];

interface AccountingNavProps {
  isCollapsed: boolean;
  searchQuery: string;
}

export const AccountingNav: React.FC<AccountingNavProps> = ({ isCollapsed, searchQuery }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openParent, setOpenParent] = React.useState(false);
  const [openChildren, setOpenChildren] = React.useState<string[]>([]);

  const [openNestedItems, setOpenNestedItems] = React.useState<string[]>([]);

  const toggleChild = (label: string) => {
    setOpenChildren((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const toggleNestedItem = (label: string) => {
    setOpenNestedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const filteredSections = accountingData
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
    !searchQuery || 'accounting'.includes(searchQuery.toLowerCase());

  if (!parentMatchesSearch && filteredSections.length === 0) {
    return null;
  }

  const isAnyActive = accountingData.some((s) =>
    (s.path && location.pathname === s.path) ||
    s.items.some((i) => location.pathname === i.path)
  );

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
              <Calculator className="h-5 w-5" />
              <span className="font-bold text-xs tracking-wide uppercase">Accounting</span>
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
                <span className="font-semibold text-xs">{section.label}</span>
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
                    section.items.some((i) => location.pathname === i.path) &&
                      'text-sidebar-primary-foreground bg-sidebar-accent'
                  )}
                >
                  <span className="font-semibold text-xs">{section.label}</span>
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
                    item.children ? (
                      <Collapsible
                        key={item.path}
                        open={openNestedItems.includes(item.label)}
                        onOpenChange={() => toggleNestedItem(item.label)}
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            className={cn(
                              'sidebar-item w-full justify-between text-xs',
                              location.pathname.startsWith(item.path) &&
                                'text-sidebar-primary-foreground bg-sidebar-accent'
                            )}
                          >
                            <span>{item.label}</span>
                            {openNestedItems.includes(item.label) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pl-4 pt-0.5 space-y-0.5">
                          {item.children.map((child) =>
                            child.children ? (
                              <Collapsible
                                key={child.path}
                                open={openNestedItems.includes(child.label)}
                                onOpenChange={() => toggleNestedItem(child.label)}
                              >
                                <CollapsibleTrigger asChild>
                                  <button
                                    className={cn(
                                      'sidebar-item w-full justify-between text-xs',
                                      location.pathname.startsWith(child.path) &&
                                        'text-sidebar-primary-foreground bg-sidebar-accent'
                                    )}
                                  >
                                    <span>{child.label}</span>
                                    {openNestedItems.includes(child.label) ? (
                                      <ChevronDown className="h-3 w-3" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3" />
                                    )}
                                  </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pl-4 pt-0.5 space-y-0.5">
                                  {child.children.map((nested) =>
                                    nested.children ? (
                                      <Collapsible
                                        key={nested.path}
                                        open={openNestedItems.includes(nested.label)}
                                        onOpenChange={() => toggleNestedItem(nested.label)}
                                      >
                                        <CollapsibleTrigger asChild>
                                          <button
                                            className={cn(
                                              'sidebar-item w-full justify-between text-xs',
                                              location.pathname.startsWith(nested.path) &&
                                                'text-sidebar-primary-foreground bg-sidebar-accent'
                                            )}
                                          >
                                            <span>{nested.label}</span>
                                            {openNestedItems.includes(nested.label) ? (
                                              <ChevronDown className="h-3 w-3" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3" />
                                            )}
                                          </button>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="pl-4 pt-0.5 space-y-0.5">
                                          {nested.children.map((leaf) => (
                                            <button
                                              key={leaf.path}
                                              onClick={() => navigate(leaf.path)}
                                              className={cn(
                                                'sidebar-item w-full text-xs',
                                                location.pathname === leaf.path && 'sidebar-item-active'
                                              )}
                                            >
                                              <span>{leaf.label}</span>
                                            </button>
                                          ))}
                                        </CollapsibleContent>
                                      </Collapsible>
                                    ) : (
                                      <button
                                        key={nested.path}
                                        onClick={() => navigate(nested.path)}
                                        className={cn(
                                          'sidebar-item w-full text-xs',
                                          location.pathname === nested.path && 'sidebar-item-active'
                                        )}
                                      >
                                        <span>{nested.label}</span>
                                      </button>
                                    )
                                  )}
                                </CollapsibleContent>
                              </Collapsible>
                            ) : (
                              <button
                                key={child.path}
                                onClick={() => navigate(child.path)}
                                className={cn(
                                  'sidebar-item w-full text-xs',
                                  location.pathname === child.path && 'sidebar-item-active'
                                )}
                              >
                                <span>{child.label}</span>
                              </button>
                            )
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
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
