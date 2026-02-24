import React from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { DealNavigationProvider } from '@/contexts/DealNavigationContext';
import { cn } from '@/lib/utils';

// We dynamically import the inner component to avoid circular deps
// The DealDataEntryInner is not exported, so we use the full page which wraps with DealNavigationProvider
// Instead, we create a lightweight wrapper that renders DealDataEntryPage content per file

interface WorkspaceFileRendererProps {
  renderFile: (dealId: string) => React.ReactNode;
}

export const WorkspaceFileRenderer: React.FC<WorkspaceFileRendererProps> = ({ renderFile }) => {
  const { openFiles, activeFileId } = useWorkspace();

  return (
    <>
      {openFiles.map(file => (
        <div
          key={file.id}
          className={cn(
            activeFileId === file.id ? 'block' : 'hidden'
          )}
        >
          <DealNavigationProvider dealId={file.id}>
            {renderFile(file.id)}
          </DealNavigationProvider>
        </div>
      ))}
    </>
  );
};
