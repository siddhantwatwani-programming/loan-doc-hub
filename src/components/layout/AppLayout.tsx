import React, { useState, useCallback } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { WorkspaceProvider, useWorkspace } from '@/contexts/WorkspaceContext';
import { FieldDictionaryCacheProvider } from '@/hooks/useFieldDictionaryCache';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { WorkspaceTabBar } from './WorkspaceTabBar';
import { WorkspaceFileRenderer } from '@/components/workspace/WorkspaceFileRenderer';
import { CloseConfirmationDialog } from '@/components/workspace/CloseConfirmationDialog';
import { DealDataEntryInner } from '@/pages/csr/DealDataEntryPage';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const AppLayoutInner: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const { openFiles, activeFileId, closeFile, isFileDirty, setFileDirty } = useWorkspace();
  const location = useLocation();
  const navigate = useNavigate();

  // Close confirmation state
  const [closingFileId, setClosingFileId] = useState<string | null>(null);
  // Store save callbacks per file
  const [saveFns, setSaveFns] = useState<Record<string, () => Promise<boolean>>>({});

  const registerSaveFn = useCallback((dealId: string, fn: () => Promise<boolean>) => {
    setSaveFns(prev => ({ ...prev, [dealId]: fn }));
  }, []);

  const unregisterSaveFn = useCallback((dealId: string) => {
    setSaveFns(prev => {
      const next = { ...prev };
      delete next[dealId];
      return next;
    });
  }, []);

  const handleRequestClose = useCallback((fileId: string) => {
    const dirty = isFileDirty(fileId);
    if (dirty) {
      setClosingFileId(fileId);
    } else {
      closeFile(fileId);
      if (activeFileId === fileId) {
        navigate('/deals');
      }
    }
  }, [isFileDirty, closeFile, activeFileId, navigate]);

  const handleSaveAndClose = useCallback(async () => {
    if (!closingFileId) return;
    const saveFn = saveFns[closingFileId];
    if (saveFn) {
      const success = await saveFn();
      if (success) {
        setFileDirty(closingFileId, false);
      }
    }
    const wasActive = activeFileId === closingFileId;
    closeFile(closingFileId);
    setClosingFileId(null);
    if (wasActive) navigate('/deals');
  }, [closingFileId, saveFns, closeFile, activeFileId, navigate, setFileDirty]);

  const handleDiscard = useCallback(() => {
    if (!closingFileId) return;
    const wasActive = activeFileId === closingFileId;
    closeFile(closingFileId);
    setClosingFileId(null);
    if (wasActive) navigate('/deals');
  }, [closingFileId, closeFile, activeFileId, navigate]);

  const handleStay = useCallback(() => {
    setClosingFileId(null);
  }, []);

  const hasOpenFiles = openFiles.length > 0;
  const hasTabBar = true; // Always show tab bar

  // Check if the current route is a deal edit route and if the deal is open in workspace
  const dealEditMatch = location.pathname.match(/^\/deals\/([^/]+)\/edit$/);
  const isWorkspaceRoute = dealEditMatch && openFiles.find(f => f.id === dealEditMatch[1]);
  const showWorkspaceRenderer = hasOpenFiles;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <AppHeader />
      {hasTabBar && (
        <WorkspaceTabBar onRequestClose={handleRequestClose} />
      )}
      <main className={cn(
        "min-h-screen transition-all duration-300",
        isCollapsed ? "pl-16" : "pl-64",
        hasTabBar ? "pt-[88px]" : "pt-12"
      )}>
        <div className="animate-fade-in">
          {/* Always render workspace files (hidden when not active) */}
          {showWorkspaceRenderer && (
            <div className={cn(!isWorkspaceRoute && 'hidden')}>
            <WorkspaceFileRenderer
                renderFile={(dealId, isActive) => (
                  <DealDataEntryInner
                    dealIdProp={dealId}
                    isActiveTab={isActive}
                    registerSaveFn={registerSaveFn}
                    unregisterSaveFn={unregisterSaveFn}
                  />
                )}
              />
            </div>
          )}
          {/* Show Outlet for non-workspace routes */}
          <div className={cn(isWorkspaceRoute && 'hidden')}>
            <Outlet />
          </div>
        </div>
      </main>

      <CloseConfirmationDialog
        open={!!closingFileId}
        onSaveAndClose={handleSaveAndClose}
        onDiscard={handleDiscard}
        onStay={handleStay}
      />
    </div>
  );
};

export const AppLayout: React.FC = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="auth-card text-center animate-slide-up">
          <h2 className="text-xl font-semibold text-foreground mb-2">No Role Assigned</h2>
          <p className="text-muted-foreground mb-4">
            Your account has been created, but you don't have a role assigned yet.
            Please contact an administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FieldDictionaryCacheProvider>
      <WorkspaceProvider>
        <AppLayoutInner />
      </WorkspaceProvider>
    </FieldDictionaryCacheProvider>
  );
};
