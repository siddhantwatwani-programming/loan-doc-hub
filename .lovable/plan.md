

## Fix: RE851A (DL‑20260‑0212) generates a corrupted .docx

### Root cause

Looking at `supabase/functions/_shared/tag-parser.ts`, the previous round of changes added `escapeXmlValue()` which converts `\n` into a literal Word fragment:

```
</w:t><w:br/><w:t xml:space="preserve">
```

This fragment is then injected at every value-substitution site, including:

1. `processEachBlocks` (split/join replacement of resolved values)
2. The main `replaceMergeTags` loop for `{{tag}}` / `«tag»`
3. Label-based `replaceNext` substitutions
4. Resolved values inside `{{#if}}` / `{{#unless}}` blocks

The fragment is **only valid if the substitution site is already inside a `<w:t>` element**. For RE851A, several merge tags in the template sit inside table cells, header/footer parts, and inside SDT (structured document tag) wrappers where the surrounding XML is `<w:r><w:rPr>…</w:rPr><w:t>{{tag}}</w:t></w:r>` for some, but for others the tag was split across runs and the cleanup pipeline leaves the substitution **outside** an open `<w:t>`. When that happens, the engine emits an orphan `</w:t>` and an opening `<w:t xml:space="preserve">` with no matching close, which:

- silently passes the existing integrity check (it only counts `<w:p>` open vs close), and
- causes Word to reject the file with "File could not open. Try refreshing the page."

The two known-broken generations for deal `b097983c-…` (`d25cc037…_v1` and `_v2`) are both persisted as `generation_status='success'` with no `error_message`, confirming the integrity check is too permissive.

### Fix (minimal, surgical)

1. **`supabase/functions/_shared/tag-parser.ts`** — make newline handling context-safe:
   - Remove the unconditional `\n → </w:t><w:br/><w:t xml:space="preserve">` replacement from the central `escapeXmlValue()` helper. `escapeXmlValue()` will only escape `&`, `<`, `>`, `"`, `'` (the part that fixed the Investor Questionnaire `&` bug — kept).
   - At each substitution site (`processEachBlocks` lines ~1404 & ~1418, main loop lines ~1571–1577, label/`replaceNext` site), detect whether the replacement is inside an open `<w:t>` run by inspecting the surrounding XML window. Only when it is, emit the `</w:t><w:br/><w:t xml:space="preserve">` form for newlines; otherwise replace `\n` with a single space.
   - This preserves multi-line rendering for values that legitimately appear inside text runs (Lender name with embedded newline, etc.) and removes the only known way our pipeline produces orphan `</w:t>`/missing `<w:t>` tags.

2. **`supabase/functions/_shared/docx-processor.ts`** — strengthen the post-zip integrity check so a future regression cannot ship a broken .docx as `success`:
   - Keep existing prolog/epilog/`<w:p>` balance guards.
   - Add `<w:r>` and `<w:t>` open/close balance checks (handle `<w:r/>` and `<w:t/>` self-closing forms).
   - On failure, throw `DOCX_INTEGRITY: <reason>` (existing handler in `generate-document/index.ts` already maps this to `generation_status='failed'` + `error_message`, instead of uploading a corrupt file).

3. **One-shot data cleanup** — mark the two known-broken `generated_documents` rows for deal `b097983c-…` as `failed` so the UI stops serving them as openable downloads:
   ```sql
   UPDATE generated_documents
      SET generation_status = 'failed',
          error_message = 'Regenerate — file failed XML integrity (Word reported "could not open").'
    WHERE deal_id = 'b097983c-b183-49b7-b7b8-83570972bfdb'
      AND template_id = (SELECT id FROM document_templates WHERE name ILIKE '%RE851A%' OR name ILIKE '%re_851a%' LIMIT 1)
      AND generation_status = 'success'
      AND created_at > now() - interval '7 days';
   ```
   No schema change.

4. **Verify**:
   - Regenerate RE851A for `DL-20260-0212`. Download the .docx, run `unzip -p file.docx word/document.xml | xmllint --noout -` (must exit 0). Open in LibreOffice and confirm the file opens with no error and layout is byte-identical to before.
   - Spot-check Investor Questionnaire (RE 870), RE 885, Addendum to LPDS, and Allonge — confirm they continue to generate and open identically.
   - Confirm a value containing both `&` and `\n` (e.g. a multi-line lender name "Smith & Jones\nTrust") still renders correctly inside a body paragraph and does not corrupt the file when present in a header cell.

### Files that will be edited

- `supabase/functions/_shared/tag-parser.ts` — context-aware newline handling at 4 substitution sites; `escapeXmlValue` no longer emits XML for `\n`.
- `supabase/functions/_shared/docx-processor.ts` — extend integrity check with `<w:r>` and `<w:t>` balance.
- One-shot SQL update on the two known-broken `generated_documents` rows.

### Why the template formatting remains unchanged

- No edits to the `.docx` template stored in the `templates` bucket.
- No edits to `field_dictionary`, `merge_tag_aliases`, packet logic, signature page-break injection, checkbox SDT logic, formatting helpers, PDF conversion, or any field mapping.
- Substitutions still produce identical output for every value that does not contain a `\n`. For values that do contain `\n` and sit inside a `<w:t>` run, output is byte-identical to today. The only behavioral change is for values containing `\n` that are substituted outside a text run — those previously corrupted the file; they now render as a space.

### Acceptance verification

- ✅ RE851A for `DL-20260-0212` opens in Microsoft Word and LibreOffice with no error.
- ✅ Layout, styling, spacing, and mapping are unchanged from the current template.
- ✅ `xmllint --noout word/document.xml` exits 0 on the regenerated file.
- ✅ All other templates (RE 870 Investor Questionnaire, RE 885, Addendum to LPDS, Allonge, etc.) still generate and open identically.
- ✅ Any future regression that produces malformed XML is persisted as `failed` with a descriptive `error_message`, not served as a downloadable broken file.

