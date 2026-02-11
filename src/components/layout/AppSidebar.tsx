import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { getRoleDisplayName } from '@/lib/accessControl';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Sun,
  Moon,
  FolderOpen,
  Plus,
  Package,
  Key,
  Link,
  Sliders,
  ChevronDown,
  ChevronRight,
  Eye,
  Menu,
  X,
  Search,
  Briefcase,
  MessageSquare,
  ListTodo,
  CheckCircle2,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { BrokerServicesNav } from '@/components/layout/BrokerServicesNav';
import { AccountingNav } from '@/components/layout/AccountingNav';
import { SystemAdminNav } from '@/components/layout/SystemAdminNav';
import { CLevelModuleNav } from '@/components/layout/CLevelModuleNav';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles: AppRole[];
  internalOnly?: boolean;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  roles: AppRole[];
  items: NavItem[];
}

// CSR items
const csrItems: NavItem[] = [];

// External user items - limited view
const externalItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['borrower', 'broker', 'lender'] },
  { label: 'My Deals', icon: FolderOpen, path: '/deals', roles: ['borrower', 'broker', 'lender'] },
];

// Top-level admin items
const adminItems: NavItem[] = [
  { label: 'User Management', icon: Users, path: '/admin/users', roles: ['admin'] },
  { label: 'Templates', icon: FileText, path: '/admin/templates', roles: ['admin'] },
  { label: 'Field Dictionary', icon: Key, path: '/admin/fields', roles: ['admin'] },
  { label: 'Field Mapping', icon: Link, path: '/admin/field-maps', roles: ['admin'] },
];

// Simplified Configuration group - only Packets and Settings
const adminGroups: NavGroup[] = [
  {
    label: 'Configuration',
    icon: Settings,
    roles: ['admin'],
    items: [
      { label: 'Packets', icon: Package, path: '/admin/packets', roles: ['admin'] },
      { label: 'Settings', icon: Sliders, path: '/admin/settings', roles: ['admin'] },
    ],
  },
];

