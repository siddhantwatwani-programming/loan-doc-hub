import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { getRoleDisplayName } from '@/lib/accessControl';
import { Sun, Moon, LogOut, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { GlobalMessageDialog } from '@/components/messaging/GlobalMessageDialog';

export const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { role, signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed } = useSidebar();
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleSignOut = async () => {
    setLogoutDialogOpen(false);
    await signOut();
    navigate('/auth');
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-64 z-40 h-12 border-b border-border bg-background flex items-center justify-end px-4 gap-4'
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

        {/* Global Message Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              disabled
              className="p-1.5 rounded-md text-muted-foreground cursor-not-allowed opacity-50"
              aria-label="New Message"
            >
              <Mail className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            Coming Soon
          </TooltipContent>
        </Tooltip>

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
              onClick={() => setLogoutDialogOpen(true)}
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

      <GlobalMessageDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
      />

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be signed out of your account and redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleSignOut}>Log Out</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};