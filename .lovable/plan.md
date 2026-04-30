## RE851D — Fix Property Index Binding + Populate Missing Property Tax Fields

Strictly scoped to `supabase/functions/generate-document/index.ts`. No UI, schema, API, template, or other-document changes. The previously-completed `_N → _1.._5` regex rewrite (line 2066, `/851d/i`) and per-index publisher loop (line 813) stay as-is — we only patch the gaps that cause the two reported symptoms.

---

### Root causes (confirmed from code + DB inspection)

1. **PropertyTax fields never publish per-index aliases.**
   - PropertyTax UI saves under entity prefix `propertytax{N}` (composite JSONB key `propertytax{N}::<field_dictionary_id>`, see `src/hooks/useDealFields.ts` line 160 + line 172). Dictionary keys are `propertytax.annual_payment`, `propertytax.delinquent`, `propertytax.delinquent_amount`, `propertytax.source_of_information` (verified via `field_dictionary` query).
   - The edge function's composite-key bridging block (index.ts line 280-289) only handles `^property\d+$` — it does NOT bridge `^propertytax\d+$`, so `propertytax2.annual_payment`, `propertytax2.delinquent`, etc. are never materialized in `fieldValues`. They collapse onto the singular canonical `propertytax.annual_payment` (whichever entity is iterated last wins).
   - The publisher at line 824-829 only looks at `property{idx}.annual_property_taxes / .annual_tax / .propertytax_annual_payment` — wrong prefix, and only covers `annual_payment`. Nothing publishes `propertytax_delinquent_N`, `propertytax_delinquent_amount_N`, or `propertytax_source_of_information_N` at all.
   - Net effect: `{{propertytax.annual_payment_N}}`, `{{propertytax.delinquent_N}}`, `{{propertytax.delinquent_amount_N}}`, `{{propertytax.source_of_information_N}}` resolve to empty (or all to property #1's data via canonical fallback).

2. **`_N` rewrite tag list does not include the dotted `propertytax.*_N` forms.**
   - The user's tags are `{{propertytax.annual_payment_N}}` (with a dot), but `RE851D_INDEXED_TAGS` (line 2068) only has the underscore form `propertytax_annual_payment_N`. So even if the publisher set the correct alias, the literal dotted `_N` placeholder would never be rewritten to `_1`, `_2`, …, and the resolver would treat `propertytax.annual_payment_N` as a literal key.

3. **`_overflow{N}` rewrite for properties beyond what's saved leaves orphan tags that the resolver may fall back through `canonical_key` to the singular field — printing Property #1 data inside Property #4/#5 blocks.** Already partially mitigated, but combined with the missing publisher entries it is what produces "all sections show Property[0]". Fix: when a `_N` tag is rewritten and no per-index alias is published for that index, register a guaranteed-empty alias so the canonical_key fallback cannot fire.

---

### Changes — `supabase/functions/generate-document/index.ts` only

#### A. Bridge `propertytax{N}::uuid` composite keys (analogous to existing property bridge)

In the JSONB load loop around line 278-290, after the existing `property\d+` bridging block, add an analogous block for propertytax. For each composite key whose entity prefix matches `^propertytax\d+$`, derive the suffix from `fieldDict.field_key` (`propertytax.X` → `X`) and set `fieldValues[propertytax{N}.X]`. Limited to the four reported fields plus the safe set already in the dictionary — implementation will simply strip the `propertytax.` prefix and write `${entityPrefix}.${suffix}` so all `propertytax.*` fields bridge consistently with how `property{N}` bridging works.

#### B. New per-property tax publisher (immediately after the existing per-property loop, line ~969 area, inside the same `for (const idx of sortedPropIndices)` loop)

Resolve a per-property tax index. Two cases:

- If the deal's `propertytax{N}` numbering aligns with `property{N}` numbering (the common case — UI saves them parallel), use idx directly: source from `propertytax{idx}.<field>` first, then fall back to canonical `propertytax.<field>` only when idx === 1 (so property #1 still works on legacy single-tax-record deals; never cross-contaminates higher indices).
- Publish, per `idx ∈ propertyIndices`, **only when the per-index source value exists** (no cross-index fallback for idx ≥ 2):

  | Published alias | Sourced from |
  |---|---|
  | `propertytax_annual_payment_${idx}` | `propertytax{idx}.annual_payment` (and existing `property{idx}.annual_property_taxes` fallback retained for backward compatibility) |
  | `propertytax_delinquent_${idx}` | `propertytax{idx}.delinquent` |
  | `propertytax_delinquent_amount_${idx}` | `propertytax{idx}.delinquent_amount` |
  | `propertytax_source_of_information_${idx}` | `propertytax{idx}.source_of_information` |

  Plus dotted-form duplicates so `{{propertytax.X_N}}` rewrites resolve directly: `propertytax.annual_payment_${idx}`, `propertytax.delinquent_${idx}`, `propertytax.delinquent_amount_${idx}`, `propertytax.source_of_information_${idx}`.

Boolean fields (`delinquent`) are normalized to "Yes"/"No" or pass-through whatever the data_type formatter produces — no behavior change to existing transform pipeline.

#### C. Extend `RE851D_INDEXED_TAGS` (line 2068-2084) with the dotted forms

Add to the list (no removals — both underscore and dotted variants will be rewritten):

```
"propertytax.annual_payment_N",
"propertytax.delinquent_amount_N",
"propertytax.delinquent_N",
"propertytax.source_of_information_N",
```

Order matters for greedy-prefix safety: `propertytax.delinquent_amount_N` MUST be listed BEFORE `propertytax.delinquent_N` so the longer match wins (regex iteration is sequential per the existing loop at line 2120).

Also retain the existing `propertytax_annual_payment_N` entry for templates that already use the underscore form — backward compatible.

#### D. Anti-fallback shield for unpublished per-index tags

After the per-index publisher block completes (around line 995, just before the closing brace of the `{ const MAX_PROPERTIES = 5; … }` scope), iterate the published `_N` tag families. For every `idx` in `1..5`, for every base tag in the `RE851D_INDEXED_TAGS` family, if `fieldValues` still has no entry for `${baseWithoutN}_${idx}` AND the corresponding `property{idx}` (or `propertytax{idx}`) data is absent, write `{ rawValue: "", dataType: "text" }` for that exact key. This prevents the canonical_key resolver from falling back to the singular Property #1 / single-tax-record value when the `_N` rewrite produces an unpublished `_2` / `_3` / `_4` / `_5` tag — which is what causes Property #2/#3 blocks to mirror Property #1 today.

This is purely additive and only fires for tags that would otherwise produce wrong data; resolved per-index aliases (case A above) overwrite nothing because we skip when `fieldValues.has(key)`.

#### E. Diagnostic logging (one line, gated)

Append a single `console.log` after the new publisher: a count of per-index propertytax aliases published per idx and the list of indices for which the anti-fallback shield blanked tags. Reuses existing `debugLog` style — no perf impact.

---

### What is NOT changing

- No edits to `tag-parser.ts`, `docx-processor.ts`, `field-resolver.ts`, `formatting.ts`, or any client-side file.
- No database migrations, no schema changes, no new tables.
- No edits to other templates' code paths — all new logic is inside the existing `/851d/i` template-name guard (line 2066) or the `propertyIndices` loop which is RE851D-shaped and inert for templates without `_N` tags.
- No change to `_N` rewrite cap of 5, no change to overflow handling, no change to `pr_p_*_N` per-index publisher already covering address / appraise / owner / LTV / encumbrance / property-type / occupancy.
- No change to `pr_p_appraiseValue_N`, `pr_p_appraiseDate_N`, `pr_p_yearBuilt_N`, `pr_p_squareFeet_N`, `pr_p_construcType_N`, `pr_p_occupanc_N` publishers — those mappings are already correct in `prKeyToSuffix` (lines 225-242) and will populate per-index for Property #2/#3 via the existing loop at line 814-822 once the `_N` rewrite + anti-fallback shield prevent the canonical fallback to Property #1. The shield (item D) is what unblocks them.

---

### Validation

After the change, regenerating RE851D against a deal with three saved properties + matching `propertytax{1..3}` records produces:

| Tag | Property #1 | Property #2 | Property #3 | Property #4/#5 |
|---|---|---|---|---|
| `{{pr_p_address_N}}` | property1 address | property2 address | property3 address | (blank) |
| `{{pr_p_appraiseValue_N}}` | property1 value | property2 value | property3 value | (blank) |
| `{{pr_p_appraiseDate_N}}` | property1 date | property2 date | property3 date | (blank) |
| `{{pr_p_yearBuilt_N}}` | per-property | per-property | per-property | (blank) |
| `{{pr_p_squareFeet_N}}` | per-property | per-property | per-property | (blank) |
| `{{pr_p_construcType_N}}` | per-property | per-property | per-property | (blank) |
| `{{pr_p_occupanc_N}}` | per-property | per-property | per-property | (blank) |
| `{{propertytax.annual_payment_N}}` | propertytax1 | propertytax2 | propertytax3 | (blank) |
| `{{propertytax.delinquent_N}}` | propertytax1 | propertytax2 | propertytax3 | (blank) |
| `{{propertytax.delinquent_amount_N}}` | propertytax1 | propertytax2 | propertytax3 | (blank) |
| `{{propertytax.source_of_information_N}}` | propertytax1 | propertytax2 | propertytax3 | (blank) |

Edge-function log lines that should appear:

```
[generate-document] RE851D: rewrote N literal "_N" placeholders … (propertytax.annual_payment_N=3, propertytax.delinquent_N=3, …)
[generate-document] RE851D propertytax: published per-index aliases for indices [1, 2, 3]
[generate-document] RE851D anti-fallback shield: blanked unpublished _N tags for indices [4, 5]
```

The previous symptom — Property #2/#3 displaying Property #1 data — disappears because the canonical_key resolver can no longer fall through for indices ≥ 2.

---

### Risk + scope summary

- **Templates affected:** RE851D only (guarded by `/851d/i` on `template.name` at line 2066, and the new propertytax publisher is gated by `propertyIndices.size > 0` and only writes `_N` aliases that the rewrite block consumes).
- **Performance:** Adds O(properties × 4) map writes — negligible vs the existing per-property loop already running for property type / occupancy / encumbrance.
- **Backward compatibility:** Existing single-property deals continue to resolve via canonical singular keys (idx === 1 fallback). Existing dotted `pr_p_*_N` and underscore `propertytax_*_N` tags continue to work.
- **Honors constraints:** No DB / schema / UI / API / generation flow change. Single-file backend edit, additive only.
