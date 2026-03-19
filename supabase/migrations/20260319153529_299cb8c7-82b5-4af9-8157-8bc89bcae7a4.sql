
CREATE TABLE public.conversation_log_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_log_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read conversation_log_types"
  ON public.conversation_log_types
  FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.conversation_log_types (label, display_order) VALUES
  ('Conversation Log', 1),
  ('Attorney / Client', 2),
  ('Internal', 3);
