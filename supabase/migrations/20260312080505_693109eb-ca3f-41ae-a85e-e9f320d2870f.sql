DELETE FROM field_dictionary 
WHERE section = 'borrower' AND form_type = 'primary' 
AND field_key NOT IN (
  'br_p_borrowerType', 'br_p_borrowerId', 'br_p_fullName', 'br_p_firstName', 
  'br_p_middleInitia', 'br_p_lastName', 'br_p_capacity', 'br_p_emailAddres', 
  'br_p_creditScore', 'br_p_issue1098', 'br_p_alternatReport', 'br_p_taxIdType', 
  'br_p_tin', 'br_p_tinVerifi', 'br_p_isPrimar', 'br_p_address', 
  'br_p_borrowerCity', 'br_p_state2', 'br_p_zip', 'br_p_mailingSameAsPrimar', 
  'br_p_mailingStreet', 'br_p_mailingCity', 'br_p_mailingState', 'br_p_mailingZip', 
  'br_p_homePhone', 'br_p_workPhone', 'br_p_cellPhone', 'br_p_fax', 
  'br_p_preferreHome', 'br_p_preferreWork', 'br_p_preferreCell', 'br_p_preferreFax', 
  'br_p_deliveryPrint', 'br_p_deliveryEmail', 'br_p_deliverySms', 
  'br_p_deliveryOnline', 'br_p_deliveryMail', 
  'br_p_sendPaymenNotifi', 'br_p_sendLateNotice', 'br_p_sendBorrowStatem', 'br_p_sendMaturiNotice', 
  'br_p_vestin', 'br_p_ford1', 'br_p_ford2', 'br_p_ford3', 'br_p_ford4', 
  'br_p_ford5', 'br_p_ford6', 'br_p_ford7', 'br_p_ford8', 
  'br_p_note', 'br_p_borrowerDescri'
);