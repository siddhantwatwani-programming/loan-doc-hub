

# Fix: Charges Data Not Displaying After Save

## Problem Identified

After analyzing the code and database, the issue is clear:

1. **Missing Dictionary Entries**: Several fields entered in the Charges modal have **no corresponding entries in the `field_dictionary` table**, which means they cannot be saved to the database.

2. **Field Key Mapping is Working**: The mapping in `useDealFields.ts` is correctly translating UI keys to dictionary keys for fields that exist, but the dictionary is missing entries for:
   - `charge.owed_to` (mapped to display as "Owed To Account")
   - `charge.account`
   - `charge.borrower_full_name`
   - `charge.accrued_interest`
   - `charge.unpaid_balance`
   - `charge.total_due`
   - All distribution fields (`advanced_by_*`, `on_behalf_of_*`, `amount_owed_by_borrower`)

3. **Current Dictionary Fields (9 total)**:
   - `charge_date` ✓
   - `charge_description` ✓
   - `charge_interest_rate` ✓
   - `charge_interest_start_date` ✓
   - `charge_is_deferred` ✓
   - `charge_notes` ✓
   - `charge_original_amount` ✓
   - `charge_reference` ✓
   - `charge_type` ✓

---

## Solution

Add the missing charge fields to the `field_dictionary` table so data can be persisted.

### Step 1: Add Missing Fields to field_dictionary

Insert new entries for:

| Dictionary Key | UI Key | Data Type | Description |
|---------------|--------|-----------|-------------|
| `charge_owed_to` | `charge.owed_to` | text | Owed To Account |
| `charge_account` | `charge.account` | text | Account number |
| `charge_borrower_full_name` | `charge.borrower_full_name` | text | Borrower name |
| `charge_accrued_interest` | `charge.accrued_interest` | currency | Accrued Interest |
| `charge_unpaid_balance` | `charge.unpaid_balance` | currency | Unpaid Balance |
| `charge_total_due` | `charge.total_due` | currency | Total Due |
| `charge_advanced_by_account` | `charge.advanced_by_account` | text | Distribution: Advanced By Account |
| `charge_advanced_by_lender_name` | `charge.advanced_by_lender_name` | text | Distribution: Advanced By Lender |
| `charge_advanced_by_amount` | `charge.advanced_by_amount` | currency | Distribution: Advanced By Amount |
| `charge_on_behalf_of_account` | `charge.on_behalf_of_account` | text | Distribution: On Behalf Of Account |
| `charge_on_behalf_of_lender_name` | `charge.on_behalf_of_lender_name` | text | Distribution: On Behalf Of Lender |
| `charge_on_behalf_of_amount` | `charge.on_behalf_of_amount` | currency | Distribution: On Behalf Of Amount |
| `charge_amount_owed_by_borrower` | `charge.amount_owed_by_borrower` | currency | Amount Owed by Borrower |

### Step 2: Update CHARGE_UI_TO_DICT Mapping

Add the new mappings in `src/hooks/useDealFields.ts`:

```typescript
const CHARGE_UI_TO_DICT: Record<string, string> = {
  // Existing mappings
  'charge.date_of_charge': 'charge_date',
  'charge.description': 'charge_description',
  'charge.interest_rate': 'charge_interest_rate',
  'charge.interest_from': 'charge_interest_start_date',
  'charge.reference': 'charge_reference',
  'charge.charge_type': 'charge_type',
  'charge.notes': 'charge_notes',
  'charge.original_amount': 'charge_original_amount',
  'charge.deferred': 'charge_is_deferred',
  
  // NEW: Additional charge fields
  'charge.owed_to': 'charge_owed_to',
  'charge.account': 'charge_account',
  'charge.borrower_full_name': 'charge_borrower_full_name',
  'charge.accrued_interest': 'charge_accrued_interest',
  'charge.unpaid_balance': 'charge_unpaid_balance',
  'charge.total_due': 'charge_total_due',
  
  // NEW: Distribution fields
  'charge.advanced_by_account': 'charge_advanced_by_account',
  'charge.advanced_by_lender_name': 'charge_advanced_by_lender_name',
  'charge.advanced_by_amount': 'charge_advanced_by_amount',
  'charge.on_behalf_of_account': 'charge_on_behalf_of_account',
  'charge.on_behalf_of_lender_name': 'charge_on_behalf_of_lender_name',
  'charge.on_behalf_of_amount': 'charge_on_behalf_of_amount',
  'charge.amount_owed_by_borrower': 'charge_amount_owed_by_borrower',
};
```

