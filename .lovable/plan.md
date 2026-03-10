

## Analysis: Edge Function Not Deployed + Missing Diagnostics

### Root Cause

The **edge function has NOT been redeployed** with the latest fixes. Evidence:
- Logs from 2026-03-10T18:29:22Z show `Found 0 merge tags` 
- **No** "After normalization" diagnostic message (added in latest code, line 871-875)
- **No** "Paragraph-level consolidation" messages (added in latest code)
- **No** "Consolidated fragmented" messages from any normalization regex

The code changes (whitespace-tolerant regexes, paragraph-level consolidation safety net, `<` exclusion in curly/chevron patterns) exist in the repository but are NOT running in production.

### Two Issues

**Issue 1: Deployment** — The `generate-document` edge function needs to be force-redeployed so the normalization and consolidation fixes take effect.

**Issue 2: Diagnostics** — Even after deployment, we need better logging to confirm normalization is working and to diagnose any remaining gaps. Currently, if consolidation silently fails (e.g., no paragraphs match the tag pattern), there's no log output to explain why.

### Plan

**File: `supabase/functions/_shared/tag-parser.ts`** — Add diagnostic logging (no logic changes):

1. **In `consolidateFragmentedTagsInParagraphs`** (line 223-267): Add a log at the start showing how many paragraphs contain `{` or `«`, and log when consolidation is skipped (e.g., "all tags already complete" or "no tags found in joined text"). This will reveal whether the function runs and what it finds.

2. **In `normalizeWordXml`** (after line 206): Add a log showing the count of `{{` pairs BEFORE the consolidation safety net runs (currently only checked after). This tells us if the regex-based normalization alone is sufficient.

3. **Force redeploy** the `generate-document` edge function.

### Technical Details

The diagnostic additions are minimal `console.log` statements — no changes to replacement logic, formatting, XML handling, or any other functionality.

```text
normalizeWordXml flow:
  1. Strip proofErr, bookmarks, pageBreaks  ← existing
  2. Regex-based fragmentation fixes        ← existing (with whitespace fixes)
  3. NEW LOG: count {{ before consolidation
  4. consolidateFragmentedTagsInParagraphs  ← existing
     - NEW LOG: paragraph stats (how many have '{', how many consolidated)
  5. Existing LOG: count {{ after consolidation
```

After deployment, regenerating the document will produce logs that reveal exactly where the pipeline fails, enabling a targeted fix if needed.

