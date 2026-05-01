## Goal

Register two new boolean fields in the Field Dictionary under **Other Origination → Origination Fees**, so they appear in Admin → Field Dictionary and are available for downstream use (forms, document merge tags, etc.).

## Verification of current state

- `field_dictionary` already contains `of_re_interestRate` (label "Interest Rate", section `origination_fees`, type `percentage`).
- Neither `of_re_interestRate.fixed` nor `of_re_interestRate.adjustable` exists yet.
- Section enum value `origination_fees` is the correct bucket for "Other Origination → Origination Fees".

## Changes

Single SQL migration that inserts two rows into `public.field_dictionary`:

| field_key | label | section | data_type | form_type |
|---|---|---|---|---|
| `of_re_interestRate.fixed` | Interest Rate — Fixed | `origination_fees` | `boolean` | `primary` |
| `of_re_interestRate.adjustable` | Interest Rate — Adjustable | `origination_fees` | `boolean` | `primary` |

Both rows use defaults for the rest (`is_calculated=false`, `is_repeatable=false`, `allowed_roles={admin,csr}`, `read_only_roles={}`).

The migration uses `ON CONFLICT (field_key) DO NOTHING` so it's idempotent and safe to re-run.

## Out of scope (Minimal Change Policy)

- No UI binding/form changes — this is a dictionary registration only, matching the same pattern used for the recent RE851D property-type checkbox additions.
- No document template / edge function (`generate-document`) changes — these fields are not yet referenced as merge tags. If/when you want them rendered in a document, we'll add the tags + per-deal publisher in a follow-up.
- No changes to the existing `of_re_interestRate` percentage field.

## Files to add

- New migration: `supabase/migrations/<timestamp>_add_interest_rate_fixed_adjustable_fields.sql` containing the two `INSERT … ON CONFLICT DO NOTHING` rows.

## Verification after apply

1. Open Admin → Field Dictionary → filter by section "Origination Fees" → confirm the two new rows appear with `boolean` type.
2. Re-run the migration manually (or via redeploy) — should be a no-op due to `ON CONFLICT DO NOTHING`.