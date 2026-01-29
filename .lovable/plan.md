
# Simplify Deal Creation and Template Upload

## Overview

This plan removes the complexity of packet selection, state, and product type from the deal creation and template upload processes. Users can simply create a deal and navigate directly to fill in information.

## Current State

### Deal Creation (`CreateDealPage.tsx`)
- Requires: State, Product Type, Packet selection, Mode
- Multi-step wizard interface
- Validates state/product before allowing deal creation

### Template Upload (`TemplateManagementPage.tsx`)
- Requires: State, Product Type as mandatory fields
- Displays dropdowns for all 50 states and 8 product types

### Database Constraints
- `deals.state` - NOT NULL
- `deals.product_type` - NOT NULL
- `templates.state` - NOT NULL
- `templates.product_type` - NOT NULL

## Changes Required

### 1. Database Migration
Make `state` and `product_type` nullable with defaults for both tables:

```sql
-- Make deals table columns nullable with defaults
ALTER TABLE deals ALTER COLUMN state SET DEFAULT 'TBD';
ALTER TABLE deals ALTER COLUMN product_type SET DEFAULT 'TBD';
ALTER TABLE deals ALTER COLUMN state DROP NOT NULL;
ALTER TABLE deals ALTER COLUMN product_type DROP NOT NULL;

-- Make templates table columns nullable with defaults
ALTER TABLE templates ALTER COLUMN state SET DEFAULT 'TBD';
ALTER TABLE templates ALTER COLUMN product_type SET DEFAULT 'TBD';
ALTER TABLE templates ALTER COLUMN state DROP NOT NULL;
ALTER TABLE templates ALTER COLUMN product_type DROP NOT NULL;
```

### 2. Simplify Deal Creation Page

**File**: `src/pages/csr/CreateDealPage.tsx`

Transform from multi-step wizard to simple one-click creation:
- Remove State dropdown
- Remove Product Type dropdown
- Remove Packet selection step
- Remove Mode selection step
- Keep only a "Create Deal" button
- Auto-navigate to `/deals/:id` after creation

**New simplified flow**:
```text
+------------------------------------------+
|  Create New Deal                         |
+------------------------------------------+
|                                          |
|  Start a new loan document package       |
|                                          |
|  [Create Deal]        [Cancel]           |
|                                          |
+------------------------------------------+
```

### 3. Simplify Template Upload Dialog

**File**: `src/pages/admin/TemplateManagementPage.tsx`

Remove State and Product Type from the template creation dialog:
- Remove State dropdown
- Remove Product Type dropdown
- Keep: Template Name, Version, Active toggle, Description, DOCX upload, PDF upload (optional)

**Simplified dialog**:
```text
+------------------------------------------+
|  Create Template                         |
+------------------------------------------+
|  Template Name *                         |
|  [________________________]              |
|                                          |
|  Version: [1]    [x] Active              |
|                                          |
|  Description (optional)                  |
|  [________________________]              |
|                                          |
|  Template File (DOCX) *                  |
|  [Choose file...]                        |
|                                          |
|  Reference PDF (optional)                |
|  [Choose file...]                        |
|                                          |
|             [Cancel]  [Save]             |
+------------------------------------------+
```

## Technical Implementation

### Files to Modify

| File | Changes |
|------|---------|
| Database | Add migration to make state/product_type nullable |
| `src/pages/csr/CreateDealPage.tsx` | Remove state, product, packet, mode selection; simplify to one-click |
| `src/pages/admin/TemplateManagementPage.tsx` | Remove state/product_type from form; update validation |

### Deal Creation Logic (Simplified)

```typescript
const handleCreateDeal = async () => {
  setLoading(true);
  try {
    const dealNumber = await generateDealNumber();
    
    const { data, error } = await supabase
      .from('deals')
      .insert({
        deal_number: dealNumber,
        state: 'TBD',      // Default placeholder
        product_type: 'TBD', // Default placeholder
        mode: 'doc_prep',
        status: 'draft',
        created_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    // Navigate directly to deal page
    navigate(`/deals/${data.id}`);
  } catch (error) {
    // Handle error
  }
};
```

### Template Creation Logic (Simplified)

```typescript
const handleSubmit = async () => {
  if (!formData.name) {
    toast({ title: 'Please enter a template name', variant: 'destructive' });
    return;
  }
  
  if (!editingTemplate && !formData.file_path) {
    toast({ title: 'Please upload a DOCX file', variant: 'destructive' });
    return;
  }

  // Insert with default values for state/product_type
  await supabase.from('templates').insert({
    name: formData.name,
    state: 'TBD',
    product_type: 'TBD',
    version: formData.version,
    is_active: formData.is_active,
    description: formData.description || null,
    file_path: formData.file_path || null,
    reference_pdf_path: formData.reference_pdf_path || null,
  });
};
```

## Summary

This simplification:
1. Makes deal creation a single-click action
2. Navigates directly to deal details for data entry
3. Removes state/product type requirements from templates
4. Allows faster iteration during the pilot phase
5. These fields can be re-enabled once the stable version is ready
