## Goal

Map CSR Property → Property Details → **Property Owner** to RE851D's `{{pr_p_ownerName_N}}` per-property tag.

## Source

- UI field: `FIELD_KEYS.propertyOwner` = `property1.property_owner` (`src/components/deal/PropertyDetailsForm.tsx`, popover already resolves to a borrower name string).
- Stored per-property under `property{N}.property_owner` in `deal_section_values`.

## Implementation

### 1. `supabase/functions/generate-document/index.ts` (per-property loop, ~line 945)

Extend the existing owner publisher to also read `property{N}.property_owner` (current canonical UI key) and publish a new alias `pr_p_ownerName_N`. The existing `pr_p_owner_N` is preserved for backward compatibility.

```ts
const ownerV =
  fieldValues.get(`${prefix}.property_owner`) ||
  fieldValues.get(`${prefix}.owner`) ||
  fieldValues.get(`${prefix}.vesting`);
if (ownerV?.rawValue) {
  if (!fieldValues.has(`pr_p_owner_${idx}`)) {
    fieldValues.set(`pr_p_owner_${idx}`, { rawValue: ownerV.rawValue, dataType: ownerV.dataType || "text" });
  }
  fieldValues.set(`pr_p_ownerName_${idx}`, { rawValue: ownerV.rawValue, dataType: "text" });
}
```

Per-index (no cross-property bleed) — runs inside existing `for (idx of sortedPropIndices)` loop.

### 2. Register `pr_p_ownerName_N` for `_N` template expansion

In the same file, add `"pr_p_ownerName_N"` to:
- The general RE851D `RE851D_INDEXED_TAGS` list (~line 2807, alongside `pr_p_owner_N`)
- `PART2_TAGS` (PROPERTY OWNER section appears in Part 2)

### 3. Field Dictionary entry (migration)

| label | field_key | data_type | section | is_repeatable |
|---|---|---|---|---|
| Property Owner | `pr_p_ownerName_N` | text | property | true |

## Out of scope

- No UI/form changes. The Property Owner picker already saves the resolved name string.
- No changes to `pr_p_owner_N` source publisher behavior.
- No other templates touched.
