import React, { useState, useCallback, useMemo } from 'react';
import { TrustLedgerTableView, type TrustLedgerEntry } from './TrustLedgerTableView';
import { TrustLedgerModal } from './TrustLedgerModal';

const TRUST_LEDGER_PAGE_SIZE = 10;

interface LoanTrustLedgerProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  onRemoveValuesByPrefix?: (prefix: string) => void;
  disabled?: boolean;
  onRefresh?: () => void;
}

export const LoanTrustLedger: React.FC<LoanTrustLedgerProps> = ({
  values,
  onValueChange,
  onRemoveValuesByPrefix,
  disabled = false,
  onRefresh,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TrustLedgerEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const entries = useMemo((): TrustLedgerEntry[] => {
    const result: TrustLedgerEntry[] = [];
    const prefixes = new Set<string>();
    Object.keys(values).forEach(key => {
      const match = key.match(/^(loan_trust_ledger\d+)\./);
      if (match) prefixes.add(match[1]);
    });
    prefixes.forEach(prefix => {
      result.push({
        id: prefix,
        date: values[`${prefix}.date`] || '',
        reference: values[`${prefix}.reference`] || '',
        fromWhomReceivedPaid: values[`${prefix}.from_whom`] || '',
        memo: values[`${prefix}.memo`] || '',
        payment: values[`${prefix}.payment`] || '',
        clr: values[`${prefix}.clr`] || '',
        deposit: values[`${prefix}.deposit`] || '',
        balance: values[`${prefix}.balance`] || '',
        category: (values[`${prefix}.category`] as TrustLedgerEntry['category']) || 'all',
      });
    });
    result.sort((a, b) => {
      const numA = parseInt(a.id.replace('loan_trust_ledger', ''));
      const numB = parseInt(b.id.replace('loan_trust_ledger', ''));
      return numA - numB;
    });
    return result;
  }, [values]);

  const getNextPrefix = useCallback((): string => {
    const prefixes = new Set<string>();
    Object.keys(values).forEach(key => {
      const match = key.match(/^(loan_trust_ledger\d+)\./);
      if (match) prefixes.add(match[1]);
    });
    let n = 1;
    while (prefixes.has(`loan_trust_ledger${n}`)) n++;
    return `loan_trust_ledger${n}`;
  }, [values]);

  const handleSaveEntry = useCallback((entryData: TrustLedgerEntry) => {
    const prefix = editingEntry ? editingEntry.id : getNextPrefix();
    onValueChange(`${prefix}.date`, entryData.date);
    onValueChange(`${prefix}.reference`, entryData.reference);
    onValueChange(`${prefix}.from_whom`, entryData.fromWhomReceivedPaid);
    onValueChange(`${prefix}.memo`, entryData.memo);
    onValueChange(`${prefix}.payment`, entryData.payment);
    onValueChange(`${prefix}.clr`, entryData.clr);
    onValueChange(`${prefix}.deposit`, entryData.deposit);
    onValueChange(`${prefix}.balance`, entryData.balance);
    onValueChange(`${prefix}.category`, entryData.category);
    setModalOpen(false);
  }, [editingEntry, getNextPrefix, onValueChange]);

  const handleDeleteEntry = useCallback((entry: TrustLedgerEntry) => {
    if (onRemoveValuesByPrefix) {
      onRemoveValuesByPrefix(entry.id);
    } else {
      Object.keys(values).forEach(key => {
        if (key.startsWith(`${entry.id}.`)) {
          onValueChange(key, '');
        }
      });
    }
  }, [values, onValueChange, onRemoveValuesByPrefix]);

  const totalPages = Math.max(1, Math.ceil(entries.length / TRUST_LEDGER_PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedEntries = entries.slice(
    (safePage - 1) * TRUST_LEDGER_PAGE_SIZE,
    safePage * TRUST_LEDGER_PAGE_SIZE
  );

  return (
    <>
      <TrustLedgerTableView
        entries={paginatedEntries}
        onAddEntry={() => { setEditingEntry(null); setModalOpen(true); }}
        onEditEntry={(entry) => { setEditingEntry(entry); setModalOpen(true); }}
        onRowClick={(entry) => { setEditingEntry(entry); setModalOpen(true); }}
        onDeleteEntry={handleDeleteEntry}
        disabled={disabled}
        onRefresh={onRefresh}
        currentPage={safePage}
        totalPages={totalPages}
        totalCount={entries.length}
        onPageChange={setCurrentPage}
      />
      <TrustLedgerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        entry={editingEntry}
        onSave={handleSaveEntry}
        isEdit={!!editingEntry}
      />
    </>
  );
};

export default LoanTrustLedger;
