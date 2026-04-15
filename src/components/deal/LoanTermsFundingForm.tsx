import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { LoanFundingGrid } from './LoanFundingGrid';
import type { FundingRecord } from './LoanFundingGrid';
import type { FundingAdjustmentData } from './FundingAdjustmentModal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';
import type { FundingFormData } from './AddFundingModal';
import { resolveLegacyKey } from '@/lib/legacyKeyMap';
import { unformatCurrencyDisplay } from '@/lib/numericInputFilter';

/** Strip commas/$ from a string before parseFloat so formatted values like "3,423.00" parse correctly */
const safeParseFloat = (v: string | undefined): number => {
  if (!v) return 0;
  return parseFloat(unformatCurrencyDisplay(v.replace(/\$/g, ''))) || 0;
};

// Field key mapping for funding data stored in loan_terms section
const FIELD_KEYS = {
  fundingRecords: 'loan_terms.funding_records',
  fundingHistory: 'loan_terms.funding_history',
  fundingAdjustments: 'loan_terms.funding_adjustments',
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

  const candidateKeys = Array.from(new Set([fieldKey, resolveLegacyKey(fieldKey)]));

  const { data, error } = await supabase
    .from('field_dictionary')
    .select('id, field_key')
    .in('field_key', candidateKeys)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.warn(`[LoanTermsFundingForm] Could not resolve field_dictionary id for "${fieldKey}"`, error);
    return null;
  }

  cache.set(fieldKey, data.id);
  if (data.field_key !== fieldKey) {
    cache.set(data.field_key, data.id);
  }

  return data.id;
}

