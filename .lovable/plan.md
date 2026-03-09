

## Audit: Field Key Mapping Inconsistencies

After cross-referencing the UI forms, `legacyKeyMap.ts`, `fieldKeyMap.ts`, and the `field_dictionary` database table, here are all the issues found:

---

### Issue 1: Co-Borrower Banking — No legacy key mappings

**CoBorrowerBankingForm** uses keys like `coborrower.bank.name`, `coborrower.bank.routing_number`, `coborrower.bank.account_number`, `coborrower.bank.account_holder`, `coborrower.bank.account_type`, `coborrower.bank.address.street/city/state/zip`, `coborrower.bank.phone` (10 fields).

The DB has matching fields (`cb_p_coborrowBankName`, `cb_p_coborrowRoutinNumber`, `cb_p_coborrowAccounNumber`, etc.) but **legacyKeyMap.ts has zero mappings** for these keys. Data cannot persist.

**Fix:** Add ~10 co-borrower banking mappings to legacyKeyMap.ts. Also update the DB `form_type` from `primary` to `banking` for these fields.

---

### Issue 2: Co-Borrower Tax Detail — No legacy key mappings

**CoBorrowerTaxDetailForm** uses keys: `coborrower.tax_id_type`, `coborrower.tax_id`, `coborrower.tax.filing_status`, `coborrower.tax.exempt`, `coborrower.tax.year`, `coborrower.tax.annual_income`, `coborrower.tax.bracket`, `coborrower.tax.notes` (8 fields).

The DB has `cb_p_taxIdType`, `cb_p_coborrowFilingStatus`, `cb_p_coborrowTaxExempt`, `cb_p_coborrowTaxYear`, `cb_p_coborrowAnnualIncome`, `cb_p_coborrowTaxBracke`, `cb_p_coborrowTaxNotes` — but **no legacy map entries** exist for most of them (only `coborrower.tax_id_type` is mapped). Also `form_type` is `primary` instead of `tax`.

**Fix:** Add ~7 co-borrower tax mappings to legacyKeyMap.ts. Update `form_type` to `tax` for these DB fields.

---

### Issue 3: Co-Borrower Note — No legacy key mapping

**CoBorrowerNoteForm** uses `coborrower.note`. No mapping exists in legacyKeyMap.ts and no DB field with key matching `cb_p_note` or similar was found.

**Fix:** Check if a DB field exists (none found in query). Need to INSERT a `cb_p_note` field and add the legacy mapping.

---

### Issue 4: Borrower Tax Detail — 7 of 10 fields missing from DB

**legacyKeyMap.ts** maps `borrower.1098.*` keys to `br_t_*` DB keys, but only 3 of 10 exist in the DB: `br_t_city`, `br_t_state`, `br_p_send1098`. Missing: `br_t_designatRecipi`, `br_t_name`, `br_t_address`, `br_t_accountNumber`, `br_t_tinType`, `br_t_tin`, `br_t_zip`.

**Fix:** INSERT 7 missing borrower tax fields into field_dictionary with `form_type = 'tax'`.

---

### Issue 5: Borrower Note & Description — missing from DB

`br_p_note` and `br_p_borrowerDescri` are mapped in legacyKeyMap but don't exist in the DB. `br_p_borrowerDescri` exists but `br_p_note` does not.

**Fix:** INSERT `br_p_note` into field_dictionary with `form_type = 'notes'`.

---

### Issue 6: Lender Tax — `ld_p_taxPayerAutoSynchr` missing from DB

The mapping `lender.tax_payer.auto_synchronize` → `ld_p_taxPayerAutoSynchr` exists in legacyKeyMap but this field is **not in the DB**.

**Fix:** INSERT this field with `section = 'lender'`, `form_type = 'tax'`.

---

### Issue 7: Co-Borrower form_type not categorized

All 85 co-borrower fields are under `form_type = 'primary'`. Fields for banking (~10), tax (~8), and notes (~1) should be recategorized.

**Fix:** UPDATE `form_type` for ~19 co-borrower fields.

---

### Issue 8: Loan Terms Servicing fields — no legacy mappings

**LoanTermsServicingForm** uses dynamic keys like `loan_terms.servicing.{row}.{col}` (20 rows × 6 columns = ~120 field keys). The DB has only 6 servicing fields (`ln_p_acceptShortPaymen`, `ln_p_holdDays`, etc.) which are unrelated to the grid structure. These servicing grid fields have **no DB entries and no legacy mappings**.

**Fix:** This is a large gap (~120 fields). Either: (a) insert all grid fields into field_dictionary, or (b) store the servicing grid as a single JSON blob. Recommend option (b) — store as a JSON field to avoid 120 individual dictionary entries.

---

### Issue 9: Loan Terms Penalties — many UI fields not mapped

**LoanTermsPenaltiesForm** uses complex keys like `loan_terms.penalties.late_charge.*`, `loan_terms.penalties.default_interest.*`, and distribution sub-keys. The DB has only 7 penalty fields. Most penalty form fields have **no DB entries and no legacy mappings**.

**Fix:** Similar to servicing — the penalty form uses ~50+ dynamic field keys. Need to either insert them all or use a JSON blob approach.

---

### Issue 10: `fieldKeyMap.ts` missing entries

Several keys in fieldKeyMap have no corresponding legacy map entry and thus can't reach the DB:
- `lender.id` (in LENDER_INFO_KEYS but not in legacyKeyMap)
- `lender.entity_sign.*` (6 fields — no legacy map, no DB)
- `property1.thomas_map`, `property1.delinquencies_60day`, `property1.delinquencies_how_many`, `property1.currently_delinquent`, `property1.paid_by_loan`, `property1.source_of_payment`, `property1.recording_number`, `property1.unit` (8 property fields — no legacy map entries)
- `loan_terms.variable_arm`, `loan_terms.limited_no_doc`, `loan_terms.rehab_construction`, `loan_terms.parent_account_value`, `loan_terms.child_account_value` — no legacy map

---

### Implementation Plan

**Task 1: Add missing legacy key mappings to legacyKeyMap.ts**
- Co-Borrower Banking: 10 entries
- Co-Borrower Tax: 7 entries  
- Co-Borrower Note: 1 entry
- Lender entity sign: skip (not implemented in DB yet)
- Missing property fields: ~8 entries (need to verify DB fields exist first)
- Missing loan terms details fields: ~5 entries

**Task 2: INSERT missing fields into field_dictionary (DB)**
- 7 borrower tax fields (`br_t_*`)
- 1 borrower note field (`br_p_note`)
- 1 lender tax field (`ld_p_taxPayerAutoSynchr`)
- 1 co-borrower note field (`cb_p_note`)

**Task 3: UPDATE form_type for co-borrower fields**
- ~10 banking fields → `form_type = 'banking'`
- ~8 tax fields → `form_type = 'tax'`
- ~1 note field → `form_type = 'notes'`

**Task 4: Add missing property field legacy mappings**
- Cross-check which property UI keys have DB counterparts and add mappings

**Task 5: Document the Servicing/Penalties gap**
- These two sub-forms use 150+ dynamic keys with no DB backing. This requires a design decision: individual fields vs. JSON blob storage. Will flag for follow-up.

### Files Changed

| File | Change |
|------|--------|
| `src/lib/legacyKeyMap.ts` | Add ~30 new mapping entries |
| DB (insert tool) | INSERT ~10 missing field_dictionary rows |
| DB (insert tool) | UPDATE ~19 co-borrower rows to fix form_type |

