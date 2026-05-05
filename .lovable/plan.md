## Problem

In the generated RE851D document's "ENCUMBRANCE(S) REMAINING" section, most fields render blank even when the underlying lien data is populated.

Investigation findings:

1. The publisher at `supabase/functions/generate-document/index.ts:2495–2598` does emit `pr_li_rem_<field>_<N>_<S>` (and `_<N>` / bare) keys into `fieldValues` for each lien grouped per property (split by `lien.anticipated`). Source data (`pr_li_lienHolder`, `lien1.holder`, `lien1.original_balance`, `lien1.balloon`, `lien1.property = "property1"`, etc.) is present in `deal_section_values` and is correctly read into `fieldValues` via the existing composite-key bridge.
2. The template uses curly merge tags like `{{pr_li_rem_beneficiary_N_S}}`, `{{pr_li_rem_priority_N_S}}`, etc. The `_N` rewriter (lines 2974–3018, `RE851D_INDEXED_TAGS`) **does not list any `pr_li_rem_*` / `pr_li_ant_*` family**. So inside PROPERTY #K regions, `_N` in encumbrance tags is **never rewritten to `_K`**, leaving the literal `..._N_S` in the XML. The downstream resolver then can't find a matching key and renders blank.
3. Even when a tag survives as `..._N_S`, `validFieldKeys` is only seeded with `ln_p_expectedEncumbrance_1..5` / etc. (lines 3822–3843), not `pr_li_rem_*_N_S` / `pr_li_ant_*_N_S`. Without seeding, the resolver's priority-1 direct match fails and the value silently falls through.
4. The "bare encumbrance-token rewrite" (lines 3494–3552) only handles **bare** (non-`{{}}`) tokens, not curly merge tags — so it doesn't compensate.

## Fix (single edge function, additive — no UI/template/schema/API changes)

**File:** `supabase/functions/generate-document/index.ts`

### Change 1 — Add encumbrance families to the per-property `_N` rewriter

In `RE851D_INDEXED_TAGS` (around line 2974) **append** the encumbrance families so the existing region rewriter converts `_N` → `_K` inside each PROPERTY #K block. Both `_N_S` and `_N` forms are listed so longest-first matching wins:

```ts
// Encumbrance Remaining / Anticipated (per-property, per-slot)
"pr_li_rem_priority_N_S", "pr_li_rem_priority_N",
"pr_li_rem_interestRate_N_S", "pr_li_rem_interestRate_N",
"pr_li_rem_interest_rate_N_S", "pr_li_rem_interest_rate_N",
"pr_li_rem_intRate_N_S", "pr_li_rem_intRate_N",
"pr_li_rem_beneficiary_N_S", "pr_li_rem_beneficiary_N",
"pr_li_rem_lienHolder_N_S", "pr_li_rem_lienHolder_N",
"pr_li_rem_holder_N_S", "pr_li_rem_holder_N",
"pr_li_rem_originalAmount_N_S", "pr_li_rem_originalAmount_N",
"pr_li_rem_principalBalance_N_S", "pr_li_rem_principalBalance_N",
"pr_li_rem_monthlyPayment_N_S", "pr_li_rem_monthlyPayment_N",
"pr_li_rem_maturityDate_N_S", "pr_li_rem_maturityDate_N",
"pr_li_rem_maturity_date_N_S", "pr_li_rem_maturity_date_N",
"pr_li_rem_matDate_N_S", "pr_li_rem_matDate_N",
"pr_li_rem_balloonAmount_N_S", "pr_li_rem_balloonAmount_N",
"pr_li_rem_balloonYes_N_S", "pr_li_rem_balloonYes_N",
"pr_li_rem_balloonNo_N_S", "pr_li_rem_balloonNo_N",
"pr_li_rem_balloonUnknown_N_S", "pr_li_rem_balloonUnknown_N",
// Same set for anticipated
"pr_li_ant_priority_N_S", "pr_li_ant_priority_N",
"pr_li_ant_interestRate_N_S", "pr_li_ant_interestRate_N",
"pr_li_ant_interest_rate_N_S", "pr_li_ant_interest_rate_N",
"pr_li_ant_intRate_N_S", "pr_li_ant_intRate_N",
"pr_li_ant_beneficiary_N_S", "pr_li_ant_beneficiary_N",
"pr_li_ant_lienHolder_N_S", "pr_li_ant_lienHolder_N",
"pr_li_ant_holder_N_S", "pr_li_ant_holder_N",
"pr_li_ant_originalAmount_N_S", "pr_li_ant_originalAmount_N",
"pr_li_ant_principalBalance_N_S", "pr_li_ant_principalBalance_N",
"pr_li_ant_monthlyPayment_N_S", "pr_li_ant_monthlyPayment_N",
"pr_li_ant_maturityDate_N_S", "pr_li_ant_maturityDate_N",
"pr_li_ant_maturity_date_N_S", "pr_li_ant_maturity_date_N",
"pr_li_ant_matDate_N_S", "pr_li_ant_matDate_N",
"pr_li_ant_balloonAmount_N_S", "pr_li_ant_balloonAmount_N",
"pr_li_ant_balloonYes_N_S", "pr_li_ant_balloonYes_N",
"pr_li_ant_balloonNo_N_S", "pr_li_ant_balloonNo_N",
"pr_li_ant_balloonUnknown_N_S", "pr_li_ant_balloonUnknown_N",
```

