
# RE851D — Fix PROPERTY #2/#3 / #4 / #5 Population

## Root Cause Analysis

I inspected the actual stored data for the open deal and the generator code:

1. **Property fields (yearBuilt, squareFeet, construcType, occupanc, appraiseDate, appraiseValue) for indices ≥ 2 ARE saved correctly** as `property2::<dictId>` / `property3::<dictId>` rows with `indexed_key = property2.year_built`, etc. The bridging at `generate-document/index.ts` lines 280-289 maps these to `propertyN.<suffix>`, and the per-index publisher at lines 833-836 publishes `pr_p_<key>_<N>`. This logic is sound — for any row that exists, `pr_p_yearBuilt_2`, `pr_p_squareFeet_2`, `pr_p_construcType_2`, `pr_p_occupanc_2`, `pr_p_appraiseDate_2`, `pr_p_appraiseValue_2` will be set. Property #2 / #3 of this exact deal already have data saved at `property2.year_built`, `property2.square_feet`, etc., so they will resolve. If any single template tag is still blank for an index where data exists, it is a tag-order or tag-uniqueness mismatch in the docx itself, which we will assert via debug logging.

2. **PropertyTax `_N` fields are the actual blocker.** The CSR Property Tax sub-grid stores tax rows in a separate collection (`propertytax1::*`, `propertytax2::*`, ...) — not nested under `propertyN`. For this deal only **one** tax row exists (`propertytax1`). Each tax row carries a `propertytax{N}.property` field whose value is the property address string (e.g., "Umar Adil - Doveson Street, Boston, AL, 10002"), but the per-index tax publisher (`generate-document/index.ts` lines 1019-1055) ONLY reads `propertytax{idx}.<field>` keyed by **property index**, not by address. Result: PROPERTY #2 / #3 in the doc print blank for `propertytax.annual_payment_N` / `delinquent_N` / `delinquent_amount_N` / `source_of_information_N`, and the anti-fallback shield at lines 1066-1103 then correctly blanks them — confirming the symptom.

The user's spec wires `{{propertytax.annual_payment_N}} → property[index].tax.annual_payment`. So the fix is to **route each propertytax row to the property index whose address it references**, then re-use the existing per-index alias publisher.

## Fix (single edge-function change)

Edit `supabase/functions/generate-document/index.ts` only. No DB schema changes, no UI changes, no dictionary changes.

### Step 1 — Build a property-address-to-index map (once)

After `propertyIndices` is populated (~line 765) and BEFORE the per-index loop, build:

```
addressToPropIndex: Map<normalizedAddress, propertyIndex>
```

Source: for each idx in `propertyIndices`, normalize (lower-case, trim) the value of `property{idx}.address` (or its computed combo from street/city/state/zip already done at lines 769-788) and map it to idx.

### Step 2 — Pre-bridge propertytax rows by address match

Inside the existing per-index loop (~line 829), BEFORE the existing per-index tax publisher (~line 1019), add a pre-pass that scans every `propertytax{srcIdx}.<field>` already in `fieldValues` and, when `propertytax{srcIdx}.property` matches the current property's address (case-insensitive normalized) AND the destination key `propertytax{idx}.<field>` is not yet set, copies the four spec'd fields (`annual_payment`, `delinquent`, `delinquent_amount`, `source_of_information`) into `propertytax{idx}.<field>`.

This is purely an in-memory remap; no writes to DB. The existing publisher at lines 1027-1054 then publishes the underscore + dotted aliases (`propertytax_annual_payment_<N>`, `propertytax.annual_payment_<N>`, etc.) without further change.

Edge cases:
- If a propertytax row has no `.property` value, leave it bound to its native srcIdx (current behavior).
- If two tax rows resolve to the same property index, first one wins (deterministic).
- For `idx === 1`, the current canonical fallback to bare `propertytax.<field>` is preserved.
- For propertytax rows whose address does NOT match any property, they are ignored (matches "do NOT fallback" acceptance criterion).

### Step 3 — Checkbox logic verification (already correct, no change)

- **OWNER OCCUPIED** Yes/No: lines 961-984 already publish `pr_p_occupancySt_{idx}_yes` / `_no` / glyphs, and accept `"Owner"`, `"owner occupied"`, `"primary borrower"` for YES; `"investor"`, `"tenant"`, `"secondary borrower"`, `"non-owner occupied"` for NO. Spec's "Owner → YES, else → NO" is satisfied — no change needed.
- **TAX DELINQUENT** Yes/No: After Step 2's address-based bridging publishes `propertytax.delinquent_{idx}` ("true"/"false"), add a small per-index publisher that emits boolean + glyph aliases:
  - `propertytax_delinquent_{idx}_yes` / `_no` (boolean)
  - `propertytax_delinquent_{idx}_yes_glyph` / `_no_glyph` (☒ / ☐)

  Mirroring the existing pattern used for occupancy. This unblocks any `{{propertytax.delinquent_N_yes}}`-style tags in the doc and is harmless if unused.

### Step 4 — Add diagnostic log (debugging aid)

After Step 2's pre-pass, emit:

```
[generate-document] RE851D propertytax bridge: {srcIdx → destIdx} mappings: [...]
```

So the next regression is one log-line away.

## Acceptance Criteria Mapping

| Criterion | Resolution |
|---|---|
| PROPERTY #2 and #3 display correct data | Step 2 routes the matching propertytax row to indices 2/3; existing publisher emits `_2` / `_3` aliases; `_N` rewrite at line 2235 already produces `pr_p_*_2`, `pr_p_*_3` for each block in reading order |
| No fields blank when CSR has data | All ten listed `_N` tags resolve via existing `pr_p_*` per-index publisher (verified to already cover yearBuilt, squareFeet, construcType, occupanc, appraiseDate, appraiseValue) plus new propertytax routing |
| Each section maps to correct property index | Address-based routing (Step 2) plus existing per-occurrence `_N`→`_<N>` rewrite |
| No duplication / no fallback to Property[0] | Anti-fallback shield at lines 1066-1103 stays in place; new pre-pass uses `if (!fieldValues.has(destKey))` guard |
| Document generates successfully | Change is additive within existing try/catch and existing publisher loop |

## Out of Scope (unchanged)

- DB schema, RLS, UI components, dictionary entries, template files
- Property #1 behavior (already working, preserved by `idx === 1` canonical fallback)
- Lien total computations
- Memory rule "RE851D Multi-Property Mapping" stays valid; this fix extends it with the address-keyed propertytax bridge.

## Files To Edit

- `supabase/functions/generate-document/index.ts` (one section, ~30 lines added inside existing per-index loop)

## Memory Update

Append to existing `mem://features/document-generation/re851d-multi-property-mapping`: "PropertyTax rows are routed to their property index via case-insensitive `propertytax{N}.property` ↔ `property{N}.address` matching before the per-index alias publisher runs."
