

## Fix: Conversation Log Data Not Persisting After Close/Reopen

### Root Cause

The Conversation Log uses UI keys like `notes_entry1.content`, `notes_entry1.date`, etc. During save, `useDealFields.ts` strips the index to get canonical keys (`notes_entry.content`), then looks up the `field_dictionary_id` via the legacy key map. **There is no legacy mapping** from `notes_entry.*` to the dictionary keys (`nt_p_content`, `nt_p_date`, etc.), so the save loop hits `if (!fieldDictId) continue;` and silently skips every note field. Data is never written to `deal_section_values`.

### Fix

**File: `src/lib/legacyKeyMap.ts`** — Add notes_entry legacy mappings:

```typescript
// NOTES / CONVERSATION LOG
'notes_entry.high_priority': 'nt_p_highPriori',
'notes_entry.date': 'nt_p_date',
'notes_entry.as_of_date': 'nt_p_asOf',
'notes_entry.account': 'nt_p_account',
'notes_entry.name': 'nt_p_name',
'notes_entry.reference': 'nt_p_referenc',
'notes_entry.content': 'nt_p_content',
```

**Database migration** — Add missing dictionary entries for `type` and `attachments` fields used by the Conversation Log UI:

```sql
INSERT INTO public.field_dictionary (field_key, section, data_type, label, canonical_key)
VALUES
  ('nt_p_type', 'notes', 'text', 'Note Type', 'nt_p_type'),
  ('nt_p_attachments', 'notes', 'text', 'Note Attachments', 'nt_p_attachments');
```

Then add the remaining legacy mappings:
```typescript
'notes_entry.type': 'nt_p_type',
'notes_entry.attachments': 'nt_p_attachments',
```

### Files Changed
| File | Change |
|------|--------|
| `src/lib/legacyKeyMap.ts` | Add 9 `notes_entry.*` → `nt_p_*` mappings |
| New migration | Insert 2 missing field_dictionary rows for `type` and `attachments` |

No changes to UI components, save logic, or any other functionality.

