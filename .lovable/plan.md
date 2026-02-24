

# Fix Global Sub-Navigation State Persistence

## Root Cause

The `DealNavigationContext` is created inside `DealDataEntryPage`, which means it only lives as long as that page is mounted. When the user navigates away (e.g., to Dashboard, or to the Deal Overview page) and returns, the entire page component unmounts and remounts, resetting all navigation state to defaults.

**Flow that fails:**
1. User is on `/deals/:id/edit` -- Borrower > Authorized Party
2. User clicks sidebar to go to Dashboard (`/dashboard`)
3. `DealDataEntryPage` unmounts, `DealNavigationProvider` is destroyed
4. User navigates back to `/deals/:id/edit`
5. New `DealNavigationProvider` is created with empty state
6. activeTab defaults to first section, sub-section defaults to "borrowers"
7. User loses their position (Authorized Party is gone)

## Solution: Persist Navigation State to SessionStorage

Update the `DealNavigationContext` to automatically persist its state (activeTab, subSections map, selectedPrefixes map) to `sessionStorage`, keyed by the deal ID. On mount, it reads from sessionStorage to restore the previous position. On unmount or logout, state is naturally cleared (sessionStorage clears on tab close; explicit clear on logout).

This approach:
- Preserves state when navigating away and returning to the same deal
- Clears automatically on browser tab close or manual refresh
- Requires no new database tables or API calls
- Changes only ONE file

## Technical Details

### File Modified

**`src/contexts/DealNavigationContext.tsx`**

Changes:
1. Add a `dealId` prop to `DealNavigationProvider` -- used as the sessionStorage key
2. On mount: read `activeTab`, `subSections`, and `selectedPrefixes` from `sessionStorage` using key `deal-nav-{dealId}`
3. On state change: write updated state to sessionStorage (debounced via a single `useEffect`)
4. The `initialTab` prop is only used if no sessionStorage entry exists

Implementation sketch:
```text
const STORAGE_KEY = `deal-nav-${dealId}`;

// On mount: restore from sessionStorage
useState(() => {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : { activeTab: initialTab, subSections: {}, selectedPrefixes: {} };
});

// On state change: persist to sessionStorage
useEffect(() => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ activeTab, subSections, selectedPrefixes }));
}, [activeTab, subSections, selectedPrefixes]);
```

**`src/pages/csr/DealDataEntryPage.tsx`**

Changes:
1. Pass the deal `id` to `DealNavigationProvider` as `dealId` prop
2. The wrapper at the bottom becomes: `<DealNavigationProvider dealId={id}>`
3. Since the id comes from `useParams`, extract it in the wrapper component

### What This Preserves
- All existing UI layout, forms, and components -- zero visual changes
- All save/update APIs and data handling
- All role-based access control
- All existing route structure
- No database or schema changes
- The forceMount + hidden class approach for within-page tab switching remains intact

### What This Fixes
- Navigating away from the deal page and returning restores the exact tab and sub-section
- Example: Borrower > Authorized Party is preserved even after visiting Dashboard and returning
- State clears on browser tab close, manual page refresh, or logout (sessionStorage behavior)
- Works for all sections: Borrower, Property (including Liens/Insurance sub-views), Loan, Lender, Broker, Charges, Origination Fees

### Example Flow After Fix
1. User opens Deals > Enter Deal Data > Borrower > Authorized Party
2. User clicks Dashboard in sidebar
3. User clicks back to the same deal's Enter Deal Data
4. Application restores: Borrower tab active, Authorized Party sub-section selected
