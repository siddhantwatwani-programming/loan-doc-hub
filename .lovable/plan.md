

## Plan: Fix Lien Interest Rate Not Persisting to Database

### Root Cause

The lien `interest_rate` field entered in the Liens tab is **never saved to the database**. Here's why:

1. When a user enters an interest rate for a lien, the UI generates the key `lien1.interest_rate`
2. The save logic normalizes this to canonical key `lien.interest_rate`
3. It then looks up `lien.interest_rate` in the legacy key map (`src/lib/legacyKeyMap.ts`) to find the corresponding field_dictionary key
4. **`lien.interest_rate` is missing from the legacy key map** — other lien fields like `lien.holder`, `lien.phone` etc. are all mapped, but `interest_rate` was omitted
5. Since no field_dictionary_id can be resolved, the field is silently skipped during save
6. During document generation, `li_gd_interestRate` has no stored value, so the template either shows empty or picks up a stale/incorrect value from another resolution path

### Fix

**File: `src/lib/legacyKeyMap.ts`** (single change)

Add the missing mapping after line 572 (end of the LIEN TAB section):

```typescript
'lien.interest_rate': 'li_gd_interestRate',
```

This maps `lien.interest_rate` → `li_gd_interestRate` (field_dictionary ID `d6fb8c00-...`, section: `liens`, data_type: `percentage`), ensuring:
- The lien interest rate entered in the UI is persisted to `deal_section_values` under the correct field_dictionary entry
- Document generation resolves `{{li_gd_interestRate}}` to the Liens interest rate, not the Loan Note Rate

### What is NOT changed
- No other files modified
- No edge function changes
- No database changes
- No UI changes
- No other field mappings affected

