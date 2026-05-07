I confirmed the failure is now a memory limit problem during the RE851D post-render phase, not just the earlier CPU scan issue. Logs show rendering completes, then the function reaches the RE851D post-render safety passes and dies with `Memory limit exceeded` before upload/job completion.

Plan:

1. Keep the change strictly scoped to RE851D document generation
   - No UI changes.
   - No database/schema changes.
   - No changes to other document templates.
   - Preserve existing field mappings and existing generation flow.

2. Reduce DOCX memory duplication in the shared processor
   - In `supabase/functions/_shared/docx-processor.ts`, remove the full second unzip used only for integrity validation after `zipSync`.
   - Validate the already-processed XML strings before zipping instead of unzipping the freshly zipped output again.
   - This avoids holding multiple full copies of the ~4MB `word/document.xml` plus zipped/unzipped package in memory at the same time.

3. Collapse repeated RE851D post-render safety passes into a single XML pass
   - In `supabase/functions/generate-document/index.ts`, keep the existing behavior, but avoid repeatedly scanning and copying `word/document.xml` for each question block.
   - Build the visible-text projection/property ranges once.
   - Apply the current safety logic for:
     - Owner Occupied YES/NO
     - Multiple / Additional Securing Property YES/NO
     - Remain Unpaid YES/NO
     - Cure Delinquency YES/NO
     - 60-day delinquency YES/NO
     - Encumbrance of Record YES/NO
     - Encumbrance table value/balloon post-render fixes
   - Collect all non-overlapping rewrites/inserts and apply them once in reverse order.

4. Remove avoidable large object retention after each major phase
   - Clear temporary decoded XML caches once they are no longer needed.
   - Avoid creating unused `TextDecoder`/`TextEncoder` instances inside every RE851D pass.
   - Keep only one mutable DOCX package representation until final upload.

5. Preserve all existing RE851D field results
   - Do not change the senior encumbrance calculations.
   - Do not change the `_N` mapping rules.
   - Do not change lien/property isolation logic.
   - Blank/zero behavior and property-specific values remain as already implemented.

6. Verify by checking logs after generation
   - Confirm `Memory limit exceeded` no longer appears.
   - Confirm the job reaches success and uploads the generated DOCX.
   - Confirm existing RE851D timing logs still show replacement and post-render stages completing.