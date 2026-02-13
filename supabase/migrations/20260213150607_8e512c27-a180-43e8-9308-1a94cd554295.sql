
INSERT INTO public.field_dictionary (field_key, label, section, data_type, is_calculated, is_repeatable)
VALUES
  ('borrower.authorized_party.first_name', 'Auth Party First Name', 'borrower', 'text', false, false),
  ('borrower.authorized_party.middle_name', 'Auth Party Middle Name', 'borrower', 'text', false, false),
  ('borrower.authorized_party.last_name', 'Auth Party Last Name', 'borrower', 'text', false, false),
  ('borrower.authorized_party.capacity', 'Auth Party Capacity', 'borrower', 'text', false, false),
  ('borrower.authorized_party.email', 'Auth Party Email', 'borrower', 'text', false, false),
  ('borrower.authorized_party.address.street', 'Auth Party Street', 'borrower', 'text', false, false),
  ('borrower.authorized_party.address.city', 'Auth Party City', 'borrower', 'text', false, false),
  ('borrower.authorized_party.address.state', 'Auth Party State', 'borrower', 'text', false, false),
  ('borrower.authorized_party.address.zip', 'Auth Party ZIP', 'borrower', 'text', false, false),
  ('borrower.authorized_party.phone.home', 'Auth Party Home Phone', 'borrower', 'phone', false, false),
  ('borrower.authorized_party.phone.work', 'Auth Party Work Phone', 'borrower', 'phone', false, false),
  ('borrower.authorized_party.phone.cell', 'Auth Party Cell Phone', 'borrower', 'phone', false, false),
  ('borrower.authorized_party.phone.fax', 'Auth Party Fax', 'borrower', 'phone', false, false),
  ('borrower.authorized_party.send_pref.payment_notification', 'Auth Party Send Payment Notification', 'borrower', 'boolean', false, false),
  ('borrower.authorized_party.send_pref.late_notice', 'Auth Party Send Late Notice', 'borrower', 'boolean', false, false),
  ('borrower.authorized_party.send_pref.borrower_statement', 'Auth Party Send Borrower Statement', 'borrower', 'boolean', false, false),
  ('borrower.authorized_party.send_pref.maturity_notice', 'Auth Party Send Maturity Notice', 'borrower', 'boolean', false, false),
  ('borrower.authorized_party.delivery.online', 'Auth Party Delivery Online', 'borrower', 'boolean', false, false),
  ('borrower.authorized_party.delivery.mail', 'Auth Party Delivery Mail', 'borrower', 'boolean', false, false),
  ('borrower.authorized_party.details', 'Auth Party Details', 'borrower', 'text', false, false)
ON CONFLICT (field_key) DO NOTHING;
