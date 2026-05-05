## Problem

In RE851D, the question:

> If YES, will the proceeds of the subject loan be used to cure the delinquency?

renders both YES/NO unchecked (or both checked) per property, regardless of UI input.

## Root Cause

- The CSR Property → Liens "Will Be Paid By This Loan" checkbox (`lienK.paid_by_loan`) is already aggregated per property at `supabase/functions/generate-document/index.ts:2443` and published as `pr_li_delinquencyPaidByLoan_<propIdx>`.
- The template's inline `{{#if}}` for this question is split across `<w:r>` runs and sometimes wrapped in Word `<w:sdt>` checkbox SDTs, so the tag never resolves and the static glyphs remain.
- An existing post-render safety pass (lines 4095–4314) handles only the *"Do any of these payments remain unpaid?"* question, bound to `pr_li_currentDelinqu_K`. There is no equivalent pass for "cure the delinquency".

## Fix (single edge-function change)

Add a new post-render safety pass in `supabase/functions/generate-document/index.ts`, immediately after the "Remain Unpaid" pass (~line 4314), modeled on it:

1. Runs only when `template.name` matches `/851d/i`.
2. Skips files lacking the literal text `"cure the delinquency"`.
3. Builds the same `PROPERTY INFORMATION` anchor map → property indices 1..5.
4. For each `/cure the delinquency/gi` match, finds the YES and NO `<w:t>` label runs within that property block window.
5. Locates the nearest `<w:sdt>` checkbox or bare `☐|☑|☒` glyph run for each label (preceding scan, then forward fallback).
6. Forces YES/NO from `pr_li_delinquencyPaidByLoan_<K>`:
   - `true` → YES `☑` / NO `☐`
   - `false`/missing → YES `☐` / NO `☑`
   - For SDTs, also rewrites `<w14:checked w14:val="1|0">`.
7. Mutually exclusive — exactly one box per property.

## Constraints respected

- No UI, schema, API, or template (`.docx`) changes.
- Reuses the already-published `pr_li_delinquencyPaidByLoan_<N>` alias.
- Existing "Remain Unpaid" pass untouched.

## Files Modified

- `supabase/functions/generate-document/index.ts` — add new safety-pass block after line 4314.

## Memory update

Add `mem://features/document-generation/re851d-cure-delinquency-checkboxes` and reference it in `mem://index.md`.
