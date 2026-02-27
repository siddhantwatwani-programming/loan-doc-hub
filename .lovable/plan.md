

## Plan: 7 Fixes — Sidebar, Mailing Address, Vesting, Hover Styles

### 1a. Logo click expands collapsed sidebar
**File: `src/components/layout/AppSidebar.tsx` (line ~197)**
- Add `onClick` handler on the logo `<img>` to call `toggleSidebar()` when `isCollapsed` is true, otherwise navigate to dashboard as before.

### 1b. Fix logo visibility in collapsed mode
**File: `src/components/layout/AppSidebar.tsx` (line ~193)**
- Change collapsed logo class from `"h-7 w-7 rounded object-cover"` to `"h-8 w-auto max-w-[40px]"` so the logo scales properly instead of being clipped to a tiny square.

### 2. Borrower — Mailing address auto-fill + disable
**File: `src/components/deal/BorrowerPrimaryForm.tsx`**
- Already implemented (lines 169-177 `handleSameAsPrimaryChange` + disabled prop on lines 297-312). No changes needed — this is already working.

### 3. Co-Borrower — Mailing address auto-fill + disable
**File: `src/components/deal/CoBorrowerPrimaryForm.tsx` (lines ~197-222)**
- Add a `handleSameAsPrimaryChange` function that copies primary address fields to mailing fields when checked.
- Update the `onCheckedChange` on line 200 to call this new handler.
- The disable logic on mailing fields (lines 206, 210, 214, 221) already references `getBoolValue('mailing_same_as_primary')` — no change needed there.

### 4. Additional Guarantor — Mailing address auto-fill + disable
**File: `src/components/deal/BorrowerAdditionalGuarantorForm.tsx`**
- Already implemented (lines 144-152 `handleSameAsPrimaryChange` + disabled prop). No changes needed.

### 5. Lender — Mailing address auto-fill + disable
**File: `src/components/deal/LenderInfoForm.tsx` (lines ~428-438)**
- Already implemented via `handleSameAsPrimaryChange` (lines 190-198) and the inline handler on line 430-438 duplicates the logic. The disabled prop on mailing fields (lines 446-458) already checks `getBoolValue('mailingSameAsPrimary')`. No changes needed.

### 6. Vesting — Make textarea editable in all 4 tabs
**Files:**
- `CoBorrowerPrimaryForm.tsx` line 278: Change `disabled={true}` to `disabled={disabled}` and remove `bg-muted/50 cursor-not-allowed` classes.
- `BorrowerPrimaryForm.tsx` line 369: Already uses `disabled={disabled}` — verify and confirm.
- `BorrowerAdditionalGuarantorForm.tsx` line 344: Already uses `disabled={disabled}` — no change.
- `LenderInfoForm.tsx`: Check Vesting textarea — already editable.

### 7. Sidebar hover — white text on blue active item in light mode
**File: `src/index.css` (line 198-199)**
- Update `.sidebar-item-active` to include `hover:text-sidebar-primary-foreground` to ensure white text persists on hover of active items.
- Add a lighter active parent style: update the parent group button that has `sidebar-item-active` to use a slightly lighter blue (`bg-sidebar-primary/80`) when it's the group header vs the leaf item.

### Summary of actual changes needed:
1. `AppSidebar.tsx` — Logo onClick toggles sidebar when collapsed; fix collapsed logo sizing
2. `CoBorrowerPrimaryForm.tsx` — Add auto-fill logic on mailing checkbox change
3. `CoBorrowerPrimaryForm.tsx` — Make Vesting textarea editable (remove `disabled={true}`)
4. `src/index.css` — Fix hover text color on active sidebar items in light mode

No database, schema, or API changes required. All field keys already exist in the forms and persist via `deal_section_values`.

