import { supabase } from '@/integrations/supabase/client';

export interface MagicLinkSettings {
  expiryHours: number;
  maxUses: number;
}

export interface MagicLinkData {
  id: string;
  deal_participant_id: string;
  token: string;
  expires_at: string;
  max_uses: number;
  used_count: number;
  created_at: string;
  last_used_at: string | null;
}

export interface MagicLinkValidationResult {
  isValid: boolean;
  error?: string;
  dealId?: string;
  role?: string;
  participantId?: string;
  dealNumber?: string;
  sessionToken?: string;
}

/**
 * Generate a cryptographically secure random token
 */
export const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Fetch magic link settings from system settings
 */
export const getMagicLinkSettings = async (): Promise<MagicLinkSettings> => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['magic_link_expiry_hours', 'magic_link_max_uses']);

  if (error) {
    console.error('Error fetching magic link settings:', error);
    // Return defaults
    return { expiryHours: 72, maxUses: 5 };
  }

  const settings = (data || []).reduce((acc, { setting_key, setting_value }) => {
    acc[setting_key] = setting_value;
    return acc;
  }, {} as Record<string, string | null>);

  return {
    expiryHours: parseInt(settings['magic_link_expiry_hours'] || '72', 10),
    maxUses: parseInt(settings['magic_link_max_uses'] || '5', 10),
  };
};

/**
 * Create a new magic link for a deal participant
 */
export const createMagicLink = async (
  dealParticipantId: string,
  createdBy: string,
  customSettings?: Partial<MagicLinkSettings>
): Promise<{ data: MagicLinkData | null; error: Error | null; url: string | null }> => {
  // Get settings
  const defaultSettings = await getMagicLinkSettings();
  const settings = { ...defaultSettings, ...customSettings };

  // Generate secure token
  const token = generateSecureToken();

  // Calculate expiration
  const expiresAt = new Date(Date.now() + settings.expiryHours * 60 * 60 * 1000);

  // Insert magic link
  const { data, error } = await supabase
    .from('magic_links')
    .insert({
      deal_participant_id: dealParticipantId,
      token,
      expires_at: expiresAt.toISOString(),
      max_uses: settings.maxUses,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error as Error, url: null };
  }

  // Build the magic link URL
  const baseUrl = window.location.origin;
  const url = `${baseUrl}/access/${token}`;

  return { data: data as MagicLinkData, error: null, url };
};

/**
 * Validate a magic link token via edge function
 */
export const validateMagicLink = async (token: string): Promise<MagicLinkValidationResult> => {
  try {
    const response = await supabase.functions.invoke('validate-magic-link', {
      body: { token },
    });

    if (response.error) {
      return { isValid: false, error: response.error.message };
    }

    return response.data as MagicLinkValidationResult;
  } catch (err: any) {
    return { isValid: false, error: err.message || 'Failed to validate link' };
  }
};

/**
 * Revoke a magic link (set max_uses to used_count to prevent further use)
 */
export const revokeMagicLink = async (magicLinkId: string): Promise<{ error: Error | null }> => {
  const { error } = await supabase
    .from('magic_links')
    .update({ max_uses: 0 })
    .eq('id', magicLinkId);

  return { error: error as Error | null };
};

/**
 * Get all magic links for a deal participant
 */
export const getMagicLinksForParticipant = async (
  dealParticipantId: string
): Promise<{ data: MagicLinkData[]; error: Error | null }> => {
  const { data, error } = await supabase
    .from('magic_links')
    .select('*')
    .eq('deal_participant_id', dealParticipantId)
    .order('created_at', { ascending: false });

  return { data: (data || []) as MagicLinkData[], error: error as Error | null };
};

/**
 * Check if a magic link is still valid (not expired and not over-used)
 */
export const isMagicLinkValid = (link: MagicLinkData): boolean => {
  const now = new Date();
  const expiresAt = new Date(link.expires_at);
  return expiresAt > now && link.used_count < link.max_uses;
};

/**
 * Get magic link status text
 */
export const getMagicLinkStatus = (link: MagicLinkData): 'active' | 'expired' | 'exhausted' => {
  const now = new Date();
  const expiresAt = new Date(link.expires_at);
  
  if (expiresAt <= now) return 'expired';
  if (link.used_count >= link.max_uses) return 'exhausted';
  return 'active';
};

/**
 * Store magic link session in localStorage
 */
export const storeMagicLinkSession = (session: {
  dealId: string;
  role: string;
  participantId: string;
  dealNumber: string;
  sessionToken: string;
  expiresAt: string;
}): void => {
  localStorage.setItem('magic_link_session', JSON.stringify(session));
};

/**
 * Get magic link session from localStorage
 */
export const getMagicLinkSession = (): {
  dealId: string;
  role: string;
  participantId: string;
  dealNumber: string;
  sessionToken: string;
  expiresAt: string;
} | null => {
  const stored = localStorage.getItem('magic_link_session');
  if (!stored) return null;
  
  try {
    const session = JSON.parse(stored);
    const expiresAt = new Date(session.expiresAt);
    
    // Check if session is expired
    if (expiresAt <= new Date()) {
      localStorage.removeItem('magic_link_session');
      return null;
    }
    
    return session;
  } catch {
    localStorage.removeItem('magic_link_session');
    return null;
  }
};

/**
 * Clear magic link session
 */
export const clearMagicLinkSession = (): void => {
  localStorage.removeItem('magic_link_session');
};
