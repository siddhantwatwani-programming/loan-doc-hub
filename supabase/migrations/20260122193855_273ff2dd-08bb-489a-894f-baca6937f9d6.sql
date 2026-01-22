-- Add missing fields to field_dictionary for Allonge to Note template

-- Lender.Name
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, allowed_roles, read_only_roles)
VALUES ('Lender.Name', 'Lender Name', 'other', 'text', 'Name of the lending institution', ARRAY['admin', 'csr'], ARRAY[]::text[]);

-- Lender.Address
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, allowed_roles, read_only_roles)
VALUES ('Lender.Address', 'Lender Address', 'other', 'text', 'Full address of the lender', ARRAY['admin', 'csr'], ARRAY[]::text[]);

-- Terms.NoteDate
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, allowed_roles, read_only_roles)
VALUES ('Terms.NoteDate', 'Date of Note', 'loan_terms', 'date', 'Original note execution date', ARRAY['admin', 'csr'], ARRAY[]::text[]);

-- Allonge.PayToOrderOf
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, default_value, allowed_roles, read_only_roles)
VALUES ('Allonge.PayToOrderOf', 'Pay To The Order Of', 'other', 'text', 'Entity receiving assignment of the note', 'California Housing Finance Agency', ARRAY['admin', 'csr'], ARRAY[]::text[]);

-- Allonge.ExecutionDate
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, allowed_roles, read_only_roles)
VALUES ('Allonge.ExecutionDate', 'Allonge Execution Date', 'dates', 'date', 'Date the allonge document is executed', ARRAY['admin', 'csr'], ARRAY[]::text[]);

-- Allonge.AuthorizedSignature
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, allowed_roles, read_only_roles)
VALUES ('Allonge.AuthorizedSignature', 'Authorized Signature', 'other', 'text', 'Signature placeholder field for authorized signer', ARRAY['admin', 'csr'], ARRAY[]::text[]);

-- Allonge.PrintName
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, allowed_roles, read_only_roles)
VALUES ('Allonge.PrintName', 'Print Name', 'other', 'text', 'Printed name of the authorized signer', ARRAY['admin', 'csr'], ARRAY[]::text[]);

-- Allonge.Title
INSERT INTO public.field_dictionary (field_key, label, section, data_type, description, allowed_roles, read_only_roles)
VALUES ('Allonge.Title', 'Signer Title', 'other', 'text', 'Title of the authorized signer', ARRAY['admin', 'csr'], ARRAY[]::text[]);