
-- Create messages table for storing sent message history
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
  message_type TEXT NOT NULL DEFAULT 'email' CHECK (message_type IN ('email', 'sms')),
  subject TEXT,
  body TEXT NOT NULL,
  recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- All authenticated users can insert messages (sender must be self)
CREATE POLICY "Users can insert their own messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Users can view their own sent messages
CREATE POLICY "Users can view their own messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

-- CSR/Admin can view all messages
CREATE POLICY "CSRs and Admins can view all messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
