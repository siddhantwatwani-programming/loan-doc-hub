import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Sun,
  Moon,
  FolderOpen,
  ClipboardList,
  Package,
  Key,
  Link,
  Sliders,
  ChevronDown,
  ChevronRight,
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
  roles: ('admin' | 'csr')[];
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  roles: ('admin' | 'csr')[];
  items: NavItem[];
}

const csrItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['admin', 'csr'] },
  { label: 'Deals', icon: FolderOpen, path: '/deals', roles: ['csr'] },
  { label: 'New Deal', icon: ClipboardList, path: '/deals/new', roles: ['csr'] },
  { label: 'Borrowers', icon: Users, path: '/borrowers', roles: ['csr'] },
  { label: 'Documents', icon: FileText, path: '/documents', roles: ['csr'] },
];

const adminGroups: NavGroup[] = [
  {
    label: 'Configuration',
    icon: Settings,
    roles: ['admin'],
    items: [
      { label: 'Overview', icon: Settings, path: '/admin/config', roles: ['admin'] },
      { label: 'Users', icon: Users, path: '/admin/users', roles: ['admin'] },
      { label: 'Templates', icon: FileText, path: '/admin/templates', roles: ['admin'] },
      { label: 'Packets', icon: Package, path: '/admin/packets', roles: ['admin'] },
      { label: 'Field Dictionary', icon: Key, path: '/admin/fields', roles: ['admin'] },
      { label: 'Field Mapping', icon: Link, path: '/admin/field-maps', roles: ['admin'] },
      { label: 'Settings', icon: Sliders, path: '/admin/settings', roles: ['admin'] },
    ],
  },
];

export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [openGroups, setOpenGroups] = React.useState<string[]>(['Configuration']);

  const filteredItems = csrItems.filter((item) => role && item.roles.includes(role));
  const filteredGroups = adminGroups.filter((group) => role && group.roles.includes(role));

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isGroupActive = (group: NavGroup) => {
    return group.items.some((item) => isActive(item.path));
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar flex flex-col z-50">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Del Toro</span>
            <span className="text-xs text-sidebar-foreground/70">Loan Servicing</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Regular Nav Items */}
        {filteredItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              'sidebar-item w-full',
              isActive(item.path) && 'sidebar-item-active'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}

        {/* Grouped Nav Items */}
        {filteredGroups.map((group) => (
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
                    isActive(item.path) && 'sidebar-item-active'
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
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {user?.email}
          </p>
          <p className="text-xs text-sidebar-foreground/70 capitalize">
            {role || 'No role assigned'}
          </p>
        </div>

        <button onClick={toggleTheme} className="sidebar-item w-full">
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        <button
          onClick={handleSignOut}
          className="sidebar-item w-full text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
