# RE851A Servicing Checkboxes — Fix Plan

## Problem (Root Cause)

The RE851A template drives the three Servicing checkboxes with Handlebars conditionals that reference the merge key `sv_p_servicingAgent`:

```
{{#if (eq sv_p_servicingAgent "Lender")}} ☑ {{else}} ☐ {{/if}} THERE ARE NO SERVICING ARRANGEMENTS
{{#if (eq sv_p_servicingAgent "Broker")}} ☑ {{else}} ☐ {{/if}} BROKER IS THE SERVICING AGENT
{{#if (or (eq sv_p_servicingAgent "Company") (eq sv_p_servicingAgent "Other Servicer"))}} ☑ {{else}} ☐ {{/if}} ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN
```

Two defects in the document-generation engine cause every Servicing checkbox to render unchecked (and risk fragment leakage):

1. **Missing field publish.** The CSR stores the dropdown under `origination_svc.servicing_agent`. The merge key `sv_p_servicingAgent` is never written into `fieldValues`, so `(eq sv_p_servicingAgent "...")` always resolves the field as empty string → every comparison is false.
2. **`(or …)` helper not supported.** `evaluateEqExpression` only matches a single `(eq FIELD LITERAL)`. The third checkbox's `(or (eq …) (eq …))` falls through to the safety-net stripper that removes the `{{#if (…)}}` opener, leaving an orphan `☑ {{else}} ☐ {{/if}}` that the dangling-tag cleanup may scrub but cannot resolve correctly.

No issue exists in the UI, dictionary, schema, persistence layer, or the template itself.

## Fix (server-side only, surgical)

### Change A — Publish `sv_p_servicingAgent` alias (`supabase/functions/generate-document/index.ts`)

In the existing servicing-agent derivation block (around lines 894–934), in addition to the booleans/glyphs already derived, also publish the canonical merge key the template actually references, normalized to the exact title-cased literals the template compares against:

```ts
// Title-case canonical value so the template's (eq sv_p_servicingAgent "Lender" | "Broker" | "Company" | "Other Servicer") resolves.
const canonicalServicingAgent =
  isLenderServicing ? "Lender" :
  isBrokerServicing ? "Broker" :
  servicingAgentRaw === "company" ? "Company" :
  (servicingAgentRaw === "other servicer" || servicingAgentRaw === "other") ? "Other Servicer" :
  "";
fieldValues.set("sv_p_servicingAgent", { rawValue: canonicalServicingAgent, dataType: "text" });
```

Comparison is already case-insensitive in `evaluateEqExpression`, so this restores the Lender and Broker single-eq blocks immediately.

### Change B — Add `(or …)` / `(and …)` helper support (`supabase/functions/_shared/tag-parser.ts`)

Extend the existing `(eq …)` pre-pass (around lines 1406–1434) so `{{#if (or (eq …) (eq …))}}` and `{{#if (and …)}}` resolve before the simple `{{#if KEY}}` matcher runs. Implementation:

1. Add an `(or …)` / `(and …)` resolver that:
   - Splits balanced parens into child sub-expressions
   - Evaluates each child via the existing `evaluateEqExpression` (or recursively for nested or/and)
   - Returns `true`/`false` for `or` (any true) and `and` (all true)
2. Add a regex pre-pass before the existing `eqIfPattern`:
   ```
   {{#if (or (...) (...))}} … {{/if}}
   {{#if (and (...) (...))}} … {{/if}}
   ```
   Replace the matched block with its true branch (or `{{else}}` branch) based on the evaluated boolean — exactly mirroring how `eqIfPattern` already rewrites `(eq …)` blocks.
3. Mirror the same treatment for `{{#unless (or …)}}` / `{{#unless (and …)}}`.
4. Update the safety-net strippers (lines ~1520, 1532, 1536) so the new openers are also recognized — they already strip generic `{{#if (…)}}` patterns; verify the catch-all still cleans any unmatched residue.

### Tests

- Extend `supabase/functions/_shared/tag-parser.amortization.test.ts` (or add a sibling `tag-parser.servicing.test.ts`) with three fixtures using the exact template fragment for each dropdown value: Lender, Broker, Company, Other Servicer. Assert that exactly one checkbox glyph becomes ☑ and the other two remain ☐, and that no `{{`/`}}` residue remains.

## What is explicitly NOT changed

- RE851A Word template (no XML edits, no glyph/layout changes).
- Field dictionary, schema, RLS, persistence, or any UI component.
- Existing boolean/glyph aliases (`sv_p_noServicingArrangements`, `sv_p_brokerIsServicingAgent`, `sv_p_anotherQualifiedParty`, etc.) — they remain in place as a redundant safety belt and are not removed.
- Any other RE851A logic (broker capacity, amortization, etc.).
- Document formatting, spacing, alignment, or checkbox placement.

## Acceptance Verification

- Lender → only "THERE ARE NO SERVICING ARRANGEMENTS" is ☑.
- Broker → only "BROKER IS THE SERVICING AGENT" is ☑.
- Company or Other Servicer → only "ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN" is ☑.
- Generated DOCX opens in Word without integrity warnings; no merge-tag residue.
- All other RE851A sections render unchanged.
