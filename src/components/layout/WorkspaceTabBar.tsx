import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useContactWorkspace } from '@/contexts/ContactWorkspaceContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkspaceTabBarProps {
  onRequestClose: (fileId: string) => void;
  onRequestCloseContact?: (contactId: string) => void;
}

export const WorkspaceTabBar: React.FC<WorkspaceTabBarProps> = ({ onRequestClose, onRequestCloseContact }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openFiles, activeFileId, switchToFile, isFileDirty } = useWorkspace();
  const { openContacts, switchToContact, isContactDirty } = useContactWorkspace();
  const { isCollapsed } = useSidebar();

  // Determine active state from the current route so top-nav and left-nav are independent.
  // A file tab is only highlighted when the user is actually viewing that file's route.
  const isDealRoute = location.pathname === '/deals' || location.pathname.startsWith('/deals/');
  const isAllDocsActive = location.pathname === '/deals';
  const currentFileIdFromRoute = isDealRoute && !isAllDocsActive
    ? openFiles.find(f => location.pathname.startsWith(`/deals/${f.id}`))?.id ?? null
    : null;

  // Active contact = pathname matches /contacts/{kind}s/{id}
  const currentContactIdFromRoute = openContacts.find(c =>
    location.pathname.startsWith(`/contacts/${c.kind}s/${c.id}`)
  )?.id ?? null;

  const handleAllDocsClick = () => {
    switchToFile('');
    if (location.pathname !== '/deals') {
      navigate('/deals');
    }
    // If already on /deals, do nothing — no refresh
  };

  const handleFileClick = (fileId: string) => {
    // If already viewing this file, do nothing — no refresh
    if (activeFileId === fileId && location.pathname === `/deals/${fileId}/edit`) return;
    switchToFile(fileId);
    navigate(`/deals/${fileId}/edit`);
  };

  const handleContactClick = (id: string, kind: string) => {
    const target = `/contacts/${kind}s/${id}`;
    if (location.pathname.startsWith(target)) return;
    switchToContact(id);
    navigate(target);
  };

  return (
    <div
      className={cn(
        'fixed top-12 right-0 left-64 z-30 h-10 border-b border-border bg-background overflow-x-auto overflow-y-hidden sleek-scrollbar'
      )}
    >
      <div className="flex items-stretch h-[34px] w-max min-w-full">
          {/* All Loan Documents tab - always first, not closable */}
          <button
            onClick={handleAllDocsClick}
            className={cn(
              'flex items-center px-4 text-sm font-medium border-r border-border transition-colors whitespace-nowrap',
              isAllDocsActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            All Loan Documents
          </button>

          {/* File tabs */}
          {openFiles.map(file => {
            const isActive = currentFileIdFromRoute === file.id;
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

          {/* Visual divider between file tabs and contact tabs */}
          {openContacts.length > 0 && (
            <div className="flex items-center px-1">
              <div className="w-px h-5 bg-border" />
            </div>
          )}

          {/* Contact tabs */}
          {openContacts.map(c => {
            const isActive = currentContactIdFromRoute === c.id;
            const isDirty = isContactDirty(c.id);
            const label = c.fullName ? `${c.contactId} · ${c.fullName}` : c.contactId;

            return (
              <div
                key={c.id}
                className={cn(
                  'flex items-center gap-1.5 px-3 border-r border-border transition-colors group cursor-pointer',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                onClick={() => handleContactClick(c.id, c.kind)}
              >
                {isDirty && (
                  <span className={cn(
                    'text-lg leading-none',
                    isActive ? 'text-primary-foreground' : 'text-warning'
                  )}>●</span>
                )}
                <span className={cn('text-sm whitespace-nowrap', isActive && 'font-bold')}>
                  {label}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestCloseContact?.(c.id);
                  }}
                  className={cn(
                    'ml-1 p-0.5 rounded-sm transition-colors',
                    isActive
                      ? 'hover:bg-primary-foreground/20 text-primary-foreground'
                      : 'hover:bg-muted-foreground/20 text-muted-foreground opacity-0 group-hover:opacity-100'
                  )}
                  aria-label={`Close ${label}`}
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
