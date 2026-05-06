## Property → Liens — UI alignment + calculation completion

### Scope (no schema, no new tables)
All persistence flows through the existing `useDealFields` / `deal_section_values` JSONB save path keyed by `{lienId}.<field>`. No `field_dictionary` rows are added. Existing calculation engine (`src/lib/lienCalculationEngine.ts`) is reused.

---

### 1. Lien Details form (`LienDetailForm.tsx`) — match screenshot

Today the form already renders 90% of the screenshot fields across 3 columns (Lien Details, middle balances column, Senior Lien Tracking). The visible deltas vs. the image:

- **Column 1 ordering** (top → bottom) will be reordered to:
  Source of Information → Related Property → Loan Type → Lien Type Dropdown (renamed from current label) → Anticipated → Condition (relabel of current "Existing") → Lien Holder Name → Account Number → Phone → Recording Date → Recording Number → Maturity Date → Balloon → Y/N → Times 60-days Delinquent.
- **Column 2** stays as-is and gains the screenshot's label tweak: "Anticipated Balance (if new lien)" (already present), and "Remaining Balance" (already present as `existingPayoffAmount`). No field add/remove.
- **Column 3 (Senior Lien Tracking)** — already complete; only verifying labels match exactly ("Foreclosure: Date Filed", "Last Payment Made", "Next Payment Due", "Current Balance", "Request Submitted", "Response Received", "Borrower Notified", "Lender Notified").
- **"This Loan" checkbox** above Source of Information will be moved to top-of-column #1 to match the screenshot's first row.

No `LienData` interface fields added. No new dictionary keys. Persistence is unchanged.

### 2. Add-Lien modal — both surfaces

**a. `LienModal.tsx`** — already wraps `LienDetailForm`, so the column-1 reorder above flows in automatically. Only modal-specific change: nothing (it just renders `<LienDetailForm/>`).

**b. `PropertyLiensForm.tsx`** (the legacy quick-add) — currently has duplicated rendering blocks (lines 145–262 are an accidental duplicate of 88–145). I will:
- Remove the duplicated block.
- Reorder fields to match the screenshot's column 1: Source of Information dropdown, Related Property, Loan Type, Lien Type Dropdown, Anticipated, Condition, Lien Holder Name, Account Number, Phone, Original Balance, Current Balance, Regular Payment, Last Checked.
- Use the same `FIELD_KEYS` constants already in `fieldKeyMap.ts` — no new keys.

### 3. Calculations (already implemented — verify and harden)

The four formulas are already coded in `src/lib/lienCalculationEngine.ts` and wired in `LienSectionContent.tsx` (lines 261–301). Verification work only:

| Formula | Engine func | Wired? | Action |
|---|---|---|---|
| Remaining Balance auto-calc (Payoff=0, Remain=Current, Paydown=Current−Paydown) | `getRemainingBalance` | Yes (LienDetailForm useEffect lines 156–180) | Confirm; ensure value persists into `lien.newRemainingBalance` |
| Lien Priority After (renumber juniors after Payoff/Paydown distribution by property value) | `distributePayoff` → `priorityAfter` | Yes (LienSectionContent line 278) | Confirm — write `${lienId}.lien_priority_after` ordinal |
| Protective Equity = PropertyValue − Senior liens (priority < This Loan) | `computeEquity.protectiveEquity` | Yes (writes `${propertyId}.protective_equity`) | Confirm; ensure surfaced read-only on Property Details (already done) |
| Junior/Senior totals (sum of liens above/below "This Loan") | `computeEquity.seniorTotal` / `totalLiens − seniorTotal` | Partially — only `seniorTotal` & `totalEquity` are written | **Add** writes for `${propertyId}.senior_liens_total` and `${propertyId}.junior_liens_total` so both totals can be read back into the UI |

Junior total formula will be `equity.totalLiens - equity.seniorTotal - <thisLoanRemaining>`, computed in the same `useEffect` that already runs.

### 4. Persistence

No DB changes. All writes use the existing `onValueChange(key, value)` plumbing → `deal_section_values.field_values[key]`. Keys used:
- `${lienId}.<field>` — already saved
- `${propertyId}.protective_equity` — already saved
- `${propertyId}.total_equity` — already saved
- `${propertyId}.senior_liens_total` — **new key, same JSONB column**
- `${propertyId}.junior_liens_total` — **new key, same JSONB column**

(These two new strings live in the existing `deal_section_values.field_values` JSONB; no schema migration.)

### Out of scope
- No changes to `LiensTableView` columns
- No changes to `LienData` interface
- No changes to document generation / merge tags
- No changes to RLS, dictionary, or migrations
- No new APIs

### Files to touch
- `src/components/deal/LienDetailForm.tsx` — reorder column 1, move This-Loan checkbox to top, label tweaks
- `src/components/deal/PropertyLiensForm.tsx` — delete duplicated render block, reorder
- `src/components/deal/LienSectionContent.tsx` — add senior/junior total writes inside existing `useEffect`
- `src/lib/lienCalculationEngine.ts` — extend `EquitySummary` with `juniorTotal` (pure helper, no behavior change for existing callers)

### Acceptance
- Form layout visually matches the screenshot's 3-column structure and label order.
- Editing Current Balance / Paydown updates Remaining Balance live (already works).
- Saving a lien persists through existing API; reopening shows the same values.
- After save, `Lien Priority After`, `Protective Equity`, `Senior Liens Total`, `Junior Liens Total` recompute automatically per property and persist.
