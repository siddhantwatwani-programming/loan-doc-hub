
# Template Document Viewer with Tag-to-Field Mapping Inspector

## Overview

You want the ability to:
1. **See the template document** - View the actual content of the uploaded DOCX template
2. **Verify all mapped fields** - See which placeholders are in the document and what database fields they map to
3. **Edit mappings** - Modify existing mappings directly from the template view

## Current State Analysis

Currently, the system has:

| Feature | Status | Location |
|---------|--------|----------|
| Template metadata preview | Available | "View Metadata" menu option |
| DOCX tag validation | Available | "Validate DOCX Tags" menu option |
| Database mapping check | Available | "Validate Mapping" menu option |
| **Document content preview** | **Missing** | Not implemented |
| **Unified tag-to-DB mapping view** | **Missing** | Data exists but scattered |
| **Inline mapping editor** | **Missing** | Must go to Tag Mapping page |

The "Validate DOCX Tags" dialog already shows:
- All tags found in the document (e.g., `{{Borrower_Name}}`, `«Loan_Amount»`)
- The `field_key` each tag maps to via `merge_tag_aliases`
- Unmapped tags with suggestions

But it **does not** show:
- How the `field_key` connects to the actual database column
- The data type, section, and label from `field_dictionary`
- An editable view of existing mappings

## Proposed Solution

### New Feature: "View Template Document" Dialog

A comprehensive dialog that shows:

```text
+------------------------------------------------------------------+
|  Template Document: Lender Disclosures v1                         |
+------------------------------------------------------------------+
| [Document Preview] [Tag Mappings] [Edit Mappings]                 |
+------------------------------------------------------------------+
|                                                                   |
|  DOCUMENT PREVIEW TAB                                             |
|  ─────────────────────────────────────────────────────────────    |
|  Shows extracted text content from the DOCX with placeholders     |
|  highlighted:                                                     |
|                                                                   |
|  "This Deed of Trust is made on [«Note_Date»] between            |
|   [«Borrower_Name»], hereinafter called BORROWER, and             |
|   [«Lender_Name»], hereinafter called LENDER..."                  |
|                                                                   |
|  Click any highlighted tag to see its mapping details             |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|  TAG MAPPINGS TAB                                                 |
|  ─────────────────────────────────────────────────────────────    |
|  Document Tag          Alias Mapping      Database Field          |
|  ─────────────         ─────────────      ──────────────          |
|  «Note_Date»     →     Terms.NoteDate  →  field_dictionary:       |
|                                           - field_key: Terms.NoteDate
|                                           - data_type: date        |
|                                           - section: loan_terms    |
|                                           - label: "Note Date"     |
|                                                                   |
|  {{Borrower_Name}} →   Borrower.Name  →  field_dictionary:        |
|                                           - field_key: Borrower.Name
|                                           - data_type: text        |
|                                           - section: borrower      |
|                                           - label: "Borrower Name" |
|                                                                   |
+------------------------------------------------------------------+
|                                                                   |
|  EDIT MAPPINGS TAB                                                |
|  ─────────────────────────────────────────────────────────────    |
|  Inline editing for existing tag aliases:                         |
|                                                                   |
|  Tag: «Note_Date»                                                 |
|  Current Field Key: [Terms.NoteDate      ▾]                       |
|  Tag Type: [merge_tag ▾]                                          |
|  Active: [✓]                        [Save] [Delete]               |
|                                                                   |
+------------------------------------------------------------------+
```

### Implementation Plan

#### Phase 1: Create Template Document Viewer Dialog

**New Component**: `src/components/admin/TemplateDocumentViewerDialog.tsx`

This dialog will have 3 tabs:

**Tab 1: Document Preview**
- Extract text content from the DOCX using the existing `validate-template` edge function
- Display the document text with merge tags highlighted
- Clickable tags that show a tooltip with mapping info

**Tab 2: Tag Mappings (Complete Chain)**
- For each tag found in the document, show the complete mapping chain:
  ```
  Document Tag → merge_tag_aliases entry → field_dictionary entry
  ```
- Display all relevant metadata from both tables:
  - `merge_tag_aliases`: tag_name, field_key, tag_type, is_active
  - `field_dictionary`: field_key, label, data_type, section, description