---

## Technical Details

### Database Migration

```sql
-- Add missing charge fields to field_dictionary
INSERT INTO field_dictionary (field_key, display_name, section, data_type, is_required, is_visible) VALUES
  ('charge_owed_to', 'Owed To Account', 'charges', 'text', false, true),
  ('charge_account', 'Account', 'charges', 'text', false, true),
  ('charge_borrower_full_name', 'Borrower Full Name', 'charges', 'text', false, true),
  ('charge_accrued_interest', 'Accrued Interest', 'charges', 'currency', false, true),
  ('charge_unpaid_balance', 'Unpaid Balance', 'charges', 'currency', false, true),
  ('charge_total_due', 'Total Due', 'charges', 'currency', false, true),
  ('charge_advanced_by_account', 'Advanced By Account', 'charges', 'text', false, true),
  ('charge_advanced_by_lender_name', 'Advanced By Lender Name', 'charges', 'text', false, true),
  ('charge_advanced_by_amount', 'Advanced By Amount', 'charges', 'currency', false, true),
  ('charge_on_behalf_of_account', 'On Behalf Of Account', 'charges', 'text', false, true),
  ('charge_on_behalf_of_lender_name', 'On Behalf Of Lender Name', 'charges', 'text', false, true),
  ('charge_on_behalf_of_amount', 'On Behalf Of Amount', 'charges', 'currency', false, true),
  ('charge_amount_owed_by_borrower', 'Amount Owed by Borrower', 'charges', 'currency', false, true);
```

### Files to Modify

1. **`src/hooks/useDealFields.ts`** - Update `CHARGE_UI_TO_DICT` mapping to include the new fields

---

## Data Flow After Fix

```text
1. User enters data in Charges modal (e.g., Date of Charge: "2024-01-15")
2. Modal calls onSave() with chargeData object
3. ChargesSectionContent.handleSaveCharge() calls onValueChange() for each field:
   - onValueChange('charge1.date_of_charge', '2024-01-15')
4. useDealFields.updateValue() stores in values state
5. User clicks "Save Draft"
6. saveDraft() processes 'charge1.date_of_charge':
   - getCanonicalKey() → 'charge.date_of_charge'
   - mapChargeFieldKey(toDict=true) → 'charge_date'
   - Dictionary lookup finds ID for 'charge_date' ✓
   - Stores in deal_section_values with key 'charge1::uuid'
7. On reload, fetchData() reverses the mapping:
   - Parses 'charge1::uuid' → prefix='charge1', fieldDictId='uuid'
   - Finds field_key 'charge_date' from dictionary
   - mapChargeFieldKey(toDict=false) → 'charge.date_of_charge'
   - Reconstructs → 'charge1.date_of_charge'
8. ChargesSectionContent extracts charge from values
9. ChargesTableView displays the data
```

---

## Testing Checklist

After implementation:
1. Navigate to CSR Portal → Deals → Enter Deal Data → Charges
2. Click "Add Charge"
3. Fill in all fields: Date, Reference, Type, Description, Interest Rate, Interest From, Deferred, Original Amount
4. Click OK to save the charge
5. Verify the charge appears in the table with all data
6. Click "Save Draft"
7. Navigate to another section (e.g., Borrower)
8. Return to the Charges section
9. Verify all charge data persists correctly
10. Reload the page and verify data still displays

---

## Scope

- **Database**: Add 13 new field_dictionary entries
- **Modified**: `src/hooks/useDealFields.ts` (expand CHARGE_UI_TO_DICT)
- **No changes to**: UI components, APIs, or document generation flow
- **Backward compatible**: Existing charge data continues to work

