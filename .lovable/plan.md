
# Plan: Fix Missing Field Mappings for Assignment (WA) Document

## Problem Analysis

After investigating the database and code, I found that **all 10 fields exist in the field dictionary** but **2 fields are not mapped to the Assignment (WA) template**:

| Field Key | Status |
|-----------|--------|
| recording.mortgagePage | Mapped |
| recording.auditorsFileNumber | Mapped |
| recording.county | Mapped |
| **recording.state** | **NOT MAPPED** |
| **other.country** | **NOT MAPPED** |
| notary1.ackDay | Mapped |
| notary1.ackMonth | Mapped |
| notary1.ackYear | Mapped |
| notary2.authorizedPersonName | Mapped |
| notary2.ackDate | Mapped |

The missing mappings prevent these fields from appearing in the CSR data entry UI when the Assignment (WA) template is part of a deal's packet.

---

## Solution

### Step 1: Add Template Field Mappings

Add two entries to the `template_field_maps` table to link `recording.state` and `other.country` to the Assignment (WA) template:

```text
Template: Assignment (WA) (ID: 88d08d22-4dd2-47f6-bde3-2d2ed89d6dc2)

New mappings to add:
- recording.state (ID: 3294c774-bbbb-4d3f-bb5d-e7b3fc8c97d0)
- other.country (ID: b3666e8e-5df6-495c-b3da-949fd89de9e1)
```

### Step 2: No UI Changes Required

The existing system automatically handles field display:
- Fields in `template_field_maps` appear in the CSR "Other" tab
- The document generation engine already supports direct field_key matching
- No code modifications needed

---

## Technical Details

### Database Migration

A single SQL migration will add the two missing template field mappings:

```sql
INSERT INTO template_field_maps (template_id, field_dictionary_id, transform_rule, required_flag)
VALUES 
  ('88d08d22-4dd2-47f6-bde3-2d2ed89d6dc2', '3294c774-bbbb-4d3f-bb5d-e7b3fc8c97d0', NULL, false),
  ('88d08d22-4dd2-47f6-bde3-2d2ed89d6dc2', 'b3666e8e-5df6-495c-b3da-949fd89de9e1', NULL, false)
ON CONFLICT DO NOTHING;
```

---

## Expected Outcome

After this change:
1. The fields `recording.state` and `other.country` will appear in the CSR "Other" tab when Assignment (WA) is part of the deal's packet
2. CSRs can enter data for Recording State and Country
3. The document placeholders `{{recording.state}}` and `{{other.country}}` will populate correctly during document generation
4. No regression to other documents or functionality

---

## Files Changed

| File | Change |
|------|--------|
| Database Migration | Add 2 rows to `template_field_maps` |

No code file changes required.
