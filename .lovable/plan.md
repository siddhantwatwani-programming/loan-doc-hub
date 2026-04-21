

## Bug: "Enter Data" reopens to the last visited tab when the file is already in the workspace

### Root cause
The workspace keeps each open file's `DealNavigationProvider` mounted (kept-alive), so when the user clicks **Enter Data** on a file that's already open, `activeTab` retains whatever the user last selected (e.g. Property, Charges). The existing reset logic only runs on first mount of the provider — not on re-entry from the Files list.

### Fix (minimal, scoped)
Force a reset of both `activeTab` and the Loan sub-section every time the user clicks an **Enter Data** entry point, by passing a navigation flag and reacting to it inside `DealDataEntryInner`.

### Changes

1. **`src/pages/csr/DealsPage.tsx`**  
   In `handleEnterData`, change both `navigate('/deals/{id}/edit')` calls to include a state flag:
   ```ts
   navigate(`/deals/${deal.id}/edit`, { state: { resetToLoanTerms: true } });
   ```

2. **`src/pages/csr/DealOverviewPage.tsx`**  
   Apply the same `state: { resetToLoanTerms: true }` to the two "Enter Data" button `navigate(...)` calls (lines ~464, ~479, and the documents-page entry at ~729 if it also routes to `/edit`).

3. **`src/pages/csr/DealDocumentsPage.tsx`**  
   The "Enter Data" button (line 733) `navigate('/deals/${id}/edit')` — add `{ state: { resetToLoanTerms: true } }`.

4. **`src/pages/csr/DealDataEntryPage.tsx`** (`DealDataEntryInner`)  
   Replace the existing one-time mount effect (lines 122-126) with a `useEffect` that listens to `location.key` + the `resetToLoanTerms` state flag. When the flag is present (or on initial mount):
   ```ts
   useEffect(() => {
     setActiveTab('loan_terms');
     setSubSection('loan_terms', 'balances_loan_details');
     // clear the flag from history state to avoid re-firing on internal nav
     if (location.state?.resetToLoanTerms) {
       window.history.replaceState({ ...window.history.state, usr: null }, '');
     }
   }, [location.key]);
   ```
   Using `location.key` ensures the reset re-runs every time the user navigates back to `/deals/:id/edit` via an "Enter Data" click, even when the component is kept alive in the workspace.

### Why this is safe
- No change to UI, components, APIs, schema, routing structure, or permissions.
- No change to the `DealNavigationProvider` storage/persistence behavior (sub-sections and selected prefixes still persist as designed).
- Only adds a navigation state flag and one effect — does not affect other navigation flows (sub-tab clicks within the page still work normally because they don't change `location.key`).
- Manually switching tabs after entering still works — the reset only fires on re-entry from an "Enter Data" click.

### Files touched
- `src/pages/csr/DealsPage.tsx`
- `src/pages/csr/DealOverviewPage.tsx`
- `src/pages/csr/DealDocumentsPage.tsx`
- `src/pages/csr/DealDataEntryPage.tsx`

