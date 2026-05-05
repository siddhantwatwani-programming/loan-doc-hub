## Goal

The document template uses the tag `pr_p_currentBalanc` (and per-property `pr_p_currentBalanc_1` … `_5`) to render the **Current Balance** value entered in the UI under **Property → Liens**. Today the generator only publishes that value under `pr_li_lienCurrenBalanc` / `property1.lien_current_balance`, so `pr_p_currentBalanc` resolves to empty.

## Where the value already exists in the resolver

In `supabase/functions/generate-document/index.ts` (around line 2127–2263, the "Lien field bridging" block), each `lienK.current_balance` from CSR is already:
- collected per-lien index in `lienFieldCollector["current_balance"]`
- aggregated (newline-joined across liens) and published as `pr_li_lienCurrenBalanc` with `dataType: "currency"`

The per-property total of all liens belonging to property N is also already computed in the RE851D block (line 845–857, `lienTotalsByPropertyName`) but that is a numeric sum used for `pr_p_totalSenior_N`, not the raw entered Current Balance string.

## Change

In `supabase/functions/generate-document/index.ts`:

### 1. Publish single alias `pr_p_currentBalanc`
Inside the existing aggregation loop (around line 2235, where `pr_li_lienCurrenBalanc` is set for `field === "current_balance"`), additionally set:

```ts
fieldValues.set("pr_p_currentBalanc", { rawValue: aggregated, dataType: "currency" });
```

This mirrors the existing newline-joined behaviour (one value per lien) so single-lien deals show the entered value verbatim and multi-lien deals show each on its own line.

### 2. Publish per-property aliases `pr_p_currentBalanc_N`
Inside the RE851D per-property loop (around line 928, after `pr_p_totalSenior_${idx}` is set), build a per-property aggregated string by:

- Walking all `lienK.current_balance` entries
- Reading the matching `lienK.property` value
- Matching it against `property{N}` (by index name) or against `property{N}.address` (case-insensitive) — same matching used at lines 988–991
- Joining matched lien current balance raw strings with `\n`

Then publish:

```ts
fieldValues.set(`pr_p_currentBalanc_${idx}`, { rawValue: joined, dataType: "currency" });
```

Only set when at least one lien matches that property (so unused indices stay blank, matching the existing per-index publisher contract).

### 3. No schema, UI, or RLS changes
The Current Balance UI key (`property1.lien_current_balance` / `lienK.current_balance`) and storage are untouched. Only the document-generator alias publisher gains two new output keys.

## Acceptance criteria

- Template tag `{{pr_p_currentBalanc}}` renders the Current Balance value entered under Property → Liens (newline-joined when multiple liens exist).
- Template tags `{{pr_p_currentBalanc_1}}` … `{{pr_p_currentBalanc_5}}` render only the lien current balances belonging to that specific property, with no cross-property bleed.
- Existing `pr_li_lienCurrenBalanc` and `property1.lien_current_balance` outputs are unchanged.
- No regressions in RE851A / RE851D / RE885 generation.
