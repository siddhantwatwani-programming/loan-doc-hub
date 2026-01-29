
# Comprehensive Refactoring Plan: Loan Document Management System

## Executive Summary

This plan addresses the following refactoring areas to improve maintainability, scalability, and reduce technical debt in the Loan Document Portal:

1. **Merge Tag Mapping Externalization** - Move hard-coded mappings to database
2. **Field Key Standardization** - Consolidate inconsistent naming conventions  
3. **Template Validation Tool** - Verify DOCX placeholders before upload
4. **Admin UI Enhancements** - Bulk operations and improved workflows
5. **Edge Function Modularization** - Split monolithic function into focused modules
6. **Data Layer Optimization** - Query performance and caching improvements

---

## Phase 1: Merge Tag Mapping Externalization

### Problem Statement
The `generate-document/index.ts` edge function contains ~180 lines of hard-coded `MERGE_TAG_TO_FIELD_MAP` and `LABEL_TO_FIELD_MAP` objects (lines 315-522). This creates:
- **Maintenance burden**: Code changes required for new template tags
- **Deployment friction**: Edge function redeploy needed for mapping updates
- **No admin visibility**: Administrators cannot see or modify mappings without code access

### Solution: Database-Driven Mapping Tables

**New Database Tables:**

```text
┌─────────────────────────────────────────────────────────────┐
│ merge_tag_aliases                                           │
├─────────────────────────────────────────────────────────────┤
│ id              UUID PRIMARY KEY                            │
│ tag_name        TEXT NOT NULL UNIQUE (e.g., "Borrower_Name")│
│ field_key       TEXT NOT NULL (e.g., "borrower.full_name")  │
│ tag_type        ENUM('merge_tag', 'label', 'f_code')        │
│ replace_next    TEXT (for label-based replacement)          │
│ is_active       BOOLEAN DEFAULT true                        │
│ created_at      TIMESTAMPTZ                                 │
│ updated_at      TIMESTAMPTZ                                 │
└─────────────────────────────────────────────────────────────┘
```

**Migration Steps:**
1. Create `merge_tag_aliases` table with RLS (admin-only write)
2. Seed table with existing 180+ mappings from code
3. Add admin UI page: "Tag Mapping Manager"
4. Update `generate-document` to query table at runtime
5. Cache mappings in edge function memory with 5-minute TTL
6. Remove hard-coded maps after validation

**Admin UI Features:**
- Search/filter by tag name, field key, or type
- Create/edit/delete mappings with validation
- Import/export CSV for bulk operations
- Preview which templates use each mapping

**Files to Create/Modify:**
| File | Action |
|------|--------|
| Database migration | Create table, RLS, seed data |
| `src/pages/admin/TagMappingPage.tsx` | New admin page |
| `supabase/functions/generate-document/index.ts` | Query table, add caching |
| `src/components/layout/AppSidebar.tsx` | Add nav link for admins |

---

## Phase 2: Field Key Standardization

### Problem Statement
Field keys use inconsistent naming patterns:
- **Case variations**: `Borrower.Name` vs `borrower.full_name` vs `borrower.name`
- **Duplicate concepts**: `borrower.address.street` vs `borrower.mailing_street` vs `borrower.street`
- **Legacy prefixes**: `Property1.Address` vs `property1.address` vs `property.legalDescription`

This causes:
- Case-insensitive fallback logic in document generation (adds latency)
- Confusion when creating new field mappings
- Duplicate data entry if both keys exist

### Solution: Key Canonicalization Strategy

**Naming Convention:**
```text
{entity}.{sub_entity?}.{attribute}

Examples:
- borrower.primary.full_name
- borrower.primary.address.street
- borrower.guarantor.address.street (for mailing/guarantor)
- property.1.address
- property.1.legal_description
- lender.current.name
- lender.new.name
```

**Migration Approach:**
1. **Audit Phase**: Generate report of all field_key patterns
2. **Canonical Map**: Create mapping table (old_key → new_key)
3. **Shadow Write**: Write to both old and new keys during transition
4. **Read Migration**: Update hooks to read from new keys with fallback
5. **Data Migration**: Batch update `deal_section_values` JSONB keys
6. **Cleanup**: Remove deprecated keys after validation

**Key Mapping Table:**
| Old Key | New Key | Status |
|---------|---------|--------|
| `Borrower.Name` | `borrower.primary.full_name` | Deprecated |
| `borrower.full_name` | `borrower.primary.full_name` | Active |
| `Property1.Address` | `property.1.address` | Deprecated |
| `property1.address` | `property.1.address` | Active |

**Files to Modify:**
| File | Changes |
|------|---------|
| `field_dictionary` table | Add `canonical_key` column |
| `src/hooks/useDealFields.ts` | Use canonical keys |
| `src/lib/fieldValueResolver.ts` | Update lookups |
| Migration script | Rename JSONB keys in `deal_section_values` |

