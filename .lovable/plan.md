

# Prevent Auto-Refresh / State Reset on Navigation

## Problem Analysis

The application has **5 separate `<AppLayout>` route groups** in `App.tsx`. Each group creates its own `AppLayout` component instance, which in turn creates its own `SidebarProvider`. When navigating between routes in different groups (e.g., from `/dashboard` to `/deals`), React unmounts and remounts the entire layout, causing:

- Sidebar collapse state to reset
- Page-level component state to be lost
- Data re-fetching on every navigation between route groups

## Root Cause

```text
Current Route Structure (simplified):

Route group 1: <AppLayout>                --> /dashboard, /my-work/*, /broker-services/*
Route group 2: <AppLayout requiredRoles>  --> /deals, /deals/:id
Route group 3: <AppLayout requiredRoles>  --> /deals/:id/data
Route group 4: <AppLayout requiredRoles blockExternalUsers> --> /deals/new, /users, /documents
Route group 5: <AppLayout requiredRoles>  --> /deals/:id/documents
Route group 6: <AppLayout requiredRoles blockExternalUsers> --> /admin/*
```

Each group is a separate React element, so switching between them causes a full remount.

## Solution

### Step 1: Lift `SidebarProvider` to App Level

Move `SidebarProvider` out of `AppLayout` and into `App.tsx`, wrapping `BrowserRouter`. This ensures sidebar state (collapsed/expanded) persists across all navigations.

**File: `src/App.tsx`**
- Import `SidebarProvider` from `@/contexts/SidebarContext`
- Wrap `BrowserRouter` content with `SidebarProvider`

### Step 2: Create a Lightweight `RoleGuard` Component

Instead of using separate `AppLayout` wrappers for role-based access, create a small `RoleGuard` wrapper component that only handles authorization checks without remounting the layout.

**New file: `src/components/layout/RoleGuard.tsx`**
- Accepts `requiredRoles` and `blockExternalUsers` props
- Uses `useAuth()` to check permissions
- Renders `<Outlet />` if authorized, otherwise `<Navigate>` to redirect
- Does NOT wrap children in layout/sidebar - purely an auth gate

### Step 3: Consolidate to a Single `AppLayout` Route Group

Restructure `App.tsx` to use a **single** `<AppLayout>` wrapper for all protected routes, with `RoleGuard` nested inside for role-specific restrictions.

```text
New Route Structure:

<AppLayout>  (single instance - never remounts)
  /dashboard
  /my-work/*
  /broker-services/*
  /accounting/*
  /system-admin/*
  /c-level/*

  <RoleGuard requiredRoles={['csr','admin','borrower','broker','lender']}>
    /deals
    /deals/:id
    /deals/:id/data
  </RoleGuard>

  <RoleGuard requiredRoles={['csr','admin']} blockExternalUsers>
    /deals/new
    /deals/:id/edit
    /users
    /documents
  </RoleGuard>

  <RoleGuard requiredRoles={['csr','admin']}>
    /deals/:id/documents
  </RoleGuard>

  <RoleGuard requiredRoles={['admin']} blockExternalUsers>
    /admin/*
  </RoleGuard>
</AppLayout>
```

### Step 4: Update `AppLayout` to Remove `SidebarProvider` Wrapper

Since `SidebarProvider` is now at the App level, remove it from `AppLayout` so `LayoutContent` renders directly.

**File: `src/components/layout/AppLayout.tsx`**
- Remove the outer `SidebarProvider` wrapper from the `AppLayout` component
- Keep `LayoutContent` logic (auth check, loading state, no-role state) intact
- Remove `requiredRoles` and `blockExternalUsers` props (handled by `RoleGuard`)

## Technical Details

### Files Modified
1. **`src/App.tsx`** - Add `SidebarProvider` wrapper, consolidate to single `AppLayout`, nest `RoleGuard` for protected routes
2. **`src/components/layout/AppLayout.tsx`** - Remove `SidebarProvider` wrapper and role-checking props

### File Created
1. **`src/components/layout/RoleGuard.tsx`** - Lightweight authorization component

### What This Preserves
- All existing route paths and their accessibility rules
- All existing UI layout, sidebar, header components
- All existing authentication flow and role checks
- All existing data-fetching hooks and form state within pages
- No database or API changes

### What This Fixes
- Sidebar state (collapsed/expanded) persists across all navigation
- Navigating between `/dashboard` and `/deals` no longer remounts the layout
- Switching between deal tabs no longer causes parent component re-initialization
- State resets only on manual browser refresh or logout

