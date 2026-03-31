

# Fix: Origination Fee Currency Fields Treated as Checkboxes in Document Generation

## Root Cause

A **data type collision** causes these fields to render as checkboxes (☐/☑) instead of currency values.

The chain of failure:
1. UI saves currency values (e.g., "$250.00") to **boolean-typed** field dictionary entries like `of_fe_interestForDaysOthers` (data_type = `boolean`) via `legacyKeyMap.ts`
2. During document generation, the `fieldValues` map stores this data with `dataType: "boolean"`
3. Template tag `{{of_901_int_o}}` resolves via `field_key_migrations` → `of_fe_interestForDaysOthers` → finds boolean data → checkbox rendering logic kicks in (line 637 of tag-parser.ts)
4. Currency-typed entries `of_901_int_o` (data_type = `currency`) exist in field_dictionary but are never populated because `legacyKeyMap` routes data to the old boolean keys

The previous fix (adding `_checkbox` suffix to `canonical_key` of boolean fields) was **never applied** — all 30 boolean fields still have their original canonical_keys.

## Fix (2 changes)

### Change 1: Update `legacyKeyMap.ts` — Route currency columns to currency-typed keys

Redirect the 30 `_broker` and `_others` entries for sections 900-1300 from old boolean keys to the new currency-typed keys.

Example change:
```
// Before:
'origination_fees.901_interest_for_days_broker': 'of_fe_interestForDaysBroker',
'origination_fees.901_interest_for_days_others': 'of_fe_interestForDaysOthers',

// After:
'origination_fees.901_interest_for_days_broker': 'of_901_int_b',
'origination_fees.901_interest_for_days_others': 'of_901_int_o',
```

All 30 mappings across 901-905, 1001-1004, 1101-1108, 1201-1202, 1302.

### Change 2: Database migration — Delete incorrect `field_key_migrations` rows

Delete the 30 migration rows that map template tags (e.g., `of_901_int_o`) to boolean fields (e.g., `of_fe_interestForDaysOthers`). After Change 1, the template tags will match the field_key directly in `fieldValues` with the correct `currency` data type — no migration bridge needed.

```sql
DELETE FROM field_key_migrations
WHERE old_key IN (
  'of_901_int_o','of_901_int_b','of_902_mi_o','of_902_mi_b',
  'of_903_hi_o','of_903_hi_b','of_904_tax_o','of_904_tax_b',
  'of_905_va_o','of_905_va_b','of_1001_hi_o','of_1001_hi_b',
  'of_1002_mi_o','of_1002_mi_b','of_1004_tax_o','of_1004_tax_b',
  'of_1101_set_o','of_1101_set_b','of_1105_doc_o','of_1105_doc_b',
  'of_1106_not_o','of_1106_not_b','of_1108_ti_o','of_1108_ti_b',
  'of_1201_rec_o','of_1201_rec_b','of_1202_ts_o','of_1202_ts_b',
  'of_1302_pest_o','of_1302_pest_b'
);
```

## Resolution Flow After Fix

1. UI saves `$250.00` → legacyKeyMap routes to `of_901_int_o` (currency field)
2. `deal_section_values` stores data under `of_901_int_o` field_dictionary entry (data_type = `currency`)
3. `fieldValues` map contains `of_901_int_o` → `{ rawValue: 250, dataType: "currency" }`
4. Template tag `{{of_901_int_o}}` → exact match in `fieldValues` → formatted as currency → `$250.00`

## Files Modified

| File | Change |
|---|---|
| `src/lib/legacyKeyMap.ts` | Update 30 broker/others mappings to currency-typed keys |
| Database migration | DELETE 30 incorrect `field_key_migrations` rows |

## What Will NOT Change
- No UI layout changes
- No template modifications
- No edge function changes
- No tag-parser or formatting changes
- Boolean checkbox fields continue to exist (their checkbox behavior in the template is still correct for the SDT/glyph-based checkbox rendering)
- All other origination fee columns (D, charge, APR, etc.) remain unchanged

