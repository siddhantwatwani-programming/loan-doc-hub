

## Analysis

The `{{br_p_vesting}}` placeholder is inside a Word field code structure (begin → instrText → end, no separate marker). When Pattern C in `flattenMergeFieldStructures` collapses this structure, it preserves the `<w:rPr>` from the begin run (line 99), which contains `<w:b/>` (bold). The replaced value then inherits that bold formatting.

The borrower name is non-bold because it was either plain text or went through a different flattening path that didn't carry bold formatting.

## Fix

**File: `supabase/functions/_shared/tag-parser.ts`**

In Pattern C (line 99-101), stop preserving the begin run's `<w:rPr>`. Field codes without a `separate` marker have no display text — there's no meaningful formatting to inherit. Dropping the `rPr` lets the replaced value inherit the paragraph's default style, matching surrounding text.

Change line 99 from:
```typescript
const rPr = beginRPr ? `<w:rPr>${beginRPr}</w:rPr>` : '';
```
to:
```typescript
const rPr = '';
```

This is a one-line change. No other files, no database changes, no UI changes.