/**
 * Direct-persist a JSON value into deal_section_values for loan_terms section.
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

    if (sectionRows && sectionRows.length > 0) {
      let targetRow = sectionRows.find((sv) => {
        const fv = (sv.field_values as Record<string, any>) || {};
        return !!fv[fieldDictId];
      }) || sectionRows[0];

      const fieldValues = ((targetRow.field_values as Record<string, any>) || {});
      fieldValues[fieldDictId] = {
        ...(fieldValues[fieldDictId] || {}),
        value_text: jsonValue,
        indexed_key: fieldKey,
        indexed_db_key: resolveLegacyKey(fieldKey),
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
      const fieldValues: Record<string, any> = {};
      fieldValues[fieldDictId] = {
        value_text: jsonValue,
        indexed_key: fieldKey,
        indexed_db_key: resolveLegacyKey(fieldKey),
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

  // Borrower Name: auto-populate from Participants table (primary borrower)
  const [participantBorrowerName, setParticipantBorrowerName] = useState('');
  useEffect(() => {
    if (!dealId) return;
    const fetchBorrower = async () => {
      // Fetch ALL borrower participants for this deal
      const { data: participants } = await supabase
        .from('deal_participants')
        .select('name, contact_id')
        .eq('deal_id', dealId)
        .eq('role', 'borrower')
        .order('created_at', { ascending: true });

      if (!participants || participants.length === 0) return;

      // Primary = first borrower participant
      const primary = participants[0];
      let primaryName = primary.name || '';

      // If no name on participant row, fallback to contacts table
      if (!primaryName && primary.contact_id) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('full_name, first_name, last_name')
          .eq('id', primary.contact_id)
          .maybeSingle();
        if (contact) {
          primaryName = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
        }
      }

      // Indicate additional borrowers if present
      if (participants.length > 1) {
        primaryName = `${primaryName} (+${participants.length - 1} more)`;
      }

      if (primaryName) {
        setParticipantBorrowerName(primaryName);
      }
    };
    fetchBorrower();
  }, [dealId]);

  const borrowerName = participantBorrowerName || values['loan_terms.details_borrower_name'] || '';

  // Get loan rates for Rate Selection
  const noteRate = values['loan_terms.note_rate'] || '';
  const soldRate = values['loan_terms.sold_rate'] || '';
  const totalPayment = values['loan_terms.total_payment'] || values['loan_terms.regular_payment'] || '';
  const loanAmount = values['loan_terms.loan_amount'] || values['loan_terms.original_loan_amount'] || '';

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

  // Parse funding adjustments from stored JSON value
  const fundingAdjustments: FundingAdjustmentData[] = useMemo(() => {
    const storedValue = values[FIELD_KEYS.fundingAdjustments];
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
    if (values[FIELD_KEYS.fundingRecords] || values[FIELD_KEYS.fundingHistory]) {
      hydrationAttemptedRef.current = true;
      return;
    }

    hydrationAttemptedRef.current = true;

    const hydrate = async () => {
      try {
        const recId = await resolveFieldDictId(FIELD_KEYS.fundingRecords, dictCacheRef.current);
        const histId = await resolveFieldDictId(FIELD_KEYS.fundingHistory, dictCacheRef.current);
        const adjId = await resolveFieldDictId(FIELD_KEYS.fundingAdjustments, dictCacheRef.current);
        if (!recId && !histId && !adjId) return;

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
          if (adjId && fv[adjId]) {
            const val = fv[adjId].value_text;
            if (val) onValueChange(FIELD_KEYS.fundingAdjustments, val);
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
    // Determine lender rate from rate selection
    let lenderRate = 0;
    if (data.rateSelection === 'note_rate') lenderRate = parseFloat(data.rateNoteValue) || 0;
    else if (data.rateSelection === 'sold_rate') lenderRate = parseFloat(data.rateSoldValue) || 0;
    else if (data.rateSelection === 'lender_rate') lenderRate = parseFloat(data.rateLenderValue) || 0;

    const newRecord: FundingRecord = {
      id: `funding-${Date.now()}`,
      fundingDate: data.fundingDate || '',
      lenderAccount: data.lenderId || '',
      lenderName: data.lenderFullName || '',
      pctOwned: safeParseFloat(data.percentOwned),
      lenderRate,
      principalBalance: safeParseFloat(data.principalBalance || data.fundingAmount),
      originalAmount: safeParseFloat(data.fundingAmount),
      regularPayment: safeParseFloat(data.regularPayment),
      lenderShare: safeParseFloat(data.lenderShare),
      roundingError: false,
      rateSelection: data.rateSelection,
      rateNoteValue: data.rateNoteValue,
      rateSoldValue: data.rateSoldValue,
      rateLenderValue: data.rateLenderValue,
      brokerParticipates: data.brokerParticipates,
      interestFrom: data.interestFrom,
      roundingAdjustment: data.roundingAdjustment,
      disbursements: data.disbursements,
      payments: data.payments,
      noteRateDisplay: data.noteRateDisplay,
      // Fees to Company
      overrideServicing: data.overrideServicing,
      companyBaseFee: data.companyBaseFee, companyBaseFeePct: data.companyBaseFeePct,
      companyAdditionalServices: data.companyAdditionalServices,
      companyMinimum: data.companyMinimum, companyMaximum: data.companyMaximum,
      companyNrSitSplitPct: data.companyNrSitSplitPct, companyNrSitSplit: data.companyNrSitSplit,
      companyTotal: data.companyTotal,
      // Fees to Vendor
      vendorId: data.vendorId, vendorName: data.vendorName,
      vendorBaseFee: data.vendorBaseFee, vendorBaseFeePct: data.vendorBaseFeePct,
      vendorAdditionalServices: data.vendorAdditionalServices,
      vendorMinimum: data.vendorMinimum, vendorMaximum: data.vendorMaximum,
      vendorNrSitSplitPct: data.vendorNrSitSplitPct, vendorNrSitSplit: data.vendorNrSitSplit,
      vendorTotal: data.vendorTotal,
      // Legacy servicing fees
      overrideServicingFees: data.overrideServicingFees,
      companyServicingFee: data.companyServicingFee, companyServicingFeePct: data.companyServicingFeePct,
      companyMaxFee: data.companyMaxFee, companyMaxFeePct: data.companyMaxFeePct,
      companyMinFee: data.companyMinFee, companyMinFeePct: data.companyMinFeePct,
      brokerServicingFee: data.brokerServicingFee, brokerServicingFeePct: data.brokerServicingFeePct,
      brokerMaxFee: data.brokerMaxFee, brokerMaxFeePct: data.brokerMaxFeePct,
      brokerMinFee: data.brokerMinFee, brokerMinFeePct: data.brokerMinFeePct,
      overrideDefaultFees: data.overrideDefaultFees,
      lateFee1Lender: data.lateFee1Lender, lateFee1Company: data.lateFee1Company, lateFee1Broker: data.lateFee1Broker, lateFee1Total: data.lateFee1Total, lateFee1Maximum: data.lateFee1Maximum,
      lateFee2Lender: data.lateFee2Lender, lateFee2Company: data.lateFee2Company, lateFee2Broker: data.lateFee2Broker, lateFee2Total: data.lateFee2Total, lateFee2Maximum: data.lateFee2Maximum,
      defaultInterestLender: data.defaultInterestLender, defaultInterestCompany: data.defaultInterestCompany, defaultInterestBroker: data.defaultInterestBroker, defaultInterestTotal: data.defaultInterestTotal, defaultInterestMaximum: data.defaultInterestMaximum,
      interestGuaranteeLender: data.interestGuaranteeLender, interestGuaranteeCompany: data.interestGuaranteeCompany, interestGuaranteeBroker: data.interestGuaranteeBroker, interestGuaranteeTotal: data.interestGuaranteeTotal, interestGuaranteeMaximum: data.interestGuaranteeMaximum,
      prepaymentLender: data.prepaymentLender, prepaymentCompany: data.prepaymentCompany, prepaymentBroker: data.prepaymentBroker, prepaymentTotal: data.prepaymentTotal, prepaymentMaximum: data.prepaymentMaximum,
      maturityLender: data.maturityLender, maturityCompany: data.maturityCompany, maturityBroker: data.maturityBroker, maturityTotal: data.maturityTotal, maturityMaximum: data.maturityMaximum,
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
      amountFunded: safeParseFloat(data.fundingAmount),
    });
    const updatedHistoryJson = JSON.stringify(history);
    onValueChange(FIELD_KEYS.fundingHistory, updatedHistoryJson);

    // Direct-persist both fields to DB
    await Promise.all([
      directPersistFundingField(dealId, FIELD_KEYS.fundingRecords, updatedRecordsJson, dictCacheRef.current),
      directPersistFundingField(dealId, FIELD_KEYS.fundingHistory, updatedHistoryJson, dictCacheRef.current),
    ]);

    // Auto-add lender to deal_participants if not already present
    if (data.lenderFullName) {
      try {
        const { data: existing } = await supabase
          .from('deal_participants')
          .select('id')
          .eq('deal_id', dealId)
          .eq('role', 'lender')
          .eq('name', data.lenderFullName)
          .maybeSingle();

        if (!existing) {
          // Look up contact for email/phone/contact_id
          let contactId: string | null = null;
          let email: string | null = null;
          let phone: string | null = null;

          if (data.lenderId) {
            const { data: contact } = await supabase
              .from('contacts')
              .select('id, email, phone')
              .eq('contact_id', data.lenderId)
              .maybeSingle();
            if (contact) {
              contactId = contact.id;
              email = contact.email;
              phone = contact.phone;
            }
          }

          await supabase.from('deal_participants').insert({
            deal_id: dealId,
            role: 'lender' as any,
            name: data.lenderFullName,
            email,
            phone,
            contact_id: contactId,
            status: 'invited',
            access_method: 'login',
          });
        }
      } catch (err) {
        console.error('[LoanTermsFundingForm] Auto-add lender participant failed:', err);
      }
    }
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

  const handleSaveAdjustment = useCallback(async (adjustment: FundingAdjustmentData) => {
    // Upsert: replace if same id exists, else append
    const existing = fundingAdjustments.filter((a) => a.id !== adjustment.id);
    const updated = [...existing, adjustment];
    const json = JSON.stringify(updated);
    onValueChange(FIELD_KEYS.fundingAdjustments, json);

    await directPersistFundingField(dealId, FIELD_KEYS.fundingAdjustments, json, dictCacheRef.current);
    toast.success('Funding adjustment saved');
  }, [fundingAdjustments, onValueChange, dealId]);

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
      loanAmount={loanAmount}
    />
  );
};

export default LoanTermsFundingForm;
