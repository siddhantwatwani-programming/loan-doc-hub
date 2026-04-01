

# HUD-1/RE885 Column Totals: Paid to Others, Paid to Broker, Grand Total

## Summary
Add 3 calculated total fields to the document generation engine that sum all "Paid to Others" and "Paid to Broker" currency columns across HUD lines 800–1300, then compute a grand total.

## Changes

### 1. Database: Insert 3 field_dictionary entries
Insert into `field_dictionary` with section `origination_fees`, data_type `currency`, `is_calculated: true`:

| field_key | label | canonical_key |
|---|---|---|
| `of_tot_oth` | Total Paid to Others | `of_tot_oth` |
| `of_tot_brk` | Total Paid to Broker | `of_tot_brk` |
| `of_tot_all` | Grand Total | `of_tot_all` |

### 2. Edge Function: Auto-compute totals during document generation
In `supabase/functions/generate-document/index.ts`, add a new auto-compute block (alongside existing auto-computed fields like `pr_p_address`, `all_properties_list`, etc.) that:

1. Defines two arrays of canonical field keys — one for all `_others`/`_o` suffixed keys, one for all `_broker`/`_b` suffixed keys (covering lines 801–812, 900–905, 1000–1004, 1100–1108, 1200–1202, 1301–1302, plus 1300 custom items 1–8)
2. Iterates the `fieldValues` map, summing numeric values for each column
3. Sets `of_tot_oth`, `of_tot_brk`, and `of_tot_all` in the fieldValues map with formatted currency strings (2 decimal places)

**Contributing field keys** (extracted from legacyKeyMap):

Others column (~30 keys): `of_801_lenderLoanOriginationFee_others`, `of_802_lenderLoanDiscountFee_others`, `of_803_appraisalFee_others`, `of_804_creditReportFee_others`, `of_805_lenderInspectionFee_others`, `of_808_mortgageBrokerCommissionFee_others`, `of_809_taxServiceFee_others`, `of_810_processingFee_others`, `of_811_underwritingFee_others`, `of_812_wireTransferFee_others`, `of_fe_900CustomItemOthers`, `of_901_int_o`, `of_902_mi_o`, `of_903_hi_o`, `of_904_tax_o`, `of_905_va_o`, `of_fe_1000CustomItemOthers`, `of_1001_hi_o`, `of_1002_mi_o`, `of_1004_tax_o`, `of_fe_1100CustomItemOthers`, `of_1101_set_o`, `of_1105_doc_o`, `of_1106_not_o`, `of_1108_ti_o`, `of_fe_1200CustomItemOthers`, `of_1201_rec_o`, `of_1202_ts_o`, `of_fe_1301Others`, `of_1302_pest_o`, `of_fe_1300CustomItem13` through `of_fe_1300CustomItem83` (8 rows)

Broker column (~30 keys): Same pattern with `_broker`/`_b` suffixes.

### 3. Merge tag aliases (optional)
If document templates use merge tags like `{{of_tot_oth}}`, no aliases needed since the field keys match directly. If legacy templates use different tag names, aliases can be added later.

## What Will NOT Change
- No UI layout changes
- No changes to existing form components
- No changes to existing field keys or mappings
- No changes to the calculation engine (`src/lib/calculationEngine.ts`)
- No changes to `legacyKeyMap.ts`

