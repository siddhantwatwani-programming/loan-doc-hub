# Fix Delinquency Fields Not Populating in RE851D

## Root Cause (verified)

The CSR values **are** already published correctly per-property by the existing publisher in `supabase/functions/generate-document/index.ts` (lines ~2199-2300):

- `pr_li_delinquencyPaidByLoan_${pIdx}` (boolean: "true"/"")
- `pr_li_delinqu60day_${pIdx}` (boolean — already true if `delinquencies_how_many > 0`)
- `pr_li_currentDelinqu_${pIdx}` (boolean)
- `pr_li_delinquHowMany_${pIdx}` (numeric string)
- `pr_li_sourceOfPayment_${pIdx}` (text)

The bug is that the RE851D template authors the placeholders with the literal token `_N` (e.g. `{{pr_li_delinqu60day_N}}`, `{{#if pr_li_currentDelinqu_N}}…`). For RE851D, an existing pre-pass rewrites `_N` → `_1`, `_2`, … per property, but **only for tag names listed in `RE851D_INDEXED_TAGS`** (around line 2763 of `generate-document/index.ts`). The `pr_li_*_N` family is missing from that allowlist, so:

- `{{pr_li_delinquHowMany_N}}` is looked up as the literal key `pr_li_delinquHowMany_N` → not found → renders blank.
- `{{#if pr_li_currentDelinqu_N}}` evaluates an unknown key → falsy → always shows the NO checkbox.
- `{{#if pr_li_delinqu60day_N}}` likewise → always NO.
- `{{#if pr_li_delinquencyPaidByLoan_N}}` likewise → always NO.
- `{{pr_li_sourceOfPayment_N}}` → blank.

The boolean truthy logic in `tag-parser.ts > isConditionTruthy` already handles the published `"true"`/`""` values correctly — no change needed there. The current `pr_li_delinqu60day_N` boolean is already derived from `delinquencies_how_many > 0`, so we do **not** need a `(gt …)` helper; once the `_N` rewrite resolves to `_1`/`_2`/…, the existing `{{#if pr_li_delinqu60day_N}}` form will work.

## Change (single, surgical edit)

Add the five `pr_li_*_N` tag names to the RE851D `RE851D_INDEXED_TAGS` allowlist immediately after `pr_p_delinquHowMany_N` so the existing per-property rewrite picks them up. No other section, allowlist (`PART1_TAGS`, `PART2_TAGS`), or logic is touched — these tags only appear in the per-property delinquency block, not in the PART 1 / PART 2 row tables.

```ts
// supabase/functions/generate-document/index.ts (~line 2779)
"pr_p_delinquHowMany_N",
// Lien-delinquency block (CSR Property → Liens, RE851D delinquency questions)
"pr_li_delinquencyPaidByLoan_N",
"pr_li_delinqu60day_N",
"pr_li_currentDelinqu_N",
"pr_li_sourceOfPayment_N",
"pr_li_delinquHowMany_N",
```

## What is NOT changed

- Field dictionary, RLS, schema, save/update APIs.
- UI components (`LienDetailForm.tsx`, `PropertySectionContent.tsx`, etc.).
- The RE851D template `.docx`.
- The publisher logic at lines 2199-2300 (already correct).
- `tag-parser.ts` truthy/conditional logic (already correct for the published `"true"`/`""` strings).
- PART 1 / PART 2 row-tag allowlists (delinquency tags do not appear there).

## Files touched

- `supabase/functions/generate-document/index.ts` — add 5 lines to the existing `RE851D_INDEXED_TAGS` array.

## Expected outcome

After regenerating any RE851D, per-property the placeholders resolve to:
- 60-day YES/NO → checkbox driven by `delinquencies_how_many > 0` from the matching lien(s)
- "If YES, how many?" → numeric count
- "Payments remain unpaid" YES/NO → driven by Currently Delinquent
- "Proceeds used to cure" YES/NO → driven by Delinquency to be Paid by This Loan
- "Source of funds" → newline-joined text from each lien
