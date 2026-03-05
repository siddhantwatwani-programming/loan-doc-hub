import React, { createContext, useContext, type ReactNode } from 'react';

interface DirtyFieldsContextType {
  dirtyFieldKeys: Set<string>;
}

const DirtyFieldsContext = createContext<DirtyFieldsContextType>({ dirtyFieldKeys: new Set() });

export const DirtyFieldsProvider: React.FC<{ dirtyFieldKeys: Set<string>; children: ReactNode }> = ({ dirtyFieldKeys, children }) => (
  <DirtyFieldsContext.Provider value={{ dirtyFieldKeys }}>
    {children}
  </DirtyFieldsContext.Provider>
);

export const useDirtyFields = () => useContext(DirtyFieldsContext);
