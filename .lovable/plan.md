# RE851D – Populate "ENCUMBRANCE(S) REMAINING / EXPECTED OR ANTICIPATED" cells

## Problem

The template's encumbrance grids (Remaining and Expected/Anticipated) contain only static label cells (`PRIORITY (1ST, 2ND, ETC.)`, `INTEREST RATE`, `BENEFICIARY`, `ORIGINAL AMOUNT`, `APPROXIMATE PRINCIPAL BALANCE`, `MONTHLY PAYMENT`, `MATURITY DATE`, `BALLOON PAYMENT?`, `IF YES, AMOUNT`, and `YES`/`NO`/`UNKNOWN`). There are **no merge tags** in any of the value cells. The existing in-render publisher (`pr_li_rem_*_N_S`, `pr_li_ant_*_N_S`) writes the correct values, but the template never references those keys, so nothing renders.

The user has explicitly forbidden template/UI/schema/API changes.

## Fix

Add a new RE851D-only **post-render label-anchored pass** in `supabase/functions/generate-document/index.ts` (after the existing post-render passes for Multiple Properties / Cure Delinquency). The pass:

1. Builds a visible-text-with-XML-offset projection of `word/document.xml` (same helper already used by the multi-property safety pass).
2. Locates each PROPERTY #K block (1..5) using existing region detection.
3. Within each property block, finds each occurrence of the headers `ENCUMBRANCE(S) REMAINING` and `ENCUMBRANCE(S) EXPECTED OR ANTICIPATED (AS REPRESENTED BY THE BORROWER)`. Each header is followed by exactly two grid rows (slots S=1 and S=2) containing the labels listed above.
4. For each label, finds the **next sibling `<w:tc>` cell** in the XML and writes the resolved value as a single `<w:p><w:r><w:t xml:space="preserve">…</w:t></w:r></w:p>`, preserving the cell's existing `<w:tcPr>` so layout is untouched. Existing `<w:p>` content in that cell is replaced only when it contains no visible text (empty placeholder paragraph) — non-empty cells are left alone (defensive: never overwrite values the template already produced).
5. For BALLOON `YES` / `NO` / `UNKNOWN` glyphs: anchors on the `BALLOON PAYMENT?` row and uses the existing glyph-rewrite helper to set `☑` on the matching state and `☐` on the others. This mirrors how the Cure-Delinquency safety pass already works.

## Value resolution

For each PROPERTY #K and slot S∈{1,2}, look up keys already published by the in-render encumbrance publisher (no schema or publisher changes needed):

```
pr_li_rem_priority_K_S, pr_li_rem_interestRate_K_S, pr_li_rem_beneficiary_K_S,
pr_li_rem_originalAmount_K_S, pr_li_rem_principalBalance_K_S,
pr_li_rem_monthlyPayment_K_S, pr_li_rem_maturityDate_K_S,
pr_li_rem_balloonAmount_K_S, pr_li_rem_balloonYes_K_S,
pr_li_rem_balloonNo_K_S, pr_li_rem_balloonUnknown_K_S
```
…and the same family with `pr_li_ant_*` for the Anticipated grid.

Values are formatted via the existing `formatByDataType` helper (currency stripped of leading `$` because the label cell already contains the `$` glyph).

## Bug fixes folded into the same pass (data correctness, no schema change)

While verifying values for deal `DL-2026-0235` I found two minor data-mapping gaps in the existing publisher (lines ~2590–2604) that prevent some present source data from reaching the template. These are within the existing publisher's `firstNonEmpty(...)` lists and are pure additions:

- `priority`: also try `lien_priority_after` (UI saves both `_now` and `_after`; some liens only have `_after`).
- `anticipated` bucket routing: treat the dropdown values that mean "expected/anticipated" as ANTICIPATED (currently only literal `true/yes/1/on` go to the ANT bucket, so UI values like `"This Loan"`, `"Senior Lien"`, `"Other"` always fall into REMAINING). Route `"this loan"`, `"new loan"`, `"senior"`, `"junior"`, `"other"`, `"yes"`, `"true"` → ANTICIPATED; only `""`/`"no"`/`"false"` stay in REMAINING. (This matches the section heading "EXPECTED OR ANTICIPATED (AS REPRESENTED BY THE BORROWER)".)

These are additive only — no key removed, no existing match path changed, no other template impacted (the keys are RE851D-specific).

## Files touched

- `supabase/functions/generate-document/index.ts` — add the post-render pass (~180 lines) immediately after the existing RE851D post-render block; small additive tweaks at the publisher (~lines 2562, 2596) per above.
- `mem://features/document-generation/re851d-encumbrance-mapping.md` — append a "Post-render label-anchored fallback" note describing the new pass.

No template, UI, schema, RLS, API, or other-template changes.

## Logging

Per occurrence: `[generate-document] RE851D encumbrance post-render P{K} {REM|ANT} S{S}: priority="…" beneficiary="…" originalAmount="…" principalBalance="…" monthlyPayment="…" maturityDate="…" balloon=YES|NO|UNKNOWN amount="…"` so future templates can be diagnosed quickly.

## Acceptance

- Each property's REMAINING and EXPECTED/ANTICIPATED grid renders the correct PRIORITY, BENEFICIARY, ORIGINAL AMOUNT, APPROX. PRINCIPAL BALANCE, MONTHLY PAYMENT, MATURITY DATE, BALLOON AMOUNT.
- BALLOON YES/NO/UNKNOWN checkbox glyph is set correctly per slot.
- No bleed across properties (all anchored inside PROPERTY #K range).
- Cells already containing text from another template tag are left untouched.
- All other RE851* templates and other documents are unaffected (pass is gated on RE851D template detection, same gate as existing post-render passes).
