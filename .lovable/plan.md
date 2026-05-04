# Liens Delinquency Mapping for RE851D

## Problem
RE851D template references `pr_li_delinquencyPaidByLoan_N`, `pr_li_delinqu60day_N`, `pr_li_delinquHowMany_N` (and existing `pr_p_delinquHowMany_N`), `pr_li_currentDelinqu_N`, `pr_li_sourceOfPayment_N`. None of these are currently published by the edge function, so YES/NO checkboxes always fall to the `else` branch and the count/source text fields render blank.

The Lien UI already persists the source data:
- `lienK.paid_by_loan` (boolean string)
- `lienK.delinquencies_60day` (boolean string) — currently unused
- `lienK.delinquencies_how_many` (number string)
- `lienK.currently_delinquent` (boolean string)
- `lienK.source_of_payment` (text)
- `lienK.property` (e.g. `property1`) — links lien → property

## Fix (single, surgical edit in `supabase/functions/generate-document/index.ts`)

Inside the existing Lien bridging block (around line 2167, right after the `for (const [field, entries] of Object.entries(lienFieldCollector))` loop), add a new dedicated publisher for the five delinquency fields. Two indexing schemes are published so the template works regardless of whether `_N` was authored as the lien ordinal or the property ordinal:

1. **Per-lien index** (`_1`, `_2`, `_3`, … by lien insertion order across the deal) — matches the user spec ("`pr_li_delinqu60day_1`, `_2`, `_3`").
2. **Per-property index** (`_1`, `_2`, … using each lien's `property` prefix `propertyN`) — matches the existing RE851D per-property repetition pattern (same N as `pr_p_delinquHowMany_N`). When multiple liens belong to one property, aggregate: YES wins for booleans; counts sum; source-of-funds joined with newlines.

For `idx === 1`, also publish the unsuffixed alias (no `_1`) for templates that reference the bare key — mirrors the convention used by every other per-property publisher in the file.

### Field derivation rules

| Template tag | UI source | Value type |
|---|---|---|
| `pr_li_delinquencyPaidByLoan_N` | `lien.paid_by_loan === 'true'` | boolean |
| `pr_li_delinqu60day_N` | `lien.delinquencies_60day === 'true'` OR `Number(lien.delinquencies_how_many) > 0` | boolean |
| `pr_li_delinquHowMany_N` and `pr_p_delinquHowMany_N` | `lien.delinquencies_how_many` (raw number) | text/number |
| `pr_li_currentDelinqu_N` | `lien.currently_delinquent === 'true'` | boolean |
| `pr_li_sourceOfPayment_N` | `lien.source_of_payment` | text |

For per-property aggregation: any lien with the trigger checked makes the property-level boolean YES; `how_many` is summed across liens of that property; `sourceOfPayment` is newline-joined.

Booleans are emitted as the literal string `"true"` / `""` so the template's `{{#if ...}}` evaluates correctly (this matches how `pr_p_occupanc_${idx}` is published elsewhere).

### Why this works
- Template, field dictionary, UI, and DB schema are untouched.
- The existing `_N` expansion engine already iterates per index, so adding the alias keys is the only missing link.
- Lien-property isolation is preserved (we only attribute a lien to the property identified by its own `property` prefix — no cross-property leakage).
- Existing `pr_p_delinquHowMany_N` from the property-tax block is left intact; we publish it again only if a lien provides a count and the key is unset.

## What does NOT change
- `field_dictionary`
- UI components (`LienDetailForm.tsx`, `LienSectionContent.tsx`)
- RE851D template
- `legacyKeyMap.ts`
- Database schema, RLS, save/update APIs

## Files touched
- `supabase/functions/generate-document/index.ts` — append ~40 lines inside the existing Lien bridging block.
