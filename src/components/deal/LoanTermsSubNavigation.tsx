import React from 'react';
import { cn } from '@/lib/utils';

export type LoanTermsSubSection = 'balances_loan_details' | 'details' | 'funding' | 'penalties' | 'servicing';

interface LoanTermsSubNavigationProps {
  activeSubSection: LoanTermsSubSection;
  onSubSectionChange: (subSection: LoanTermsSubSection) => void;
}

const LOAN_TERMS_SECTIONS: { key: LoanTermsSubSection; label: string }[] = [
  { key: 'balances_loan_details', label: 'Balances & Loan Details' },
  { key: 'details', label: 'Details' },
  { key: 'funding', label: 'Funding' },
  { key: 'penalties', label: 'Penalties' },
  { key: 'servicing', label: 'Servicing' },
];

export const LoanTermsSubNavigation: React.FC<LoanTermsSubNavigationProps> = ({
  activeSubSection,
  onSubSectionChange,
}) => {
  return (
    <div className="flex flex-col border-r border-border bg-background min-w-[180px]">
      {LOAN_TERMS_SECTIONS.map((section) => (
        <button
          key={section.key}
          onClick={() => onSubSectionChange(section.key)}
          className={cn(
            'px-4 py-3 text-sm font-medium transition-colors text-left border-l-2',
            activeSubSection === section.key
              ? 'border-primary text-foreground bg-muted/30'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20'
          )}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
};

export default LoanTermsSubNavigation;
