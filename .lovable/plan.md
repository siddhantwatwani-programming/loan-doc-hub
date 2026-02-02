
# Investigation Summary: Missing Field Population in Collateral Assignment of Deed of Trust

## Problem Analysis

After thorough investigation of the document generation flow, I've identified the root causes for the missing field population issues.

---

## Key Findings

### 1. Template Field Maps Missing
The "Collateral Assignment of Deed of Trust" template (ID: `83f568d3-db76-4671-b188-538806b3deba`) has **zero entries** in the `template_field_maps` table. While the system can still resolve fields directly from the field dictionary, this means:
- No explicit transform rules are defined for this template
- Fields won't appear in the CSR form as "required" 
- Date and currency formatting relies on default behavior

### 2. Fields with NO DATA in Database
These fields exist in the field dictionary but have **no values stored** for deal `DL-2026-0072`:
- `lender.vesting`
- `borrower.vesting` 
- `property1.address`
- `notary2.ackDate`
- `notary.appearing_party_names`
- `notary2.representedEntityName`

**Root Cause**: The form likely isn't capturing or saving data for these specific field_keys.

### 3. Fields with DATA but Not Populating
These fields have data stored but still don't appear in the document:
- `other.country` (has value "india")
- `notary.name` (has value "Adwait")

**Root Cause**: The document template placeholders (e.g., `{{country}}` or `«country»`) don't match the canonical field_key format (`other.country`). The system needs:
1. Merge tag aliases to map template tags to field_keys, OR
2. Document placeholders updated to use exact field_key names

### 4. Formatting Issues
- `other.date` - Date stored in ISO format needs `date_mmddyyyy` or `date_long` transform
- `lender.current.name` - No transform rule defined for proper formatting

---

## Required Fixes

### Fix 1: Add Missing Merge Tag Aliases
Create aliases in `merge_tag_aliases` table to map document placeholders to field_keys:

| Tag in Document | Field Key | Tag Type |
|-----------------|-----------|----------|
| `country` | `other.country` | merge_tag |
| `notary_name` | `notary.name` | merge_tag |
| `lender_vesting` | `lender.vesting` | merge_tag |
| `borrower_vesting` | `borrower.vesting` | merge_tag |
| `property_address` | `property1.address` | merge_tag |
| `notary2_ackDate` | `notary2.ackDate` | merge_tag |
| `appearing_party_names` | `notary.appearing_party_names` | merge_tag |
| `representedEntityName` | `notary2.representedEntityName` | merge_tag |

### Fix 2: Add Template Field Maps with Transform Rules
Create entries in `template_field_maps` for the Collateral Assignment template to define proper formatting:

| Field Key | Transform Rule |
|-----------|---------------|
| `other.date` | `date_long` or `date_mmddyyyy` |
| `lender.current.name` | `titlecase` |
| `notary2.ackDate` | `date_long` |
| `recording.date` | `date_mmddyyyy` |
| `deed_of_trust.recording_date` | `date_mmddyyyy` |

### Fix 3: Ensure CSR Forms Capture All Fields
Verify that the CSR data entry forms include input fields for:
- `lender.vesting` (in Lender section)
- `borrower.vesting` (in Borrower section)
- `property1.address` (in Property section)
- `notary.appearing_party_names` (in Other/Notary section)
- `notary2.ackDate` (in Other/Notary section)
- `notary2.representedEntityName` (in Other/Notary section)

---

## Technical Implementation Steps

### Step 1: Validate Template Tags
Run the `validate-template` edge function on the Collateral Assignment template to get the exact list of placeholder tags used in the document. This will reveal:
- What tags are in the document
- Which are mapped vs unmapped
- Suggested field_key matches

### Step 2: Create Database Inserts
Insert merge_tag_aliases for any unmapped tags identified in Step 1.

### Step 3: Create Template Field Maps
Insert template_field_maps entries linking the template to field_dictionary entries with appropriate transform rules.

### Step 4: Verify Form Field Coverage
Ensure the CSR form components include all required fields and properly save to the correct field_dictionary_ids.

---

## Files to Modify

1. **Database (via SQL migration)**
   - Insert into `merge_tag_aliases` for missing tag-to-field mappings
   - Insert into `template_field_maps` for transform rules

2. **Edge Function (if needed)**
   - `supabase/functions/generate-document/index.ts` - No changes needed, existing logic is correct
   - `supabase/functions/_shared/tag-parser.ts` - No changes needed

3. **CSR Form Components (if fields missing)**
   - Verify field definitions in relevant form components under `src/components/deal/`

---

## Next Steps

1. Run `validate-template` on the Collateral Assignment template to get the exact tag list
2. Compare document tags against field_dictionary entries
3. Create the necessary merge_tag_aliases
4. Add template_field_maps with transform rules
5. Test document generation to verify all fields populate correctly
