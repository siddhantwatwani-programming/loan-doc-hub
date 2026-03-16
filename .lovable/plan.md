

## Fix: `{{pr_li_lienHolder}}` not populating

### Root Cause

The Liens tab (LienSectionContent) stores data using keys like `lien1.holder`, which canonicalize to `lien.holder`. However, the field_dictionary entries use:
- `field_key`: `pr_li_lienHolder`  
- `canonical_key`: `property1.lien_holder`
- `section`: `property`

There is **no** `lien.holder` entry in the field_dictionary, and no legacy key mapping from `lien.holder` to `property1.lien_holder`. As a result, `useDealFields.saveDraft()` silently skips all lien fields — they are never persisted to `deal_section_values`, making them invisible to the document generator.

This affects ALL lien fields, not just the holder.

### Fix: Two changes

**1. Add lien legacy key mappings** (`src/lib/legacyKeyMap.ts`)

Add mappings from `lien.{field}` → `property1.lien_{field}` so the save path can resolve lien fields to their dictionary entries:

```
'lien.holder': 'pr_li_lienHolder',
'lien.property': 'pr_li_lienProper',
'lien.priority': 'pr_li_lienPriori',
'lien.account': 'pr_li_lienAccoun',
'lien.contact': 'pr_li_lienContac',
'lien.phone': 'pr_li_lienPhone',
'lien.original_balance': 'pr_li_lienOriginBalanc',
'lien.current_balance': 'pr_li_lienCurrenBalanc',
'lien.regular_payment': 'pr_li_lienRegulaPaymen',
'lien.last_checked': 'pr_li_lienLastChecke',
```

**2. Add lien field bridging in generator** (`supabase/functions/generate-document/index.ts`)

After existing auto-compute blocks, add a lien bridging block that maps `lien1.*` or `lien.*` dot-notation keys to `pr_li_*` and `property1.lien_*` namespaces so the tag parser can resolve `{{pr_li_lienHolder}}`.

### What this does NOT change
- No UI layout changes
- No database schema changes
- No template changes
- No changes to existing save/load logic — only adds missing key mappings

### After deployment
The user must re-save the deal's Liens data (or re-enter a lien holder) so the value gets persisted under the correct dictionary ID. Then regenerate the document.

