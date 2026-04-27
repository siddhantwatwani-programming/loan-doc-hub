## Problem

The RE851A template uses `{{#if (eq oo_svc_servicingAgent "Broker")}}` (Other Origination → Servicing prefix), but the document engine only publishes the canonical servicing-agent value under `sv_p_servicingAgent`. Since `oo_svc_servicingAgent` is never set as a derived alias, the `(eq ...)` comparison resolves to empty/false for every value — so the template always falls through to the `{{else}}` branch ("No Affiliation, 3rd Party Provider"), even when the user selects **Broker**.

The CSR persists the dropdown under `origination_svc.servicing_agent` as the lowercase code `"broker"`. The previous fix already canonicalizes this to `"Broker"` (title-case) and publishes it as `sv_p_servicingAgent`. We just need to mirror that same canonical value under the `oo_svc_*` key the new template references.

## Fix (minimal, scoped)

**File:** `supabase/functions/generate-document/index.ts` (immediately after line 944, where `sv_p_servicingAgent` is published)

Add a single additional alias publication so both naming conventions resolve to the same canonical title-case string:

```typescript
fieldValues.set("sv_p_servicingAgent", { rawValue: canonicalServicingAgent, dataType: "text" });
// Also publish under the oo_svc_* prefix (Other Origination → Servicing) used
// by newer RE851A template revisions: {{#if (eq oo_svc_servicingAgent "Broker")}}.
fieldValues.set("oo_svc_servicingAgent", { rawValue: canonicalServicingAgent, dataType: "text" });
```

The existing `(eq ...)` evaluator in `tag-parser.ts` already lowercases both sides of the comparison, so `(eq oo_svc_servicingAgent "Broker")`, `"broker"`, and `"BROKER"` will all match correctly.

## Why this is safe

- **No template changes.** The user's existing `{{#if (eq oo_svc_servicingAgent "Broker")}} N/A {{else}} No Affiliation, 3rd Party Provider {{/if}}` works as-is.
- **No UI / dropdown / schema / pipeline changes.** Only a single new derived alias is published in the document-generation merge map.
- **No impact on `sv_p_servicingAgent`** or the three Servicing checkboxes — they continue to populate from the same canonical source.
- **No impact on other templates** — `oo_svc_servicingAgent` was previously unset, so adding it cannot collide with any existing mapping.

## Verification

1. Extend `supabase/functions/_shared/tag-parser.servicing.test.ts` with a small fixture using `oo_svc_servicingAgent` to confirm:
   - "Broker" → renders `N/A`
   - "Lender" / "Company" / "Other Servicer" / empty → renders `No Affiliation, 3rd Party Provider`
2. Deploy the `generate-document` function.
3. Generate RE851A with Servicing Agent = **Broker** and confirm output is `N/A`; repeat for the other dropdown values and confirm `No Affiliation, 3rd Party Provider`.

## Files touched

- `supabase/functions/generate-document/index.ts` — add one `fieldValues.set("oo_svc_servicingAgent", …)` line.
- `supabase/functions/_shared/tag-parser.servicing.test.ts` — add regression cases (optional but recommended).
- Memory note `mem://features/document-generation/re851a-servicing-agent-checkboxes.md` updated to record the new alias.