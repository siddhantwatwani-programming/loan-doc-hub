

## Fix duplicate Lender output in Hazardous Materials Certificate

### Root cause

The duplication you see in the body sentence — `Del Toro Loan Servicing Inc / a California Corporation  ddddads ("Lender")` — is **not** caused by the template having two placeholders or by the engine looping. It's caused by the field‑alias block in `supabase/functions/generate-document/index.ts` (lines 1361–1403) populating **both** sides of the same name simultaneously when the lender is an entity:

1. `ld_p_vesting` already contains the full entity legal block (e.g. `"Del Toro Loan Servicing Inc\na California Corporation"`) — confirmed in edge logs.
2. The alias step then unconditionally does:
   ```
   ld_p_firstIfEntityUse ← ld_p_firstName   ("ddd" / entity name copy)
   ld_p_middle           ← ld_p_middleName
   ld_p_last             ← ld_p_lastName    ("dads")
   ```
3. The template line `{{ld_p_vesting}} {{ld_p_firstIfEntityUse}}{{ld_p_middle}}{{ld_p_last}}` therefore prints the entity block (from vesting) **and then** the entity name again (concatenated from first/middle/last) → looks like the lender is rendered twice.

The field‑dictionary label confirms this: `ld_p_firstIfEntityUse` = **"First (If Entity, Use Signer)"** — for an Entity it should hold the *signer's* first name, **not** be auto‑aliased from `ld_p_firstName`. The signature block at the bottom of the document (`ddd dads / Del Toro Loan Servicing Inc / a California Corporation`) is a separate, intentional placeholder and is **not** the duplicate.

### Fix (single, surgical change)

Edit only the alias block at **`supabase/functions/generate-document/index.ts` lines 1365–1403**. No template, schema, UI, or other code changes.

Replace the current "always alias firstName/middleName/lastName" logic with a type‑driven rule that matches the previously approved Hazardous Materials spec:

- **Individual** (`ld_p_lenderType === "Individual"`):
  - `ld_p_vesting` → `""`
  - `ld_p_firstIfEntityUse` ← `ld_p_firstName`
  - `ld_p_middle` ← `ld_p_middleName`
  - `ld_p_last` ← `ld_p_lastName`
  
  Result in body: `{{ld_p_vesting}}{{ld_p_firstIfEntityUse}}{{ld_p_middle}}{{ld_p_last}}` → `First Middle Last` (no vesting, printed once).

- **Entity / Trust / LLC / anything else**:
  - `ld_p_vesting` ← existing vesting value, with a single trailing space when non‑empty (current behavior, preserved).
  - `ld_p_firstIfEntityUse`, `ld_p_middle`, `ld_p_last` → **only set if the user has explicitly entered signer overrides** for those keys. If they're empty, they stay empty (do **not** auto‑copy from `ld_p_firstName/middleName/lastName`, which for an entity contain the entity name and would duplicate vesting).
  
  Result in body: `{{ld_p_vesting}}{{ld_p_firstIfEntityUse}}…` → `Del Toro Loan Servicing Inc / a California Corporation` (printed once, no trailing duplicate).

### Code change (lines 1365–1403)

```ts
{
  const lenderTypeRaw = (fieldValues.get('ld_p_lenderType')?.rawValue ?? '').toString().trim();
  const isIndividual = lenderTypeRaw.toLowerCase() === 'individual';

  if (isIndividual) {
    // Vesting must NOT appear; name comes from Individual first/middle/last
    fieldValues.set('ld_p_vesting', { rawValue: '', dataType: 'text' });

    const first  = fieldValues.get('ld_p_firstName')?.rawValue   ?? '';
    const middle = fieldValues.get('ld_p_middleName')?.rawValue  ?? '';
    const last   = fieldValues.get('ld_p_lastName')?.rawValue    ?? '';
    fieldValues.set('ld_p_firstIfEntityUse', { rawValue: String(first),  dataType: 'text' });
    fieldValues.set('ld_p_middle',           { rawValue: String(middle), dataType: 'text' });
    fieldValues.set('ld_p_last',             { rawValue: String(last),   dataType: 'text' });
  } else {
    // Entity / Trust / LLC / etc.
    // Vesting prints the entity legal block; do NOT also alias firstName→firstIfEntityUse
    // (that caused the entity name to render twice in the body sentence).
    const vestingRaw = (fieldValues.get('ld_p_vesting')?.rawValue ?? '').toString().trim();
    fieldValues.set('ld_p_vesting', {
      rawValue: vestingRaw ? `${vestingRaw} ` : '',
      dataType: 'text',
    });

    // Leave ld_p_firstIfEntityUse / ld_p_middle / ld_p_last as whatever the user
    // explicitly entered (signer override). If they have no value, they stay empty,
    // so the template will only print the vesting block.
    for (const k of ['ld_p_firstIfEntityUse', 'ld_p_middle', 'ld_p_last']) {
      if (!fieldValues.has(k)) {
        fieldValues.set(k, { rawValue: '', dataType: 'text' });
      }
    }
  }
}
```

### Why this is minimal & safe

- Touches one block in one file.
- No template change, no schema change, no UI change, no permission change.
- Investor Questionnaire (the other consumer of `ld_p_firstIfEntityUse/middle/last`): for Individual lenders it now receives the individual's name (same as today). For Entity lenders it receives the explicit signer fields if entered, or empty — which matches the dictionary semantics ("First (If Entity, Use Signer)") and removes the accidental entity‑name duplication. If existing data relied on the silent auto‑alias for entities, the user can populate the signer fields explicitly.
- Signature block at the bottom of the Hazardous Materials Certificate is a separate template placeholder and is unaffected.

### Validation

1. **Entity lender** (current test data: vesting = "Del Toro Loan Servicing Inc / a California Corporation"): body sentence renders `... in favor of Del Toro Loan Servicing Inc / a California Corporation ("Lender").` — no trailing `ddddads` duplicate.
2. **Individual lender**: body sentence renders `... in favor of First Middle Last ("Lender").` — no vesting, no leading blank.
3. Signature block at bottom renders once, exactly as today.
4. Investor Questionnaire still resolves first/middle/last for Individual lenders.
5. No other templates reference these aliases, so no collateral impact.

### File touched

- `supabase/functions/generate-document/index.ts` (lines 1365–1403 only)

