

## Fix: Investor Questionnaire (DL‑20260‑0212 / RE 870) generates a corrupted DOCX

### Root‑cause direction

The generation pipeline reports `success` and uploads bytes, but Word reports the file is unreadable. That always means the produced `word/document.xml` is no longer well‑formed XML, or the ZIP package is missing a part. For the Investor Questionnaire specifically, three recently‑touched areas are the realistic causes:

1. **Replacement values containing unescaped XML characters** (`&`, `<`, `>`, `"`) — investor names, company names, addresses, descriptions can contain `&` (e.g. "Smith & Jones"), which silently breaks `word/document.xml`.
2. **Unbalanced / leftover Handlebars blocks** in the RE 870 template (`{{#if …}}` without a matching `{{/if}}`, or stray `{{else}}`) — the conditional processor in `tag-parser.ts` can over‑consume runs and leave malformed XML.
3. **Merge‑tag aliases added in `20260415170501_…sql`** (`ld_p_investorQuestiDueDate`, `ld_p_lenderType`, `lender.investor_questionnaire_due_date`, etc.) resolving to unexpected values that break a structured Word table cell.

### What I will do (read → diagnose → fix → verify)

1. **Reproduce & capture the bad bytes** — pull the latest generated artifact (`generated-docs/<dealId>/d25cc037…_v8_*.docx`) using the service‑role client inside a small one‑shot edge function call, unzip it, and run `xmllint --noout` on `word/document.xml`. Identify the exact line/column the parser rejects. Also unzip the source template (`templates/1776276673127_re870_…docx`) and confirm it opens cleanly and that all `{{ … }}` and `«…»` tags are well‑formed and balanced.

2. **Patch the replacement pipeline so values are XML‑safe** in `supabase/functions/_shared/tag-parser.ts` (and `formatting.ts` if needed):
   - Centralize a single `escapeXml(value)` helper (`& → &amp;`, `< → &lt;`, `> → &gt;`, `" → &quot;`, `' → &apos;`).
   - Apply it inside `replaceMergeTags` for **every** value path: curly `{{tag}}`, chevron `«tag»`, label‑based mapping, conditional resolved string, and any `replaceNext` substitution for merge_tag_aliases. This is the minimum change required and does not alter formatting or layout.
   - Verify checkboxes / SDT replacement (`formatCheckbox`) still emit valid XML — they already use literal characters, so they remain unchanged.

3. **Harden conditional / each block parsing for the RE 870 template**:
   - In `tag-parser.ts`, when an `{{#if x}}` / `{{#unless x}}` / `{{#each x}}` opener has no matching closer in the same paragraph or section, fall back to **leaving the original text unchanged** instead of consuming runs across the rest of the document. This prevents one malformed tag from destroying the document body.
   - Log the offending tag name to `console.warn` so the next regeneration surfaces the bad placeholder by name (no behavior change for valid templates).

4. **Fix the RE 870 template tags themselves** (only if step 1 proves they are malformed):
   - Re‑open `1776276673127_re870_-_Investor_Questionnaire_-_Field_Key_mapping.docx`, normalize fragmented tags, ensure every `{{`/`}}` is balanced, replace unsupported placeholder names with their canonical `field_dictionary` keys (e.g. `{{ld_p_investorQuestiDueDate}}`), and re‑upload via `upload-template` (which already validates structure).
   - Do not change visible text, formatting, or layout.

5. **Add a defensive ZIP‑integrity check** at the end of `processDocx` in `supabase/functions/_shared/docx-processor.ts`:
   - After `fflate.zipSync`, re‑parse the produced bytes with `fflate.unzipSync` and assert that `word/document.xml` parses as XML (lightweight check: must start with `<?xml` and end with `</w:document>`).
   - If the check fails, mark the `generated_documents` row as `failed` with a clear `error_message` instead of uploading a corrupt file. Existing successful generations are unaffected.

6. **Verify**:
   - Regenerate the Investor Questionnaire for the deal in the screenshots (`b097983c-…`), download the `.docx`, open it with `unzip -p output.docx word/document.xml | xmllint --noout -`, then convert to PDF via LibreOffice and inspect the first three pages as images.
   - Confirm: file opens in Word, all mapped fields populate, layout unchanged, empty fields render blank (not `{{tag}}`), and special characters like `&` in lender names appear correctly.

### Files that will be edited

- `supabase/functions/_shared/tag-parser.ts` — add `escapeXml` to all value substitution sites; safer fallback for unbalanced conditional blocks.
- `supabase/functions/_shared/docx-processor.ts` — post‑zip integrity check; on failure return an error instead of corrupted bytes.
- `supabase/functions/generate-document/index.ts` — when `processDocx` throws the new integrity error, persist `generation_status = 'failed'` with `error_message` so the UI shows a real error rather than serving a broken file.
- (Conditional) Re‑upload `templates/1776276673127_re870_-_Investor_Questionnaire_-_Field_Key_mapping.docx` if step 1 finds malformed tags inside the template itself.

### What will NOT change

- No database schema changes.
- No changes to existing field_dictionary entries, merge_tag_aliases rows, RLS, permissions, packet logic, PDF conversion, signature page‑break injection, or any other template's behavior.
- No UI, layout, route, or component changes.
- All other templates continue to generate exactly as today.

### Acceptance verification

- ✅ `unzip -p generated.docx word/document.xml | xmllint --noout -` exits 0.
- ✅ Word and LibreOffice open the file with no "could not open / refresh the page" error.
- ✅ Mapped Investor Questionnaire fields render correctly; unmapped fields render empty.
- ✅ Lender/investor names containing `&`, `<`, `>` no longer corrupt the file.
- ✅ Existing templates (RE 851A, RE 885, Addendum to LPDS, etc.) still generate and open identically.

