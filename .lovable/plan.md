

## Field Dictionary & Field Key Refactoring Plan

### Scope Overview

This is a **phased refactoring** that will modernize the field key system, remove the "Other" section, introduce a new naming convention (`br_p_fn` format), and add `is_mandatory` validation logic. The work spans:

- **Database**: New `field_dictionary` schema, new section enum, data migrations
- **Admin UI**: Refactored Field Dictionary page with new columns, filters, CSV export
- **Form components**: 23+ forms using hardcoded `FIELD_KEYS` objects
- **Document generation**: Edge functions that resolve field keys → values
- **Deal data**: 36 existing deals with saved JSONB field values

---

## Phase 1: Database Schema Refactoring (Week 1)

### 1.1 Update `field_section` Enum
Add `origination_fees` and `insurance` sections; remove reliance on `other`:

```sql
ALTER TYPE field_section ADD VALUE 'origination_fees';
ALTER TYPE field_section ADD VALUE 'insurance';
-- 'other' enum value remains for backward compatibility but won't be used
```

### 1.2 Alter `field_dictionary` Table
Add new columns to support the new architecture:

| New Column | Type | Purpose |
|------------|------|---------|
| `form_type` | `text` | Primary, Additional, Guarantor, Banking, etc. |
| `is_mandatory` | `boolean DEFAULT false` | Red star validation |

Migration:
```sql
ALTER TABLE field_dictionary ADD COLUMN form_type text DEFAULT 'primary';
ALTER TABLE field_dictionary ADD COLUMN is_mandatory boolean DEFAULT false;
```

### 1.3 Create Field Key Migration Tracking
Leverage existing `field_key_migrations` table to track old→new mappings:
- Record all field_key changes for deal data migration
- Status: `pending` → `migrated`

---

## Phase 2: Field Dictionary Admin UI (Week 1-2)

### 2.1 New Field Dictionary Page Columns
| Column | Source |
|--------|--------|
| Section | `section` enum |
| Form Type | New `form_type` column |
| Field Label | `label` |
| Field Key | `field_key` (editable) |
| Field Type | `data_type` enum |
| Mandatory | `is_mandatory` toggle |

### 2.2 Features
- **Section dropdown filter**: Filter by borrower, loan_terms, property, etc.
- **Search by label**: Text search across `label` column
- **CSV Export**: Download filtered results
- **Duplicate check**: Prevent duplicate `field_key` on save
- **Bulk edit**: Toggle mandatory for multiple fields

### 2.3 Remove "Other" from Section Dropdown
The admin dropdown will exclude `other` from available options for new fields.

---

## Phase 3: New Field Key Convention Generator (Week 2)

### 3.1 Naming Convention
```
{section_abbr}_{form_abbr}_{fieldIdentifier}
```

| Section | Abbr | Example |
|---------|------|---------|
| Borrower | `br` | `br_p_fn` (Primary, First Name) |
| Co-Borrower | `cb` | `cb_p_ln` |
| Loan Terms | `ln` | `ln_g_lnAmt` (General, Loan Amount) |
| Property | `pr` | `pr_a_pptAdd` (Address) |
| Lender | `ld` | `ld_p_email` |
| Broker | `bk` | `bk_i_cmpName` |
| Charges | `ch` | `ch_d_chrDate` |
| Origination Fees | `of` | `of_800_orgFee` |

### 3.2 Auto-Generation Helper
```typescript
function generateFieldKey(section: string, formType: string, label: string): string {
  const sectionMap = { borrower: 'br', co_borrower: 'cb', loan_terms: 'ln', ... };
  const formMap = { primary: 'p', additional: 'a', guarantor: 'g', banking: 'b', ... };
  const identifier = label.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  return `${sectionMap[section]}_${formMap[formType]}_${identifier}`;
}
```

---

## Phase 4: Migrate Existing Field Dictionary (Week 2-3)

### 4.1 Categorize 778 "Other" Fields
| Category | Action |
|----------|--------|
| Origination fees (`origination_fees.*`) | Move to `origination_fees` section |
| Notary/recording fields | Move to `escrow` section |
| Legacy UI descriptions | Archive (mark inactive) |
| Unused fields | Delete after dependency check |

