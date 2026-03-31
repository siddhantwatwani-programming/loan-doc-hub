

# Fix Origination Fee Currency Fields Not Populating in Document Generation

## Root Cause

The old **boolean** (checkbox) fields in `field_dictionary` have `canonical_key` values that collide with the legacy dot-notation keys used by `legacyKeyMap.ts` to route currency data to the new fields.

Example:
- Old boolean field `of_fe_lendersLoanOriginFee` has `canonical_key = 'origination_fees.801_lenders_loan_origination_fee_broker'`
- The legacyKeyMap maps `origination_fees.801_lenders_loan_origination_fee_broker` → `of_801_lenderLoanOriginationFee_broker` (new currency field)
- During save, `useDealFields.ts` builds an `idMap` where `resolveDbKeyToLegacy` maps the boolean field back to the same dot-notation key, causing `idMap['origination_fees.801_lenders_loan_origination_fee_broker']` to point to the **boolean UUID** instead of the **currency UUID**
- Result: currency values entered by users are persisted under the old boolean UUID, and the document engine cannot find them under the new currency keys

## Fix: Database Migration

Update `canonical_key` on 20 old boolean fields (10 broker + 10 others for HUD items 801–812) to append `_checkbox`, eliminating the collision. This allows the legacyKeyMap to correctly route currency data to the new field UUIDs.

Affected fields (20 total):

| Old Field Key | Current canonical_key (colliding) | New canonical_key |
|---|---|---|
| `of_fe_lendersLoanOriginFee` | `...fee_broker` | `...fee_broker_checkbox` |
| `of_fe_lendersLoanOriginFee3` | `...fee_others` | `...fee_others_checkbox` |
| `of_fe_lendersLoanDiscouFee` | `...fee_broker` | `...fee_broker_checkbox` |
| `of_fe_lendersLoanDiscouFee3` | `...fee_others` | `...fee_others_checkbox` |
| `of_fe_appraisaFeeBroker` | `...fee_broker` | `...fee_broker_checkbox` |
| `of_fe_appraisaFeeOthers` | `...fee_others` | `...fee_others_checkbox` |
| (same pattern for 804, 805, 808, 809, 810, 811, 812) | | |

SQL migration:
```sql
UPDATE field_dictionary 
SET canonical_key = canonical_key || '_checkbox'
WHERE field_key IN (
  'of_fe_lendersLoanOriginFee', 'of_fe_lendersLoanOriginFee3',
  'of_fe_lendersLoanDiscouFee', 'of_fe_lendersLoanDiscouFee3',
  'of_fe_appraisaFeeBroker', 'of_fe_appraisaFeeOthers',
  'of_fe_creditReportBroker', 'of_fe_creditReportOthers',
  'of_fe_lendersInspecFeeBroker', 'of_fe_lendersInspecFeeOthers',
  'of_fe_mortgageBrokerFeeBroker', 'of_fe_mortgageBrokerFeeOthers',
  'of_fe_taxServicFeeBroker', 'of_fe_taxServicFeeOthers',
  'of_fe_processiFeeBroker', 'of_fe_processiFeeOthers',
  'of_fe_underwriFeeBroker', 'of_fe_underwriFeeOthers',
  'of_fe_wireTransfFeeBroker', 'of_fe_wireTransfFeeOthers'
)
AND data_type = 'boolean';
```

Also update `legacyKeyMap.ts` to match — the boolean checkbox entries need their legacy keys updated to the `_checkbox` suffix so they continue to resolve correctly.

## What Will NOT Change
- No UI layout or component changes
- No edge function changes
- No document template changes
- No changes to document generation logic
- The boolean checkbox fields continue to work — only their `canonical_key` changes
- No new fields created; no fields deleted

