-- Add email and name columns to deal_participants for tracking invites
ALTER TABLE public.deal_participants
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS name text;

-- Add comments
COMMENT ON COLUMN public.deal_participants.email IS 'Email address of the invited participant';
COMMENT ON COLUMN public.deal_participants.name IS 'Name of the invited participant';

-- Create index for faster lookups by email
CREATE INDEX IF NOT EXISTS idx_deal_participants_email ON public.deal_participants(email);

-- Add revoked_at column to track when access was revoked
ALTER TABLE public.deal_participants
ADD COLUMN IF NOT EXISTS revoked_at timestamp with time zone;

COMMENT ON COLUMN public.deal_participants.revoked_at IS 'Timestamp when participant access was revoked';