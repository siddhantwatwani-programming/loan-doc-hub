## Goal

In RE851A documents, ensure exactly one of the three Servicing checkboxes is checked based on the CSR `Servicing Agent` dropdown:

- **Lender** → ☑ "THERE ARE NO SERVICING ARRANGEMENTS"
- **Broker** → ☑ "BROKER IS THE SERVICING AGENT"
- **Company** or **Other Servicer** → ☑ "ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN"

All other servicing checkboxes remain ☐. No template, schema, dropdown, or field-mapping changes.

## Diagnosis

Engine logs confirm `sv_p_servicingAgent` and `oo_svc_servicingAgent` ARE populated correctly at runtime (e.g. `"Other Servicer"`, `"Broker"`). The `(eq …)` and `(or (eq …) (eq …))` helpers ARE supported and pass on a clean fixture. But in the live RE851A `.docx` the three `{{#if (eq sv_p_servicingAgent "…")}}` blocks live inside Word XML where each `{{`/`}}` is fragmented across multiple `<w:r>`/`<w:t>` runs (often inside SDT checkbox containers). When that fragmentation breaks any one of the three conditional blocks, the conditional resolver leaves a static `☐` glyph in place — exactly the failure the user reports.

This is the same class of issue we already fixed for **Subordination Provision** and **Broker-capacity A/B** with a label-anchored safety pass. The fix here mirrors that proven pattern.

## Approach (engine-side, scoped to RE851A Servicing only)

Add a new safety pass in `supabase/functions/_shared/tag-parser.ts` (immediately after the broker-capacity pass, before the final SDT conversion) that:

1. Reads the canonical servicing-agent value already published by `generate-document/index.ts` (`sv_p_servicingAgent` / `oo_svc_servicingAgent` / `origination_svc.servicing_agent` / `loan_terms.servicing_agent`).
2. Normalizes it to one of `lender` | `broker` | `other` (Company OR Other Servicer collapses to `other`). Skips entirely if blank/unknown.
3. Forces the glyph immediately preceding each of the three literal RE851A labels:
   - `THERE ARE NO SERVICING ARRANGEMENTS` → ☑ when `lender`, else ☐
   - `BROKER IS THE SERVICING AGENT` → ☑ when `broker`, else ☐
   - `ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN` → ☑ when `other`, else ☐
4. Uses the same `forceGlyphBeforeLabel` helper pattern as the broker-capacity pass — case-insensitive, XML-fragment-tolerant (works whether the glyph is inside `<w:t>`, plain text, or split across runs), and replaces ONLY the glyph character (no formatting, spacing, alignment, font, or surrounding text touched).
5. Logs the resolved state for traceability: `[generate-document] Forced RE851A servicing-agent glyphs: agent=…, lender=☐/☑, broker=☐/☑, other=☐/☑`.

## Files

- `supabase/functions/_shared/tag-parser.ts` — add the safety-pass block (≈40 lines, label-anchored). No other code changed.
- `supabase/functions/_shared/tag-parser.servicing-labels.test.ts` — new regression test pinning all 4 cases (`Lender`, `Broker`, `Company`, `Other Servicer`) against a DOCX-shaped fixture mimicking the live RE851A run-split structure (with SDT sentinel so `replaceMergeTags` enters its post-processing pipeline). Asserts exactly one ☑ and two ☐ per case, and that document-formatting tags are unchanged.

## Constraints respected

- No template `.docx` edits.
- No DB schema, dropdown, or UI changes.
- No changes to existing field mappings (`sv_p_servicingAgent`, `oo_svc_servicingAgent`, `origination_svc.servicing_agent`, etc. — all preserved as published today).
- No formatting / spacing / alignment / font / checkbox-position changes — only the glyph CHAR (`☐` ↔ `☑`) toggles.
- Other RE851A sections (subordination, amortization, broker-capacity, etc.) unaffected — pass is strictly scoped to the three literal servicing labels.

## Acceptance

- Existing 4 servicing tests pass.
- New 4 label-anchored regression cases pass (Lender / Broker / Company / Other Servicer each → exactly one ☑ on the correct line).
- Document generates without corruption (deploy `generate-document` after the change).
- No regression in the other 21 RE851A tests (broker-capacity, amortization, subordination, soft-break paragraph-split).
