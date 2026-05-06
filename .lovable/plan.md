## Goal
RE851D PROPERTY #1..#N questionnaire (Q1–Q6) must reflect each property's own lien rows only, using the exact rules below. No cross-property leakage.

## Spec mapping (from user)

| Q | Source field on `lienK.*` (UI key) | Result |
|---|---|---|
| Q1 Encumbrances of record? | `slt_paid_off` (checkbox) | paid_off=true → YES ☑ ; else NO ☑ |
| Q2 >60 day late last 12 mo? | `delinquencies_how_many` (number) | value > 0 → YES ☑ ; else NO ☑ |
| Q3 If YES, how many? | `delinquencies_how_many` | print numeric value |
| Q4 Remain unpaid? | `new_remaining_balance` (currency) | > 0 → YES ☑ ; else NO ☑ |
| Q5 Loan cure delinquency? | `paid_by_loan` (checkbox) | true → YES ☑ ; else NO ☑ |
| Q6 If NO, source of funds | `source_of_payment` (text) | print text |

Per-property rule: aggregate only liens whose `lien.property === "property{N}"`. If a property has multiple matching liens: paid_off = ALL liens paid off; how_many = SUM; remaining_balance > 0 if ANY > 0; paid_by_loan true if ANY true; source = join with newline.

## Findings

Template (verified by extracting `Re851d_v1_1_2_9-5.docx` `word/document.xml`) repeats per PROPERTY block:

```
Q1 "Are there any encumbrances of record…?"   static ??? + ☐ glyphs (no merge tag)
Q2 {{#if pr_li_delinqu60day_N}}☑{{else}}☐{{/if}} YES   {{#if pr_li_delinqu60day_N}}☐{{else}}☑{{/if}} NO
Q3 {{pr_p_delinquHowMany_N}}
Q4 static ☐ glyphs (handled by existing remain-unpaid post-render pass using pr_li_currentDelinqu_K)
Q5 static ??? + ☐ glyphs (handled by existing cure-delinquency post-render pass using pr_li_delinquencyPaidByLoan_K)
Q6 {{pr_li_sourceOfPayment_N}}
```

The publisher (`supabase/functions/generate-document/index.ts` ~lines 2411–2538) already buckets liens per property by exact `lienK.property` match (regex `^property(\d+)$`). It already publishes `pr_li_delinqu60day_N`, `pr_li_currentDelinqu_N`, `pr_li_delinquencyPaidByLoan_N`, `pr_p_delinquHowMany_N`, `pr_li_sourceOfPayment_N`. Existing safety passes (Q4 lines ~4582, Q5 lines ~4794) are strictly per-property.