The region scanner uses longest-first ordering and a single-pass `_N$` → `_K` rewrite, so `_N_S` is consumed first (preserving the slot index), then `_N` matches alone. No other behavior changes.

### Change 2 — Seed encumbrance suffixed keys into `validFieldKeys`

In the RE851D block at lines 3829–3843, extend `SUFFIXED_BASES` (or add a parallel loop) to include the encumbrance per-slot keys so the resolver's priority-1 direct match succeeds:

```ts
// pr_li_rem / pr_li_ant per property (1..5) and per slot (1..10)
const ENC_FAMILIES = [
  "pr_li_rem_priority","pr_li_rem_interestRate","pr_li_rem_interest_rate","pr_li_rem_intRate",
  "pr_li_rem_beneficiary","pr_li_rem_lienHolder","pr_li_rem_holder",
  "pr_li_rem_originalAmount","pr_li_rem_principalBalance","pr_li_rem_monthlyPayment",
  "pr_li_rem_maturityDate","pr_li_rem_maturity_date","pr_li_rem_matDate",
  "pr_li_rem_balloonAmount","pr_li_rem_balloonYes","pr_li_rem_balloonNo","pr_li_rem_balloonUnknown",
  // ant mirror
  "pr_li_ant_priority", /* …same list with pr_li_ant_ prefix… */
];
for (let p = 1; p <= 5; p++) {
  for (const base of ENC_FAMILIES) {
    effectiveValidFieldKeys.add(`${base}_${p}`);
    for (let s = 1; s <= 10; s++) effectiveValidFieldKeys.add(`${base}_${p}_${s}`);
  }
}
```

## What this delivers

- Inside each PROPERTY #K block, all encumbrance merge tags `{{pr_li_rem_<field>_N_S}}` get rewritten to `{{pr_li_rem_<field>_K_S}}`.
- Those keys are now in `validFieldKeys`, so the resolver's priority-1 direct match returns the values already published by the per-property/per-slot publisher (lines 2528–2592).
- Each property's REMAINING table populates from its own liens (priority, beneficiary, original/current balance, monthly payment, maturity date, balloon amount and Yes/No/Unknown checkboxes).
- The same fix applies to the ANTICIPATED table via the `pr_li_ant_*` mirror.
- No template, UI, schema, dictionary, persistence, or API changes. Other RE851D behavior is untouched (additions only — no removals or reorderings).

## Memory update

Update `mem://features/document-generation/re851d-encumbrance-mapping.md` to note that the encumbrance families are now in `RE851D_INDEXED_TAGS` and seeded into `validFieldKeys` so per-property `_N`→`_K` rewriting and direct-match resolution succeed for `{{pr_li_(rem|ant)_<field>_N_S}}` curly tags. No index entry change needed (existing entry already references this file).

## Files Modified

- `supabase/functions/generate-document/index.ts` — additive entries in `RE851D_INDEXED_TAGS` and `validFieldKeys` seeding only.
