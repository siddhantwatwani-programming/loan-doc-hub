I confirmed RE885 is consistently failing in `generation_jobs` with `Generation timed out (CPU limit exceeded)`, while another document on the same deal completes in about 7–10 seconds. The RE885 template file itself is not huge, so the likely bottleneck is the generic DOCX parser doing unnecessary document-wide label/checkbox safety passes that were built for RE851A and are currently running for every template, including RE885.

Plan:

1. Scope RE851A-only safety passes to RE851A templates only
   - Add an optional processing context/template name parameter through the DOCX processing path.
   - In `replaceMergeTags`, run the existing RE851A-specific sections only when the template name matches `851a`.
   - This preserves RE851A behavior while preventing RE885 from paying the CPU cost of RE851A-only checkbox/glyph normalization.

2. Keep RE885 output behavior unchanged
   - Do not alter RE885 mappings, field resolution, business logic, output format, database schema, UI, or document flow.
   - RE885 will still run the shared merge tag replacement, conditionals, labels, DOCX integrity validation, upload, and generated document record creation.

3. Add lightweight timing logs around major generation phases
   - Add debug/performance logs for RE885 generation phases such as field resolution, template download, mapping fetch, DOCX processing, upload, and record insertion.
   - This is only observability; it does not change output.
   - These logs will make it clear if any additional RE885-specific bottleneck remains after the scoped optimization.

4. Validate using recent job behavior and logs
   - After implementation, check that new RE885 jobs no longer remain stuck/running until timeout.
   - Confirm that generated document records are created normally and other document generation paths remain unchanged.

Files expected to change:
- `supabase/functions/_shared/types.ts` — add a small optional DOCX processing context type.
- `supabase/functions/_shared/docx-processor.ts` — pass template context into the parser.
- `supabase/functions/_shared/tag-parser.ts` — gate RE851A-only passes behind an `isRe851A` check.
- `supabase/functions/generate-document/index.ts` — provide the template name/context and add scoped timing logs.

No database schema changes, UI layout changes, or template/output formatting changes are planned.