What is wrong vs. spec:
1. **Q1 has no publisher and no safety pass** — both checkboxes render raw template ☐.
2. **Q2 publisher uses `delinquencies_60day` truthy OR how_many > 0**. Spec says: strictly `delinquencies_how_many > 0`.
3. **Q4 publisher uses `currently_delinquent` truthy**. Spec says: strictly `new_remaining_balance > 0`.
4. **Q5 publisher uses `paid_by_loan`** — already correct.
5. **Q3 (`pr_p_delinquHowMany_N`)** — already correct (sum of how_many for that property's liens).
6. **Q6 (`pr_li_sourceOfPayment_N`)** — already correct.

UI field names verified in `src/components/deal/LienDetailForm.tsx`:
`lien.slt_paid_off`, `lien.delinquencies_how_many`, `lien.new_remaining_balance`, `lien.paid_by_loan`, `lien.source_of_payment`, `lien.property`.

## Changes (all in `supabase/functions/generate-document/index.ts` only — no UI, no schema, no template)

### A. Per-lien aggregator (~lines 2449–2496)

Inside `orderedLiens.forEach`, replace the boolean derivations to follow spec exactly:
- `howManyNum = parseInt(getLienVal(prefix, "delinquencies_how_many", "delinquenciesHowMany"), 10)`
- `has60 = Number.isFinite(howManyNum) && howManyNum > 0`     ← was: also checked `delinquencies_60day` flag
- `remainingBalance = parseFloat(getLienVal(prefix, "new_remaining_balance", "newRemainingBalance").replace(/[$,\s]/g,""))`
- `currentDelinq = Number.isFinite(remainingBalance) && remainingBalance > 0`     ← was: `currently_delinquent` truthy
- `paidByLoan = truthy(getLienVal(prefix, "paid_by_loan", "paidByLoan"))`     (unchanged)
- `paidOff = truthy(getLienVal(prefix, "slt_paid_off", "sltPaidOff"))`     (NEW)
- `source = getLienVal(prefix, "source_of_payment", "sourceOfPayment").trim()`     (unchanged)

In the `perProp[pIdx]` bucket, add two fields:
- `hasLien: boolean` — set true on every match
- `allPaidOff: boolean` — start true; set false the first time a lien with paidOff=false is seen

Per-lien-index aliases (`_lienIdx`) keep existing behaviour for back-compat.

### B. Per-property publish loop (~lines 2499–2536)

Add Q1 alias publication next to existing `setBoolP` calls:

```ts
const encOfRecord = b.hasLien && b.allPaidOff;   // YES iff all liens flagged Paid Off
fieldValues.set(`pr_li_encumbranceOfRecord_${pIdx}`,           { rawValue: encOfRecord ? "true" : "", dataType: "boolean" });
fieldValues.set(`pr_li_encumbranceOfRecord_${pIdx}_yes`,       { rawValue: encOfRecord ? "true" : "false", dataType: "boolean" });
fieldValues.set(`pr_li_encumbranceOfRecord_${pIdx}_no`,        { rawValue: encOfRecord ? "false" : "true", dataType: "boolean" });
fieldValues.set(`pr_li_encumbranceOfRecord_${pIdx}_yes_glyph`, { rawValue: encOfRecord ? "☒" : "☐", dataType: "text" });
fieldValues.set(`pr_li_encumbranceOfRecord_${pIdx}_no_glyph`,  { rawValue: encOfRecord ? "☐" : "☒", dataType: "text" });
```

Add `pr_li_encumbranceOfRecord_N{,_yes,_no,_yes_glyph,_no_glyph}` to the `_N` merge-tag seed list near lines 3042–3048 so any future merge-tag template recognizes them.

The existing publish lines for `pr_li_delinqu60day_${pIdx}`, `pr_li_currentDelinqu_${pIdx}*`, `pr_li_delinquencyPaidByLoan_${pIdx}`, `pr_p_delinquHowMany_${pIdx}`, `pr_li_sourceOfPayment_${pIdx}` remain — the values they emit are now driven by the corrected booleans from step A.

### C. Q1 post-render safety pass (template uses static ??? + ☐, no merge tag)

Add a new post-render block in the same style as the existing remain-unpaid pass (~line 4582) and cure-delinquency pass (~line 4794):

- Run only when template name matches `/851d/i`.
- Decode `word/document.xml`, headers, footers; only mutate files containing the literal "encumbrances of record".
- Build `propRanges[1..5]` by anchoring on `\bPROPERTY\s+INFORMATION\b` (same helper logic already used at lines 4621–4656).
- For each match of `/Are there any encumbrances of record/i`, find the next two YES/NO controls within a 4096-byte window using the existing `findControlNear` helper pattern (handles SDT checkboxes and bare ☐/☑/☒ glyph runs).
- Force YES checked + NO unchecked when `pr_li_encumbranceOfRecord_${k}_yes` is true; inverse otherwise. Use the same `rewriteSdtChecked` helper for SDT and bare-glyph string substitution for plain runs.
- Skip if either control overlaps a queued rewrite (same `overlaps` guard).
- Emit the same `[generate-document] RE851D post-render encumbrance-of-record …` log line.

### D. No other changes
- Q4 remain-unpaid pass keeps reading `pr_li_currentDelinqu_${k}_yes` — value source switched in step A.
- Q5 cure-delinquency pass keeps reading `pr_li_delinquencyPaidByLoan_${k}` — unchanged.
- Q3 `pr_p_delinquHowMany_N` and Q6 `pr_li_sourceOfPayment_N` already correct.
- Lien bridging (`pr_li_lien*`), encumbrance remaining/anticipated grids (`pr_li_rem_*`, `pr_li_ant_*`) untouched.

## Out of scope
- No `.docx` template edits.
- No `field_dictionary`, schema, RLS, or migrations.
- No UI / form / save-API changes.
- No new tables.

## Acceptance

For every PROPERTY #N block in the regenerated RE851D:

- Q1 YES ☑ iff every matching lien has Paid Off checked (and ≥1 lien exists); otherwise NO ☑.
- Q2 YES ☑ iff sum of `delinquencies_how_many` across that property's liens > 0; otherwise NO ☑.
- Q3 prints the integer sum (blank if 0).
- Q4 YES ☑ iff any matching lien has `new_remaining_balance > 0`; otherwise NO ☑.
- Q5 YES ☑ iff any matching lien has `paid_by_loan` checked; otherwise NO ☑.
- Q6 prints joined `source_of_payment` text.
- Properties with zero liens render every YES/NO as NO and Q3/Q6 blank.
- No PROPERTY block shows another property's lien data.
