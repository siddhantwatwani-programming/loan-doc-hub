

## Conditional Lender Name Mapping for Hazardous Materials Certificate

### Root cause / current behavior

In `supabase/functions/generate-document/index.ts` (lines 1361–1377), the document generator unconditionally aliases the four lender name tags used by the Hazardous Materials Certificate (and Investor Questionnaire) templates:

```
ld_p_firstIfEntityUse ← ld_p_firstName
ld_p_middle           ← ld_p_middleName
ld_p_last             ← ld_p_lastName
ld_p_vesting          ← (whatever is stored, no trailing space handling)
```

Because the template line is `{{ld_p_vesting}} {{ld_p_firstIfEntityUse}}{{ld_p_middle}}{{ld_p_last}}` with a literal space after `{{ld_p_vesting}}`, an Individual lender (no vesting) still prints a leading blank, and entity vesting is shown without a controlled trailing space.

### Fix (single, surgical change in the existing alias block)

Edit only the block at **`supabase/functions/generate-document/index.ts` lines 1361–1377**. No template, schema, UI, or other behavior changes.

After the existing `aliasSetIfEmpty` calls, add a conditional override driven by `ld_p_lenderType` (already populated upstream at line 506 from the lender contact's `contact_data.type`):

```ts
// ── Hazardous Materials / Investor Questionnaire vesting rule ──
// If Lender Type === "Individual": clear vesting and force the three name
// tags to the Individual's first / middle / last name (no vesting prefix).
// Otherwise: keep vesting, and append a single trailing space so the
// template tag {{ld_p_vesting}}{{ld_p_firstIfEntityUse}}... renders cleanly
// without requiring a literal space between the two tags.
{
  const lenderTypeRaw = (fieldValues.get('ld_p_lenderType')?.rawValue ?? '').toString().trim();
  const isIndividual = lenderTypeRaw.toLowerCase() === 'individual';

  if (isIndividual) {
    // Vesting must NOT appear
    fieldValues.set('ld_p_vesting', { rawValue: '', dataType: 'text' });

    // Force name tags to Individual first/middle/last (override any prior alias)
    const first  = fieldValues.get('ld_p_firstName')?.rawValue   ?? '';
    const middle = fieldValues.get('ld_p_middleName')?.rawValue  ?? '';
    const last   = fieldValues.get('ld_p_lastName')?.rawValue    ?? '';
    fieldValues.set('ld_p_firstIfEntityUse', { rawValue: String(first),  dataType: 'text' });
    fieldValues.set('ld_p_middle',           { rawValue: String(middle), dataType: 'text' });
    fieldValues.set('ld_p_last',             { rawValue: String(last),   dataType: 'text' });
  } else {
    // Entity / Trust / LLC / etc.: keep existing aliases, but normalize vesting
    // so the trailing space is included only when vesting is non-empty.
    const vestingRaw = (fieldValues.get('ld_p_vesting')?.rawValue ?? '').toString().trim();
    fieldValues.set('ld_p_vesting', {
      rawValue: vestingRaw ? `${vestingRaw} ` : '',
      dataType: 'text',
    });
  }
}
```

### Template guidance (no template edit performed by code; documentation only)

The requirement notes the template should ideally be `{{ld_p_vesting}}{{ld_p_firstIfEntityUse}}{{ld_p_middle}}{{ld_p_last}}` (no literal space between the first two tags). The mapping above also works with the **current** template (`{{ld_p_vesting}} {{ld_p_firstIfEntityUse}}…`) — Individual will print one stray leading space; if the user wants pixel-perfect output without changing the mapping further, they can remove the literal space in the DOCX. The mapping itself does not modify the template.

### Files touched

- `supabase/functions/generate-document/index.ts` — append the conditional block immediately after the existing `aliasSetIfEmpty(...)` calls inside the same `{ ... }` scope (around line 1377). No other code paths, no other templates, no schema, no UI.

### Acceptance verification

- Lender Type = `Individual` → `ld_p_vesting` resolves to empty; first/middle/last come from the Individual's name fields.
- Lender Type = anything else (Entity, Trust, LLC, Corporation, etc.) → `ld_p_vesting` resolves to `"<vesting> "` (with trailing space) when vesting exists, empty when it doesn't; first/middle/last continue to alias from `ld_p_firstName/middleName/lastName` exactly as today.
- Hazardous Materials Certificate and Investor Questionnaire still open cleanly in Word and Google Docs (no template structural change).
- No other template, no other field mapping, no UI, and no permissions are affected.

