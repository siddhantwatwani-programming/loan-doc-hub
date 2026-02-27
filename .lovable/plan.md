

## Problem

In light mode, selected parent navigation items (like "Broker Services", "New Account Intake", etc.) use `text-sidebar-primary-foreground bg-sidebar-accent` which renders as **white text on a light gray background** — nearly invisible.

The `sidebar-item-active` class (used for leaf items) correctly uses `bg-sidebar-primary` (blue) with white text, but parent collapsible sections use `bg-sidebar-accent` (light gray) with white text instead.

## Solution

Update the CSS variable for `--sidebar-accent` in light mode to use a more visible color that provides sufficient contrast with white text, OR change the active parent styling pattern.

The cleanest fix: change all parent active highlights from `text-sidebar-primary-foreground bg-sidebar-accent` to use `sidebar-item-active` class (same as leaf items — blue background, white text). This makes all selected navigation items consistent and readable.

## Files to Change

### 1. `src/components/layout/BrokerServicesNav.tsx`
- Line 135: Change `'text-sidebar-primary-foreground bg-sidebar-accent'` to `'sidebar-item-active'`
- Line 175: Same change for child section triggers

### 2. `src/components/layout/AccountingNav.tsx`
- Lines 172, 194, 210, 235, 259, 283: Change all `'text-sidebar-primary-foreground bg-sidebar-accent'` to `'sidebar-item-active'`

### 3. `src/components/layout/SystemAdminNav.tsx`
- Lines 162, 184, 203: Same change

### 4. `src/components/layout/PromotedNavSection.tsx`
- Line 88: Same change

### 5. `src/components/layout/AppSidebar.tsx`
- Lines 286, 585: Same change (parent group triggers)

This ensures all active/selected navigation items — both parent sections and leaf items — use the same readable blue background with white text in light mode.

