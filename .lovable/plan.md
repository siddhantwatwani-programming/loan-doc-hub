

## Plan: Fix Re851a Part 2 "IS BROKER ALSO A BORROWER?" Checkbox

### Problem
1. The UI renders **two** checkboxes but the Re851a document has only **one** checkbox
2. The UI persistence key (`origination_app.doc.is_broker_also_borrower_yes`) has **no mapping** in `legacyKeyMap.ts` to the document generation key (`or_p_isBrokerAlsoBorrower_yes`), so the value never reaches the generator

### Changes

**File 1: `src/components/deal/OriginationApplicationForm.tsx`** (lines 312-331)
- Remove the second checkbox (the "No" checkbox)
- Keep only a single checkbox bound to `FIELD_KEYS.is_broker_borrower_yes`
- Remove the mutual-exclusivity logic (no longer needed with one checkbox)
- Checked = true, Unchecked = false — simple toggle

**File 2: `src/lib/legacyKeyMap.ts`**
- Add one mapping entry:
  - `'origination_app.doc.is_broker_also_borrower_yes'` → `'or_p_isBrokerAlsoBorrower_yes'`
- This bridges the UI persistence key to the canonical key used by the existing derive block in `generate-document/index.ts`

### What is NOT changed
- No database schema changes
- No template modifications
- No changes to the document generation Edge Function (the existing derive block at lines 1235-1242 already handles converting the boolean to checked/unchecked glyphs)
- No changes to any other UI fields or sections
- The `_no` key in the UI FIELD_KEYS definition can remain but will no longer be rendered

### How it works end-to-end
1. User checks/unchecks the single checkbox → value stored as `origination_app.doc.is_broker_also_borrower_yes` = `"true"`/`"false"`
2. `useDealFields` save resolves via `legacyKeyMap` → persists as `or_p_isBrokerAlsoBorrower_yes`
3. Document generator reads `or_p_isBrokerAlsoBorrower_yes`, existing derive block sets YES/NO glyphs
4. Re851a Part 2 checkbox populates correctly