### 4.2 Migration Script
```sql
-- Move origination fees to new section
UPDATE field_dictionary 
SET section = 'origination_fees'
WHERE field_key LIKE 'origination_fees.%' AND section = 'other';

-- Track key migrations
INSERT INTO field_key_migrations (old_key, new_key, status)
SELECT field_key, 'of_800_' || SUBSTRING(field_key FROM 17), 'pending'
FROM field_dictionary WHERE section = 'origination_fees';
```

### 4.3 Update Field Keys in Batches
Run migration scripts section-by-section with old→new tracking.

---

## Phase 5: Update Form Components (Week 3-4)

### 5.1 Affected Components (23+)
Each form has a hardcoded `FIELD_KEYS` object that must be updated:

| Form | Location | Fields |
|------|----------|--------|
| BorrowerPrimaryForm | `src/components/deal/` | 50+ keys |
| LenderInfoForm | `src/components/deal/` | 60+ keys |
| PropertyDetailsForm | `src/components/deal/` | 40+ keys |
| LoanTermsDetailsForm | `src/components/deal/` | 30+ keys |
| ... | ... | ... |

### 5.2 Migration Strategy
1. Create a central `FIELD_KEY_MAP` module
2. Import into all forms (replaces inline `FIELD_KEYS`)
3. Add TypeScript strict typing for new keys

### 5.3 Mandatory Field Validation (Red Star)
```typescript
// In DealFieldInput.tsx
{field.is_mandatory && (
  <span className="absolute top-0 right-0 text-red-500">*</span>
)}

// In useDealFields.ts saveDraft()
const missingMandatory = fields.filter(f => f.is_mandatory && !values[f.field_key]);
if (missingMandatory.length > 0) {
  toast({ title: 'Missing required fields', variant: 'destructive' });
  return false;
}
```

---

## Phase 6: Migrate Deal Data (Week 4)

### 6.1 JSONB Key Migration
For each deal's `deal_section_values`:
1. Read existing `field_values` JSONB
2. For each key, look up `field_key_migrations` table
3. Replace old key with new key
4. Write back updated JSONB

```typescript
async function migrateDealFieldKeys(dealId: string) {
  const { data: migrations } = await supabase
    .from('field_key_migrations')
    .select('old_key, new_key')
    .eq('status', 'pending');
    
  const migrationMap = new Map(migrations.map(m => [m.old_key, m.new_key]));
  
  // Update each section's field_values
  for (const section of sections) {
    const newFieldValues = {};
    Object.entries(section.field_values).forEach(([key, value]) => {
      const newKey = migrationMap.get(extractFieldKey(key)) || key;
      newFieldValues[newKey] = value;
    });
    // Save back
  }
}
```

---

## Phase 7: Update Document Generation (Week 4-5)

### 7.1 Edge Function Updates
The `generate-document` function already uses `field_dictionary` lookups. Key changes:

1. Update `field-resolver.ts` to handle new naming convention
2. Update `resolveFieldKeyWithMap` for new key format
3. Test with existing templates

### 7.2 Template Field Maps
- Existing mappings remain valid (they reference `field_dictionary_id`)
- New templates will use new field keys

---

## Phase 8: Remove "Other" Section from UI (Week 5)

### 8.1 Code Changes
| File | Change |
|------|--------|
| `FieldDictionaryPage.tsx` | Remove `other` from SECTIONS array |
| `useDealFields.ts` | Remove `MERGE_INTO_OTHER` logic |
| `requiredFieldsResolver.ts` | Update `SECTION_ORDER` |

### 8.2 CSR Enter Data Tabs
After migration, CSR sees only:
- Borrower, Co-Borrower, Loan Terms, Property, Lender, Broker, Charges, Escrow, Origination Fees, Notes

---

## Technical Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking document generation | Run parallel validation: old keys still resolve via migration table |
| Losing deal data | Full backup before migration + rollback script |
| Form render failures | Gradual rollout: one section at a time |
| Template mapping breaks | FK to `field_dictionary.id` unchanged; only `field_key` column changes |

---

## Deliverables Summary

1. **Database**: Updated `field_dictionary` schema with `form_type`, `is_mandatory`
2. **Admin UI**: Refactored Field Dictionary page with filters, CSV export, mandatory toggle
3. **Field Keys**: New `br_p_fn` naming convention applied to all 2000+ fields
4. **Forms**: 23+ form components updated with centralized field key mapping
5. **Deal Data**: All 36 deals migrated to new field keys
6. **Doc Gen**: Edge functions updated for new key resolution
7. **"Other" Removed**: Section eliminated from UI and new field creation

