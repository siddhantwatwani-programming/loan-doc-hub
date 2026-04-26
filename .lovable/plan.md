## Root cause

The RE851A template uses `{{#if ln_p_subordinationProvision}}`, but the CSR UI persists this checkbox under a different key:

- **UI write key (from `src/lib/fieldKeyMap.ts`):** `loan_terms.subordination_provision`
- **Field dictionary entry:** `field_key = ln_p_subordinationProvision`, `data_type = boolean`, no `canonical_key`, no `merge_tag_aliases` row.
- **Server-side handling in `generate-document` / `tag-parser.ts`:** none. There is no alias mapping that bridges `ln_p_subordinationProvision` to `loan_terms.subordination_provision`.

Because the dictionary key (`ln_p_subordinationProvision`) and the persisted key (`loan_terms.subordination_provision`) are not linked, `isConditionTruthy()` resolves the conditional to `false` regardless of the CSR selection. The template logic itself is correct — Yes/No always inverts together — so when the lookup is empty, **No** ends up checked even when CSR shows Yes.

This is the same class of issue that was already fixed for `ln_p_balloonPayment` and `or_p_isBrkBorrower` in `getConditionalAliasCandidates()` inside `supabase/functions/_shared/tag-parser.ts`.

## Fix (minimal, scoped)

Add `ln_p_subordinationProvision` to the existing `getConditionalAliasCandidates()` switch in `supabase/functions/_shared/tag-parser.ts` so the conditional probes the actual UI persistence key. No template, schema, mapping table, UI, or pipeline changes are required.

### Code change (single function, two small additions)

In `supabase/functions/_shared/tag-parser.ts`, inside `getConditionalAliasCandidates()` (around line 1188, alongside the balloon block):

```ts
if (lower === "ln_p_subordinationprovision") {
  return [normalized, "loan_terms.subordination_provision"];
}

if (lower === "loan_terms.subordination_provision") {
  return [normalized, "ln_p_subordinationProvision"];
}
```

The existing `isConditionTruthy()` already:

- Probes alias candidates when the canonical key has no data.
- Treats `true`, `"true"`, `"yes"`, `"y"`, `"1"`, `"checked"`, `"on"` as truthy.
- Treats `false`, `"false"`, `"no"`, `"n"`, `"0"`, `"unchecked"`, `"off"`, `""`, `null` as falsy.
- Handles native booleans and numbers.

So no other logic needs to change.

## Confirmed corrected Handlebars (no template edit needed)

The current template is already correct and will work once the alias is in place:

```handlebars
{{#if ln_p_subordinationProvision}}☑{{else}}☐{{/if}} Yes
{{#if ln_p_subordinationProvision}}☐{{else}}☑{{/if}} No
```

## Verification

1. Deploy the updated `generate-document` edge function (automatic on save).
2. In CSR → Loan → Detail, **check** Subordination Provision → save → regenerate RE851A → expect `☑ Yes`, `☐ No`.
3. **Uncheck** Subordination Provision → save → regenerate → expect `☐ Yes`, `☑ No`.
4. Confirm no regression on other RE851A checkboxes (Balloon Payment, Broker Capacity A/B, payment frequency, amortization).

## Out of scope (explicitly not touched)

- UI components, `fieldKeyMap.ts`, `legacyKeyMap.ts`
- `field_dictionary`, `merge_tag_aliases`, any DB schema or rows
- RE851A DOCX template or any other template
- Document generation pipeline stages, label-safety passes, or unrelated checkbox logic
- Permissions / RLS
