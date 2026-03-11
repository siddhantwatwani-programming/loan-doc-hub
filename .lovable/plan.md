

## Fix: Cross-Paragraph Tag Consumption Bug in Document Generation

### Problem

The generated document shows `Account Number: {{R Ekambaram for the benefit of the Broker, Lender...` — a dangling `{{` from the unresolved `{{ln_p_loanNumber}}` tag consumed the entire next paragraph. This causes:
- Missing Account Number field
- Lost certification paragraph structure  
- Page content shifts (section 4 bleeds onto page 1)
- Layout mismatches across all 6 pages

### Root Cause

The `{{ln_p_loanNumber}}` tag is fragmented across multiple XML runs in the DOCX template. The normalization regexes reconstruct the `{{` but fail to join the field name + `}}` back together (likely due to complex run properties or alternate content structures). The consolidation safety net (already coded) should catch this, but **the edge function hasn't been successfully redeployed** — production logs show zero diagnostic messages from the new tag-parser code.

Even with consolidation working correctly, there's no safety net to prevent dangling `{{` from corrupting the output when a tag can't be resolved.

### Fix (2 changes)

**1. Add dangling-brace cleanup in `replaceMergeTags`** (`supabase/functions/_shared/tag-parser.ts`)

After all tag replacement and label-based replacement are complete, add a final pass that removes any remaining `{{...}}` patterns from the output. These are unresolved tags that should display as blank, not as raw template syntax:

```typescript
// After label-based replacement (end of replaceMergeTags):

// Final safety net: remove any remaining unresolved {{...}} merge tags
// to prevent dangling braces from corrupting document layout
const unresolvedTagPattern = /\{\{[A-Za-z0-9_.| ]+\}\}/g;
const unresolvedTags = result.match(unresolvedTagPattern);
if (unresolvedTags && unresolvedTags.length > 0) {
  console.log(`[tag-parser] Cleaning ${unresolvedTags.length} unresolved tags: ${unresolvedTags.join(', ')}`);
  result = result.replace(unresolvedTagPattern, '');
}

// Also clean dangling {{ without matching }} (cross-paragraph fragmentation artifact)
// A {{ followed by 200+ chars before the next }} is almost certainly a broken tag
result = result.replace(/\{\{(?=[^}]{200,})/g, '');
```

This ensures that even if normalization/consolidation fails for a specific tag, the output document is clean.

**2. Force redeploy the `generate-document` edge function**

The consolidation safety net and diagnostic logging already in the codebase need to be deployed to production. The code change above will trigger a redeploy automatically.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/_shared/tag-parser.ts` | Add ~10 lines of cleanup logic at end of `replaceMergeTags` |

### What This Does NOT Change
- No UI changes
- No database changes
- No changes to normalization regexes or consolidation logic
- No changes to field resolution, formatting, or any other document generation logic
- All existing templates continue to work identically

