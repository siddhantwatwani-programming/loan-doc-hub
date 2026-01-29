

# Field Mapping Fix & Navigation Refactoring Plan

## Part 1: Understanding Tag Mapping vs Field Mapping

### Tag Mapping (Document Placeholders → Field Keys)
Managed via `merge_tag_aliases` table. Maps document placeholders to data fields:

| Document Placeholder | Field Key |
|---------------------|-----------|
| `{{Borrower_Name}}` | `borrower.name` |
| `«Loan_Amount»` | `Terms.LoanAmount` |
| `F0001` | `lender.current.name` |

**Purpose**: During document generation, tells the system "when you see this tag in the DOCX, replace it with data from this field"

### Field Mapping (Template ↔ Field Dictionary)
Managed via `template_field_maps` table. Defines which fields from the dictionary are associated with each template:

| Template | Field | Required | Transform |
|----------|-------|----------|-----------|
| Lender Disclosures v1 | borrower.name | Yes | titlecase |
| Lender Disclosures v1 | Terms.LoanAmount | Yes | currency |

**Purpose**: Controls which fields appear in the CSR data entry form for deals using that template, and whether they're required

### Key Difference
- **Tag Mapping**: "What placeholder text maps to what data field?" (document-centric)
- **Field Mapping**: "What fields belong to this template?" (template-centric)

---

## Part 2: Fix Field Mapping Screen

### Current Problem
When selecting a template, the page shows:
- Left panel: ALL unmapped fields from the entire dictionary (potentially hundreds)
- Right panel: Fields actually mapped to the selected template

This is designed for adding new fields, but makes it confusing to just review what's mapped.

### Solution
Change the default view to only show mapped fields for the selected template. Add an "Add Fields" mode toggle that reveals the full dictionary when needed.

### Changes to `FieldMapEditorPage.tsx`

1. **Add view mode toggle**: 
   - Default: "View Mapped Fields" - shows only fields mapped to this template
   - Toggle: "Add New Fields" - shows the two-column layout with available fields

2. **Simplify default view**: Single column showing all mapped fields with their settings

3. **Keep full functionality**: The "Add Fields" mode preserves the current ability to add fields from dictionary

---

## Part 3: Navigation Refactoring

### Current Sidebar Structure (for Admin)
```
Dashboard
Deals
Create Deal
Users
Documents
▼ Configuration
  ├── Overview        → /admin/config
  ├── Users           → /admin/users  
  ├── Templates       → /admin/templates
  ├── Packets         → /admin/packets
  ├── Field Dictionary→ /admin/fields
  ├── Field Mapping   → /admin/field-maps
  ├── Tag Mapping     → /admin/tag-mapping
  └── Settings        → /admin/settings
```

### New Sidebar Structure (Requested)
```
Dashboard              → /dashboard (merge Overview cards here)
Deals                  → /deals
Create Deal            → /deals/new
Users (CSR)            → /users
Documents              → /documents
─────────────────────────
User Management        → /admin/users      (separate item)
Templates              → /admin/templates  (separate item)
Field Dictionary       → /admin/fields     (separate item)
Field Mapping          → /admin/field-maps (separate item)
Tag Mapping            → /admin/tag-mapping (separate item)
─────────────────────────
▼ Configuration
  ├── Packets         → /admin/packets
  └── Settings        → /admin/settings
```

---

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/admin/FieldMapEditorPage.tsx` | Add view mode toggle, refactor to show only mapped fields by default |
| `src/components/layout/AppSidebar.tsx` | Restructure navigation: move items out of Configuration group |
| `src/pages/Dashboard.tsx` | Merge ConfigurationPage overview cards into Admin Dashboard |
| `src/pages/admin/ConfigurationPage.tsx` | Simplify to only show Packets and Settings cards |

### FieldMapEditorPage Changes

```typescript
// Add state for view mode
const [viewMode, setViewMode] = useState<'mapped' | 'add'>('mapped');

// Default view: Only show mapped fields
// Toggle to 'add' mode to see full dictionary for adding new fields
```

**Default "Mapped Fields" View**:
- Single column showing all fields mapped to selected template
- Each row shows: field label, field_key, required toggle, transform dropdown, delete button
- "Add Fields" button at top to switch to add mode

**"Add Fields" Mode**:
- Two-column layout (current design)
- Left: Available fields from dictionary not yet mapped
- Right: Currently mapped fields
- "Done" button to return to default view

### AppSidebar Changes

```typescript
// Move these items out of adminGroups and make them top-level admin items
const adminItems: NavItem[] = [
  { label: 'User Management', icon: Users, path: '/admin/users', roles: ['admin'] },
  { label: 'Templates', icon: FileText, path: '/admin/templates', roles: ['admin'] },
  { label: 'Field Dictionary', icon: Key, path: '/admin/fields', roles: ['admin'] },
  { label: 'Field Mapping', icon: Link, path: '/admin/field-maps', roles: ['admin'] },
  { label: 'Tag Mapping', icon: Link, path: '/admin/tag-mapping', roles: ['admin'] },
];

// Simplified Configuration group
const adminGroups: NavGroup[] = [
  {
    label: 'Configuration',
    icon: Settings,
    roles: ['admin'],
    items: [
      { label: 'Packets', icon: Package, path: '/admin/packets', roles: ['admin'] },
      { label: 'Settings', icon: Sliders, path: '/admin/settings', roles: ['admin'] },
    ],
  },
];
```

### Dashboard Enhancement

For Admin users, add the configuration quick-links from ConfigurationPage:
- User Management card
- Template Management card
- Field Dictionary card
- Field Mapping card

This provides quick access from the dashboard while keeping them as separate top-level navigation items.

---

## Summary

1. **Tag Mapping** = Document placeholders → field keys (for document generation)
2. **Field Mapping** = Fields ↔ templates (for data entry forms)
3. **Field Mapping Fix**: Default to showing only mapped fields; add toggle for "Add Fields" mode
4. **Navigation Refactor**: 
   - User Management, Templates, Field Dictionary, Field Mapping, Tag Mapping → separate top-level items
   - Configuration group → only Packets and Settings
   - Dashboard → merge Overview cards for quick access

