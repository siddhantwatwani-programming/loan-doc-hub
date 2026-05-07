# RE851D — Additional Remaining/Anticipated Encumbrances Attachment

Per-property logic. If a property has more than 2 Remaining liens **or** more than 2 Anticipated liens, force the "Additional remaining, expected, or anticipated encumbrances are set forth in an attachment to this statement." YES checkbox for that property and append an Addendum section at the end of the document listing the overflow liens (3rd onward). Otherwise force NO and emit no addendum content.

All work confined to `supabase/functions/generate-document/index.ts` in the existing RE851D code paths. No template changes, no schema changes, no UI changes, no impact to other templates.

## Implementation

### 1. Compute overflow flags during the existing per-property lien pass
Inside the existing `pr_li_rem` / `pr_li_ant` publisher block (around lines 2572–2700, where `perPropRem` and `perPropAnt` are already built), add:

- `remCount[pIdx] = perPropRem[pIdx]?.length ?? 0`
- `antCount[pIdx] = perPropAnt[pIdx]?.length ?? 0`
- `attachmentYes[pIdx] = remCount[pIdx] > 2 || antCount[pIdx] > 2`

Publish boolean + glyph aliases per property so any existing merge tags work without template edits:
- `pr_li_additionalEncumbrance_<N>` / `_yes` / `_no` / `_yes_glyph` / `_no_glyph`
- `pr_p_additionalEncumbrance_<N>` mirror (same family as other pr_li/pr_p mirrors already in the file)

These follow the exact same pattern used for `pr_li_encumbranceOfRecord_<N>` (lines 2518–2522) so the existing anti-fallback shield for `pr_li_*` (memory: "RE851D Lien Questionnaire Glyph Resolution") covers them automatically.

### 2. Post-render YES/NO safety pass (label-anchored)
Add a new pass next to the existing four post-render passes (remain-unpaid, cure-delinquency, 60-day, encumbrances-of-record around line 5740). Reuse the same helpers (`__xmlGet`, `__xmlGetLower`, `__getVisProj`, `findControlNear`, `rewriteSdtChecked`, `glyphRunRe`, `sdtCheckboxRe`).

Anchor regex (case-insensitive, whitespace-tolerant): match `additional remaining` AND `set forth in an attachment` within the same property region. Then locate the nearest YES and NO label runs and toggle their controls based on `attachmentYes[propertyK]`.

This guarantees the checkbox visibly flips even on templates where the author used static glyphs instead of merge tags — same approach already proven for the four other questionnaire YES/NO pairs.

### 3. Append addendum at end of document
After all post-render passes complete and immediately before the final flush/upload prep (after the encumbrances-of-record pass closes around line 5896), add a single addendum builder pass on `word/document.xml`:

1. Skip entirely when no property has `attachmentYes === true` (no document mutation).
2. Build addendum XML in-memory using:
   - A page-break paragraph (`<w:p><w:r><w:br w:type="page"/></w:r></w:p>`).
   - A heading paragraph: "Addendum — Additional Encumbrances".
   - For each property `N` where `attachmentYes[N]` is true:
     - Sub-heading "Property N".
     - If `remCount > 2`: sub-section "Additional Remaining Encumbrances", then for liens 3..remCount emit the same fields the main document already shows for remaining liens (Lender, Original Balance, Current Balance, Recording Info, etc.) read directly from `fieldValues` using the existing `pr_li_rem_<field>_<N>_<S>` keys already published by the per-slot section.
     - If `antCount > 2`: sub-section "Additional Anticipated Encumbrances", then for liens 3..antCount emit the same fields using `pr_li_ant_<field>_<N>_<S>` keys.
3. Insert the addendum block immediately before the final `</w:body>` (or before `<w:sectPr>` inside body if present, to preserve final section properties).
4. Run formatted text through the same XML-escape helper used elsewhere in the file (no raw user values injected).

Paragraph styling reuses the document's `Normal` style + bold runs only — no new styles, no new relationships, no images, no tables added (keeps it format-safe and Word-compatible without touching numbering/styles parts).

### 4. Logging
Add concise `[generate-document] RE851D additional-encumbrance` log lines:
- Per property: `PROP#K rem=X ant=Y → YES/NO`
- Addendum: `appended K addendum sections (R remaining-overflow, A anticipated-overflow)`
Mirrors existing log style.

## Validation (after implementation)

For deal `DL-2026-0235`:
- Properties with ≤2 remaining and ≤2 anticipated liens → NO checked, no addendum appended.
- Property with 3+ remaining or 3+ anticipated liens → YES checked, only liens 1–2 in main body (unchanged), addendum at end lists liens 3+.
- Other templates (RE851A, RE885, etc.) unaffected — all changes gated by the existing `isTemplate851D` guard.
- No raw `pr_li_*` keys leak into output (existing anti-fallback shield + addendum builder reads resolved values only).

## Constraints honored
- No DB / field_dictionary / template / RLS changes.
- No UI changes.
- No new dependencies.
- Existing main-document rendering for liens 1–2 unchanged (publisher still emits all `_S` slots; addendum just additionally renders 3+).
- Single source of truth for YES/NO state: `attachmentYes` map computed once, used by both the merge-tag publisher and the post-render safety pass.
