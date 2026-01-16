-- Create enums for access method and participant status
CREATE TYPE public.participant_access_method AS ENUM ('login', 'magic_link');
CREATE TYPE public.participant_status AS ENUM ('invited', 'in_progress', 'completed', 'expired');

-- Create deal_participants table
CREATE TABLE public.deal_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  access_method public.participant_access_method NOT NULL DEFAULT 'login',
  sequence_order integer,
  status public.participant_status NOT NULL DEFAULT 'invited',
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Ensure one participant per role per deal by default
  CONSTRAINT unique_deal_role UNIQUE (deal_id, role),
  
  -- Ensure role is an external role only
  CONSTRAINT external_role_only CHECK (public.is_external_role(role))
);

-- Add comments
COMMENT ON TABLE public.deal_participants IS 'Manages external participants (borrower, broker, lender) for each deal';
COMMENT ON COLUMN public.deal_participants.user_id IS 'Nullable for magic link access - will be set when user accepts invitation';
COMMENT ON COLUMN public.deal_participants.sequence_order IS 'Order in which participants should complete their tasks (nullable for no specific order)';
COMMENT ON COLUMN public.deal_participants.access_method IS 'How the participant accesses the deal - via login or magic link';

-- Create index for common queries
CREATE INDEX idx_deal_participants_deal_id ON public.deal_participants(deal_id);
CREATE INDEX idx_deal_participants_user_id ON public.deal_participants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_deal_participants_status ON public.deal_participants(status);

-- Create trigger for updated_at
CREATE TRIGGER update_deal_participants_updated_at
  BEFORE UPDATE ON public.deal_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.deal_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- CSRs and Admins can view all deal participants
CREATE POLICY "CSRs and Admins can view deal participants"
  ON public.deal_participants
  FOR SELECT
  USING (
    has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin')
  );

-- CSRs and Admins can insert deal participants
CREATE POLICY "CSRs and Admins can insert deal participants"
  ON public.deal_participants
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin')
  );

-- CSRs and Admins can update deal participants
CREATE POLICY "CSRs and Admins can update deal participants"
  ON public.deal_participants
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin')
  );

-- CSRs and Admins can delete deal participants
CREATE POLICY "CSRs and Admins can delete deal participants"
  ON public.deal_participants
  FOR DELETE
  USING (
    has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin')
  );

-- External users can view their own participant record
CREATE POLICY "Participants can view their own record"
  ON public.deal_participants
  FOR SELECT
  USING (auth.uid() = user_id);

-- External users can update their own status (for marking progress)
CREATE POLICY "Participants can update their own status"
  ON public.deal_participants
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);