

## Plan: Highlight Unsaved Changes in Lender Section (Remove Stars, Add Highlights)

### Problem
1. The current `DirtyFieldWrapper` shows a star (★) indicator — user wants it removed, replaced with highlight-only
2. The Lender section top tab shows a star — user wants highlight instead
3. The Lender left sub-navigation tabs don't indicate which sub-tab has dirty fields
4. **Critical bug**: Dirty field keys are stored as `lender1.type` but Lender sub-forms use `lender.type` in `DirtyFieldWrapper`, so field-level highlighting never matches. The `LenderSectionContent` needs to remap dirty keys for the selected lender prefix.

### Changes

#### 1. `DirtyFieldWrapper.tsx` — Remove star, keep highlight only
- Remove the `<span>★</span>` element
- Keep the `bg-warning/10 ring-1 ring-warning/30` highlight styling on the wrapper div

#### 2. `DealDataEntryPage.tsx` — Replace star with highlight on section tab
- Line 834-836: Remove the star `<span>` for `sectionHasDirtyFields`
- Instead, add a highlight class to the `TabsTrigger` (e.g., `bg-warning/10 ring-1 ring-warning/30`) when `sectionHasDirtyFields` is true

#### 3. `LenderSectionContent.tsx` — Pass remapped dirty keys to sub-forms
- Accept `dirtyFieldKeys` from context (via `useDirtyFields`)
- Compute a remapped `Set<string>` that translates `lender1.xxx` → `lender.xxx` for the selected prefix
- Wrap each sub-form render in a local `DirtyFieldsProvider` with the remapped keys so `DirtyFieldWrapper` inside forms can match

#### 4. `LenderSubNavigation.tsx` — Highlight sub-tabs with dirty fields
- Accept a `dirtySubSections` prop (a `Set<LenderSubSection>`) from `LenderSectionContent`
- Apply highlight styling (`bg-warning/10`) to sub-nav buttons that have dirty fields

#### 5. `LenderSectionContent.tsx` — Compute which sub-sections have dirty fields
- Map each Lender form's FIELD_KEYS prefixes to sub-sections:
  - `lender.` fields → mapped per sub-section (lender info keys, authorized party keys, banking keys, tax info keys)
- A simpler approach: check if any dirty key starting with the selected prefix matches field patterns for each sub-section
- Pass the resulting `dirtySubSections` set to `LenderSubNavigation`

### No Backend Changes Required
- Dirty field tracking already works via `useDealFields` hook's `dirtyFieldKeys` state
- No new tables or schema modifications needed
- Uses existing save/update flow (dirty state clears on save/discard)

### Files Modified
1. `src/components/deal/DirtyFieldWrapper.tsx` — remove star
2. `src/pages/csr/DealDataEntryPage.tsx` — replace star with highlight on tab
3. `src/components/deal/LenderSectionContent.tsx` — remap dirty keys, compute dirty sub-sections
4. `src/components/deal/LenderSubNavigation.tsx` — accept and render dirty sub-section highlights

