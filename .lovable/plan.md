

# Fix Auto-Refresh / State Reset on Navigation

## Problem Analysis

After the previous fix (consolidating to a single `AppLayout`), the layout no longer remounts between route groups. However, **state still resets** due to two remaining issues:

### Issue 1: Tab Content Unmounting (Radix TabsContent)
In `DealDataEntryPage.tsx`, the top-level tabs (Borrower, Loan, Property, etc.) use Radix UI's `<TabsContent>`, which **unmounts inactive tab content by default**. When switching from "Property" to "Loan" and back, the entire `PropertySectionContent` component is destroyed and recreated, losing:
- Active sub-section (e.g., "Legal Description" resets to "Properties")
- Selected item (e.g., which property was being viewed)
- Table pagination, scroll position
- Modal state

### Issue 2: Local State in Section Components
Every section component stores its navigation state in local `useState`:
- `BorrowerSectionContent` -- `useState<BorrowerSubSection>('borrowers')`
- `PropertySectionContent` -- `useState<PropertySubSection>('properties')`
- `LoanTermsSectionContent` -- `useState<LoanTermsSubSection>('balances_loan_details')`
- `LenderSectionContent` -- `useState<LenderSubSection>('lenders')`
- `BrokerSectionContent` -- `useState<BrokerSubSection>('brokers')`
- `ChargesSectionContent` -- `useState<ChargesSubSection>('charges')`
- `InsuranceSectionContent` -- `useState<InsuranceSubSection>('insurances')`
- `LienSectionContent` -- `useState<LienSubSection>('liens')`
- `OriginationFeesSectionContent` -- `useState<OriginationFeesSubSection>('application')`

When the parent `TabsContent` unmounts/remounts these components, all sub-navigation resets to defaults.

## Solution

### Step 1: Create a Navigation State Context

Create a new context (`DealNavigationContext`) that stores all tab and sub-navigation state for the deal data entry page. This context will be placed inside `DealDataEntryPage` so it lives as long as the page is mounted.

**New file: `src/contexts/DealNavigationContext.tsx`**

Stores:
- `activeTab` (top-level tab: borrower, loan_terms, property, etc.)
- `subSections` map: a record mapping each section key to its active sub-section
- `selectedPrefixes` map: a record mapping each section to its selected item prefix (e.g., `property1`, `borrower2`)

This means when a user navigates Property > Legal Description > switches to Loan tab > comes back to Property, it will restore "Legal Description" as the active sub-section.

### Step 2: Use `forceMount` on TabsContent + CSS Visibility

Modify `DealDataEntryPage.tsx` to add `forceMount` to each `<TabsContent>` and use CSS to hide inactive tabs instead of unmounting them. This keeps all section components mounted in the DOM, preserving their internal state.

```text
Before: <TabsContent value={section}>  -- unmounts when inactive
After:  <TabsContent value={section} forceMount className={activeTab !== section ? 'hidden' : ''}>
```

This single change prevents all child component state from being destroyed.

### Step 3: Wire Section Components to the Navigation Context

Update each section content component to read/write its sub-section state from the context instead of local `useState`:

- `BorrowerSectionContent` -- read `subSections.borrower`, write via context setter
- `PropertySectionContent` -- read `subSections.property`, write via context setter
- `LoanTermsSectionContent` -- read `subSections.loan_terms`, write via context setter
- `LenderSectionContent` -- read `subSections.lender`, write via context setter
- `BrokerSectionContent` -- read `subSections.broker`, write via context setter
- `ChargesSectionContent` -- read `subSections.charges`, write via context setter
- `InsuranceSectionContent` -- read from parent context
- `LienSectionContent` -- read from parent context
- `OriginationFeesSectionContent` -- read `subSections.origination_fees`, write via context setter

Each component's `useState` for sub-section/selected-prefix will be replaced with context getters/setters, keeping the same API shape.

### Step 4: Persist activeTab in DealDataEntryPage via Context

Move the `activeTab` state from `DealDataEntryPage`'s local `useState` into the `DealNavigationContext`. The initial tab is still set from the first loaded section, but subsequent tab switches are stored in context and persist as long as the page component is mounted.

## Technical Details

### Files Created
1. **`src/contexts/DealNavigationContext.tsx`** -- Context provider for deal navigation state (active tab, sub-sections, selected prefixes)

### Files Modified
1. **`src/pages/csr/DealDataEntryPage.tsx`**
   - Wrap content with `DealNavigationProvider`
   - Replace local `activeTab` state with context
   - Add `forceMount` + conditional `hidden` class to all `TabsContent` elements

2. **`src/components/deal/BorrowerSectionContent.tsx`** -- Replace local `activeSubSection` and `selectedBorrowerPrefix` with context
3. **`src/components/deal/PropertySectionContent.tsx`** -- Replace local `activeSubSection` and `selectedPropertyPrefix` with context
4. **`src/components/deal/LoanTermsSectionContent.tsx`** -- Replace local `activeSubSection` with context
5. **`src/components/deal/LenderSectionContent.tsx`** -- Replace local `activeSubSection` and `selectedLenderPrefix` with context
6. **`src/components/deal/BrokerSectionContent.tsx`** -- Replace local `activeSubSection` and `selectedBrokerPrefix` with context
7. **`src/components/deal/ChargesSectionContent.tsx`** -- Replace local `activeSubSection` and `selectedChargePrefix` with context
8. **`src/components/deal/InsuranceSectionContent.tsx`** -- Replace local `activeSubSection` with context
9. **`src/components/deal/LienSectionContent.tsx`** -- Replace local `activeSubSection` with context
10. **`src/components/deal/OriginationFeesSectionContent.tsx`** -- Replace local `activeSubSection` with context

### What This Preserves
- All existing UI layout, forms, and components
- All save/update APIs and data handling
- All role-based access control
- All existing route structure
- No database or schema changes

### What This Fixes
- Switching top-level tabs (Borrower/Loan/Property/etc.) no longer destroys sub-component state
- Sub-navigation position is remembered when returning to a tab
- Selected items (which borrower, which property) are preserved across tab switches
- Table pagination, scroll position, and modal state survive tab changes
- State resets only on page unmount (navigating away from deal), manual refresh, or logout

### Example Flow After Fix
1. User opens Deals > Enter Deal Data > Property > selects Property 2 > Legal Description
2. User switches to Loan tab
3. User returns to Property tab
4. Property tab shows Property 2 > Legal Description (exactly where they left off)

