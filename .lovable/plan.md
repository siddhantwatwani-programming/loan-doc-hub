
Goal: fix the still-broken “Mortgage_Broker_Agency_Disclosure_CA” generation with the smallest possible code changes, preserving the existing flow and template structure.

1) What I verified (deep analysis)
- Compared uploaded files:
  - Original template contains full sections 1–4 and 6 mapped placeholders.
  - Generated file is structurally truncated (content between “Account Number” and “Broker’s Representative” is dropped), with spacing/layout collapse.
- Mapping health:
  - Template validation shows all 6 tags are correctly mapped.
  - Field dictionary keys exist for all 6 tags.
- Data availability for the tested deal:
  - Present: br_p_fullName, ln_p_loanNumber, bk_p_company, bk_p_firstName, bk_p_lastName.
  - Missing in this deal: bk_p_brokerLicens is null.
- Root cause:
  - Current normalization in `tag-parser.ts` is still too broad: dot/underscore run-consolidation can rewrite non-tag Word XML when tag delimiters exist nearby in the same paragraph context, which can corrupt run/paragraph structure and cause Word to drop large content blocks.
  - Paragraph safety-net consolidation can flatten run-level structure more than needed, causing formatting drift.
  - Unresolved-tag cleanup can blank tags that were not safely reconstructed.
  - Secondary population gap: numeric fields are extracted from `value_number` only; if a numeric-tag field is stored in `value_text`, it can appear “mapped but empty”.

2) Minimal implementation changes (only what is required)
A. `supabase/functions/_shared/tag-parser.ts` (primary fix)
- Replace paragraph-scope dot/underscore normalization with strict tag-bound normalization:
  - Only normalize fragmented `.` / `_` when the match is inside a confirmed delimiter pair (`{{...}}` or `«...»`) within the same tag boundary.
  - Do not normalize punctuation/underscores outside confirmed merge-tag bodies.
- Gate paragraph safety-net:
  - Run paragraph-level consolidation only when unresolved fragmented delimiters are detected after normal passes.
  - Skip it for already-parseable tags to preserve original run formatting.
- Make unresolved cleanup safe:
  - Stop globally removing remaining `{{...}}` tokens by default.
  - Only clear unresolved placeholders when they are positively identified as replaceable in the same processing pass.

B. `supabase/functions/_shared/field-resolver.ts` (targeted population fix)
- In `extractRawValueFromJsonb`, for numeric-like data types:
  - Use `value_number` when present.
  - Fallback to `value_text` when `value_number` is null and text exists.
- This is minimal and keeps existing save/update APIs unchanged (no schema changes).

3) Why this fixes the reported symptoms
- Prevents structural XML rewrites outside tag boundaries, which is what causes dropped paragraphs/sections and layout shifts.
- Preserves in-place run/paragraph/table structure, so line spacing/alignment/positions remain template-accurate.
- Ensures mapped fields stored as text in numeric slots are still populated (without DB/schema changes).

4) Validation checklist after implementation
- Regenerate “Mortgage_Broker_Agency_Disclosure_CA” and compare against original:
  - Sections 1–4 intact (no missing content block).
  - Same visual layout: spacing, alignment, and table geometry.
  - In-place field replacement only.
- Field verification:
  - br_p_fullName populates both occurrences.
  - ln_p_loanNumber populates.
  - bk_p_company populates.
  - bk_p_firstName + bk_p_LastName populate.
  - bk_p_brokerLicens populates when source data exists (including text fallback case).
- Regression smoke test with 2–3 other templates to confirm no break in existing generation behavior.

Technical details (implementation scope)
- No UI/component/API flow changes.
- No database schema changes.
- No template file modifications.
- No changes outside `tag-parser.ts` and `field-resolver.ts` unless strictly required by the above fix.
