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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

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
const csrItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'csr', 'borrower', 'broker', 'lender'] },
  { label: 'Deals', icon: FolderOpen, path: '/deals', roles: ['csr', 'borrower', 'broker', 'lender'] },
  { label: 'Create Deal', icon: Plus, path: '/deals/new', roles: ['csr'], internalOnly: true },
  { label: 'Users', icon: Users, path: '/users', roles: ['csr'], internalOnly: true },
  { label: 'Documents', icon: FileText, path: '/documents', roles: ['csr'], internalOnly: true },
];

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

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, signOut, user, isExternalUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [openGroups, setOpenGroups] = React.useState<string[]>(['Configuration']);

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

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {/* Regular Nav Items */}
        {filteredItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'sidebar-item w-full',
              isActive(item.path) && 'sidebar-item-active',
              isCollapsed && 'justify-center px-2'
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}

        {/* Separator before admin items */}
        {filteredAdminItems.length > 0 && (
          <div className="my-3 border-t border-sidebar-border" />
        )}

        {/* Top-level Admin Items */}
        {filteredAdminItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'sidebar-item w-full',
              isActive(item.path) && 'sidebar-item-active',
              isCollapsed && 'justify-center px-2'
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span>{item.label}</span>}
          </button>
        ))}

        {/* Separator before Configuration group */}
        {filteredGroups.length > 0 && !isCollapsed && (
          <div className="my-3 border-t border-sidebar-border" />
        )}

        {/* Grouped Nav Items (Configuration) - only show when not collapsed */}
        {!isCollapsed && filteredGroups.map((group) => (
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
      </nav>

      {/* User Section */}
      <div className={cn("p-4 border-t border-sidebar-border space-y-2", isCollapsed && "p-2")}>
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

        <button 
          onClick={toggleTheme} 
          className={cn("sidebar-item w-full", isCollapsed && "justify-center px-2")}
          title={isCollapsed ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : undefined}
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          {!isCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>

        <button
          onClick={handleSignOut}
          className={cn("sidebar-item w-full text-destructive hover:bg-destructive/10", isCollapsed && "justify-center px-2")}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
