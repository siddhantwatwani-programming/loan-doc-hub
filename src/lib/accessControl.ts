import { supabase } from '@/integrations/supabase/client';
import { AppRole, EXTERNAL_ROLES, INTERNAL_ROLES } from '@/contexts/AuthContext';

export interface FieldPermission {
  field_key: string;
  can_view: boolean;
  can_edit: boolean;
}

export interface DealAssignment {
  id: string;
  deal_id: string;
  user_id: string;
  role: AppRole;
  assigned_by: string;
  assigned_at: string;
  notes: string | null;
}

/**
 * Check if a role is an external role (borrower, broker, lender)
 */
export const isExternalRole = (role: AppRole): boolean => {
  return role !== null && EXTERNAL_ROLES.includes(role);
};

/**
 * Check if a role is an internal role (admin, csr)
 */
export const isInternalRole = (role: AppRole): boolean => {
  return role !== null && INTERNAL_ROLES.includes(role);
};

/**
 * Check if a role has admin-level access
 */
export const hasAdminAccess = (role: AppRole): boolean => {
  return role === 'admin';
};

/**
 * Check if a role can create deals
 */
export const canCreateDeal = (role: AppRole): boolean => {
  return role === 'csr' || role === 'admin';
};

/**
 * Check if a role can generate documents
 */
export const canGenerateDocuments = (role: AppRole): boolean => {
  return role === 'csr' || role === 'admin';
};

/**
 * Check if a role can access admin screens
 */
export const canAccessAdminScreens = (role: AppRole): boolean => {
  return role === 'admin';
};

/**
 * Field visibility info from field_dictionary
 */
export interface FieldVisibility {
  field_key: string;
  allowed_roles: string[];
  read_only_roles: string[];
  is_calculated: boolean;
}

/**
 * Fetch field visibility settings from field_dictionary
 */
export const fetchFieldVisibility = async (): Promise<Map<string, FieldVisibility>> => {
  const { data, error } = await supabase
    .from('field_dictionary')
    .select('field_key, allowed_roles, read_only_roles, is_calculated');

  if (error) {
    console.error('Error fetching field visibility:', error);
    return new Map();
  }

  return new Map((data || []).map(fv => [fv.field_key, {
    field_key: fv.field_key,
    allowed_roles: fv.allowed_roles || ['admin', 'csr'],
    read_only_roles: fv.read_only_roles || [],
    is_calculated: fv.is_calculated,
  }]));
};

/**
 * Fetch field permissions for a given role (legacy - uses field_permissions table)
 */
export const fetchFieldPermissions = async (role: AppRole): Promise<Map<string, FieldPermission>> => {
  if (!role || isInternalRole(role)) {
    // Internal users have full access - return empty map (will be treated as full access)
    return new Map();
  }

  const { data, error } = await supabase
    .from('field_permissions')
    .select('field_key, can_view, can_edit')
    .eq('role', role);

  if (error) {
    console.error('Error fetching field permissions:', error);
    return new Map();
  }

  return new Map((data || []).map(fp => [fp.field_key, fp]));
};

/**
 * Check if user can view a specific field using field_dictionary visibility
 */
export const canViewFieldWithVisibility = (
  role: AppRole,
  fieldKey: string,
  fieldVisibility: Map<string, FieldVisibility>
): boolean => {
  // Internal users have full access
  if (isInternalRole(role)) {
    return true;
  }

  // External users need to be in allowed_roles or read_only_roles
  const visibility = fieldVisibility.get(fieldKey);
  if (!visibility) return false;
  
  return visibility.allowed_roles.includes(role!) || visibility.read_only_roles.includes(role!);
};

/**
 * Check if user can edit a specific field using field_dictionary visibility
 */
