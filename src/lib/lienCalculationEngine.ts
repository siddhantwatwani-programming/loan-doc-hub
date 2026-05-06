// Pure helpers for the Lien Management calculation engine.
// No React, no I/O. Inputs are plain LienData[] + propertyValue.

import type { LienData } from '@/components/deal/LiensTableView';

const ORDINAL_SUFFIX: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };

export function parsePriority(input: string | number | undefined | null): number {
  if (input === null || input === undefined || input === '') return Number.POSITIVE_INFINITY;
  if (typeof input === 'number') return Number.isFinite(input) ? input : Number.POSITIVE_INFINITY;
  const m = String(input).match(/-?\d+/);
  if (!m) return Number.POSITIVE_INFINITY;
  const n = parseInt(m[0], 10);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

export function formatOrdinal(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '';
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  return `${n}${ORDINAL_SUFFIX[n % 10] ?? 'th'}`;
}

export function toNumber(v: string | undefined | null): number {
  if (!v) return 0;
  const cleaned = String(v).replace(/[^0-9.\-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function getRemainingBalance(lien: LienData): number {
  const cur = toNumber(lien.currentBalance);
  if (lien.existingPayoff === 'true') return 0;
  if (lien.existingPaydown === 'true') {
    const pd = toNumber(lien.existingPaydownAmount);
    return Math.max(0, cur - pd);
  }
  if (lien.existingRemain === 'true') return cur;
  // No "Existing" set: use anticipated/new balance for new liens.
  const anticipated = toNumber(lien.anticipatedAmount) || toNumber(lien.newRemainingBalance);
  if (anticipated > 0) return anticipated;
  return cur;
}

export interface DistributionResult {
  paidAmount: number;
  balanceAfter: number;
  priorityAfter: number;
}

export function distributePayoff(
  liens: LienData[],
  propertyValue: number,
): Map<string, DistributionResult> {
  const sorted = [...liens].sort((a, b) =>
    parsePriority(a.lienPriorityNow) - parsePriority(b.lienPriorityNow),
  );
  const result = new Map<string, DistributionResult>();
  let remaining = Math.max(0, propertyValue);
  let order = 1;
  for (const lien of sorted) {
    const owed = getRemainingBalance(lien);
    const paid = Math.min(remaining, owed);
    const balanceAfter = Math.max(0, owed - paid);
    result.set(lien.id, {
      paidAmount: paid,
      balanceAfter,
      priorityAfter: balanceAfter > 0 ? order++ : 0,
    });
    remaining = Math.max(0, remaining - paid);
  }
  return result;
}

export function findThisLoanLien(liens: LienData[]): LienData | undefined {
  return liens.find(
    (l) => l.anticipated === 'This Loan' || l.thisLoan === 'true',
  );
}

export interface EquitySummary {
  propertyValue: number;
  seniorTotal: number;
  totalLiens: number;
  protectiveEquity: number;
  totalEquity: number;
}

export function computeEquity(
  liens: LienData[],
  propertyValue: number,
): EquitySummary {
  const thisLoan = findThisLoanLien(liens);
  const thisLoanPriority = thisLoan
    ? parsePriority(thisLoan.lienPriorityNow)
    : Number.POSITIVE_INFINITY;

  let seniorTotal = 0;
  let totalLiens = 0;
  for (const l of liens) {
    const bal = getRemainingBalance(l);
    totalLiens += bal;
    if (parsePriority(l.lienPriorityNow) < thisLoanPriority) {
      seniorTotal += bal;
    }
  }
  return {
    propertyValue,
    seniorTotal,
    totalLiens,
    protectiveEquity: propertyValue - seniorTotal,
    totalEquity: propertyValue - totalLiens,
  };
}
