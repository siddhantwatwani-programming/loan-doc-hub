
# Fix: Charges Records Disappearing After Navigation

## Problem Identified

When charge data is entered via the modal and saved, the data disappears upon navigation because there is a **complete field key mismatch** between what the UI uses and what exists in the field dictionary:

| UI Field Key | Dictionary Field Key |
|-------------|---------------------|
| `charge1.date_of_charge` | `charge_date` |
| `charge1.description` | `charge_description` |
| `charge1.interest_rate` | `charge_interest_rate` |
| `charge1.reference` | `charge_reference` |
| `charge1.charge_type` | `charge_type` |
| `charge1.notes` | `charge_notes` |
| `charge1.original_amount` | `charge_original_amount` |
| `charge1.deferred` | `charge_is_deferred` |
| `charge1.interest_from` | `charge_interest_start_date` |

Additionally:
1. The `getCanonicalKey()` function in `useDealFields.ts` does not normalize `charge1.*` to `charge.*`
2. The `getIndexedPrefix()` function does not recognize `charge\d+` as an indexed entity
3. Even after normalization, `charge.date_of_charge` would not match `charge_date`

## Solution: Add Charge Field Key Mapping

Create a mapping layer in `useDealFields.ts` that translates between UI field keys and dictionary field keys for charges. This maintains backward compatibility and follows the existing architecture pattern.

---

## Files to Modify

### 1. `src/hooks/useDealFields.ts`

**Add charge entity support to existing functions:**

1. **Update `getCanonicalKey()` (line 82-90)** - Add charge prefix normalization:
   ```typescript
   .replace(/^(charge)\d+\./, 'charge.')
   ```

2. **Update `getIndexedPrefix()` (line 93-96)** - Add charge pattern:
   ```typescript
   const match = fieldKey.match(/^(borrower\d+|coborrower\d+|co_borrower\d+|lender\d+|property\d+|broker\d+|charge\d+)\./);
   ```

3. **Add new function: `mapChargeFieldToDict()`** - Convert UI field names to dictionary field names:
   ```typescript
   function mapChargeFieldToDict(fieldKey: string): string {
     // Maps charge1.date_of_charge -> charge_date
     const chargeFieldMap: Record<string, string> = {
       'charge.date_of_charge': 'charge_date',
       'charge.description': 'charge_description',
       'charge.interest_rate': 'charge_interest_rate',
       'charge.interest_from': 'charge_interest_start_date',
       'charge.reference': 'charge_reference',
       'charge.charge_type': 'charge_type',
       'charge.notes': 'charge_notes',
       'charge.original_amount': 'charge_original_amount',
       'charge.deferred': 'charge_is_deferred',
     };
     return chargeFieldMap[fieldKey] || fieldKey;
   }
   ```

4. **Add reverse mapping function: `mapDictToChargeField()`** - For loading data back:
   ```typescript
   function mapDictToChargeField(dictKey: string): string {
     // Maps charge_date -> charge.date_of_charge
     const reversMap: Record<string, string> = {
       'charge_date': 'charge.date_of_charge',
       'charge_description': 'charge.description',
       'charge_interest_rate': 'charge.interest_rate',
       'charge_interest_start_date': 'charge.interest_from',
       'charge_reference': 'charge.reference',
       'charge_type': 'charge.charge_type',
       'charge_notes': 'charge.notes',
       'charge_original_amount': 'charge.original_amount',
       'charge_is_deferred': 'charge.deferred',
     };
     return reversMap[dictKey] || dictKey;
   }
   ```

5. **Update save logic in `saveDraft()` (around line 415)** - Apply mapping when looking up dictionary ID:
   - Before dictionary lookup, check if the canonical key is a charge field
   - If so, map it to the dictionary format
   - Use the mapped key for dictionary ID lookup

6. **Update load logic in `fetchData()` (around line 280)** - Apply reverse mapping when reconstructing field keys:
   - When loading charge section data, reverse-map dictionary keys to UI format
   - Reconstruct indexed keys properly (e.g., `charge1.date_of_charge`)

---

## Technical Details

### Updated Helper Functions

```typescript
// Charge field UI-to-dictionary mapping
const CHARGE_UI_TO_DICT: Record<string, string> = {
  'charge.date_of_charge': 'charge_date',
  'charge.description': 'charge_description',
  'charge.interest_rate': 'charge_interest_rate',
  'charge.interest_from': 'charge_interest_start_date',
  'charge.reference': 'charge_reference',
  'charge.charge_type': 'charge_type',
  'charge.notes': 'charge_notes',
  'charge.original_amount': 'charge_original_amount',
  'charge.deferred': 'charge_is_deferred',
  'charge.accrued_interest': 'charge_accrued_interest',
  'charge.unpaid_balance': 'charge_unpaid_balance',
  'charge.total_due': 'charge_total_due',
  'charge.owed_to': 'charge_owed_to',
  'charge.account': 'charge_account',
  'charge.borrower_full_name': 'charge_borrower_full_name',
};

// Reverse mapping for loading
const CHARGE_DICT_TO_UI: Record<string, string> = Object.fromEntries(
  Object.entries(CHARGE_UI_TO_DICT).map(([ui, dict]) => [dict, ui])
);

function mapChargeFieldKey(canonicalKey: string, toDict: boolean): string {
  if (!canonicalKey.startsWith('charge.')) return canonicalKey;
  
  if (toDict) {
    return CHARGE_UI_TO_DICT[canonicalKey] || canonicalKey;
  } else {
    return CHARGE_DICT_TO_UI[canonicalKey] || canonicalKey;
  }
}
```

### Save Logic Flow

```text
1. UI calls onValueChange('charge1.description', 'Test')
2. saveDraft() processes field key 'charge1.description'
3. getCanonicalKey() normalizes to 'charge.description'
4. mapChargeFieldKey() converts to 'charge_description'
5. Dictionary lookup finds ID for 'charge_description'
6. Storage key: 'charge1::uuid' with indexed_key='charge1.description'
```

### Load Logic Flow

```text
1. fetchData() reads deal_section_values for 'charges' section
2. Parses storage key 'charge1::uuid' -> prefix='charge1', fieldDictId='uuid'
3. Looks up field_key 'charge_description' from dictionary
4. mapChargeFieldKey(reverse) converts to 'charge.description'
5. Reconstructs indexed key: 'charge1.description'
6. Sets values['charge1.description'] = loaded_value
```

---

## Testing Checklist

After implementation:
1. Open a deal and navigate to the Charges tab
2. Click "Add Charge" and fill in all fields
3. Click OK to save the charge
4. Click "Save Draft" button
5. Navigate to another tab (e.g., Borrower)
6. Return to the Charges tab
7. Verify the charge appears in the table with correct data
8. Add a second charge and repeat steps 4-7
9. Verify both charges persist correctly
10. Reload the page and verify all charges reload

---

## Scope

- **Modified**: `src/hooks/useDealFields.ts` only
- **No changes to**: UI components, database schema, APIs, or document generation
- **Backward compatible**: Existing data format continues to work
