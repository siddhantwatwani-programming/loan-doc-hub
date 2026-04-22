
## Fix RE851A + Investor Questionnaire so generated DOCX files open correctly for DL-20260-0212

### Issue identified

Do I know what the issue is? Yes.

The current fix only proves `word/document.xml` is balanced enough to pass a heuristic check. It does **not** validate the other XML parts that this generator actively edits (`header*.xml`, `footer*.xml`, `footnotes.xml`, `endnotes.xml`). The latest database rows already show new “success” generations for both templates after the deploy, which means the current integrity guard is no longer firing. If the newly generated files still cannot open, the most likely remaining problem is:

1. malformed XML in a **non-document** Word part, or
2. a package-level XML problem that the current `document.xml`-only check does not catch.

That matches the current code:
- `processDocx()` edits multiple content parts
- the integrity check only verifies `word/document.xml`

### What I will change

#### 1) Reproduce using the latest generated outputs, not the older failed rows
Use the newest “success” outputs for:
- `re851a`
- `Investor Questionnaire`

Unpack the generated `.docx` files and inspect **all** content-bearing parts:
- `word/document.xml`
- `word/header*.xml`
- `word/footer*.xml`
- `word/footnotes.xml`
- `word/endnotes.xml`

This will confirm exactly which XML part is still malformed.

#### 2) Replace the current partial integrity check with full multi-part XML validation
In `supabase/functions/_shared/docx-processor.ts`:

- keep the current ZIP/package re-open step
- validate **every processed content XML part**, not just `word/document.xml`
- parse each XML part with a real XML parser / well-formedness check
- fail generation if **any** processed part is invalid
- include the exact failing part name in the thrown `DOCX_INTEGRITY` error

Example failure shape:
```text
DOCX_INTEGRITY: word/header1.xml is not well-formed XML
```

This is the minimum necessary hardening and does not alter template layout, mapping, or generation flow.

#### 3) Apply the surgical fix at the actual failing insertion path
Once the malformed part is identified, patch only the specific XML insertion path that creates invalid markup there.

Likely target: `supabase/functions/_shared/tag-parser.ts`

Most likely correction:
- keep XML escaping
- keep current formatting/mapping behavior
- ensure newline / break insertion only emits Word fragments when the insertion point is valid for that XML part and run context
- if a non-text-run context is detected, degrade safely to plain text/space instead of emitting structural tags

If the malformed part comes from a label-based replacement, conditional block, or `#each` expansion in a header/footer/footnote, I will patch only that exact branch.

#### 4) Prevent false “success” records for corrupt files
Keep the existing behavior in `supabase/functions/generate-document/index.ts` that converts `DOCX_INTEGRITY` failures into generation failure results, but make the error message more specific by surfacing the exact XML part that failed validation.

That way:
- corrupt files are never stored as successful outputs
- the failure message becomes actionable
- no workflow or permission changes are needed

#### 5) Clean up misleading historical failed rows only if needed
No schema or workflow change.

If validation proves the latest regenerated files are now valid, I will leave historical failed records as history.  
If additional stale rows must be updated for clarity, I will do a minimal one-shot data cleanup only for the affected generated document records for this deal.

### Files likely to be touched

- `supabase/functions/_shared/docx-processor.ts`
  - expand integrity validation from `document.xml` to all processed Word XML parts
- `supabase/functions/_shared/tag-parser.ts`
  - patch only the exact replacement branch causing malformed XML in the failing part
- possibly one small SQL migration
  - only if a targeted cleanup of incorrect generated-document statuses is still required

### What will remain unchanged

- document templates
- placeholder naming
- field mapping logic unless the failing branch absolutely requires a surgical fix
- layout, spacing, styling, formatting, and structure of RE851A / Investor Questionnaire
- export flow
- regeneration workflow
- permissions
- database schema

### Validation after implementation

#### For DL-20260-0212
1. Generate `re851a`
2. Generate `Investor Questionnaire`
3. Download both latest outputs
4. Unzip and validate all processed XML parts
5. Confirm both files open in Microsoft Word / compatible viewers without repair prompts
6. Confirm layout and formatting are unchanged

#### Broader regression check
Run the same validation path for the rest of the templates generated for this deal / packet so the fix works for all files tied to DL-20260-0212, not only these two templates.

### Acceptance criteria

- RE851A generates successfully and opens normally
- Investor Questionnaire generates successfully and opens normally
- No generated DOCX for this deal is marked `success` if any edited Word XML part is malformed
- Template formatting and layout remain unchanged
- The fix applies reliably across all files generated for DL-20260-0212

### Technical notes

Current evidence from the database:
- older failed rows still exist for these templates
- newer rows were generated afterward with `generation_status = 'success'`

That means the remaining bug is most likely **not** “generation still fails” at the job level. It is more likely:
```text
generator now reports success because only word/document.xml is checked,
but another edited DOCX part is still invalid
```

So the correct fix is **full multi-part DOCX XML validation plus a surgical patch in the specific failing insertion path**.
