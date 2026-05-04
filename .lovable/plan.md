## Root cause

The broker license value is stored on the broker contact at `contact_data.License` (capital "L") = `"4455"`. The generator's force-set publisher (line 631) reads this correctly. However, the upstream `deal_section_values` loader pre-populates `bk_p_brokerLicens` with `rawValue: null` because `field_dictionary.bk_p_brokerLicens.data_type = 'number'` and `extractRawValueFromJsonb` returns `data.value_number ?? data.value_text ?? null` — when the license is stored as text only, `value_number` is null and the section value (if any) wins. The current `forceSet` helper at line 373 short-circuits if `value` is empty, but the bigger issue is the auto-compute block at line 1911 only fills when `!existingLicense.rawValue` — which works — but the participant force-set at line 631 ONLY fires when `license` is truthy. With the existing pipeline, the value should flow, but the field_dictionary's `data_type: number` causes the merge-tag formatter to render `NaN`/blank when source happens to be a non-numeric string.

## Fix (single file: `supabase/functions/generate-document/index.ts`)

Make the broker-license publisher robust regardless of dictionary data_type:

1. **Line 631 area** — keep `forceSet("bk_p_brokerLicens", String(license))` as-is. Already `dataType: "text"` via `forceSet`.

2. **Line 1911–1922 (auto-compute block)** — Replace with a hardened version:
   - Treat `null`/`undefined`/empty-string as "missing" (not just falsy)
   - Add `bk_p_license` as an additional fallback source
   - Always publish `dataType: "text"` (never `number`) so the formatter renders the literal string

```ts
{
  const existingLicense = fieldValues.get("bk_p_brokerLicens");
  const license =
    fieldValues.get("broker1.License")?.rawValue
    || fieldValues.get("broker1.license_number")?.rawValue
    || fieldValues.get("broker.License")?.rawValue
    || fieldValues.get("broker.license_number")?.rawValue
    || fieldValues.get("bk_p_license")?.rawValue;
  const existingHasValue = existingLicense?.rawValue !== undefined
    && existingLicense?.rawValue !== null
    && String(existingLicense?.rawValue ?? "").trim() !== "";
  if (!existingHasValue && license !== undefined && license !== null && String(license).trim() !== "") {
    fieldValues.set("bk_p_brokerLicens", { rawValue: String(license), dataType: "text" });
  }
}
```

The existing dataType-override loop at line 677–685 already coerces any `bk_p_brokerLicens` to `dataType: "text"` (matches `brokerlicens` substring), so number-formatting is already prevented downstream — but explicitly setting `dataType: "text"` here adds a second guard and matches the `forceSet` path.

## Out of scope

- No UI/schema changes
- No dictionary changes (would require admin migration; not requested)
- No template changes
- No other broker fields touched
