# Fix: Borrower and Lender Data Not Saving/Loading

## Status: ✅ COMPLETED

## Problem Summary

When entering data for Borrowers and Lenders in a deal:
- Data does not persist after saving
- Reopening a deal shows empty Borrower and Lender sections

## Root Cause

Field key mismatch between UI (indexed keys like `lender1.first_name`) and database (canonical keys like `lender.first_name`).

## Solution Implemented

Modified `src/hooks/useDealFields.ts`:

1. **Added `getCanonicalKey()` helper** - Strips numeric indices from field keys for dictionary lookups
2. **Updated save logic** - Uses canonical key for dictionary ID lookup, stores `indexed_key` in JSONB to preserve multi-entity relationships  
3. **Updated load logic** - Reads `indexed_key` from JSONB to restore indexed field values correctly

## Changes Made

| File | Change |
|------|--------|
| `src/hooks/useDealFields.ts` | Added `indexed_key` to `JsonbFieldValue` interface |
| `src/hooks/useDealFields.ts` | Added `getCanonicalKey()` helper function |
| `src/hooks/useDealFields.ts` | Updated `saveDraft()` to resolve canonical keys and store indexed_key |
| `src/hooks/useDealFields.ts` | Updated `fetchData()` to use indexed_key when loading values |

## Impact

- **No database schema changes** - uses existing JSONB structure
- **Backward compatible** - existing data without `indexed_key` still works
- **Fixes all multi-entity sections**: Borrower, Lender, Property, Co-Borrower, Broker
