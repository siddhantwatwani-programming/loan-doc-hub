
ALTER TABLE public.deal_participants
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id);
