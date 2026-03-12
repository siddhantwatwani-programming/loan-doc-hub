
CREATE OR REPLACE FUNCTION public.validate_contact_type()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO 'public' AS $$
BEGIN
  IF NEW.contact_type NOT IN ('lender', 'broker', 'borrower') THEN
    RAISE EXCEPTION 'Invalid contact_type: %. Must be lender, broker, or borrower.', NEW.contact_type;
  END IF;
  RETURN NEW;
END;
$$;
