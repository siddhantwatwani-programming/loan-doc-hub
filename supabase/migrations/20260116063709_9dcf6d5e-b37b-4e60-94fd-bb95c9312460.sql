-- Create magic_links table for secure deal-specific access
CREATE TABLE public.magic_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_participant_id uuid NOT NULL REFERENCES public.deal_participants(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  max_uses integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  last_used_at timestamp with time zone,
  
  -- Ensure token is valid
  CONSTRAINT valid_max_uses CHECK (max_uses > 0),
  CONSTRAINT valid_used_count CHECK (used_count >= 0 AND used_count <= max_uses)
);

-- Add comments
COMMENT ON TABLE public.magic_links IS 'Secure magic links for external participant access to deals';
COMMENT ON COLUMN public.magic_links.token IS 'Secure random token for URL - should be cryptographically random';
COMMENT ON COLUMN public.magic_links.expires_at IS 'Expiration timestamp - configurable via system settings';
COMMENT ON COLUMN public.magic_links.max_uses IS 'Maximum number of times this link can be used';
COMMENT ON COLUMN public.magic_links.used_count IS 'Number of times this link has been used';

-- Create indexes for common queries
CREATE INDEX idx_magic_links_token ON public.magic_links(token);
CREATE INDEX idx_magic_links_participant ON public.magic_links(deal_participant_id);
CREATE INDEX idx_magic_links_expires_at ON public.magic_links(expires_at);

-- Enable RLS
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- CSRs and Admins can view all magic links
CREATE POLICY "CSRs and Admins can view magic links"
  ON public.magic_links
  FOR SELECT
  USING (
    has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin')
  );

-- CSRs and Admins can create magic links
CREATE POLICY "CSRs and Admins can create magic links"
  ON public.magic_links
  FOR INSERT
  WITH CHECK (
    (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'))
    AND auth.uid() = created_by
  );

-- CSRs and Admins can update magic links (e.g., revoke)
CREATE POLICY "CSRs and Admins can update magic links"
  ON public.magic_links
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin')
  );

-- CSRs and Admins can delete magic links
CREATE POLICY "CSRs and Admins can delete magic links"
  ON public.magic_links
  FOR DELETE
  USING (
    has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin')
  );

-- Create a function to validate magic link (used by edge function with service role)
CREATE OR REPLACE FUNCTION public.validate_magic_link(_token text)
RETURNS TABLE (
  is_valid boolean,
  error_message text,
  deal_id uuid,
  role app_role,
  participant_id uuid,
  deal_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link magic_links%ROWTYPE;
  v_participant deal_participants%ROWTYPE;
  v_deal deals%ROWTYPE;
BEGIN
  -- Find the magic link
  SELECT * INTO v_link FROM magic_links WHERE token = _token;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Invalid or expired link'::text, NULL::uuid, NULL::app_role, NULL::uuid, NULL::text;
    RETURN;
  END IF;
  
  -- Check expiration
  IF v_link.expires_at < now() THEN
    RETURN QUERY SELECT false, 'This link has expired'::text, NULL::uuid, NULL::app_role, NULL::uuid, NULL::text;
    RETURN;
  END IF;
  
  -- Check usage count
  IF v_link.used_count >= v_link.max_uses THEN
    RETURN QUERY SELECT false, 'This link has reached its maximum uses'::text, NULL::uuid, NULL::app_role, NULL::uuid, NULL::text;
    RETURN;
  END IF;
  
  -- Get participant info
  SELECT * INTO v_participant FROM deal_participants WHERE id = v_link.deal_participant_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Participant not found'::text, NULL::uuid, NULL::app_role, NULL::uuid, NULL::text;
    RETURN;
  END IF;
  
  -- Get deal info
  SELECT * INTO v_deal FROM deals WHERE id = v_participant.deal_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Deal not found'::text, NULL::uuid, NULL::app_role, NULL::uuid, NULL::text;
    RETURN;
  END IF;
  
  -- Update usage count and last_used_at
  UPDATE magic_links 
  SET used_count = used_count + 1, last_used_at = now()
  WHERE id = v_link.id;
  
  -- Return valid result
  RETURN QUERY SELECT 
    true, 
    NULL::text, 
    v_participant.deal_id,
    v_participant.role,
    v_participant.id,
    v_deal.deal_number;
END;
$$;

-- Add default system settings for magic link configuration
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description) VALUES
  ('magic_link_expiry_hours', '72', 'number', 'Number of hours before a magic link expires'),
  ('magic_link_max_uses', '5', 'number', 'Maximum number of times a magic link can be used')
ON CONFLICT (setting_key) DO NOTHING;