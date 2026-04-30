## Root Cause

The RE851D `_N` placeholder expansion (the preprocessor that rewrites `{{pr_p_address_N}}`, `{{pr_p_appraiseValue_N}}`, `{{ln_p_loanToValueRatio_N}}`, etc. into per-occurrence indexed tags `_1`, `_2`, …, `_5`) is **never running for the production template**.

### Why

In `supabase/functions/generate-document/index.ts` line 2057, the template-name guard is:

```ts
if (/(^|[^a-z])851d/i.test(template.name || "")) {
```

The DB template name is **`Re851d`** (verified via `SELECT … FROM templates WHERE name ILIKE '%851d%'`). The guard requires either start-of-string or a *non-letter* character immediately before `851d`. In `Re851d` the letter `e` sits directly before `851d`, so the regex returns `false` and the entire `_N` rewrite block is skipped.

### Confirmed against the supplied artifacts

- `Re851d_v1(1)(2).docx` (template) contains exactly the literal merge tags `{{pr_p_address_N}}` (×5), `{{pr_p_appraiseValue_N}}` (×5, one fragmented), `{{ln_p_loanToValueRatio_N}}` (×5).
- `Re851d_v8.docx` (output) shows Property #1 row blanked for address (because the singular `{{pr_p_address}}` tag elsewhere consumed it) and Properties #2–#5 all showing the same `Doveson Street, Boston, AL, 10002` — exact symptom of the `_N` tags being left as-is and resolved by fallback rather than being rewritten to `_1 / _2 / _3 / _4 / _5`.
- Recent edge-function logs include: `[tag-parser] No data for pr_p_address_N (canonical: pr_p_address_N, ultimate: pr_p_address_N)` — proves the literal `_N` tag reached the parser unchanged.

The downstream per-index publisher (`pr_p_address_1`, `pr_p_address_2`, …) is already correct and already tested in earlier work — it is wired strictly per `property{N}.*` with no cross-index fallback. It just never has the chance to be consumed because the `_N → _1.._5` rewrite is gated off.

## Fix (one line)

`supabase/functions/generate-document/index.ts`, line 2057:

```diff
-    if (/(^|[^a-z])851d/i.test(template.name || "")) {
+    if (/851d/i.test(template.name || "")) {
```

The simpler regex matches `Re851d`, `RE851D`, `RE-851D`, `Re851d_v1(1)(2)`, etc. — all current and historical naming variants the user has uploaded. Nothing else in the function references this guard, so no other behavior changes.

## Why this is the minimum-change fix

- **No schema changes.** No DB migration.
- **No UI changes.** Property data entry, save logic, and storage model untouched.
- **No other template impact.** The guard exclusively wraps the RE851D `_N`-rewrite preprocessor; other templates never enter that block.
- **No business logic change.** The per-index alias publisher (`pr_p_*_1.._5`), Part 2 checkbox booleans, occupancy mapping, encumbrance totals, and LTV computation already exist and are correct — they only need the placeholders to actually be expanded so the publisher's values can resolve.
- **No PDF / generation flow change.** Only the regex character class is widened.

## Validation

After the change, re-generate `Re851d` against a deal with three saved properties:

| Section | Expected value |
|---|---|
| PROPERTY #1 → STREET ADDRESS | property1 address |
| PROPERTY #2 → STREET ADDRESS | property2 address |
| PROPERTY #3 → STREET ADDRESS | property3 address |
| PROPERTY #4, #5 | Blank (no CSR data → no `_4` / `_5` aliases published → empty) |
| Part 2 → CURRENT MARKET VALUE per row | property{N}.appraised_value (no repeats) |
| Part 2 → LOAN TO VALUE per row | property{N} computed LTV |

Edge-function log line that should appear:

```
[generate-document] RE851D: rewrote N literal "_N" placeholders to per-occurrence indices (pr_p_address_N=5, pr_p_appraiseValue_N=5, ln_p_loanToValueRatio_N=5, …)
```

The `[tag-parser] No data for pr_p_address_N` log line should disappear.

## Constraints honored

- ❌ No DB / schema change
- ❌ No UI / form / API change
- ❌ No effect on other templates (RE851A, RE885, etc.)
- ✅ Single 1-character widening of an existing regex inside the already-RE851D-scoped preprocessor
- ✅ Backward compatible with prior template names that did match (`RE-851D`, `RE_851D`)
