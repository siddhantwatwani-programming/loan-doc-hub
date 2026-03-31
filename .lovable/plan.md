

# Fix Template Placeholders Not Populating in Document Generation

## Root Cause

Three distinct resolution gaps prevent template tags from finding their stored values:

### 1. Origination Fee 900-1300 Series (30 fields)
Template tags like `{{of_901_int_o}}` resolve to `of_901_int_o` (exists in field_dictionary). But the actual data is stored under the **old** field_key `of_fe_interestForDaysOthers` (also in field_dictionary). The `fieldValues` map is keyed by the old field_key. There is no bridge between them.

### 2. Broker Fields (5 fields)
- `bk_p_brokerRepres`, `bk_p_brokerAddres` — stored via deal_section_values under broker section, so they SHOULD be in fieldValues already. But the participant injection force-overrides broker keys, and these specific keys are not in the force-set list. If no data was entered in the deal's broker form, these remain empty.
- `bk_p_license` — exists in field_dictionary but the participant injection sets `bk_p_brokerLicens` (different key). `bk_p_license` is never populated.

### 3. Lien Fields (5 fields)
- `pr_li_lienPrioriNow`, `pr_li_lienPrioriAfter` — lien bridging maps `lien_priority_now` → `li_gd_lienPriorityNow`, NOT to `pr_li_lienPrioriNow`.
- `li_bp_balanceAfter` — lien bridging maps `balance_after` → `pr_li_lienCurrenBalanc2`, NOT to `li_bp_balanceAfter`.
- `pr_li_lienCurrenBalanc2` — already bridged correctly (should work).
- `pr_li_lienHolder` — already bridged correctly (should work).

## Fix

### Change 1: Add `field_key_migrations` entries (database migration)

Insert migration records mapping each new short template tag to the old `of_fe_*` field_key. This uses the existing Priority 2 resolution path in `resolveFieldKeyWithBackwardCompat` and Priority 3 in `getFieldData`.

30 rows for origination fees:
| old_key (template tag) | new_key (stored field_key) |
|---|---|
| `of_901_int_o` | `of_fe_interestForDaysOthers` |
| `of_901_int_b` | `of_fe_interestForDaysBroker` |
| `of_902_mi_o` | `of_fe_mortgageInsuraPremiuOthers` |
| `of_902_mi_b` | `of_fe_mortgageInsuraPremiuBroker` |
| `of_903_hi_o` | `of_fe_hazardInsuraPremiuOthers` |
| `of_903_hi_b` | `of_fe_hazardInsuraPremiuBroker` |
| `of_904_tax_o` | `of_fe_countyProperTaxesOthers` |
| `of_904_tax_b` | `of_fe_countyProperTaxesBroker` |
| `of_905_va_o` | `of_fe_vaFundinFeeOthers` |
| `of_905_va_b` | `of_fe_vaFundinFeeBroker` |
| `of_1001_hi_o` | `of_fe_hazardInsuraOthers` |
| `of_1001_hi_b` | `of_fe_hazardInsuraBroker` |
| `of_1002_mi_o` | `of_fe_mortgageInsuraOthers` |
| `of_1002_mi_b` | `of_fe_mortgageInsuraBroker` |
| `of_1004_tax_o` | `of_fe_coProperTaxesOthers` |
| `of_1004_tax_b` | `of_fe_coProperTaxesBroker` |
| `of_1101_set_o` | `of_fe_settlemeFeeOthers` |
| `of_1101_set_b` | `of_fe_settlemeFeeBroker` |
| `of_1105_doc_o` | `of_fe_docPreparFeeOthers` |
| `of_1105_doc_b` | `of_fe_docPreparFeeBroker` |
| `of_1106_not_o` | `of_fe_notaryFeeOthers` |
| `of_1106_not_b` | `of_fe_notaryFeeBroker` |
| `of_1108_ti_o` | `of_fe_titleInsuraOthers` |
| `of_1108_ti_b` | `of_fe_titleInsuraBroker` |
| `of_1201_rec_o` | `of_fe_recordinFeesOthers` |
| `of_1201_rec_b` | `of_fe_recordinFeesBroker` |
| `of_1202_ts_o` | `of_fe_citycounTaxStampsOthers` |
| `of_1202_ts_b` | `of_fe_citycounTaxStampsBroker` |
| `of_1302_pest_o` | `of_fe_pestInspecOthers` |
| `of_1302_pest_b` | `of_fe_pestInspecBroker` |

All with `status = 'migrated'`.

### Change 2: Add lien field bridging (generate-document/index.ts)

In the lien bridging block (~line 962-976), add three missing mappings to `lienFieldToLiKeys`:
- `"lien_priority_now": "pr_li_lienPrioriNow"` — add second bridge
- `"lien_priority_after": "pr_li_lienPrioriAfter"` — add second bridge  
- `"balance_after": "li_bp_balanceAfter"` — add second bridge

These are in addition to the existing mappings (not replacing them). After the existing bridging loop that sets `li_gd_*` keys, add a second pass that also sets the `pr_li_*` / `li_bp_*` variants.

### Change 3: Add broker field bridging (generate-document/index.ts)

In the broker participant injection block (~line 506-541), add:
```typescript
if (cd["address.street"]) forceSet("bk_p_brokerAddres", cd["address.street"]);
if (cd.broker_representative || cd.representative) forceSet("bk_p_brokerRepres", cd.broker_representative || cd.representative);
if (license) forceSet("bk_p_license", String(license));
```

## Files Modified

| File | Change |
|---|---|
| Database migration | INSERT 30 `field_key_migrations` rows |
| `supabase/functions/generate-document/index.ts` | Add lien bridging for 3 keys, broker injection for 3 keys |

## What Will NOT Change
- No UI layout or component changes
- No field dictionary schema changes
- No template modifications
- No changes to tag-parser, field-resolver, or docx-processor
- No changes to legacyKeyMap.ts
- Existing document generation logic preserved

