

## Hide Workspace Tab Bar for Admin Users

### Problem
The Workspace Tab Bar (showing "All Loan Documents" tab and deal tabs) is currently visible for all authenticated users, including Admins. It should only be displayed for CSR users.

### Fix — File: `src/components/layout/AppLayout.tsx`

1. Import `useAuth` from `@/contexts/AuthContext`
2. In `AppLayoutInner`, get the `role` from `useAuth()`
3. Change `const hasTabBar = true;` to `const hasTabBar = role === 'csr';`

This single change will:
- Hide the tab bar for Admin users
- Keep it visible for CSR users
- Adjust the main content padding accordingly (the existing `hasTabBar` ternary on `pt-[88px]` vs `pt-12` already handles this)