---

## Phase 3: Template Validation Tool

### Problem Statement
Templates can be uploaded without verifying that their merge tags exist in the field dictionary. This leads to:
- Failed document generation with unclear errors
- "Zero replacements" when tags don't match
- Admin frustration debugging mapping issues

### Solution: Pre-Upload Validation Workflow

**New Edge Function: `validate-template`**

```text
Request: { templateFile: base64, templateId?: UUID }
Response: {
  validTags: [{ tag: "{{Borrower.Name}}", fieldKey: "borrower.full_name", mapped: true }],
  unmappedTags: [{ tag: "{{Unknown_Field}}", suggestions: ["borrower.unknown"] }],
  missingRequired: [{ fieldKey: "Terms.LoanAmount", templateMaps: true }],
  warnings: ["Label 'DATE OF NOTE:' found but no label mapping exists"]
}
```

**Processing Steps:**
1. Parse DOCX file and extract all merge tags (same logic as generate-document)
2. Query `merge_tag_aliases` and `field_dictionary` for each tag
3. Report unmapped tags with fuzzy-match suggestions
4. Check if required template_field_maps are satisfied
5. Scan for static labels that may need LABEL_TO_FIELD_MAP entries

**UI Integration:**
- Add validation step to Template Management upload flow
- Show validation results before confirming upload
- Allow "Upload Anyway" with warnings acknowledged
- Add "Re-Validate" button on existing templates

**Files to Create:**
| File | Purpose |
|------|---------|
| `supabase/functions/validate-template/index.ts` | DOCX parsing and validation |
| `src/components/admin/TemplateValidationDialog.tsx` | Results display |
| `src/pages/admin/TemplateManagementPage.tsx` | Integration |

---

## Phase 4: Admin UI Enhancements

### Problem Statement
Current admin pages lack efficiency features:
- No bulk import/export for Field Dictionary
- Manual one-by-one field mapping operations
- No quick-copy of mappings between templates
- Limited search and filtering

### Solution: Enhanced Admin Tooling

**4.1 Field Dictionary Bulk Operations:**
- Export to CSV/JSON with all columns
- Import from CSV with validation and conflict resolution
- Bulk delete with confirmation
- Duplicate field detection on import

**4.2 Template Field Map Cloning:**
- "Clone Mappings From" dropdown on template edit
- Copy all mappings from source template to target
- Merge mode: add missing vs overwrite existing
- Preview changes before applying

**4.3 Enhanced Search & Filtering:**
- Field Dictionary: Filter by section, data_type, is_calculated, is_required (in any template)
- Templates: Filter by state, product_type, has_mappings, validation_status
- Cross-reference view: Which templates use which fields

**4.4 Audit Trail Dashboard:**
- Recent field dictionary changes
- Recent template uploads/modifications
- Mapping change history

**Files to Modify/Create:**
| File | Changes |
|------|---------|
| `src/pages/admin/FieldDictionaryPage.tsx` | Add bulk import/export |
| `src/pages/admin/FieldMapEditorPage.tsx` | Add clone functionality |
| `src/components/admin/BulkImportDialog.tsx` | New component |
| `src/components/admin/FieldUsageReport.tsx` | Cross-reference view |

---

## Phase 5: Edge Function Modularization

### Problem Statement
`generate-document/index.ts` is 1,489 lines with:
- Formatting utilities (lines 79-219)
- Value resolution logic (lines 221-301)
- Tag parsing (lines 303-640)
- Label replacement (lines 642-745)
- DOCX processing (lines 807-835)
- Single doc generation (lines 837-1220)
- Packet generation (lines 1222-1400)
- HTTP handler (lines 1402-1489)

This makes it hard to:
- Test individual components
- Reuse formatting in other functions
- Debug specific failure points
- Onboard new developers

### Solution: Modular Function Architecture

**Directory Structure:**
```text
supabase/functions/
├── _shared/
│   ├── formatting.ts        # Currency, date, text transforms
│   ├── field-resolver.ts    # Value extraction from JSONB
│   ├── tag-parser.ts        # Merge tag detection
│   ├── docx-processor.ts    # ZIP/XML manipulation
│   └── types.ts             # Shared interfaces
├── generate-document/
│   └── index.ts             # Orchestration only (~200 lines)
├── validate-template/
│   └── index.ts             # Template validation
└── batch-generate/
    └── index.ts             # Parallel packet generation
```

**Shared Module Benefits:**
- Single source of truth for formatting
- Testable in isolation (can add Deno tests)
- Consistent behavior across functions
- Smaller main function file

