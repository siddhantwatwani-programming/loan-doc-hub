

# Plan: Verify Notary Acknowledgment Date Fields Visibility

## Current State Analysis

After thorough investigation, I found that the notary acknowledgment date fields are **properly configured** in the system:

### Field Dictionary Status
| Field Key | Label | Data Type | Section |
|-----------|-------|-----------|---------|
| `notary1.ackDay` | Acknowledgment Day (Ack 1) | integer | other |
| `notary1.ackMonth` | Acknowledgment Month (Ack 1) | text | other |
| `notary1.ackYear` | Acknowledgment Year (Ack 1) | integer | other |

### Template Mapping Status
All three fields are **correctly mapped** to the Assignment (WA) template (ID: `88d08d22-4dd2-47f6-bde3-2d2ed89d6dc2`):
- `notary1.ackDay` - Mapped, not required
- `notary1.ackMonth` - Mapped, not required  
- `notary1.ackYear` - Mapped, not required

### Current Deal Status
The deal `DL-2026-0076` has **no packet assigned** (`packet_id: null`). When no packet is assigned:
- The system loads ALL 194 fields from the "other" section
- Fields appear in the "Other" tab in alphabetical order by label
- Users must scroll to find the notary acknowledgment fields

---

## Root Cause

The placeholders `{{notary1.ackDay}}`, `{{notary1.ackMonth}}`, `{{notary1.ackYear}}` are not populating because:

1. **No data has been entered** for these fields in the deal
2. The fields ARE visible in the UI (in the "Other" tab)
3. With 194 fields in the "other" section, they may be difficult to find

---

## Resolution

**No code changes are required.** The system is working correctly.

### To enable document population:

1. Navigate to **Deals → DL-2026-0076 → Enter Deal Data**
2. Click the **"Other"** tab
3. Scroll to find the acknowledgment fields (alphabetically sorted):
   - Acknowledgment Day (Ack 1)
   - Acknowledgment Month (Ack 1)  
   - Acknowledgment Year (Ack 1)
4. Enter values for Day (1-31), Month (e.g., "January"), and Year (e.g., 2026)
5. Click **Save Draft**

Alternatively, assign a packet containing the Assignment (WA) template to the deal. This will filter the "Other" tab to show only the 40+ fields mapped to that template, making the notary fields easier to find.

---

## Verification Steps

To confirm the fields are working:

1. Enter test data for the three notary fields
2. Generate the Assignment (WA) document
3. Verify the placeholders are replaced with the entered values

---

## Optional Future Enhancement

If field discoverability remains an issue, consider:
- Adding a search/filter function to the "Other" tab
- Grouping related notary fields together with a section header
- Marking these fields as required on the template mapping

---

## Summary

| Aspect | Status |
|--------|--------|
| Fields exist in dictionary | ✓ Complete |
| Fields mapped to template | ✓ Complete |
| Fields visible in UI | ✓ Complete |
| Data entered by user | ✗ Pending user action |

**No code or database changes needed.** The user needs to enter data for these fields in the "Other" tab.

