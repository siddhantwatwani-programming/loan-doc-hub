
# Enhancement Plan: Direct Mapping Creation from Template Validation

## Overview
Enhance the "Validate DOCX Tags" dialog to allow admins to directly create mappings for unmapped tags without leaving the validation interface.

## Current Gap Analysis

The `TemplateValidationDialog` component already has an `onCreateMapping` prop defined:
```typescript
onCreateMapping?: (tagName: string, fieldKey: string) => void;
```

However, in `TemplateManagementPage.tsx`, this callback is not being passed or implemented when rendering the dialog.

## Proposed Solution

### 1. Connect the onCreateMapping Callback

**File**: `src/pages/admin/TemplateManagementPage.tsx`

Add a handler function that:
- Creates a new mapping in `merge_tag_aliases` table
- Re-validates the template after mapping is created
- Shows success/error feedback

```typescript
const handleCreateMappingFromValidation = async (tagName: string, fieldKey: string) => {
  try {
    // Determine tag type based on pattern
    const tagType = tagName.match(/^F\d{4,}$/) ? 'f_code' : 'merge_tag';
    
    await supabase.from('merge_tag_aliases').insert({
      tag_name: tagName,
      field_key: fieldKey,
      tag_type: tagType,
      is_active: true,
    });
    
    toast.success(`Created mapping: ${tagName} → ${fieldKey}`);
    
    // Re-run validation to update results
    if (docxValidationTemplateName) {
      // Trigger re-validation
    }
  } catch (error) {
    toast.error('Failed to create mapping');
  }
};
```

### 2. Enhance the Validation Dialog UI

**File**: `src/components/admin/TemplateValidationDialog.tsx`

Current unmapped tag display shows suggestion buttons that call `onCreateMapping`. Enhance this to:
- Add visual feedback when a mapping is created (loading state, success indicator)
- Add ability to enter a custom field key if suggestions don't match
- Add a "Map All Suggestions" button for bulk operations
- Show the newly mapped tag move from "Unmapped" to "Mapped" tab

**New UI Elements in Unmapped Tab**:
```text
┌─────────────────────────────────────────────────────────────┐
│ ✗ Borrower_SSN                           [Merge Tag]       │
│   Suggestions:                                              │
│   [borrower.ssn] [borrower.tax_id] [+ Custom]              │
│                                                             │
│   Or enter custom field key:                                │
│   [________________________] [Create Mapping]               │
└─────────────────────────────────────────────────────────────┘
```

### 3. Add Re-Validation After Mapping

After creating a mapping:
1. Show success toast
2. Automatically re-fetch validation results
3. The newly mapped tag should move to the "Mapped" tab
4. Update the summary counts

### 4. Add "Refresh Validation" Button

Add a refresh button in the dialog header that allows re-running validation after making changes in a separate tab/window (e.g., if admin went to Tag Mapping page).

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/TemplateManagementPage.tsx` | Add `handleCreateMappingFromValidation` function and pass it to dialog |
| `src/components/admin/TemplateValidationDialog.tsx` | Add custom field key input, loading states, refresh button |

### Database Operations
- **Insert**: New row in `merge_tag_aliases` when creating mapping
- **Query**: Re-call `validate-template` edge function after changes

### State Management
- Track `isCreatingMapping` loading state
- Track `lastCreatedMapping` for success feedback
- Store current `templateId` to enable re-validation

## User Workflow After Enhancement

1. **Upload Template** → Navigate to Admin > Templates
2. **Click "Validate DOCX Tags"** on template row
3. **View Summary** → See mapped/unmapped counts
4. **Go to Unmapped Tab** → See list of unmapped tags with suggestions
5. **Click Suggestion Button** → Creates mapping instantly, shows success
6. **Or Enter Custom Key** → Type field key, click "Create Mapping"
7. **Click Refresh** → Validation re-runs, tag moves to "Mapped" tab
8. **Repeat** until all tags mapped

## Alternative: Direct Editing Mode

As an alternative enhancement, add an "Edit Mappings" toggle that converts the validation view into an inline editing interface where all tags (mapped and unmapped) can be edited directly.

## Implementation Priority

1. **Phase A** (Essential): Connect `onCreateMapping` callback with basic functionality
2. **Phase B** (Better UX): Add custom field key input and auto-refresh
3. **Phase C** (Polish): Add bulk mapping, inline editing mode

## Estimated Effort

- Phase A: ~30 minutes
- Phase B: ~45 minutes  
- Phase C: ~1 hour

## Summary

Currently, the "Validate DOCX Tags" feature shows you what's mapped and what's not, with suggestions for unmapped fields. However, to actually create those mappings, you must navigate to the separate **Tag Mapping** page.

This enhancement will allow you to:
- Create mappings directly from the validation dialog by clicking suggestions
- Enter custom field keys when suggestions don't match
- See real-time updates as mappings are created
- Avoid context-switching between pages
