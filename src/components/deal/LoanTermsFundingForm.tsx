import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { LoanFundingGrid } from './LoanFundingGrid';
import type { FundingRecord } from './LoanFundingGrid';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';
import type { FundingFormData } from './AddFundingModal';

// Field key mapping for funding data stored in loan_terms section
const FIELD_KEYS = {
  fundingRecords: 'loan_terms.funding_records',
  fundingHistory: 'loan_terms.funding_history',
} as const;

interface LoanTermsFundingFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  saveDraft?: () => Promise<boolean>;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
  dealId: string;
  onRefresh?: () => void;
}

/**
 * Helper: resolve a field_dictionary UUID for a given field_key.
 * Cached per component lifecycle via the returned ref map.
 */
async function resolveFieldDictId(fieldKey: string, cache: Map<string, string>): Promise<string | null> {
  if (cache.has(fieldKey)) return cache.get(fieldKey)!;
  const { data, error } = await supabase
    .from('field_dictionary')
    .select('id')
    .eq('field_key', fieldKey)
    .maybeSingle();
  if (error || !data) {
    console.warn(`[LoanTermsFundingForm] Could not resolve field_dictionary id for "${fieldKey}"`, error);
    return null;
  }
  cache.set(fieldKey, data.id);
  return data.id;
}

/**
 * Direct-persist a JSON value into deal_section_values for loan_terms section.
 * Mirrors the pattern used by handleDeleteRecord.
 */
