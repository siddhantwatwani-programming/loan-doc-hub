import React, { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';

export interface OpenFile {
  id: string;
  dealNumber: string;
  state: string;
  productType: string;
  openedAt: number;
}

interface WorkspaceState {
  openFiles: OpenFile[];
  activeFileId: string | null;
  openFile: (file: OpenFile) => boolean;
  closeFile: (id: string) => void;
  switchToFile: (id: string) => void;
  setFileDirty: (id: string, dirty: boolean) => void;
  isFileDirty: (id: string) => boolean;
  isAtLimit: () => boolean;
}

const MAX_FILES = 10;
const STORAGE_KEY_FILES = 'workspace_openFiles';
const STORAGE_KEY_ACTIVE = 'workspace_activeFileId';

function loadPersistedFiles(): OpenFile[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_FILES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function loadPersistedActive(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY_ACTIVE) || null;
  } catch { return null; }
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>(loadPersistedFiles);
  const [activeFileId, setActiveFileId] = useState<string | null>(loadPersistedActive);
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set());

  // Persist to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(openFiles));
  }, [openFiles]);

  useEffect(() => {
    if (activeFileId) {
      sessionStorage.setItem(STORAGE_KEY_ACTIVE, activeFileId);
    } else {
      sessionStorage.removeItem(STORAGE_KEY_ACTIVE);
    }
  }, [activeFileId]);

  const openFile = useCallback((file: OpenFile): boolean => {
    let opened = false;
    setOpenFiles(prev => {
      // Already open? Just switch to it
      if (prev.find(f => f.id === file.id)) {
        opened = true;
        return prev;
      }
      if (prev.length >= MAX_FILES) {
        opened = false;
        return prev;
      }
      opened = true;
      return [...prev, file];
    });
    // We need to handle the return synchronously but setState is async
    // Use a ref-like pattern: check current state
    setActiveFileId(file.id);
    return opened;
  }, []);

  const closeFile = useCallback((id: string) => {
    setOpenFiles(prev => prev.filter(f => f.id !== id));
    setDirtyFiles(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setActiveFileId(prev => prev === id ? null : prev);
  }, []);

  const switchToFile = useCallback((id: string) => {
    setActiveFileId(id);
  }, []);

  const setFileDirty = useCallback((id: string, dirty: boolean) => {
    setDirtyFiles(prev => {
      const hasDirty = prev.has(id);
      if (dirty && hasDirty) return prev;   // already dirty – no change
      if (!dirty && !hasDirty) return prev;  // already clean – no change
      const next = new Set(prev);
      if (dirty) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  // Use a ref to always have the latest dirtyFiles available without stale closures
  const dirtyFilesRef = useRef(dirtyFiles);
  dirtyFilesRef.current = dirtyFiles;

  const isFileDirty = useCallback((id: string): boolean => {
    return dirtyFilesRef.current.has(id);
  }, []);

  const isAtLimit = useCallback((): boolean => {
    return openFiles.length >= MAX_FILES;
  }, [openFiles]);

  return (
    <WorkspaceContext.Provider value={{
      openFiles,
      activeFileId,
      openFile,
      closeFile,
      switchToFile,
      setFileDirty,
      isFileDirty,
      isAtLimit,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceState => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export const useWorkspaceOptional = (): WorkspaceState | null => {
  return useContext(WorkspaceContext);
};
