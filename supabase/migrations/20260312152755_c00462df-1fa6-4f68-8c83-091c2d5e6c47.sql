
-- Create contacts table for standalone contact management
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type text NOT NULL,
  contact_id text NOT NULL UNIQUE,
  full_name text DEFAULT '',
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  company text DEFAULT '',
  contact_data jsonb DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validation trigger for contact_type
CREATE OR REPLACE FUNCTION public.validate_contact_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.contact_type NOT IN ('lender', 'broker', 'borrower') THEN
    RAISE EXCEPTION 'Invalid contact_type: %. Must be lender, broker, or borrower.', NEW.contact_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_contact_type_trigger
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION validate_contact_type();

-- Update timestamp trigger
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "CSRs and Admins can view contacts" ON public.contacts
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "CSRs and Admins can insert contacts" ON public.contacts
  FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin')) AND auth.uid() = created_by);

CREATE POLICY "CSRs and Admins can update contacts" ON public.contacts
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "CSRs and Admins can delete contacts" ON public.contacts
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'csr') OR has_role(auth.uid(), 'admin'));

-- Function to generate sequential contact IDs
CREATE OR REPLACE FUNCTION public.generate_contact_id(p_type text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  prefix text;
  next_seq integer;
BEGIN
  CASE p_type
    WHEN 'lender' THEN prefix := 'L-';
    WHEN 'broker' THEN prefix := 'BR-';
    WHEN 'borrower' THEN prefix := 'B-';
    ELSE prefix := 'C-';
  END CASE;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(contact_id FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
  INTO next_seq
  FROM public.contacts
  WHERE contact_type = p_type;
  
  RETURN prefix || LPAD(next_seq::TEXT, 5, '0');
END;
$$;
