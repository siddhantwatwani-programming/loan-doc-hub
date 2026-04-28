## Scope

Enter File Data → Other Origination → (left side menu) Servicing.

Two changes only — no schema changes, no new tables, no new APIs. All values persist through the existing `onValueChange` flow already used by `OriginationServicingForm`.

---

## 1. Rename left-side menu label

**File:** `src/components/deal/OriginationFeesSubNavigation.tsx`

Change the sub-nav entry from `'Servicing'` to `'Servicing Agent'`. The internal `key: 'servicing'` and routing stay the same — only the displayed label changes.

```text
{ key: 'servicing', label: 'Servicing' }   →   { key: 'servicing', label: 'Servicing Agent' }
```

---

## 2. Servicing Agent dropdown + population rules

**File:** `src/components/deal/OriginationServicingForm.tsx`

### 2a. Dropdown options

Replace the current `AGENT_OPTIONS = ['Company', 'Other Servicer', 'Lender', 'Broker']` with the four options requested:

```text
Company
Broker
Lender
Other / Third Party
```

The selected value continues to persist into the existing field key `origination_svc.servicing_agent` (no schema change).

### 2b. Auto-populate rules for the "Complete if 3rd Party" address block

Add a `useEffect` that fires whenever `origination_svc.servicing_agent` changes and writes into the existing third-party fields (`origination_svc.third_party.{name,street,city,state,zip,phone,email}`) using the existing `onValueChange` callback (which already persists to `deal_section_values` via the standard save pipeline).

| Selection | Source of populated values |
|---|---|
| **Company** | `loan_terms.details_company` → Name. Other address fields cleared (no company address fields exist in the schema today; mirrors the existing `LoanTermsServicingForm` Company behavior). |
| **Broker** | Existing broker keys already in `values`: `broker.company`, `broker.address.street/city/state/zip`, `broker.phone.work`, `broker.email`. |
| **Lender** (single lender) | Existing lender keys already in `values`: `lender.full_name`, `lender.primary_address.street/city/state/zip`, `lender.phone.work`, `lender.email`. |
| **Lender** (multi-lender) | Parse `values['loan_terms.funding_records']` (existing JSON array). Find the record with the **largest `principalBalance`**. If that lender's `lenderAccount` matches the deal's primary lender, use the existing `lender.*` keys; otherwise look up that contact in `contacts` (by `contact_id` = `lenderAccount`) and populate `name` + `contact_data.primary_address.*` / `phone.work` / `email` from there. The `lenderName` from the funding record is used as a fallback for Name. |
| **Other / Third Party** | No auto-populate. The third-party fields remain editable for manual entry. Existing values are preserved (do not clear). |

Fields are written via `onValueChange(...)` which routes through the same dirty-tracking + save API that the rest of the form already uses. The existing `Same as 3rd Party` checkbox on the right column continues to mirror values into `Send Payments To`.

### 2c. Multi-lender detection

A loan is considered "multi-lender" when `values['loan_terms.funding_records']` parses to an array with more than one entry. The largest is selected by:

```text
records.reduce((max, r) => Number(r.principalBalance) > Number(max.principalBalance) ? r : max)
```

For ties, the first record wins (deterministic).

### 2d. Lender contact lookup (multi-lender only)

When the largest-funding lender's `lenderAccount` differs from the deal's primary lender:

- Single Supabase read: `supabase.from('contacts').select('full_name, contact_data').eq('contact_id', lenderAccount).eq('contact_type', 'lender').maybeSingle()`
- Mapped into the third-party fields using the same shape `LenderIdSearch` already returns (`contact_data.primary_address.*`, `contact_data.phone.work`, `contact_data.email`, `contact_data.full_name`).

This uses the existing `contacts` RLS policy already in place — no schema changes.

---

## Constraints honored

- ✅ Sub-nav internal key (`servicing`) and routing untouched — only the display label changes.
- ✅ All field keys (`origination_svc.servicing_agent`, `origination_svc.third_party.*`, `origination_svc.send_payments.*`) already exist; no new `field_dictionary` rows, no new tables, no schema migration.
- ✅ Persistence flows through the existing `onValueChange` → `deal_section_values` API used by every other form on this page.
- ✅ No changes to UI layout, the right-side "Send Payments To" column, the "Same as 3rd Party" checkbox, the Broker Servicing Fee block, or any other section.
- ✅ Existing `LoanTermsServicingForm` (under Loan → Terms) continues to use its own copy of `AGENT_OPTIONS` and is **not** modified.

---

## Files touched

1. `src/components/deal/OriginationFeesSubNavigation.tsx` — one-line label change.
2. `src/components/deal/OriginationServicingForm.tsx` — update `AGENT_OPTIONS`, add `useEffect` for auto-populate with Company / Broker / Lender / largest-funding-lender lookup; `Other / Third Party` skips populate.