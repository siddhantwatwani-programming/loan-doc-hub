import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

interface DealNavigationState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  getSubSection: (sectionKey: string) => string;
  setSubSection: (sectionKey: string, subSection: string) => void;
  getSelectedPrefix: (sectionKey: string) => string;
  setSelectedPrefix: (sectionKey: string, prefix: string) => void;
}

const DealNavigationContext = createContext<DealNavigationState | null>(null);

const DEFAULT_SUB_SECTIONS: Record<string, string> = {
  borrower: 'primary',
  property: 'properties',
  loan_terms: 'balances_loan_details',
  lender: 'lenders',
  broker: 'brokers',
  charges: 'charges',
  notes: 'notes',
  insurance: 'insurances',
  lien: 'liens',
  origination_fees: 'application',
};

const DEFAULT_PREFIXES: Record<string, string> = {
  borrower: 'borrower1',
  property: 'property1',
  lender: 'lender1',
  broker: 'broker1',
  charges: 'charge1',
  notes: 'notes_entry1',
  insurance: 'insurance1',
  lien: 'lien1',
  coborrower: 'coborrower',
};

interface StoredState {
  activeTab: string;
  subSections: Record<string, string>;
  selectedPrefixes: Record<string, string>;
}

const getStorageKey = (dealId?: string) => dealId ? `deal-nav-${dealId}` : null;

const loadState = (dealId?: string, initialTab = ''): StoredState => {
  const key = getStorageKey(dealId);
  if (key) {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredState;
        return {
          activeTab: parsed.activeTab || initialTab,
          subSections: parsed.subSections || {},
          selectedPrefixes: parsed.selectedPrefixes || {},
        };
      }
    } catch {
      // Ignore parse errors
    }
  }
  return { activeTab: initialTab, subSections: {}, selectedPrefixes: {} };
};

interface DealNavigationProviderProps {
  children: ReactNode;
  initialTab?: string;
  dealId?: string;
}

export const DealNavigationProvider: React.FC<DealNavigationProviderProps> = ({ children, initialTab = '', dealId }) => {
  const [state] = useState(() => loadState(dealId, initialTab));
  const [activeTab, setActiveTabState] = useState<string>(state.activeTab);
  const [subSections, setSubSections] = useState<Record<string, string>>(state.subSections);
  const [selectedPrefixes, setSelectedPrefixes] = useState<Record<string, string>>(state.selectedPrefixes);

  // Persist to sessionStorage on changes
  useEffect(() => {
    const key = getStorageKey(dealId);
    if (key) {
      sessionStorage.setItem(key, JSON.stringify({ activeTab, subSections, selectedPrefixes }));
    }
  }, [dealId, activeTab, subSections, selectedPrefixes]);

  const setActiveTab = useCallback((tab: string) => {
    setActiveTabState(tab);
  }, []);

  const getSubSection = useCallback((sectionKey: string) => {
    return subSections[sectionKey] ?? DEFAULT_SUB_SECTIONS[sectionKey] ?? '';
  }, [subSections]);

  const setSubSection = useCallback((sectionKey: string, subSection: string) => {
    setSubSections(prev => ({ ...prev, [sectionKey]: subSection }));
  }, []);

  const getSelectedPrefix = useCallback((sectionKey: string) => {
    return selectedPrefixes[sectionKey] ?? DEFAULT_PREFIXES[sectionKey] ?? '';
  }, [selectedPrefixes]);

  const setSelectedPrefix = useCallback((sectionKey: string, prefix: string) => {
    setSelectedPrefixes(prev => ({ ...prev, [sectionKey]: prefix }));
  }, []);

  return (
    <DealNavigationContext.Provider value={{
      activeTab,
      setActiveTab,
      getSubSection,
      setSubSection,
      getSelectedPrefix,
      setSelectedPrefix,
    }}>
      {children}
    </DealNavigationContext.Provider>
  );
};

export const useDealNavigation = (): DealNavigationState => {
  const context = useContext(DealNavigationContext);
  if (!context) {
    throw new Error('useDealNavigation must be used within a DealNavigationProvider');
  }
  return context;
};

// Optional hook that returns null if not within provider (for components that may or may not use context)
export const useDealNavigationOptional = (): DealNavigationState | null => {
  return useContext(DealNavigationContext);
};
