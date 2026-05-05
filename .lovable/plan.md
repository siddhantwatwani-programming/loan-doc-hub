## Plan: RE851D Owner Occupied Checkbox Deep Fix

### Goal
Ensure the RE851D generated document can never show both `OWNER OCCUPIED` checkboxes selected.

Expected output for each property section:

```text
Owner Occupied  -> Yes checked, No unchecked
Tenant / Other  -> Yes unchecked, No checked
Vacant          -> Yes unchecked, No checked
NA              -> Yes unchecked, No checked
blank/other     -> Yes unchecked, No checked
```

Applies to Property #1 through Property #5 only.

### Root Cause Found
The current code has two remaining risks:

1. The safety pass still treats `"Owner"` as owner-occupied:
   ```ts
   occVal === "owner occupied" || occVal === "owner"
   ```
   This is not strict enough for the requested behavior. It must be exactly `"Owner Occupied"` after normalization.

2. The uploaded RE851D template can still contain malformed or independent conditional patterns such as:
   ```text
   (eq pr_p_occupanc_N"Owner")
   (eq pr_p_occupanc_N "Owner")
   separate Yes and No if blocks
   ```
   The parser only evaluates well-formed `(eq FIELD "literal")` expressions. Bad spacing or the wrong literal can leave condition markers stripped while both branch glyphs remain visible, producing a double-check.

### Implementation Scope
Only update document generation/template parsing logic. No UI changes, no database/schema changes, no new APIs, and no document flow refactor.

### Changes to Make

1. **Strict value match in `supabase/functions/generate-document/index.ts`**
   - Change Owner Occupied detection to:
     ```ts
     const isOwner = occVal === "owner occupied";
     ```
   - Remove the permissive `|| occVal === "owner"` fallback.

2. **Strengthen RE851D Owner Occupied safety pass**
   - Keep the current per-property region scoping.
   - Replace only the checkbox glyph directly attached to the `Yes` label and the checkbox glyph directly attached to the `No` label.
   - Ensure queued rewrites force a mutually exclusive pair:
     - `Owner Occupied`: `Yes = checked`, `No = unchecked`
     - anything else: `Yes = unchecked`, `No = checked`
   - If malformed conditionals leave duplicate glyphs around the labels, add a narrow cleanup in the same Owner Occupied block so each label ends with exactly one checkbox glyph.

3. **Normalize malformed Owner Occupied condition expressions in RE851D only**
   - Before the normal parser runs, add a narrow RE851D-only correction for the known template syntax/value issue:
     - `eq pr_p_occupanc_N"Owner"` -> `eq pr_p_occupanc_N "Owner Occupied"`
     - `eq pr_p_occupanc_N "Owner"` -> `eq pr_p_occupanc_N "Owner Occupied"`
   - This is limited to `pr_p_occupanc_N` / already indexed `pr_p_occupanc_1..5` expressions and will not affect other document conditions.

4. **Add parser support for the requested single-block `if + else` pattern if needed**
   - The existing parser already handles normal `{{#if (eq FIELD "Owner Occupied")}}...{{else}}...{{/if}}` when well formed.
   - The fix will preserve that behavior and only improve malformed spacing/value normalization for this specific RE851D field.

### Validation Plan
After implementing, test generation logic using the uploaded `Re851d_v2-2.docx` template structure and verify the generated XML around `OWNER OCCUPIED` sections has only one checked glyph per property:

- Property #1: `Owner Occupied` -> Yes checked only
- Property #2: `Tenant / Other` -> No checked only
- Property #3: `Vacant` -> No checked only
- Property #4: `NA` -> No checked only
- Property #5: blank/other -> No checked only

### Non-Goals
- No UI changes.
- No database changes.
- No save/update API changes.
- No changes to other RE851D checkbox groups unless directly necessary to isolate the Owner Occupied pair.
- No broad parser refactor.