**Tab 3: Edit Mappings**
- Inline editing of `merge_tag_aliases` entries for tags in this template
- Add new mappings for unmapped tags
- Delete incorrect mappings
- Changes save directly to database

#### Phase 2: Enhance validate-template Edge Function

Modify the edge function to optionally return:
- Raw extracted text content (for document preview)
- Full field dictionary info for each mapped tag

**Updated Response Structure**:
```typescript
interface EnhancedValidationResult {
  // Existing fields
  valid: boolean;
  mappedTags: FoundTag[];
  unmappedTags: FoundTag[];
  // New fields
  documentText?: string;         // Extracted text content
  fieldDictionaryInfo?: Map<string, {
    id: string;
    field_key: string;
    label: string;
    data_type: string;
    section: string;
    description: string | null;
  }>;
}
```

#### Phase 3: Add Menu Option

Add "View Document" option to the template actions dropdown:

```typescript
<DropdownMenuItem onClick={() => handleViewDocument(template)}>
  <FileSearch className="h-4 w-4 mr-2" />
  View Document & Mappings
</DropdownMenuItem>
```

### Technical Details

#### Data Flow

```text
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    DOCX File    │────>│  validate-template│────>│   UI Dialog      │
│  (storage)      │     │  (edge function)  │     │                  │
└─────────────────┘     └──────────────────┘     └──────────────────┘
         │                       │                        │
         │                       │                        ▼
         │               ┌───────▼───────┐       ┌──────────────────┐
         │               │ merge_tag_    │       │ Display:         │
         │               │ aliases       │       │ - Document text  │
         │               │ (get mappings)│       │ - All tags found │
         │               └───────┬───────┘       │ - Full mapping   │
         │                       │               │   chain          │
         │               ┌───────▼───────┐       │ - Edit controls  │
         │               │ field_        │       └──────────────────┘
         │               │ dictionary    │
         │               │ (get metadata)│
         │               └───────────────┘
```

#### Mapping Chain Display

For each tag, display the complete resolution chain:

| Document Tag | Alias Entry | Field Dictionary |
|--------------|-------------|------------------|
| `«Borrower_SSN»` | `tag_name: Borrower_SSN` → `field_key: borrower.ssn` | `field_key: borrower.ssn`, `label: SSN`, `data_type: text`, `section: borrower` |
| `{{Loan_Amount\|currency}}` | `tag_name: Loan_Amount` → `field_key: Terms.LoanAmount` | `field_key: Terms.LoanAmount`, `label: Loan Amount`, `data_type: currency`, `section: loan_terms` |

#### Edit Capabilities

The edit tab will allow:

1. **Modify existing mappings**:
   - Change the `field_key` (with autocomplete from field_dictionary)
   - Toggle `is_active` status
   - Change `tag_type` (merge_tag, f_code, label)

2. **Create new mappings**:
   - For unmapped tags, directly create entries in `merge_tag_aliases`

3. **Delete mappings**:
   - Remove incorrect entries from `merge_tag_aliases`

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/admin/TemplateDocumentViewerDialog.tsx` | Create | New comprehensive dialog component |
| `supabase/functions/validate-template/index.ts` | Modify | Add `includeDocumentText` and `includeFieldDictionary` options |
| `src/pages/admin/TemplateManagementPage.tsx` | Modify | Add new menu option and state for dialog |

### User Workflow

1. Navigate to **Admin > Templates**
2. Click action menu on any template
3. Select **"View Document & Mappings"**
4. Dialog opens with 3 tabs:
   - **Document Preview**: See the actual template text with highlighted tags
   - **Tag Mappings**: See complete mapping chain (tag → alias → dictionary)
   - **Edit Mappings**: Modify, add, or delete mappings inline
5. Click any highlighted tag in preview to jump to its mapping details
6. Edit mappings as needed - changes save to database
7. Click "Refresh" to re-parse the document after making changes

### Summary

This enhancement provides:

- **Document visibility**: See the actual DOCX content with placeholders highlighted
- **Complete mapping transparency**: View the full chain from document tag → merge_tag_aliases → field_dictionary
- **Inline editing**: Modify mappings without leaving the template view
- **Verification capability**: Confirm all required fields are properly mapped before generating documents
