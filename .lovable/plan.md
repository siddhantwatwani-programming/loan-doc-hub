
Goal: fix “Mortgage_Broker_Agency_Disclosure_CA” generation so mapped fields populate and DOCX layout remains identical to template (no paragraph/spacing/alignment drift), with minimal targeted code changes.

1) Deep diagnosis summary (from code + logs + file comparison)
- Template validation confirms 6 valid mapped tags exist in the source template:
  - br_p_fullName, ln_p_loanNumber, bk_p_company, bk_p_brokerLicens, bk_p_firstName, bk_p_LastName.
- Generated output comparison shows structural loss:
  - Entire middle disclosure sections (1–3 and parts of 4) are missing.
  - Some placeholders become blank/removed instead of replaced.
  - Only selective fields appear (e.g., broker representative and final borrower line).
- Edge logs show the parser repeatedly running on non-content XML parts (settings/numbering/font/header/footer) with 0 merge tags, indicating overly broad processing scope and high risk of unintended XML mutation.
- Current tag normalization still contains broad structural rewrites (fragment/paragraph normalization passes) that can alter Word run/paragraph structure when no replacement is needed.

2) Minimal fix strategy (no schema/API/template changes)
A. Restrict replacement engine to text-bearing Word parts only
- In DOCX processing, only run `replaceMergeTags` on:
  - `word/document.xml`
  - `word/header*.xml`
  - `word/footer*.xml`
  - `word/footnotes.xml`
  - `word/endnotes.xml`
- Pass all other XML files through unchanged bytes.
Why: protects numbering/styles/settings/theme/relationship metadata from accidental rewrite.

B. Make normalization strictly tag-bound (not proximity-based)
- In `tag-parser.ts`, tighten fragmented-dot/underscore consolidation so it only runs when the match is inside a confirmed merge-tag boundary pair (`{{...}}` or `«...»`), not merely “near” delimiters.
- Keep XML structure untouched for normal sentence punctuation and signature underscores.
Why: prevents inadvertent run-tag stripping that causes content disappearance/layout shifts.

C. Remove destructive paragraph-level fallback from normal path
- Disable or gate paragraph-wide consolidation so it runs only as a last-resort when:
  1) unresolved merge delimiters remain in that same paragraph, and
  2) the paragraph text actually contains a reconstructable tag token.
- Never flatten entire paragraph text for paragraphs without fragmented tags.
Why: preserves run-level formatting, spacing, and alignment.

D. Safe unresolved-tag cleanup
- Only remove unresolved `{{...}}` placeholders when replacements were successfully detected in that XML part; otherwise leave original tokens intact.
Why: avoids blanking placeholders when detection fails.

E. Preserve XML validity for inserted values
- Ensure inserted field values are XML-escaped (`&`, `<`, `>`, quotes) before substitution.
Why: prevents subtle XML corruption that can cause Word to drop content.

3) Data-population verification to include in fix
- Add targeted diagnostics for `word/document.xml`:
  - tag count before normalization
  - tag count after normalization
  - replacements applied per tag
- Confirm expected population results for this deal:
  - br_p_fullName: present
  - ln_p_loanNumber: present
  - bk_p_company: present
  - bk_p_firstName + bk_p_lastName: present
  - bk_p_brokerLicens: currently null in saved deal data (cannot populate until data exists)

4) Validation plan (must pass before closing)
- Regenerate this exact template and compare original vs generated:
  - identical paragraph count/order
  - no missing sections
  - no alignment/line-spacing drift
  - field replacements in-place with same run styling
- Regression check:
  - generate 2–3 previously working templates to ensure no breakage in legacy fragmented-tag handling.
