/**
 * Activity Log Hook
 * 
 * Provides functions to log deal-related activities for accountability.
 */

import { supabase } from '@/integrations/supabase/client';

export type ActionType = 
  | 'DealCreated'
  | 'DealUpdated'
  | 'DealMarkedReady'
  | 'DealRevertedToDraft'
  | 'FieldUpdated';

export interface ActivityLogEntry {
  id: string;
  deal_id: string;
  actor_user_id: string;
  action_type: ActionType;
  action_details: Record<string, any> | null;
  created_at: string;
}

export interface LogActivityParams {
  dealId: string;
  actionType: ActionType;
  actionDetails?: Record<string, any>;
}

/**
 * Log an activity for a deal
 */
export async function logActivity(params: LogActivityParams): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn('Cannot log activity: user not authenticated');
      return false;
    }

    const { error } = await supabase
      .from('activity_log')
      .insert({
        deal_id: params.dealId,
        actor_user_id: user.id,
        action_type: params.actionType,
        action_details: params.actionDetails || null,
      });

    if (error) {
      console.error('Failed to log activity:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error logging activity:', err);
    return false;
  }
}

/**
 * Log deal creation
 */
export async function logDealCreated(dealId: string, details?: {
  dealNumber?: string;
  state?: string;
  productType?: string;
  mode?: string;
}): Promise<boolean> {
  return logActivity({
    dealId,
    actionType: 'DealCreated',
    actionDetails: details,
  });
}

/**
 * Log deal draft saved
 */
export async function logDealUpdated(dealId: string, details?: {
  fieldsUpdated?: number;
  fieldsTotal?: number;
}): Promise<boolean> {
  return logActivity({
    dealId,
    actionType: 'DealUpdated',
    actionDetails: details,
  });
}

/**
 * Log deal marked as ready
 */
export async function logDealMarkedReady(dealId: string, details?: {
  requiredFieldsCount?: number;
}): Promise<boolean> {
  return logActivity({
    dealId,
    actionType: 'DealMarkedReady',
    actionDetails: details,
  });
}

/**
 * Log deal reverted to draft due to field change
 */
export async function logDealRevertedToDraft(dealId: string, details?: {
  reason?: string;
  fieldChanged?: string;
  previousStatus?: string;
}): Promise<boolean> {
  return logActivity({
    dealId,
    actionType: 'DealRevertedToDraft',
    actionDetails: details,
  });
}

/**
 * Log specific field update (for important fields)
 */
export async function logFieldUpdated(dealId: string, details: {
  fieldKey: string;
  fieldLabel?: string;
  oldValue?: string;
  newValue?: string;
}): Promise<boolean> {
  return logActivity({
    dealId,
    actionType: 'FieldUpdated',
    actionDetails: details,
  });
}
