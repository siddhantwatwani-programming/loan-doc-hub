-- Add missing investor fields for RE 870 Investor Questionnaire
INSERT INTO field_dictionary (field_key, label, section, data_type, description) VALUES
-- Education Information
('investor.highest_education_level', 'Highest Year of Education Completed', 'other', 'text', 'Highest year of education completed by the investor'),
('investor.graduation_year', 'Year of Graduation', 'other', 'text', 'Year the investor graduated'),
('investor.degree_or_certificate', 'Degree / Diploma / Certification', 'other', 'text', 'Degree, diploma, or certification obtained'),

-- Investment Experience
('investor.mutual_funds_experience', 'Experience in Mutual Funds', 'other', 'text', 'Investor experience level in mutual funds'),
('investor.annuities_experience', 'Experience in Annuities', 'other', 'text', 'Investor experience level in annuities'),
('investor.bonds_experience', 'Experience in Bonds', 'other', 'text', 'Investor experience level in bonds'),
('investor.stocks_experience', 'Experience in Stocks / Shares', 'other', 'text', 'Investor experience level in stocks/shares'),
('investor.options_experience', 'Experience in Options', 'other', 'text', 'Investor experience level in options'),
('investor.other_investment_experience', 'Other Investment Experience', 'other', 'text', 'Investor experience in other investment types'),
('investor.total_investment_years', 'Total Years of Investment Experience', 'other', 'number', 'Total years of investment experience'),

-- Trust Deed Experience
('investor.trust_deed_months', 'Months of Experience in Trust Deed / Note Investments', 'other', 'number', 'Months of experience in trust deed/note investments'),
('investor.current_other_investments', 'Other Current Investments', 'other', 'text', 'Other current investments held by investor'),

-- Co-Investor Acknowledgements
('investor.co_investor_signature', 'Co-Investor Signature', 'other', 'text', 'Signature of co-investor'),
('investor.co_investor_signature_date', 'Date Signed (Co-Investor)', 'other', 'date', 'Date co-investor signed the questionnaire');