

# Create 8 New Field Dictionary Entries for Other Origination

## Summary
Insert 8 new rows into `field_dictionary` under section `origination_fees` with the specified keys, types, and labels. No code changes needed — only a database migration.

## Database Migration

A single SQL `INSERT` into `field_dictionary` with these rows:

| field_key | label | section | data_type | form_type |
|---|---|---|---|---|
| of_int_days | Interest Days | origination_fees | number | fees |
| of_int_pd | Interest Per Day | origination_fees | currency | fees |
| of_haz_mon | Hazard Insurance Months | origination_fees | number | fees |
| of_haz_amt | Hazard Insurance Monthly Amount | origination_fees | currency | fees |
| of_mi_mon | Mortgage Insurance Months | origination_fees | number | fees |
| of_mi_amt | Mortgage Insurance Monthly Amount | origination_fees | currency | fees |
| of_tax_mon | Property Taxes Months | origination_fees | number | fees |
| of_tax_amt | Property Taxes Monthly Amount | origination_fees | currency | fees |

All fields will have `is_required = false`, `is_calculated = false`, and standard defaults. No UI, API, or schema changes required.