// My Work items
const myWorkItems: NavItem[] = [
  { label: 'Messages', icon: MessageSquare, path: '/my-work/messages', roles: ['admin', 'csr', 'borrower', 'broker', 'lender'] },
  { label: 'Queue', icon: ListTodo, path: '/my-work/queue', roles: ['admin', 'csr', 'borrower', 'broker', 'lender'] },
  { label: 'Action Items', icon: CheckCircle2, path: '/my-work/action-items', roles: ['admin', 'csr', 'borrower', 'broker', 'lender'] },
  { label: 'Alerts', icon: Bell, path: '/my-work/alerts', roles: ['admin', 'csr', 'borrower', 'broker', 'lender'] },
];

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, signOut, user, isExternalUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [openGroups, setOpenGroups] = React.useState<string[]>(['Configuration', 'My Work']);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter items based on role
  const getFilteredItems = (): NavItem[] => {
    if (isExternalUser) {
      return externalItems.filter((item) => role && item.roles.includes(role));
    }
    return csrItems.filter((item) => role && item.roles.includes(role));
  };

  const filteredItems = getFilteredItems();
  const filteredAdminItems = adminItems.filter((item) => role && item.roles.includes(role));
  const filteredGroups = adminGroups.filter((group) => role && group.roles.includes(role));
  const filteredMyWorkItems = myWorkItems.filter((item) => role && item.roles.includes(role));

  // Apply search filter
  const searchFilter = (item: NavItem) =>
    !searchQuery || item.label.toLowerCase().includes(searchQuery.toLowerCase());

  const searchedItems = filteredItems.filter(searchFilter);
  const searchedAdminItems = filteredAdminItems.filter(searchFilter);
  const searchedMyWorkItems = filteredMyWorkItems.filter(searchFilter);
  const searchedGroups = filteredGroups.map((group) => ({
    ...group,
    items: group.items.filter(searchFilter),
  })).filter((group) => group.items.length > 0);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    if (path === '/deals') {
      return location.pathname === '/deals';
    }
    return location.pathname === path;
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some((item) => location.pathname === item.path);
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-sidebar flex flex-col z-50 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo Section with Hamburger */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-3", isCollapsed && "justify-center w-full")}>
            {!isCollapsed && (
              <>
                <img src={logo} alt="Logo" className="h-10 w-auto" />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-sidebar-foreground">Del Toro</span>
                  <span className="text-xs text-sidebar-foreground/70">Loan Servicing</span>
                </div>
              </>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* External User Banner */}
      {isExternalUser && !isCollapsed && (
        <div className="px-4 py-2 bg-primary/10 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-xs text-primary">
            <Eye className="h-3 w-3" />
            <span>External Access</span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {!isCollapsed ? (
        <div className="px-3 py-2 border-b border-sidebar-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
            <input
              type="text"
              placeholder="Site Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-sidebar-border bg-sidebar text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      ) : (
        <div className="px-2 py-2 border-b border-sidebar-border">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="sidebar-item w-full justify-center px-2">
                  <Search className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Site Search
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {/* My Work Section */}
          {searchedMyWorkItems.length > 0 && (
            isCollapsed ? (
              <React.Fragment>
                {searchedMyWorkItems.map((item) => (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(item.path)}
                        className={cn(
                          'sidebar-item w-full justify-center px-2',
                          isActive(item.path) && 'sidebar-item-active'
                        )}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ))}
                <div className="my-3 border-t border-sidebar-border" />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <div>
                  <button
                    className={cn(
                      'sidebar-item w-full',
                      searchedMyWorkItems.some((item) => isActive(item.path)) && 'text-sidebar-primary-foreground bg-sidebar-accent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5" />
                      <span>My Work</span>
                    </div>
                  </button>
                  <div className="pl-4 pt-1 space-y-1">
                    {searchedMyWorkItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          'sidebar-item w-full text-sm',
                          isActive(item.path) && 'sidebar-item-active'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="my-3 border-t border-sidebar-border" />
              </React.Fragment>
            )
          )}

          {/* Broker Services Section */}
          {!isCollapsed && (
            <BrokerServicesNav isCollapsed={isCollapsed} searchQuery={searchQuery} />
          )}

          {/* Accounting Section */}
          {!isCollapsed && (
            <AccountingNav isCollapsed={isCollapsed} searchQuery={searchQuery} />
          )}

          {/* System Administration Section */}
          {!isCollapsed && (
            <SystemAdminNav isCollapsed={isCollapsed} searchQuery={searchQuery} />
          )}

          {/* C Level Module Section */}
          {!isCollapsed && (
            <CLevelModuleNav isCollapsed={isCollapsed} searchQuery={searchQuery} />
          )}

          {/* Regular Nav Items */}
          {searchedItems.map((item) => (
            isCollapsed ? (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'sidebar-item w-full justify-center px-2',
                      isActive(item.path) && 'sidebar-item-active'
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'sidebar-item w-full',
                  isActive(item.path) && 'sidebar-item-active'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          ))}

          {/* Separator before admin items */}
          {searchedAdminItems.length > 0 && (
            <div className="my-3 border-t border-sidebar-border" />
          )}

          {/* Top-level Admin Items */}
          {searchedAdminItems.map((item) => (
            isCollapsed ? (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'sidebar-item w-full justify-center px-2',
                      isActive(item.path) && 'sidebar-item-active'
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'sidebar-item w-full',
                  isActive(item.path) && 'sidebar-item-active'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          ))}

          {/* Separator before Configuration group */}
          {searchedGroups.length > 0 && !isCollapsed && (
            <div className="my-3 border-t border-sidebar-border" />
          )}

          {/* Configuration items shown as tooltips when collapsed */}
          {isCollapsed && searchedGroups.map((group) => (
            <React.Fragment key={group.label}>
              <div className="my-3 border-t border-sidebar-border" />
              {group.items.map((item) => (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate(item.path)}
                      className={cn(
                        'sidebar-item w-full justify-center px-2',
                        location.pathname === item.path && 'sidebar-item-active'
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </React.Fragment>
          ))}

          {/* Grouped Nav Items (Configuration) - only show when not collapsed */}
          {!isCollapsed && searchedGroups.map((group) => (
            <Collapsible
              key={group.label}
              open={openGroups.includes(group.label)}
              onOpenChange={() => toggleGroup(group.label)}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    'sidebar-item w-full justify-between',
                    isGroupActive(group) && 'text-sidebar-primary-foreground bg-sidebar-accent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <group.icon className="h-5 w-5" />
                    <span>{group.label}</span>
                  </div>
                  {openGroups.includes(group.label) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 pt-1 space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'sidebar-item w-full text-sm',
                      location.pathname === item.path && 'sidebar-item-active'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </TooltipProvider>
      </nav>

      {/* User Section */}
      <div className={cn("p-4 border-t border-sidebar-border space-y-2", isCollapsed && "p-2")}>
        <TooltipProvider delayDuration={0}>
          {!isCollapsed && (
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.email}
              </p>
              <p className="text-xs text-sidebar-foreground/70">
                {getRoleDisplayName(role)}
              </p>
            </div>
          )}

          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={toggleTheme} 
                  className="sidebar-item w-full justify-center px-2"
                >
                  {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </TooltipContent>
            </Tooltip>
          ) : (
            <button 
              onClick={toggleTheme} 
              className="sidebar-item w-full"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </button>
          )}

          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleSignOut}
                  className="sidebar-item w-full text-destructive hover:bg-destructive/10 justify-center px-2"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Sign Out
              </TooltipContent>
            </Tooltip>
          ) : (
            <button
              onClick={handleSignOut}
              className="sidebar-item w-full text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          )}
        </TooltipProvider>
      </div>
    </aside>
  );
};
