## Problem

In RE851D, `{{#if (eq pr_p_performeBy_N "Broker")}}…{{/if}}` resolves to the same value across PROPERTY #1–#5 (or to no property at all) instead of using each property's own `appraisal_performed_by`.

## Root cause

The publisher already emits per-property values:
- `pr_p_performedBy_1..5` (canonical, from `property{N}.appraisal_performed_by`, line 997–1002)
- `pr_p_performeBy_1..5` (legacy misspelling mirror, line 1003–1011)

But the per-property region rewriter that converts `_N` → `_K` inside each `PROPERTY #K` block only rewrites tags listed in `RE851D_INDEXED_TAGS` (line 2995, applied at line 3494). Neither `pr_p_performeBy_N` nor `pr_p_performedBy_N` is in that list. Result: the literal `_N` survives in every PROPERTY block, so the `(eq pr_p_performeBy_N "Broker")` helper compares against whatever single key happens to resolve (or nothing), making all properties render identically.

## Fix (additive, single file)

**File:** `supabase/functions/generate-document/index.ts`

In the `RE851D_INDEXED_TAGS` array (ends at line 3076), append:

```ts
// Per-property "Performed By" — both canonical and legacy-misspelled
// aliases so PROPERTY #K blocks rewrite _N → _K and each property
// renders its own appraisal_performed_by value.
"pr_p_performedBy_N", "pr_p_performeBy_N",
```

That's the entire change. The existing publisher already emits the per-index values, and the existing region rewriter handles `_N`→`_K` conversion for any tag listed here. No template, schema, UI, API, or other generation logic is touched.

## Acceptance criteria

- Each PROPERTY #1–#5 renders its own "Performed By" value.
- Property with "Other" produces blank `(eq … "Broker")` output; property with "Broker" produces "BPO Performed by Broker" / "N/A".
- No cross-property bleed; no fallback to a single shared value.
- All other RE851D behavior unchanged.

## Files modified

- `supabase/functions/generate-document/index.ts` — 2 entries appended to `RE851D_INDEXED_TAGS`.

## Memory

Existing memory file `mem://features/document-generation/re851d-performed-by-mapping` will be updated to note the per-property `_N`→`_K` rewrite is now wired via `RE851D_INDEXED_TAGS`.
