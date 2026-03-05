import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { getRoleDisplayName } from '@/lib/accessControl';
import { Sun, Moon, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { role, signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed } = useSidebar();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-40 h-12 border-b border-border bg-background flex items-center justify-end px-4 gap-4 transition-all duration-300',
        isCollapsed ? 'left-16' : 'left-64'
      )}
    >
      <TooltipProvider delayDuration={0}>
        {/* User Info */}
        <div className="flex items-center gap-2 mr-2">
          <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
            {user?.email}
          </span>
          <span className="text-xs text-muted-foreground">
            {getRoleDisplayName(role)}
          </span>
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-border" />

        {/* Dark Mode Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-md hover:bg-muted text-foreground transition-colors"
              aria-label={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </TooltipContent>
        </Tooltip>

        {/* Sign Out */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
              aria-label="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Sign Out
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </header>
  );
};
