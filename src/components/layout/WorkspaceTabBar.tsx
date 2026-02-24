import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkspaceTabBarProps {
  onRequestClose: (fileId: string) => void;
}

export const WorkspaceTabBar: React.FC<WorkspaceTabBarProps> = ({ onRequestClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openFiles, activeFileId, switchToFile, isFileDirty } = useWorkspace();
  const { isCollapsed } = useSidebar();

  const isDashboardActive = !activeFileId || location.pathname === '/dashboard' || !openFiles.find(f => f.id === activeFileId);

  const handleDashboardClick = () => {
    switchToFile('');
    navigate('/dashboard');
  };

  const handleFileClick = (fileId: string) => {
    switchToFile(fileId);
    navigate(`/deals/${fileId}/edit`);
  };

  if (openFiles.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed top-12 right-0 z-30 h-10 border-b border-border bg-muted/30 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent transition-all duration-300',
        isCollapsed ? 'left-16' : 'left-64'
      )}
    >
      <div className="flex items-stretch h-10 w-max min-w-full">
          {/* Dashboard tab */}
          <button
            onClick={handleDashboardClick}
            className={cn(
              'flex items-center px-4 text-sm font-medium border-r border-border transition-colors whitespace-nowrap',
              isDashboardActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            Dashboard
          </button>

          {/* File tabs */}
          {openFiles.map(file => {
            const isActive = activeFileId === file.id && !isDashboardActive;
            const isDirty = isFileDirty(file.id);

            return (
              <div
                key={file.id}
                className={cn(
                  'flex items-center gap-1.5 px-3 border-r border-border transition-colors group cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                onClick={() => handleFileClick(file.id)}
              >
                {isDirty && (
                  <span className={cn(
                    'text-lg leading-none',
                    isActive ? 'text-primary-foreground' : 'text-warning'
                  )}>●</span>
                )}
                <span className={cn('text-sm whitespace-nowrap', isActive && 'font-bold')}>
                  {file.dealNumber}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestClose(file.id);
                  }}
                  className={cn(
                    'ml-1 p-0.5 rounded-sm transition-colors',
                    isActive
                      ? 'hover:bg-primary-foreground/20 text-primary-foreground'
                      : 'hover:bg-muted-foreground/20 text-muted-foreground opacity-0 group-hover:opacity-100'
                  )}
                  aria-label={`Close ${file.dealNumber}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
      </div>
    </div>
  );
};