export const canEditFieldWithVisibility = (
  role: AppRole,
  fieldKey: string,
  fieldVisibility: Map<string, FieldVisibility>
): boolean => {
  // Admin can view all but not edit deal data (only config)
  if (role === 'admin') {
    return false; // Admin can only view, edit is handled at config level
  }
  
  // CSR can edit all non-calculated fields
  if (role === 'csr') {
    const visibility = fieldVisibility.get(fieldKey);
    return visibility ? !visibility.is_calculated : true;
  }

  // External users need to be in allowed_roles (not read_only_roles)
  const visibility = fieldVisibility.get(fieldKey);
  if (!visibility) return false;
  
  // Cannot edit calculated fields
  if (visibility.is_calculated) return false;
  
  return visibility.allowed_roles.includes(role!);
};

/**
 * Check if user can view a specific field (legacy - uses field_permissions)
 */
export const canViewField = (
  role: AppRole,
  fieldKey: string,
  fieldPermissions: Map<string, FieldPermission>
): boolean => {
  // Internal users have full access
  if (isInternalRole(role)) {
    return true;
  }

  // External users need explicit permission
  const permission = fieldPermissions.get(fieldKey);
  return permission?.can_view ?? false;
};

/**
 * Check if user can edit a specific field (legacy - uses field_permissions)
 */
export const canEditField = (
  role: AppRole,
  fieldKey: string,
  fieldPermissions: Map<string, FieldPermission>
): boolean => {
  // Internal users have full access
  if (isInternalRole(role)) {
    return true;
  }

  // External users need explicit permission
  const permission = fieldPermissions.get(fieldKey);
  return permission?.can_edit ?? false;
};

/**
 * Fetch deal assignments for a user
 */
export const fetchUserDealAssignments = async (userId: string): Promise<DealAssignment[]> => {
  const { data, error } = await supabase
    .from('deal_assignments')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching deal assignments:', error);
    return [];
  }

  return (data || []) as DealAssignment[];
};

/**
 * Fetch assignments for a specific deal
 */
export const fetchDealAssignments = async (dealId: string): Promise<DealAssignment[]> => {
  const { data, error } = await supabase
    .from('deal_assignments')
    .select('*')
    .eq('deal_id', dealId);

  if (error) {
    console.error('Error fetching deal assignments:', error);
    return [];
  }

  return (data || []) as DealAssignment[];
};

/**
 * Assign a user to a deal
 */
export const assignUserToDeal = async (
  dealId: string,
  userId: string,
  role: AppRole,
  assignedBy: string,
  notes?: string
): Promise<{ error: Error | null }> => {
  const { error } = await supabase
    .from('deal_assignments')
    .insert({
      deal_id: dealId,
      user_id: userId,
      role: role,
      assigned_by: assignedBy,
      notes: notes || null,
    });

  return { error: error as Error | null };
};

/**
 * Remove a user from a deal
 */
export const removeUserFromDeal = async (
  dealId: string,
  userId: string
): Promise<{ error: Error | null }> => {
  const { error } = await supabase
    .from('deal_assignments')
    .delete()
    .eq('deal_id', dealId)
    .eq('user_id', userId);

  return { error: error as Error | null };
};

/**
 * Filter fields based on user's permissions
 */
export const filterFieldsByPermission = <T extends { field_key: string }>(
  fields: T[],
  role: AppRole,
  fieldPermissions: Map<string, FieldPermission>,
  checkEdit: boolean = false
): T[] => {
  // Internal users see all fields
  if (isInternalRole(role)) {
    return fields;
  }

  // External users only see permitted fields
  return fields.filter(field => {
    const permission = fieldPermissions.get(field.field_key);
    return checkEdit ? permission?.can_edit : permission?.can_view;
  });
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: AppRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'csr':
      return 'CSR';
    case 'borrower':
      return 'Borrower';
    case 'broker':
      return 'Broker';
    case 'lender':
      return 'Lender';
    default:
      return 'Unknown';
  }
};

/**
 * Get role badge color classes
 */
export const getRoleBadgeClasses = (role: AppRole): string => {
  switch (role) {
    case 'admin':
      return 'bg-destructive/10 text-destructive';
    case 'csr':
      return 'bg-primary/10 text-primary';
    case 'borrower':
      return 'bg-success/10 text-success';
    case 'broker':
      return 'bg-warning/10 text-warning';
    case 'lender':
      return 'bg-accent/10 text-accent-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};
