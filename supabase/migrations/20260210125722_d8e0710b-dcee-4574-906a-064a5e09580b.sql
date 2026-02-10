-- Fix Terms.LoanNumber data_type from 'number' to 'text'
-- Loan numbers are identifiers (e.g., "LN-001"), not numeric values
UPDATE field_dictionary 
SET data_type = 'text', updated_at = now()
WHERE field_key = 'Terms.LoanNumber' AND data_type = 'number';