## Root Cause

The generated documents (`Re851d_v18.docx`, `Re851d_v1_1_2_9-6.docx`) come out blank for every per-property field because the RE851D `_N` → `_1`, `_2`, … preprocessing block is throwing on every run.

Edge function logs confirm this on every generation:
```
[generate-document] RE851D _N preprocessing failed (continuing with original template):
sortedPropIndices is not defined
```

When the preprocessing `try` block throws, the function "continues with the original template", so `{{pr_p_address_N}}`, `{{ln_p_remainingEncumbrance_N}}`, `{{pr_li_currentDelinqu_N_yes_glyph}}`, etc. are never expanded into the per-property `_1`/`_2`/`_3` form. The merge-tag resolver then sees them as literal field keys, finds nothing, and renders blank. That single error cascades into "no per-property fields populate" in both uploaded docs.

I confirmed both DOCX files contain raw `{{..._N}}` placeholders that depend on this preprocessing pass:
```
{{pr_p_address_N}}, {{ln_p_remainingEncumbrance_N}}, {{ln_p_expectedEncumbrance_N}},
{{ln_p_totalEncumbrance_N}}, {{ln_p_totalWithLoan_N}}, {{ln_p_loanToValueRatio_N}},
{{pr_li_currentDelinqu_N_yes_glyph}}, {{pr_li_currentDelinqu_N_no_glyph}}, …
```

### Why the throw

`supabase/functions/generate-document/index.ts`:

- Line 963 declares `const sortedPropIndices` **inside** the alias-publisher block (`if (/851d/i.test(template.name || ""))` starting at line 931). It is block-scoped to that `if`.
- Line 3864, inside the **separate** `_N` preprocessing block (different `if`, far later in the file), references `sortedPropIndices` — which is not in scope there → `ReferenceError`.
- The surrounding `try { … } catch (e) { debugLog("RE851D _N preprocessing failed …") }` swallows the error and ships the un-rewritten template.

`propertyIndices` (the underlying `Set<number>` declared at line 889) IS in scope at line 3864, so the fix is local.

## Fix

In `supabase/functions/generate-document/index.ts`, inside the preprocessing block (around line 3863, just before `const propCount = sortedPropIndices.length;`), re-derive the sorted indices from the still-in-scope `propertyIndices`:

```ts
const propCount = [...propertyIndices].sort((a, b) => a - b).slice(0, 5).length;
```

(Equivalently: a single `const sortedPropIndicesLocal = [...propertyIndices].sort((a, b) => a - b).slice(0, 5);` at the top of the preprocessing `try` block, and update the one usage.)

No other logic changes. The cap of 5 matches `MAX_PROPERTIES` used elsewhere.

## Validation

After the fix, regenerate the same document and check the edge function logs:

- The `RE851D _N preprocessing failed … sortedPropIndices is not defined` line must be gone.
- A new log line like `RE851D multi-properties YES/NO anchored: count=3 isMultiple=true` should appear.
- The per-property region rewrites (`PROP#1`, `PROP#2`, `PROP#3`) reported in `regionRewriteCounts` should be > 0.
- The output DOCX should now show populated values in:
  - PART 1 LTV table (Property #N, appraised value, encumbrances, LTV)
  - PART 2 Securing Properties block (address, owner, type checkboxes)
  - PROPERTY #N detail blocks (all `pr_p_*`, `pr_li_*`, `propertytax.*` `_N` fields)
  - Lien delinquency YES/NO glyphs and counts

## Scope

- Single file: `supabase/functions/generate-document/index.ts`
- ~1-line change inside the existing RE851D `_N` preprocessing `try` block.
- No DB / schema / template / UI changes.
- No impact on RE851A, RE885, or any non-RE851D generation path (block is gated by `/851d/i.test(template.name)`).
