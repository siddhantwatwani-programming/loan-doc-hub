## Goal

Add the 5 requested RE885 fields under Other Origination → Origination Fees to the `field_dictionary` so that values entered in the UI are persisted and resolved into the document tags during generation.

## Background

The 5 fields already exist in the UI (`src/components/deal/RE885ProposedLoanTerms.tsx`) and already have legacy → short-key mappings in `src/lib/legacyKeyMap.ts`. However, there are **no `field_dictionary` rows** for any RE885 keys (verified: `SELECT … WHERE field_key LIKE 'origination_fees.re885%'` returns 0 rows). Per the project rule "missing UI keys are skipped" by `useDealFields`, this means the values are silently dropped on save and never reach `deal_section_values` — so the document also gets no value to substitute.

Adding the dictionary rows fixes both persistence and document population in one step, because:
- The save hook (`useDealFields`) writes JSONB keyed by `field_dictionary_id`, which the doc-gen edge function (`supabase/functions/generate-document/index.ts`) already resolves back to `field_key` (and via `legacyKeyMap` to the short tag, e.g. `of_re_viiPaymentAmount`) before substituting tags.

## Field rows to insert

Section: `origination_fees`, form_type: `primary`.

| field_key | label | data_type |
|---|---|---|
| `origination_fees.re885_vii_payment_amount` | VII. Proposed Initial (Minimum) Loan Payment | `currency` |
| `origination_fees.re885_viii_rate_increase_pct` | VIII. Interest Rate can Increase Percentage | `percentage` |
| `origination_fees.re885_viii_rate_increase_months` | VIII. Interest Rate can Increase Months | `number` |
| `origination_fees.re885_ix_payment_end_months` | IX. Payment Options end after Months | `number` |
| `origination_fees.re885_ix_payment_end_pct` | IX. Payment Options end after Percentage | `percentage` |

`canonical_key` will be set to the short key (`of_re_viiPaymentAmount`, `of_re_viiiRateIncreasePct`, `of_re_viiiRateIncreaseMonths`, `of_re_ixPaymentEndMonths`, `of_re_ixPaymentEndPct`) to match `legacyKeyMap.ts` and the document tag names already supported by the resolver.

## Steps

1. **Create migration** that inserts the 5 rows into `public.field_dictionary` with `ON CONFLICT (field_key) DO UPDATE` so re-runs are safe. Set `section='origination_fees'`, `form_type='primary'`, default `allowed_roles=['admin','csr']`, and the `canonical_key` listed above.
2. **No UI changes required** — `RE885ProposedLoanTerms.tsx` already binds these 5 keys via `getValue` / `setValue`. Once the dictionary rows exist, `useDealFields` will accept and persist them.
3. **No edge-function changes required** — the doc-gen function already:
   - resolves `field_dictionary_id` → `field_key` from `deal_section_values`,
   - bridges `field_key` → short canonical key via `legacyKeyMap`,
   - so tags like `{{of_re_viiPaymentAmount}}`, `{{of_re_viiiRateIncreasePct}}`, `{{of_re_viiiRateIncreaseMonths}}`, `{{of_re_ixPaymentEndMonths}}`, `{{of_re_ixPaymentEndPct}}` in the RE885 template will populate automatically once data exists.
4. **Verification** after migration:
   - `SELECT field_key, data_type FROM field_dictionary WHERE field_key LIKE 'origination_fees.re885_v%' OR field_key LIKE 'origination_fees.re885_ix%';` returns 5 rows.
   - In the UI, enter values in the VII / VIII / IX inputs of the RE885 form, save, and confirm `deal_section_values` row contains the new field IDs.
   - Generate the RE885 document; the 5 tags resolve to the entered values.

## Out of scope (per Minimal Change Policy)

- No changes to UI layout, form components, or the doc-gen pipeline.
- No backfill of the other ~25 RE885 dictionary entries (this request is scoped to these 5 fields only). If you'd like, I can add the rest in a follow-up.
- No `template_field_maps` rows are required — generation works off `field_dictionary` + `legacyKeyMap` for these tags.
