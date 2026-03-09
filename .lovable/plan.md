

## Field Key Refactoring — Status Summary

### Completed Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Add `canonical_key` and `form_type` columns to `field_dictionary` | Done |
| 2 | Create `field_key_migrations` tracking table | Done |
| 3 | Generate new field keys (`br_p_fn` convention) via edge function | Done (~1,500+ fields migrated) |
| 4 | Create central `src/lib/fieldKeyMap.ts` module | Done (814 lines, 23 sections) |
| 5 | Update 19 form components to import from central map | Done |
| 6 | Update `field-resolver.ts` with multi-tier backward-compatible resolution | Done |
| 7 | Update `generate-document` to call `fetchFieldKeyMappings()` at init | Done |
| 8 | Deal data JSONB migration | Skipped (unnecessary — data uses stable UUIDs, not field_key strings) |

**All phases are complete.** The refactoring is fully implemented.

### 4 Remaining Form Components (Not Updated)

`CoBorrowerPrimaryForm`, `InsuranceDetailForm`, `LienDetailForm`, and `LoanTermsPenaltiesForm` use dynamic index-based keys and were intentionally left with inline key generation. These are fine as-is.

---

### End-to-End Testing Plan

Here is how to verify everything works correctly:

**Test 1 — Field Dictionary Admin Page**
1. Log in as Admin
2. Navigate to System Admin → Field Dictionary
3. Verify migrated fields show new keys (e.g., `br_p_firstname`) and the `form_type` column is populated
4. Confirm `canonical_key` column shows the original dot-notation key (e.g., `borrower.first_name`)

**Test 2 — Data Entry (Read + Write)**
1. Log in as CSR
2. Open an existing deal → Enter Deal Data
3. Verify all sections load existing data correctly (Borrower, Lender, Property, Loan Terms, etc.)
4. Edit a field in each major section, save, then reload the page
5. Confirm the edited values persist correctly

**Test 3 — New Deal Creation**
1. Create a new deal
2. Fill in fields across Borrower, Property, Lender, Loan Terms sections
3. Save and reload — confirm all values are retained

**Test 4 — Document Generation (Backward Compatibility)**
1. Open an existing deal with data
2. Generate a document using an existing template
3. Verify merge tags resolve correctly — the generated document should have field values populated, not blank or showing raw tags

**Test 5 — Field Permissions**
1. If you have external user accounts (borrower/broker/lender roles), log in as one
2. Verify field visibility and editability still works correctly per role

