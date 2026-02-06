
# Document Generation Field Resolution Fix

## Problem Summary

When generating the "Authority to Receive Information" document, the following merge tags appear blank:
- `{{Lender.Name}}`
- `{{Borrower.Name}}`
- `{{Broker.Name}}`
- `{{Broker.Address}}`

## Root Cause Analysis

The document generation system has a field key mismatch between **template tags** and **stored data**:

| Template Tag | Field Dictionary Key | Stored Data Field Key | Status |
|--------------|---------------------|----------------------|--------|
| `{{Lender.Name}}` | `Lender.Name` (ID: 9c81c74c...) | `lender.full_name` (ID: 007066be...) | MISMATCH |
| `{{Borrower.Name}}` | `Borrower.Name` (ID: 8089c5fd...) | `borrower.full_name` (ID: 69d7cead...) | MISMATCH |
| `{{Broker.Name}}` | `Broker.Name` (ID: 344d868e...) | No data in broker section | NO DATA |
| `{{Broker.Address}}` | `Broker.Address` (ID: 5ba6924a...) | No data in broker section | NO DATA |

The edge function logs confirm this:
```text
[tag-parser] No data for Lender.Name (canonical: Lender.Name)
[tag-parser] No data for Borrower.Name (canonical: Borrower.Name)
[tag-parser] No data for Broker.Name (canonical: Broker.Name)
[tag-parser] No data for Broker.Address (canonical: Broker.Address)
```

## Solution

Add merge tag aliases to bridge the document template tags to the actual stored field keys. The system already supports this via the `merge_tag_aliases` table.

### Step 1: Add Merge Tag Aliases

Insert the following alias records into `merge_tag_aliases`:

| tag_name | field_key | tag_type | is_active |
|----------|-----------|----------|-----------|
| `Lender.Name` | `lender.full_name` | `merge_tag` | `true` |
| `Borrower.Name` | `borrower.full_name` | `merge_tag` | `true` |
| `Broker.Name` | `broker.full_name` | `merge_tag` | `true` |
| `Broker.Address` | `broker.address.street` | `merge_tag` | `true` |

This tells the document generation system:
- When it encounters `{{Lender.Name}}`, resolve it using the data stored under `lender.full_name`
- When it encounters `{{Borrower.Name}}`, resolve it using the data stored under `borrower.full_name`
- etc.

### Step 2: Ensure Broker Data is Entered

The broker section for this deal is empty. You will need to:
1. Navigate to the deal's "Broker" section
2. Enter the broker's name, address, and other required information
3. Save the draft

### Technical Implementation

**File to modify:** Database migration (no code changes required)

```sql
INSERT INTO merge_tag_aliases (tag_name, field_key, tag_type, is_active)
VALUES 
  ('Lender.Name', 'lender.full_name', 'merge_tag', true),
  ('Borrower.Name', 'borrower.full_name', 'merge_tag', true),
  ('Broker.Name', 'broker.full_name', 'merge_tag', true),
  ('Broker.Address', 'broker.address.street', 'merge_tag', true)
ON CONFLICT (tag_name) DO UPDATE SET
  field_key = EXCLUDED.field_key,
  is_active = true;
```

### Why This Works

The `generate-document` Edge Function's `resolveFieldKeyWithMap` function (in `field-resolver.ts`) already implements the priority order:

1. **Priority 1**: Explicit alias mapping (check `merge_tag_aliases` first)
2. **Priority 2**: Direct field_key match from field_dictionary
3. **Priority 3**: Case-insensitive fallback

By adding aliases, we redirect `{{Lender.Name}}` to look up data stored under `lender.full_name` instead of the non-existent `Lender.Name` field values.

### Current Data for This Deal

| Section | Field Key | Value |
|---------|-----------|-------|
| lender | `lender.full_name` | "David Samuel" |
| borrower | `borrower.full_name` | "Stephen Dafern" |
| broker | (empty) | No data entered |

After implementing this fix:
- `{{Lender.Name}}` will render as "David Samuel"
- `{{Borrower.Name}}` will render as "Stephen Dafern"
- `{{Broker.Name}}` and `{{Broker.Address}}` will render once broker data is entered
