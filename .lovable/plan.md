

## Fix: "Continuing Authorization" Document Fields Not Populating

### Root Cause

Three issues prevent field population:

1. **Stored template uses legacy tags** (`{{Borrower.Name}}`, `{{terms.loannumber}}`) that don't resolve to data. The alias maps `Borrower.Name` → `borrower.full_name`, but data lives under `borrower1.full_name` (indexed). No bridge exists.

2. **`terms.loannumber` has no resolution path** — no merge_tag_alias, no canonical_key, no migration entry maps it to the actual field key `ln_p_loanNumber`.

3. **Pagination bug in `field-resolver.ts`**: `fetchFieldKeyMappings` fetches `field_dictionary` entries without pagination — only 1,000 of 2,033 canonical_key entries load, truncating the resolution map.

### Fix Plan

**1. Replace stored template** — Upload the user's corrected DOCX (which uses current field keys `{{br_p_fullName}}`, `{{ln_p_loanNumber}}`) to storage via the `upload-template` edge function, replacing the legacy-tag version.

**2. Fix pagination in `field-resolver.ts`** (lines 54-58) — Add a `.range()` loop to fetch ALL field_dictionary entries with canonical_key, matching the pagination pattern already used in `generate-document/index.ts` (lines 441-454).

**3. Add non-indexed entity aliases in `generate-document/index.ts`** — After fieldValues is built (~line 188), iterate through all keys matching `entity1.fieldname` pattern and create a non-indexed alias `entity.fieldname` if not already set. This bridges indexed data (e.g., `borrower1.full_name`) to the semantic keys used by legacy merge tag aliases (e.g., `borrower.full_name`).

### Scope

| File | Change |
|------|--------|
| Storage: `templates` bucket | Replace stored DOCX with uploaded version |
| `supabase/functions/_shared/field-resolver.ts` | Add pagination to canonical_key query (lines 54-58) |
| `supabase/functions/generate-document/index.ts` | Add non-indexed entity alias bridging after line ~188 |

No UI, database schema, or other logic changes.

