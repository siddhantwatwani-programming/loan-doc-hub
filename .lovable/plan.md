

# Fix: Duplicate Dollar Sign in Generated Document Output

## Root Cause

The document template contains a literal `$` character before each currency placeholder:
```
$ {{of_901_int_o}}
```

When the engine resolves the tag, `formatByDataType("currency")` calls `formatCurrency()` which uses `Intl.NumberFormat` with `style: "currency"` — producing `$95.00`.

The final output becomes: `$ $95.00` (double dollar sign).

This affects ALL currency-typed fields in the document (800, 900, 1000, 1100, 1200, 1300 series).

## Fix

**File: `supabase/functions/_shared/tag-parser.ts`** — In the merge tag replacement logic (~line 1262-1283), after formatting a currency value, check if the template XML immediately preceding the tag contains a literal `$` character. If so, strip the `$` from the formatted value to avoid duplication.

Specifically, after `resolvedValue` is computed (line 1269), add a currency-prefix-aware step:

```typescript
// If the value is currency-formatted (starts with "$"), strip the "$" because
// the template already contains a literal "$" before the placeholder.
if (fieldData.dataType === 'currency' && resolvedValue.startsWith('$')) {
  resolvedValue = resolvedValue.substring(1);
}
```

This is the simplest and most correct fix because:
1. The template is designed with `$` prefixes — this is intentional formatting by the template author
2. The `formatCurrency` function should continue to produce `$150.00` for other consumers
3. Only currency-typed fields in document generation need the prefix stripped

The same logic applies in the label-based replacement path (~line 688-693) — add the same strip there for consistency.

## Files Modified

| File | Change |
|---|---|
| `supabase/functions/_shared/tag-parser.ts` | Strip leading `$` from currency-formatted values before inserting into template (2 locations) |

## What Will NOT Change
- No template modifications
- No `formatting.ts` changes
- No UI or database changes
- No changes to non-currency fields
- `formatCurrency()` continues to return `$150.00` for all other uses