async function directPersistFundingField(
  dealId: string,
  fieldKey: string,
  jsonValue: string,
  dictCache: Map<string, string>,
): Promise<boolean> {
  try {
    const fieldDictId = await resolveFieldDictId(fieldKey, dictCache);
    if (!fieldDictId) return false;

    const { data: sectionRows, error: fetchError } = await supabase
      .from('deal_section_values')
      .select('id, field_values, version')
      .eq('deal_id', dealId)
      .eq('section', 'loan_terms');

    if (fetchError) throw fetchError;

    // If rows exist, update the first one that has this key, or the first row as fallback
    if (sectionRows && sectionRows.length > 0) {
      // Find the row that already contains this field, or use first row
      let targetRow = sectionRows.find((sv) => {
        const fv = (sv.field_values as Record<string, any>) || {};
        return !!fv[fieldDictId];
      }) || sectionRows[0];

      const fieldValues = ((targetRow.field_values as Record<string, any>) || {});
      fieldValues[fieldDictId] = {
        ...(fieldValues[fieldDictId] || {}),
        value_text: jsonValue,
        indexed_key: fieldKey,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('deal_section_values')
        .update({
          field_values: JSON.parse(JSON.stringify(fieldValues)),
          updated_at: new Date().toISOString(),
          version: (targetRow.version || 0) + 1,
        })
        .eq('id', targetRow.id);

      if (updateError) throw updateError;
      return true;
    } else {
      // No loan_terms row exists yet — create one
      const fieldValues: Record<string, any> = {};
      fieldValues[fieldDictId] = {
        value_text: jsonValue,
        indexed_key: fieldKey,
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('deal_section_values')
        .insert({
          deal_id: dealId,
          section: 'loan_terms',
          field_values: fieldValues,
          version: 1,
        });

      if (insertError) throw insertError;
      return true;
    }
  } catch (err) {
    console.error(`[LoanTermsFundingForm] directPersist failed for "${fieldKey}":`, err);
    return false;
  }
}

export const LoanTermsFundingForm: React.FC<LoanTermsFundingFormProps> = ({
  fields,
  values,
  onValueChange,
  saveDraft,
  showValidation = false,
  disabled = false,
  calculationResults = {},
  dealId,
  onRefresh,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isLoading, setIsLoading] = useState(false);
  const dictCacheRef = useRef<Map<string, string>>(new Map());
  const hydrationAttemptedRef = useRef(false);

  // Get loan number and borrower name from values - auto-populate
  const loanNumber = values['Terms.LoanNumber'] || values['loan_terms.loan_number'] || '';
  const borrowerName = useMemo(() => {
    const first = values['borrower1.first_name'] || values['borrower.first_name'] || '';
    const last = values['borrower1.last_name'] || values['borrower.last_name'] || '';
    if (first || last) return `${first} ${last}`.trim();
    return values['borrower1.full_name'] || values['borrower.full_name'] || values['borrower.name'] || '';
  }, [values]);

  // Get loan rates for Rate Selection
  const noteRate = values['loan_terms.note_rate'] || '';
  const soldRate = values['loan_terms.sold_rate'] || '';
  const totalPayment = values['loan_terms.total_payment'] || values['loan_terms.regular_payment'] || '';

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

  // ── Fallback hydration: load funding data directly from DB if values are empty ──
  useEffect(() => {
    if (hydrationAttemptedRef.current) return;
    if (!dealId) return;
    // If values already contain funding data, skip
    if (values[FIELD_KEYS.fundingRecords] || values[FIELD_KEYS.fundingHistory]) {
      hydrationAttemptedRef.current = true;
      return;
    }

    hydrationAttemptedRef.current = true;

    const hydrate = async () => {
      try {
        const recId = await resolveFieldDictId(FIELD_KEYS.fundingRecords, dictCacheRef.current);
        const histId = await resolveFieldDictId(FIELD_KEYS.fundingHistory, dictCacheRef.current);
        if (!recId && !histId) return;

        const { data: sectionRows, error } = await supabase
          .from('deal_section_values')
          .select('field_values')
          .eq('deal_id', dealId)
          .eq('section', 'loan_terms');

        if (error || !sectionRows?.length) return;

        for (const sv of sectionRows) {
          const fv = (sv.field_values as Record<string, any>) || {};
          if (recId && fv[recId]) {
            const val = fv[recId].value_text;
            if (val) onValueChange(FIELD_KEYS.fundingRecords, val);
          }
          if (histId && fv[histId]) {
            const val = fv[histId].value_text;
            if (val) onValueChange(FIELD_KEYS.fundingHistory, val);
          }
        }
      } catch (err) {
        console.error('[LoanTermsFundingForm] Fallback hydration failed:', err);
      }
    };

    hydrate();
  }, [dealId, values, onValueChange]);

  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(fundingRecords.length / pageSize));

  // Get paginated records
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return fundingRecords.slice(startIndex, startIndex + pageSize);
  }, [fundingRecords, currentPage, pageSize]);

  const handleAddFunding = useCallback(async (data: FundingFormData) => {
    const newRecord: FundingRecord = {
      id: `funding-${Date.now()}`,
      lenderAccount: data.lenderId || '',
      lenderName: data.lenderFullName || '',
      pctOwned: parseFloat(data.percentOwned) || 0,
      lenderRate: parseFloat(data.lenderRate) || 0,
      principalBalance: parseFloat(data.fundingAmount) || 0,
      originalAmount: parseFloat(data.fundingAmount) || 0,
      regularPayment: parseFloat(data.regularPayment) || 0,
      roundingError: false,
    };

    const updatedRecords = [...fundingRecords, newRecord];
    const updatedRecordsJson = JSON.stringify(updatedRecords);
    onValueChange(FIELD_KEYS.fundingRecords, updatedRecordsJson);

    // Build updated history
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
    const updatedHistoryJson = JSON.stringify(history);
    onValueChange(FIELD_KEYS.fundingHistory, updatedHistoryJson);

    // Direct-persist both fields to DB
    await Promise.all([
      directPersistFundingField(dealId, FIELD_KEYS.fundingRecords, updatedRecordsJson, dictCacheRef.current),
      directPersistFundingField(dealId, FIELD_KEYS.fundingHistory, updatedHistoryJson, dictCacheRef.current),
    ]);
  }, [fundingRecords, values, onValueChange, dealId]);

  const handleUpdateRecord = useCallback(async (id: string, updates: Partial<FundingRecord>) => {
    const updatedRecords = fundingRecords.map((record) =>
      record.id === id ? { ...record, ...updates } : record
    );
    const updatedRecordsJson = JSON.stringify(updatedRecords);
    onValueChange(FIELD_KEYS.fundingRecords, updatedRecordsJson);

    // Direct-persist to DB
    await directPersistFundingField(dealId, FIELD_KEYS.fundingRecords, updatedRecordsJson, dictCacheRef.current);
  }, [fundingRecords, onValueChange, dealId]);

  const handleDeleteRecord = async (record: FundingRecord) => {
    const updatedRecords = fundingRecords.filter((r) => r.id !== record.id);
    onValueChange(FIELD_KEYS.fundingRecords, JSON.stringify(updatedRecords));

    // Directly persist the updated records to the backend to avoid stale state issues
    try {
      const fieldDictId = await resolveFieldDictId(FIELD_KEYS.fundingRecords, dictCacheRef.current);
      if (!fieldDictId) throw new Error('Field dictionary entry not found for funding_records');

      const { data: sectionRows, error: fetchError } = await supabase
        .from('deal_section_values')
        .select('id, field_values, version')
        .eq('deal_id', dealId)
        .eq('section', 'loan_terms');

      if (fetchError) throw fetchError;

      for (const sv of (sectionRows || [])) {
        const fieldValues = (sv.field_values as Record<string, any>) || {};

        if (fieldValues[fieldDictId]) {
          fieldValues[fieldDictId] = {
            ...fieldValues[fieldDictId],
            value_text: JSON.stringify(updatedRecords),
            updated_at: new Date().toISOString(),
          };

          await supabase
            .from('deal_section_values')
            .update({
              field_values: JSON.parse(JSON.stringify(fieldValues)),
              updated_at: new Date().toISOString(),
              version: (sv.version || 0) + 1,
            })
            .eq('id', sv.id);

          toast.success('Funding record deleted successfully');
          return;
        }
      }

      // If we didn't find the key in any row, fallback to saveDraft
      if (saveDraft) {
        const success = await saveDraft();
        if (success) {
          toast.success('Funding record deleted successfully');
        }
      }
    } catch (err) {
      console.error('Error persisting funding deletion:', err);
      if (saveDraft) {
        const success = await saveDraft();
        if (success) {
          toast.success('Funding record deleted successfully');
        }
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <LoanFundingGrid
      dealId={dealId}
      loanNumber={loanNumber}
      borrowerName={borrowerName}
      fundingRecords={paginatedRecords}
      historyRecords={historyRecords}
      onAddFunding={handleAddFunding}
      onDeleteRecord={handleDeleteRecord}
      onUpdateRecord={handleUpdateRecord}
      onRefresh={onRefresh}
      isLoading={isLoading}
      disabled={disabled}
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={pageSize}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      noteRate={noteRate}
      soldRate={soldRate}
      totalPayment={totalPayment}
    />
  );
};

export default LoanTermsFundingForm;
