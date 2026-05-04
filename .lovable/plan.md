## Problem

In RE851D, the **Encumbrance(s) Remaining** section renders correctly for Original Amount, Monthly Payment, and Approximate Principal Balance, but **Interest Rate, Beneficiary, and Maturity Date** print blank — even though the publisher already emits per-property values for them.

## Root Cause

The publisher in `supabase/functions/generate-document/index.ts` (lines 2410-2418) emits these keys per property and slot:

- `pr_li_rem_interestRate_<N>_<S>` (and `_N`)
- `pr_li_rem_beneficiary_<N>_<S>` (and `_N`)
- `pr_li_rem_maturityDate_<N>_<S>` (and `_N`)

The bare-token rewrite (lines 3288-3330) recognises these exact camelCase names. The fields that DO render share the same publisher/rewrite path, which means the data layer is fine.

The authored RE851D template almost certainly writes the three failing tokens under alternate names that the whitelist does not match — most likely:

- `pr_li_rem_interest_rate` / `pr_li_rem_intRate`
- `pr_li_rem_lienHolder` / `pr_li_rem_holder`
- `pr_li_rem_maturity_date` / `pr_li_rem_matDate`

(Same for `pr_li_ant_*`.) Because they aren't in `encFields`, the bare-token rewrite skips them and they print verbatim/blank.

## Fix (single, minimal, scoped change)

`supabase/functions/generate-document/index.ts`:

### A. Publish alias keys alongside the existing ones (~line 2421)

Inside the existing field-emit loop in `publishSection`, additionally emit the same value under each well-known alias for the three problem fields. Pseudocode:

```ts
const aliases: Record<string, string[]> = {
  interestRate: ["interest_rate", "intRate"],
  beneficiary: ["lienHolder", "holder"],
  maturityDate: ["maturity_date", "matDate"],
};
// after the existing setVal loop, for each [f, v, dt]:
for (const altName of aliases[f] ?? []) {
  setVal(`${tagPrefix}_${altName}_${pIdx}_${s}`, v, dt);
  if (s === 1) setVal(`${tagPrefix}_${altName}_${pIdx}`, v, dt);
  if (pIdx === 1 && s === 1) setVal(`${tagPrefix}_${altName}`, v, dt);
}
```

### B. Extend `encFields` in the bare-token rewrite (line 3296)

Add the alias names to `encFields` so any bare occurrence inside a PROPERTY #K block is rewritten:

```ts
const encFields = [
  "priority", "interestRate", "interest_rate", "intRate",
  "beneficiary", "lienHolder", "holder",
  "originalAmount", "principalBalance",
  "monthlyPayment",
  "maturityDate", "maturity_date", "matDate",
  "balloonAmount",
  "balloonYes", "balloonNo", "balloonUnknown",
];
```

### Strict scoping

- All edits live inside the existing RE851D-gated blocks (`if (/851d/i.test(template.name || ""))` and the encumbrance publisher region that already runs only for RE851D).
- No changes to UI, schema, dictionary, or other templates.
- No removal of any current alias; only additions.

## Files to change

- `supabase/functions/generate-document/index.ts` — two small additions described above.

## Expected outcome

For every property in the Encumbrance(s) Remaining and Encumbrance(s) Anticipated sections of RE851D, Interest Rate, Beneficiary, and Maturity Date now resolve regardless of which token name the authored template uses — same behavior as the already-working Original Amount / Monthly Payment / Principal Balance cells.
