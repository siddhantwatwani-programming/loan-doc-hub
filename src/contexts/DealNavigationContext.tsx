import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

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
  borrower: 'borrowers',
  property: 'properties',
  loan_terms: 'balances_loan_details',
  lender: 'lenders',
  broker: 'brokers',
  charges: 'charges',
  insurance: 'insurances',
  lien: 'liens',
  origination_fees: 'application',
};

const DEFAULT_PREFIXES: Record<string, string> = {
  borrower: 'borrower',
  property: 'property1',
  lender: 'lender1',
  broker: 'broker1',
  charges: 'charge1',
  insurance: 'insurance1',
  lien: 'lien1',
  coborrower: 'coborrower',
};

interface DealNavigationProviderProps {
  children: ReactNode;
  initialTab?: string;
}

export const DealNavigationProvider: React.FC<DealNavigationProviderProps> = ({ children, initialTab = '' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [subSections, setSubSections] = useState<Record<string, string>>({});
  const [selectedPrefixes, setSelectedPrefixes] = useState<Record<string, string>>({});

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
