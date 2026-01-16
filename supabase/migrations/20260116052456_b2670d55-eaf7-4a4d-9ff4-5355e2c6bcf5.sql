-- Create activity_log table
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient deal-based queries
CREATE INDEX idx_activity_log_deal_id ON public.activity_log(deal_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- CSRs and Admins can view activity logs for deals they can access
CREATE POLICY "CSRs can view activity logs"
ON public.activity_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM deals d
    WHERE d.id = activity_log.deal_id
    AND (has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  )
);

-- CSRs and Admins can insert activity logs
CREATE POLICY "CSRs can insert activity logs"
ON public.activity_log
FOR INSERT
WITH CHECK (
  auth.uid() = actor_user_id
  AND (has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Add comment
COMMENT ON TABLE public.activity_log IS 'Tracks deal-related activities for accountability and troubleshooting';