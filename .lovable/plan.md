

# Fix: Mortgage Broker Agency Disclosure - Content Loss & Field Population Failure

## Root Cause Analysis

Two bugs in `supabase/functions/_shared/tag-parser.ts` `normalizeWordXml()` function:

### Bug 1: `fragmentedDot` regex matches normal sentence periods (lines 135-139)
The regex consolidates dots fragmented across XML runs. It's designed for merge tags like `Terms.LoanNumber` split across runs, but it also matches **every period in normal text** that falls at a run boundary (e.g., `"...the Borrower</w:t></w:r><w:r><w:t>.A mortgage broker..."`). When it matches, it **strips the XML run structure between the two text fragments**, corrupting the document XML. In a document with many paragraphs (sections 1-4), this cascading corruption causes Word to lose/not render entire sections.

The `fragmentedDotInRun` pattern (lines 143-147) has the same issue.

### Bug 2: `fragmentedUnderscore` regex (lines 108-109)
Same problem — matches underscores at run boundaries in normal content (signature lines, etc.) and strips XML structure via `"$1_$4"` replacement string.

### Bug 3: Dangling `{{` cleanup is too aggressive (line 1003)
```javascript
result = result.replace(/\{\{(?=[^}]{200,})/g, '');
```
Strips `{{` when `}}` is >200 chars away. In Word XML, even simple `{{fieldName}}` tags can have >200 chars of XML between the braces, so this incorrectly strips valid (but fragmented) opening braces.

## Fix (Single File)

**File: `supabase/functions/_shared/tag-parser.ts`**

### Change 1: Constrain `fragmentedDot` to merge tag context only
Add a lookaround/guard so the regex only fires when the text before+after looks like a field key (both sides must be field-key-like patterns, and the match must be near `{{`, `«`, or contain typical field key segments). Replace the current unconditional regex with a callback that checks context.

```text
Before: Always replaces word<XML>.word patterns
After:  Only replaces when BOTH sides match field-key patterns AND the match
        is within 100 chars of {{ or « delimiters
```

### Change 2: Constrain `fragmentedDotInRun` similarly

### Change 3: Constrain `fragmentedUnderscore` similarly
Add context checks so it only fires near merge tag delimiters.

### Change 4: Remove the dangerous dangling `{{` cleanup (line 1003)
Delete the line `result = result.replace(/\{\{(?=[^}]{200,})/g, '');` — the paragraph-level consolidation safety net already handles truly fragmented tags, and this cleanup causes more harm than good by stripping valid braces.

### Implementation approach
For changes 1-3, convert the regex replacements to use callbacks that:
1. Check if the match position is within ~200 chars of a `{{` or `«` character in the source
2. Only apply the consolidation if the context suggests a merge tag (not normal sentence text)
3. Log when a match is skipped due to context check

This is a minimal, targeted fix. No other files, UI, schema, or logic are modified.

