## Root Cause

The field dictionary entry for "Performed By" is `pr_p_performeBy` (legacy misspelling, no `d`) — confirmed via DB:

```
field_key = pr_p_performeBy
```

In `supabase/functions/generate-document/index.ts` the property composite-key bridge (lines ~290-298) translates `propertyN::<dictId>` → `propertyN.<suffix>` using the `prKeyToSuffix` map. That map only contains the canonical-spelled key:

```ts
'pr_p_performedBy': 'appraisal_performed_by',   // line 257 — wrong spelling for the actual dict key
```

Because the dict's `field_key` is `pr_p_performeBy` (no `d`), `prKeyToSuffix[fieldDict.field_key]` returns `undefined` for properties #2–#5, so **`property2.appraisal_performed_by` … `property5.appraisal_performed_by` are never bridged**.

Property #1 happens to work only because the legacy-key map already exposes `property1.appraisal_performed_by` directly (`indexed_key` path), so the per-property publisher at lines 1082-1088 finds it for idx=1 only. For idx≥2, no `propertyN.appraisal_performed_by` exists, the publisher falls through, and the anti-fallback shield blanks `pr_p_performeBy_2..5` — **but the conditional `{{#if (eq pr_p_performeBy_N "Broker")}}` then sees the un-suffixed `pr_p_performeBy` global value (Property #1's value) inherited as fallback**, so all sections show the same text.

## Fix (one-line bridge map addition)

**File:** `supabase/functions/generate-document/index.ts`, line 257

Add the misspelled key to `prKeyToSuffix` so the bridge works for the actual dictionary key. Keep the `performedBy` (correct spelling) entry for forward-compat:

```ts
'pr_p_performedBy': 'appraisal_performed_by',
'pr_p_performeBy':  'appraisal_performed_by',   // ← add this (matches actual dict field_key)
```

That single addition lets the bridge populate `property2.appraisal_performed_by` … `propertyN.appraisal_performed_by`. The existing per-property publisher (lines 1072-1090) then publishes `pr_p_performedBy_N` and `pr_p_performeBy_N` correctly per index, and the existing anti-fallback shield (line 1671) blanks the un-suffixed global so `_N` no longer falls back to Property #1.

## Out of scope
- No template change (template tags `pr_p_performeBy_N` already correct).
- No schema, field-dictionary, UI, publisher-logic, or shield changes.
- No change to `legacyKeyMap.ts` (only `property1.*` mapping is needed there; `propertyN::dictId` composite keys for N≥2 flow through the edge-function bridge).

## Deploy
Deploy `generate-document` edge function and regenerate RE851D for deal `db7517e9-…` to verify each PROPERTY block shows its own Performed By value.