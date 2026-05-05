## Plan: RE851D Owner Occupied Checkbox Fix

### Goal
Ensure the RE851D generated document never checks both OWNER OCCUPIED Yes and No. The output should be:

- `Owner Occupied` -> Yes checked, No unchecked
- `Tenant / Other`, `Vacant`, `NA`, or blank -> Yes unchecked, No checked
- Applies to PROPERTY #1 through PROPERTY #5

### Scope
Only update the RE851D document-generation logic. No UI changes, no schema changes, no new APIs, and no broad refactoring.

### Findings
The current generated-document function already publishes `pr_p_occupanc_1` through `pr_p_occupanc_5` as `"Owner Occupied"` only when the CSR value is exactly Owner Occupied, otherwise blank.

The remaining issue is in the RE851D safety pass that rewrites the two static checkbox glyphs near the `OWNER OCCUPIED` label. Its current logic grabs the first two checkbox glyphs after the label. In some template layouts, the first glyph can be an unrelated checkbox or a glyph already produced by a template conditional, causing both visible Yes and No to end up checked.

### Implementation Steps
1. Update the RE851D Owner Occupied safety pass in `supabase/functions/generate-document/index.ts` only.
2. Make the glyph targeting stricter:
   - Locate the `OWNER OCCUPIED` label inside each detected PROPERTY #N region.
   - Find the actual `Yes` and `No` label positions after that label.
   - Rewrite only the nearest checkbox glyph immediately associated with `Yes` and the nearest checkbox glyph immediately associated with `No`.
   - Keep the rewrite bounded to the current property region so one property cannot affect another.
3. Keep the existing condition source:
   - Use `pr_p_occupanc_N` for the matching property.
   - Treat only `"Owner Occupied"` as true.
   - Treat all other values as false.
4. Preserve the existing normalized field publisher for `pr_p_occupanc_N`; no field names or template placeholders will be changed.

### Technical Detail
The current code has this safe normalized source:

```ts
fieldValues.set(`pr_p_occupanc_${idx}`, {
  rawValue: isYes ? "Owner Occupied" : "",
  dataType: "text",
});
```

The planned change is only in the later XML safety pass. Instead of assuming the first two glyphs after `OWNER OCCUPIED` are Yes and No, it will anchor each rewrite to the actual adjacent labels:

```text
OWNER OCCUPIED
[checkbox glyph] Yes
[checkbox glyph] No
```

This prevents an unrelated or already-rendered checkbox glyph from being rewritten and eliminates the both-checked result.

### Acceptance Criteria
- Owner Occupied: only Yes is checked.
- Tenant / Other: only No is checked.
- Vacant: only No is checked.
- NA: only No is checked.
- Works for PROPERTY #1 through PROPERTY #5.
- No changes to UI behavior, database schema, save/update APIs, or other document-generation mappings.