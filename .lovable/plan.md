# RE851A — Part 2 Broker Capacity A/B Checkboxes

## Status of the request

The exact behavior described in the requirement is **already implemented end-to-end** in the document-generation engine. No template edit (and no `{{#if or_p_isBrkBorrower}}` Mustache block) is required — the system intentionally forces the A/B glyphs based on `or_p_isBrkBorrower`, regardless of whether the template uses a conditional or static glyphs.

What's already in place:

1. **Normalization layer** (`supabase/functions/generate-document/index.ts`, lines ~854–875):
   - Reads "Is Broker Also a Borrower?" from any of: `or_p_isBrokerAlsoBorrower_yes`, `origination_app.doc.is_broker_also_borrower_yes`, `or_p_isBrkBorrower`, `origination.is_broker_also_a_borrower`.
   - Publishes the canonical boolean `or_p_isBrkBorrower` plus glyph aliases (`or_p_brkCapacityAgentGlyph`, `or_p_brkCapacityPrincipalGlyph`) and Agent/Principal booleans.

2. **Paragraph-scoped A/B safety pass** (`supabase/functions/_shared/tag-parser.ts`, lines ~2729–2809):
   - After all merge-tag and conditional rendering, scans the rendered XML for the literal labels `A. Agent in arranging a loan` and `B. [optional *]Principal as a borrower`.
   - Forces the immediately-preceding glyph (`☐`/`☑`/`☒`) to the correct state derived from `or_p_isBrkBorrower`.
   - Local dedup collapses adjacent duplicate glyphs on the same line.
   - Surrounding text, formatting, and XML structure are preserved unchanged → no layout shift, no spacing/alignment change.

3. **Final SDT conversion** turns the resulting glyph into a native interactive Word checkbox.

The uploaded `re851a_v64.docx` uses static glyphs (`☐ .A. Agent…` / `☐B. *Principal…`), which is exactly the case the post-pass was designed to handle.

## What this plan does

A small, low-risk hardening pass to guarantee the behavior cannot silently regress.

### 1. Add Deno regression test

New file: `supabase/functions/_shared/tag-parser.broker-capacity.test.ts`

Three deterministic cases against the post-pass logic:
- `or_p_isBrkBorrower = "true"` → A becomes `☐`, B becomes `☑`.
- `or_p_isBrkBorrower = "false"` → A becomes `☑`, B becomes `☐`.
- `or_p_isBrkBorrower` missing/null → glyphs left untouched.

Inputs simulate the actual `<w:r><w:t>` shape from `re851a_v64.docx` (including the `*` before "Principal" and the leading `.` before "A.").

### 2. Add a single targeted log line

In `tag-parser.ts` inside the existing `if (isBrkBorrower !== null)` block, log the forced A/B glyph state so production runs can be audited from edge-function logs. One `console.log` line, no behavioral change.

## Files touched

- `supabase/functions/_shared/tag-parser.broker-capacity.test.ts` (new)
- `supabase/functions/_shared/tag-parser.ts` (one `console.log` added inside the existing block)

## Files explicitly NOT touched

- `re851a_v64.docx` (template stays exactly as uploaded)
- Any UI form, field dictionary entry, or DB schema
- `generate-document/index.ts` derivation logic
- The post-pass regex / replacement logic itself
- Any other field mapping or tag-parser path

## Acceptance verification

After deploy:
- CSR checks "Is Broker Also a Borrower?" → generated RE851A shows B☑ / A☐.
- CSR leaves it unchecked → generated RE851A shows A☑ / B☐.
- Document opens in Word with no corruption; layout, fonts, indents, and spacing unchanged.
- New Deno test passes (`supabase--test_edge_functions`).
- Edge function logs include a `[generate-document] Forced RE851A broker-capacity glyphs …` line for each generation.
