/**
 * Loan allocation pre-save validators.
 *
 * Mirrors the inline `allocationIncomplete` checks in:
 *  - LoanTermsBalancesForm.tsx (Sold Rate)
 *  - LoanTermsPenaltiesForm.tsx (DistributionFields, used by all penalties)
 *
 * Used by DealDataEntryPage.performSave / handleMarkReady to BLOCK save
 * when Lenders < 100 and Origination Vendor is empty.
 */

import { LOAN_TERMS_BALANCES_KEYS } from '@/lib/fieldKeyMap';

const parsePct = (raw: string | undefined): number | null => {
  if (raw === undefined || raw === null || String(raw).trim() === '') return null;
  const n = parseFloat(String(raw).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
};

export interface AllocationValidationResult {
  ok: boolean;
  /** Penalty prefix that failed (only set for penalty validation). */
  firstPrefix?: string;
}

/**
 * Sold Rate (Loan → Terms & Balances).
 * Fails when Sold Rate is enabled, Lenders has a value < 100,
 * and Origination Vendor (soldRateOtherClient1) is empty/NaN.
 */
export function validateBalancesSoldRate(
  values: Record<string, string>
): AllocationValidationResult {
  const enabled = values[LOAN_TERMS_BALANCES_KEYS.soldRateEnabled] === 'true';
  if (!enabled) return { ok: true };

  const lenders = parsePct(values[LOAN_TERMS_BALANCES_KEYS.soldRateCompany]);
  const origination = parsePct(values[LOAN_TERMS_BALANCES_KEYS.soldRateOtherClient1]);

  // Replicates LoanTermsBalancesForm: lendersHasValue && lendersClamped < 100 && originationEmpty
  if (lenders !== null && lenders < 100 && origination === null) {
    return { ok: false };
  }
  return { ok: true };
}

/** Penalty distribution prefixes that use the shared DistributionFields component. */
const PENALTY_PREFIXES = [
  'loan_terms.penalties.late_charge_1',
  'loan_terms.penalties.late_charge_2',
  'loan_terms.penalties.default_interest',
  'loan_terms.penalties.interest_guarantee',
  'loan_terms.penalties.prepayment_penalty',
  'loan_terms.penalties.maturity',
];

/**
 * Penalty Distribution allocations (Loan → Penalties).
 * For each penalty prefix, fails when Lenders has a value < 100
 * and Origination Vendor is empty/NaN.
 */
export function validatePenaltyDistributions(
  values: Record<string, string>
): AllocationValidationResult {
  for (const prefix of PENALTY_PREFIXES) {
    const lenders = parsePct(values[`${prefix}.distribution.lenders`]);
    const vendor = parsePct(values[`${prefix}.distribution.origination_vendors`]);
    if (lenders !== null && lenders < 100 && vendor === null) {
      return { ok: false, firstPrefix: prefix };
    }
  }
  return { ok: true };
}
