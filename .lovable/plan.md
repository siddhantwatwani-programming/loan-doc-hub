

## Problem Summary

There are four critical issues with the Field Dictionary module:

1. **Insurance section: 0 fields in DB** — `InsuranceDetailForm` uses ~25 field keys but the `field_dictionary` table has zero entries for `section = 'insurance'`
2. **form_type misclassification** — Borrower authorized party (~24 fields), guarantor (~50+ fields), and banking (~15 fields) are all tagged as `form_type = 'primary'` instead of `authorized_party`, `guarantor`, and `banking` respectively. Same issue with several loan_terms fields that should be `servicing`, `funding`, or `balances`. Lender banking fields (only 2 of ~21 are tagged `banking`), and lender tax fields are under `primary`.
3. **Legacy key mismatch in DB field_key prefix** — The DB keys use `br_p_` prefix for authorized party, guarantor, and banking fields (e.g., `br_p_authPartyFirstName`) when they should use `br_ap_`, `br_g_`, and `br_b_` respectively to match the section/form convention
4. **Missing insurance field_dictionary entries** — No DB rows exist, so InsuranceDetailForm cannot persist any data

## Plan

### Task 1: Fix form_type categorization via UPDATE queries

Update `form_type` on existing `field_dictionary` rows to reflect the actual sub-form they belong to. This is purely data updates — no schema changes.

**Borrower section:**
- All `br_p_authParty*` fields → `form_type = 'authorized_party'`
- All `br_p_guaranto*` fields → `form_type = 'guarantor'`  
- All `br_p_bank*`, `br_p_routin*`, `br_p_individ*`, `br_p_account*` (ACH-related), `br_p_serviceStatus`, `br_p_applyDebitAs`, `br_p_debit*`, `br_p_nextDebit*`, `br_p_stopDate`, `br_p_sendConfir`, `br_p_disableOnlinePaymen` → `form_type = 'banking'`
- `br_p_send1098` → `form_type = 'tax'` (alongside existing `br_t_*` fields)
- `br_p_note` → `form_type = 'notes'`

**Co-Borrower section:**
- Banking, tax, and notes fields within `co_borrower` similarly re-tagged

**Lender section:**
- `ld_p_bank*`, `ld_p_routing*`, `ld_p_account*`, `ld_p_furtherCredit*`, `ld_p_byCheck*`, `ld_p_checkSame*`, `ld_p_checkAddres*`, `ld_p_checkCity*`, `ld_p_checkZip*`, `ld_p_achEmail*`, `ld_p_achStatus`, `ld_p_creditCard*`, `ld_p_cardNumber`, `ld_p_securityCode`, `ld_p_expirati` → `form_type = 'banking'`
- `ld_p_taxPayer*`, `ld_p_designatRecipi` → `form_type = 'tax'`

**Loan Terms section:**
- Fields matching servicing (escrow impound, disbursement) → `form_type = 'servicing'`
- Additional balances fields currently under `primary` → `form_type = 'balances'`

**Broker section:**
- Banking fields under `primary` → `form_type = 'banking'`

Approximately 6-8 UPDATE statements using pattern matching on `field_key`.

### Task 2: Insert Insurance section fields into field_dictionary

Insert ~25 rows for section `insurance` covering all fields from `InsuranceDetailForm`:
- property, description, insuredName, companyName, policyNumber, expiration, coverage, active
- agentName, businessAddress, businessAddressCity, businessAddressState, businessAddressZip
- phoneNumber, faxNumber, email, note
- paymentMailingStreet, paymentMailingCity, paymentMailingState, paymentMailingZip
- insuranceTracking, lastVerified, trackingStatus

Each entry gets: `section = 'insurance'`, `form_type = 'detail'`, appropriate `data_type`, `field_key` in `in_d_*` convention.

### Task 3: Add Insurance key mappings to legacyKeyMap.ts

Add entries mapping InsuranceDetailForm's `insurance1.*` legacy keys to the new `in_d_*` DB keys created in Task 2.

### Task 4: Update legacyKeyMap.ts DB key references for reclassified fields

Where the DB `field_key` prefix changes (e.g., if we rename `br_p_authPartyFirstName` to `br_ap_firstName`), update the legacy map accordingly. However, renaming DB field_keys is high-risk (breaks existing stored data). **Instead, we will only update `form_type` without changing the actual `field_key` values.** The prefix mismatch (`br_p_` for authorized party fields) is cosmetic — what matters for persistence is the exact `field_key` match, which already works via `legacyKeyMap.ts`.

### Task 5: Add Insurance section enum value

The `field_section` enum currently doesn't include `insurance`. We need a migration to add it:
```sql
ALTER TYPE field_section ADD VALUE IF NOT EXISTS 'insurance';
```

### Files Changed

| File | Change |
|------|--------|
| DB migration | Add `insurance` to `field_section` enum |
| DB data (insert tool) | INSERT 25 insurance fields |
| DB data (insert tool) | UPDATE ~150 rows to fix `form_type` across borrower, co_borrower, lender, loan_terms, broker |
| `src/lib/legacyKeyMap.ts` | Add insurance section key mappings (~25 entries) |

### What We Are NOT Changing
- **field_key values in DB** — Renaming `br_p_authPartyFirstName` to `br_ap_firstName` would break any existing stored deal data. The form_type column is sufficient for correct categorization/filtering.
- **fieldKeyMap.ts** — Legacy dot-notation keys remain as-is; the translation layer in legacyKeyMap.ts handles the bridge.
- **Schema/table structure** — Only data updates and one enum addition.

