CREATE OR REPLACE FUNCTION public.validate_contact_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.contact_type NOT IN ('lender', 'broker', 'borrower', 'additional_guarantor', 'authorized_party') THEN
    RAISE EXCEPTION 'Invalid contact_type: %. Must be lender, broker, borrower, additional_guarantor, or authorized_party.', NEW.contact_type;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_contact_id(p_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  prefix text;
  next_seq integer;
BEGIN
  CASE p_type
    WHEN 'lender' THEN prefix := 'L-';
    WHEN 'broker' THEN prefix := 'BR-';
    WHEN 'borrower' THEN prefix := 'B-';
    WHEN 'additional_guarantor' THEN prefix := 'AG-';
    WHEN 'authorized_party' THEN prefix := 'AP-';
    ELSE prefix := 'C-';
  END CASE;

  SELECT COALESCE(MAX(CAST(SUBSTRING(contact_id FROM LENGTH(prefix) + 1) AS INTEGER)), 0) + 1
  INTO next_seq
  FROM public.contacts
  WHERE contact_type = p_type;

  RETURN prefix || LPAD(next_seq::TEXT, 5, '0');
END;
$function$;