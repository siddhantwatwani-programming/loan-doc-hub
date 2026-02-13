import React from 'react';
import { cn } from '@/lib/utils';

export type BorrowerSubSection = 
  | 'borrowers' 
  | 'co_borrowers' 
  | 'primary' 
  | 'additional_guarantor' 
  | 'authorized_party'
  | 'trust_ledger'
  | 'banking' 
  | 'tax_detail'
  | 'note'
  | 'coborrower_primary'
  | 'coborrower_banking'
  | 'coborrower_tax_detail'
  | 'coborrower_note'
  | 'coborrower_attachment';

interface BorrowerSubNavigationProps {
  activeSubSection: BorrowerSubSection;
  onSubSectionChange: (subSection: BorrowerSubSection) => void;
  showDetailTabs?: boolean;
  isCoBorrowerDetail?: boolean;
  isDetailView?: boolean;
}

const BORROWER_DETAIL_SECTIONS: { key: BorrowerSubSection; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'co_borrowers', label: 'Co-borrower' },
  { key: 'additional_guarantor', label: 'Additional Guarantor' },
  { key: 'authorized_party', label: 'Authorized Party' },
  { key: 'trust_ledger', label: 'Trust Ledger' },
  { key: 'banking', label: 'Banking' },
  { key: 'tax_detail', label: '1098' },
];

const COBORROWER_DETAIL_SECTIONS: { key: BorrowerSubSection; label: string }[] = [
  { key: 'coborrower_primary', label: 'Primary' },
];

export const BorrowerSubNavigation: React.FC<BorrowerSubNavigationProps> = ({
  activeSubSection,
  onSubSectionChange,
  showDetailTabs = false,
  isCoBorrowerDetail = false,
  isDetailView = false,
}) => {
  // Only show navigation when in detail view (matching Lender pattern)
  if (!isDetailView) {
    return null;
  }

  let sections: { key: BorrowerSubSection; label: string }[];
  
  if (showDetailTabs) {
    sections = isCoBorrowerDetail ? COBORROWER_DETAIL_SECTIONS : BORROWER_DETAIL_SECTIONS;
  } else {
    sections = BORROWER_DETAIL_SECTIONS;
  }

  return (
    <div className="flex flex-col border-r border-border bg-background min-w-[180px]">
      {sections.map((section) => (
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

export default BorrowerSubNavigation;
