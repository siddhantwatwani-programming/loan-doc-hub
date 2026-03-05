
CREATE TABLE public.event_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  event_number integer NOT NULL DEFAULT 0,
  actor_user_id uuid NOT NULL,
  section text NOT NULL,
  details jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_journal_deal ON public.event_journal(deal_id, event_number DESC);
ALTER TABLE public.event_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CSRs can view event journal" ON public.event_journal
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "CSRs can insert event journal" ON public.event_journal
  FOR INSERT TO authenticated
  WITH CHECK ((has_role(auth.uid(), 'csr'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) AND auth.uid() = actor_user_id);

CREATE OR REPLACE FUNCTION public.set_event_journal_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  SELECT COALESCE(MAX(event_number), 0) + 1 INTO NEW.event_number
  FROM public.event_journal WHERE deal_id = NEW.deal_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_event_journal_number
  BEFORE INSERT ON public.event_journal
  FOR EACH ROW EXECUTE FUNCTION public.set_event_journal_number();