**Implementation:**
1. Extract formatting utilities to `_shared/formatting.ts`
2. Extract field resolution to `_shared/field-resolver.ts`
3. Extract tag parsing to `_shared/tag-parser.ts`
4. Extract DOCX processing to `_shared/docx-processor.ts`
5. Update `generate-document` to import from `_shared/`
6. Create `validate-template` using shared modules
7. Add unit tests for shared modules

---

## Phase 6: Data Layer Optimization

### Problem Statement
Several inefficiencies exist:
- Multiple round-trips to `field_dictionary` per request
- No caching of field definitions (static data)
- Sequential section value saves (could batch)
- Large JSONB queries without projection

### Solution: Query Optimization

**6.1 Field Dictionary Caching:**
- Cache field dictionary in React context (refresh on admin changes)
- Add `stale-while-revalidate` pattern for background refresh
- Include version/hash for cache invalidation

**6.2 Batched Section Saves:**
- Group all section updates into single transaction
- Use Postgres function for atomic multi-section upsert:
```sql
CREATE FUNCTION upsert_deal_sections(
  p_deal_id UUID,
  p_sections JSONB -- { "borrower": {...}, "property": {...} }
) RETURNS void AS $$
  -- Atomic upsert of multiple sections
$$;
```

**6.3 Projection Optimization:**
- Select only needed columns from `deal_section_values`
- Use JSONB path queries for specific fields when possible

**6.4 React Query Integration:**
- Add query keys for field dictionary (`['field_dictionary']`)
- Add mutation hooks with cache invalidation
- Background refetch on window focus

**Files to Modify:**
| File | Changes |
|------|---------|
| `src/contexts/FieldDictionaryContext.tsx` | New context for caching |
| `src/hooks/useDealFields.ts` | Use cached field definitions |
| Database migration | Add batch upsert function |
| `src/lib/queryClient.ts` | Configure stale times |

---

## Implementation Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Merge Tag Externalization | ✅ Complete | Database table created, admin UI added, edge function updated |
| Phase 2: Field Key Standardization | ✅ Complete | canonical_key column added, migration table created, helper function added |
| Phase 3: Template Validation | ✅ Complete | validate-template edge function created, UI integrated |
| Phase 4: Admin UI Enhancements | 🔲 Pending | Bulk import/export, clone mappings |
| Phase 5: Edge Function Modularization | 🔲 Pending | Split into shared modules |
| Phase 6: Data Layer Optimization | 🔲 Pending | Caching, batched saves |

## Implementation Priority & Timeline

| Phase | Effort | Impact | Priority | Dependencies |
|-------|--------|--------|----------|--------------|
| Phase 1: Merge Tag Externalization | High | High | 1 | None |
| Phase 3: Template Validation | Medium | High | 2 | Phase 1 |
| Phase 5: Edge Function Modularization | High | Medium | 3 | None |
| Phase 4: Admin UI Enhancements | Medium | Medium | 4 | None |
| Phase 2: Field Key Standardization | Very High | Medium | 5 | Phase 1, 4 |
| Phase 6: Data Layer Optimization | Medium | Low | 6 | Phase 2 |

**Recommended Order:**
1. **Phase 1** - ✅ Complete
2. **Phase 3** - ✅ Complete
3. **Phase 5** - Sets foundation for maintainability
4. **Phase 4** - Quality of life for admins
5. **Phase 2** - ✅ Complete (database structure ready)
6. **Phase 6** - Performance optimization last

---

## Technical Details

### Database Changes Summary

```text
New Tables:
├── merge_tag_aliases (Phase 1)
│   - tag_name, field_key, tag_type, replace_next, is_active
│
└── field_key_migrations (Phase 2)
    - old_key, new_key, migrated_at, status

Schema Modifications:
├── field_dictionary
│   - ADD canonical_key TEXT
│   - ADD UNIQUE INDEX on canonical_key
│
└── Database Functions
    - upsert_deal_sections(UUID, JSONB)
    - migrate_field_keys()
```

### File Change Summary

| Category | Files Created | Files Modified |
|----------|---------------|----------------|
| Edge Functions | 2 | 1 |
| Admin Pages | 2 | 3 |
| Hooks | 1 | 2 |
| Components | 4 | 0 |
| Contexts | 1 | 0 |
| Database | 3 migrations | - |
| **Total** | **13** | **6** |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss during key migration | Shadow-write transition period, rollback scripts |
| Edge function performance | Cache mapping lookups, profile before/after |
| Breaking existing templates | Validate all templates before/after each phase |
| Admin workflow disruption | Feature flags for gradual rollout |
| External user access during migration | Maintenance mode option for large migrations |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Lines of code in generate-document | 1,489 | <400 |
| Hard-coded mappings in code | 180+ | 0 |
| Template upload validation | Manual | Automated |
| Field key inconsistencies | 30+ patterns | 1 pattern |
| Average query round-trips | 5-8 | 2-3 |
| Admin bulk operations | None | Import/Export/Clone |
