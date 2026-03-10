

## Plan: Per-User Form Permissions for CSR Users

### Overview

Replace the current role-based permission model with a per-user permission model. Admin selects a specific CSR user from a dropdown, then configures Editable/Read Only for each Deal form. Default is Read Only when no permission record exists.

### Database Changes

**New table: `user_form_permissions`**

```sql
CREATE TABLE public.user_form_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  form_key text NOT NULL,
  access_mode text NOT NULL DEFAULT 'view_only',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, form_key)
);

ALTER TABLE public.user_form_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can fully manage
CREATE POLICY "Admins can manage user form permissions" ON public.user_form_permissions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Users can read their own permissions
CREATE POLICY "Users can view own form permissions" ON public.user_form_permissions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```

The existing `form_permissions`, `user_permission_levels` tables and `CsrUserPermissionsTable` component remain untouched (no deletions).

### Code Changes

| File | Change |
|------|--------|
| `src/hooks/useFormPermissions.ts` | **`useFormPermissions`**: For CSR users, query `user_form_permissions` by `user_id` instead of `form_permissions` by role/level. Default to `view_only` when no record exists. **`useFormPermissionsAdmin`**: Add functions to fetch/upsert `user_form_permissions` for a selected user. |
| `src/pages/admin/PermissionManagementPage.tsx` | Replace the Role + Permission Level selectors with a **CSR User dropdown**. When a user is selected, show the form permission grid for that user (from `user_form_permissions`). Auto-seed all form keys as `view_only` when a user is selected for the first time. Keep the toggle switch for Editable/View-Only. Remove the `CsrUserPermissionsTable` section. |
| `src/components/admin/CsrUserPermissionsTable.tsx` | No changes (kept as-is, just no longer rendered on the page). |

### Permission Check Flow (CSR users)

1. CSR logs in → `useFormPermissions` queries `user_form_permissions WHERE user_id = currentUserId`
2. If no record found for a form → default is **Read Only** (changed from current default of Editable)
3. `isFormViewOnly(formKey)` returns `true` if record is `view_only` OR if no record exists
4. `isFormEditable(formKey)` returns `true` only if record exists with `access_mode = 'editable'`

### Admin UI Flow

1. Admin opens Permission Management
2. Selects a CSR user from dropdown (fetched from `user_roles` + `profiles`)
3. Sees all 12 form keys with their current permission (Read Only / Editable toggle)
4. First time selecting a user with no records → auto-seeds all forms as `view_only`
5. Toggle updates `user_form_permissions` via upsert
6. Changes take effect on CSR's next page load

### Security

- RLS ensures only admins can insert/update/delete `user_form_permissions`
- CSR users can only SELECT their own rows
- No client-side permission bypass possible

