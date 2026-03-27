

## Problem Analysis

### Root Cause: Field Dictionary Batch Fetch Failure

The edge function logs show repeated `TypeError: error sending request` errors when fetching field_dictionary entries. The current batch size of 500 UUIDs creates an HTTP URL that is approximately 18,000+ characters long (500 UUIDs x ~37 chars each), exceeding the practical URL length limit for Supabase REST API requests.

**Why Borrower Name and Property Address still populate**: These values are injected from the `deal_participants` → `contacts` table lookup (lines 257-463 of index.ts), which doesn't depend on the field_dictionary fetch. All other values from `deal_section_values` (loan number, property details, etc.) fail because the field dictionary ID-to-key mapping can't be built.

### Secondary Issue: Multi-Property Population

Property data stored with `property1::` and `property2::` composite keys needs to populate indexed keys (`property1.street`, `property2.street` etc.) for multi-property auto-computation. Currently, property1 fields without `indexed_key` resolve only to bare `pr_p_*` keys, not to `property1.*` format needed for multi-property templates.

### ln_p_loanNumber

The loan number value ("745") IS stored correctly in the database. The field dictionary entry exists. The failure is solely due to the batch fetch network error preventing resolution.

---

## Plan

### Step 1: Reduce Batch Size to Fix Network Errors

**File**: `supabase/functions/generate-document/index.ts`

Change `FD_BATCH_SIZE` from 500 to **100**. This reduces the URL length from ~18,500 chars to ~3,700 chars, well within limits. The tradeoff is more HTTP requests (9 instead of 2 for 853 fields), but each request will succeed reliably.

```
Line ~195: const FD_BATCH_SIZE = 100;
```

### Step 2: Bridge Property Data to Indexed Keys

**File**: `supabase/functions/generate-document/index.ts`

After field values are built from deal_section_values (around line 253), add bridging logic: when a field resolves to `pr_p_*` (bare property key) AND the composite key started with `propertyN::`, also set `propertyN.fieldname` so the existing auto-compute for `Property1.Address`, `Property2.Address` etc. works correctly.

This is done by:
1. During the field_values population loop, if the composite key is `propertyN::uuid` and there's no `indexed_key`, also set `propertyN.{mapped_suffix}` alongside the `pr_p_*` key
2. Add a property field key mapping (`pr_p_street` → `street`, `pr_p_city` → `city`, etc.) used during this bridging

### Step 3: Multi-Property All-Properties Merge Tag

**File**: `supabase/functions/generate-document/index.ts`

After the existing per-property auto-compute (lines 515-545), add logic to build an `all_properties` composite value. If multiple property indices exist, concatenate them:
```
Property 1: [Address, City, State, Zip]
Property 2: [Address, City, State, Zip]
```
Set this as `all_properties_list` field value for templates that use `{{all_properties_list}}`.

---

## Technical Details

### Batch Size Calculation
- 100 UUIDs × 37 chars = 3,700 chars for IDs
- Plus URL base (~200 chars) and column selectors (~80 chars)
- Total ~4,000 chars — safely within limits

### Property Field Bridging Map
```typescript
const prPrefixToSuffix: Record<string, string> = {
  'pr_p_street': 'street',
  'pr_p_city': 'city',
  'pr_p_state': 'state',
  'pr_p_zip': 'zip',
  'pr_p_county': 'county',
  'pr_p_address': 'address',
  // ... other pr_p_ fields
};
```

### Files Changed
1. `supabase/functions/generate-document/index.ts` — batch size reduction, property bridging, multi-property composite

### No Changes To
- Database schema
- Frontend code
- Template files
- Other edge functions
- Formatting/layout logic

