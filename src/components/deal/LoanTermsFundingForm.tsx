import React, { useState, useMemo } from 'react';
import { LoanFundingGrid } from './LoanFundingGrid';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';
import type { FundingFormData } from './AddFundingModal';

// Field key mapping for funding data stored in loan_terms section
const FIELD_KEYS = {
  fundingRecords: 'loan_terms.funding_records',
  fundingHistory: 'loan_terms.funding_history',
} as const;

interface FundingRecord {
  id: string;
  lenderAccount: string;
  lenderName: string;
  pctOwned: number;
  lenderRate: number;
  principalBalance: number;
  originalAmount: number;
  regularPayment: number;
  roundingError: boolean;
}

interface LoanTermsFundingFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
  dealId: string;
}

export const LoanTermsFundingForm: React.FC<LoanTermsFundingFormProps> = ({
  fields,
  values,
  onValueChange,
  showValidation = false,
  disabled = false,
  calculationResults = {},
  dealId,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isLoading, setIsLoading] = useState(false);

  // Get loan number and borrower name from values
  const loanNumber = values['loan_terms.loan_number'] || values['Terms.LoanNumber'] || '';
  const borrowerName = values['borrower.full_name'] || values['borrower.name'] || '';

  // Parse funding records from stored JSON value
  const fundingRecords: FundingRecord[] = useMemo(() => {
    const storedValue = values[FIELD_KEYS.fundingRecords];
    if (storedValue) {
      try {
        return JSON.parse(storedValue);
      } catch {
        return [];
      }
    }
    return [];
  }, [values]);

  // Parse funding history from stored JSON value
  const historyRecords = useMemo(() => {
    const storedValue = values[FIELD_KEYS.fundingHistory];
    if (storedValue) {
      try {
        return JSON.parse(storedValue);
      } catch {
        return [];
      }
    }
    return [];
  }, [values]);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(fundingRecords.length / pageSize));

  // Get paginated records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return fundingRecords.slice(startIndex, startIndex + pageSize);
  }, [fundingRecords, currentPage, pageSize]);

  const handleAddFunding = (data: FundingFormData) => {
    const newRecord: FundingRecord = {
      id: `funding-${Date.now()}`,
      lenderAccount: data.lenderId || '',
      lenderName: data.lenderFullName || '',
      pctOwned: 0,
      lenderRate: parseFloat(data.lenderRate) || 0,
      principalBalance: parseFloat(data.fundingAmount) || 0,
      originalAmount: parseFloat(data.fundingAmount) || 0,
      regularPayment: 0,
      roundingError: false,
    };

    const updatedRecords = [...fundingRecords, newRecord];
    onValueChange(FIELD_KEYS.fundingRecords, JSON.stringify(updatedRecords));

    // Also add to funding history
    const historyValue = values[FIELD_KEYS.fundingHistory];
    let history: any[] = [];
    try {
      history = historyValue ? JSON.parse(historyValue) : [];
    } catch {
      history = [];
    }
    history.push({
      id: `history-${Date.now()}`,
      fundingDate: data.fundingDate,
      reference: `REF-${Date.now()}`,
      lenderAccount: data.lenderId,
      lenderName: data.lenderFullName,
      amountFunded: parseFloat(data.fundingAmount) || 0,
      notes: data.notes,
    });
    onValueChange(FIELD_KEYS.fundingHistory, JSON.stringify(history));
  };

  const handleUpdateRecord = (id: string, updates: Partial<FundingRecord>) => {
    const updatedRecords = fundingRecords.map((record) =>
      record.id === id ? { ...record, ...updates } : record
    );
    onValueChange(FIELD_KEYS.fundingRecords, JSON.stringify(updatedRecords));
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div className="p-6">
      <LoanFundingGrid
        dealId={dealId}
        loanNumber={loanNumber}
        borrowerName={borrowerName}
        fundingRecords={paginatedRecords}
        historyRecords={historyRecords}
        onAddFunding={handleAddFunding}
        onUpdateRecord={handleUpdateRecord}
        isLoading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

export default LoanTermsFundingForm;
