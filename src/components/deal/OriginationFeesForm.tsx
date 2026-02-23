import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { CalculationResult } from '@/lib/calculationEngine';

interface OriginationFeesFormProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

// Field keys for Origination Fees (HUD-1 form)
const FIELD_KEYS = {
  // 800 Items Payable in Connection with Loan
  lendersLoanOriginationFee_payable_to: 'origination_fees.801_lenders_loan_origination_fee_payable_to',
  lendersLoanOriginationFee_d: 'origination_fees.801_lenders_loan_origination_fee_d',
  lendersLoanOriginationFee_charge: 'origination_fees.801_lenders_loan_origination_fee_charge',
  lendersLoanOriginationFee_broker: 'origination_fees.801_lenders_loan_origination_fee_broker',
  lendersLoanOriginationFee_others: 'origination_fees.801_lenders_loan_origination_fee_others',
  lendersLoanOriginationFee_apr: 'origination_fees.801_lenders_loan_origination_fee_apr',
  lendersLoanOriginationFee_paid_to_company: 'origination_fees.801_lenders_loan_origination_fee_paid_to_company',
  lendersLoanOriginationFee_oral_disclosure: 'origination_fees.801_lenders_loan_origination_fee_oral_disclosure',

  lendersLoanDiscountFee_payable_to: 'origination_fees.802_lenders_loan_discount_fee_payable_to',
  lendersLoanDiscountFee_d: 'origination_fees.802_lenders_loan_discount_fee_d',
  lendersLoanDiscountFee_charge: 'origination_fees.802_lenders_loan_discount_fee_charge',
  lendersLoanDiscountFee_broker: 'origination_fees.802_lenders_loan_discount_fee_broker',
  lendersLoanDiscountFee_others: 'origination_fees.802_lenders_loan_discount_fee_others',
  lendersLoanDiscountFee_apr: 'origination_fees.802_lenders_loan_discount_fee_apr',
  lendersLoanDiscountFee_paid_to_company: 'origination_fees.802_lenders_loan_discount_fee_paid_to_company',
  lendersLoanDiscountFee_oral_disclosure: 'origination_fees.802_lenders_loan_discount_fee_oral_disclosure',

  appraisalFee_payable_to: 'origination_fees.803_appraisal_fee_payable_to',
  appraisalFee_d: 'origination_fees.803_appraisal_fee_d',
  appraisalFee_charge: 'origination_fees.803_appraisal_fee_charge',
  appraisalFee_broker: 'origination_fees.803_appraisal_fee_broker',
  appraisalFee_others: 'origination_fees.803_appraisal_fee_others',
  appraisalFee_apr: 'origination_fees.803_appraisal_fee_apr',
  appraisalFee_paid_to_company: 'origination_fees.803_appraisal_fee_paid_to_company',
  appraisalFee_oral_disclosure: 'origination_fees.803_appraisal_fee_oral_disclosure',

  creditReport_payable_to: 'origination_fees.804_credit_report_payable_to',
  creditReport_d: 'origination_fees.804_credit_report_d',
  creditReport_charge: 'origination_fees.804_credit_report_charge',
  creditReport_broker: 'origination_fees.804_credit_report_broker',
  creditReport_others: 'origination_fees.804_credit_report_others',
  creditReport_apr: 'origination_fees.804_credit_report_apr',
  creditReport_paid_to_company: 'origination_fees.804_credit_report_paid_to_company',
  creditReport_oral_disclosure: 'origination_fees.804_credit_report_oral_disclosure',

  lendersInspectionFee_payable_to: 'origination_fees.805_lenders_inspection_fee_payable_to',
  lendersInspectionFee_d: 'origination_fees.805_lenders_inspection_fee_d',
  lendersInspectionFee_charge: 'origination_fees.805_lenders_inspection_fee_charge',
  lendersInspectionFee_broker: 'origination_fees.805_lenders_inspection_fee_broker',
  lendersInspectionFee_others: 'origination_fees.805_lenders_inspection_fee_others',
  lendersInspectionFee_apr: 'origination_fees.805_lenders_inspection_fee_apr',
  lendersInspectionFee_paid_to_company: 'origination_fees.805_lenders_inspection_fee_paid_to_company',
  lendersInspectionFee_oral_disclosure: 'origination_fees.805_lenders_inspection_fee_oral_disclosure',

  mortgageBrokerFee_payable_to: 'origination_fees.808_mortgage_broker_fee_payable_to',
  mortgageBrokerFee_d: 'origination_fees.808_mortgage_broker_fee_d',
  mortgageBrokerFee_charge: 'origination_fees.808_mortgage_broker_fee_charge',
  mortgageBrokerFee_broker: 'origination_fees.808_mortgage_broker_fee_broker',
  mortgageBrokerFee_others: 'origination_fees.808_mortgage_broker_fee_others',
  mortgageBrokerFee_apr: 'origination_fees.808_mortgage_broker_fee_apr',
  mortgageBrokerFee_paid_to_company: 'origination_fees.808_mortgage_broker_fee_paid_to_company',
  mortgageBrokerFee_oral_disclosure: 'origination_fees.808_mortgage_broker_fee_oral_disclosure',

  taxServiceFee_payable_to: 'origination_fees.809_tax_service_fee_payable_to',
  taxServiceFee_d: 'origination_fees.809_tax_service_fee_d',
  taxServiceFee_charge: 'origination_fees.809_tax_service_fee_charge',
  taxServiceFee_broker: 'origination_fees.809_tax_service_fee_broker',
  taxServiceFee_others: 'origination_fees.809_tax_service_fee_others',
  taxServiceFee_apr: 'origination_fees.809_tax_service_fee_apr',
  taxServiceFee_paid_to_company: 'origination_fees.809_tax_service_fee_paid_to_company',
  taxServiceFee_oral_disclosure: 'origination_fees.809_tax_service_fee_oral_disclosure',

  processingFee_payable_to: 'origination_fees.810_processing_fee_payable_to',
  processingFee_d: 'origination_fees.810_processing_fee_d',
  processingFee_charge: 'origination_fees.810_processing_fee_charge',
  processingFee_broker: 'origination_fees.810_processing_fee_broker',
  processingFee_others: 'origination_fees.810_processing_fee_others',
  processingFee_apr: 'origination_fees.810_processing_fee_apr',
  processingFee_paid_to_company: 'origination_fees.810_processing_fee_paid_to_company',
  processingFee_oral_disclosure: 'origination_fees.810_processing_fee_oral_disclosure',

  underwritingFee_payable_to: 'origination_fees.811_underwriting_fee_payable_to',
  underwritingFee_d: 'origination_fees.811_underwriting_fee_d',
  underwritingFee_charge: 'origination_fees.811_underwriting_fee_charge',
  underwritingFee_broker: 'origination_fees.811_underwriting_fee_broker',
  underwritingFee_others: 'origination_fees.811_underwriting_fee_others',
  underwritingFee_apr: 'origination_fees.811_underwriting_fee_apr',
  underwritingFee_paid_to_company: 'origination_fees.811_underwriting_fee_paid_to_company',
  underwritingFee_oral_disclosure: 'origination_fees.811_underwriting_fee_oral_disclosure',

  wireTransferFee_payable_to: 'origination_fees.812_wire_transfer_fee_payable_to',
  wireTransferFee_d: 'origination_fees.812_wire_transfer_fee_d',
  wireTransferFee_charge: 'origination_fees.812_wire_transfer_fee_charge',
  wireTransferFee_broker: 'origination_fees.812_wire_transfer_fee_broker',
  wireTransferFee_others: 'origination_fees.812_wire_transfer_fee_others',
  wireTransferFee_apr: 'origination_fees.812_wire_transfer_fee_apr',
  wireTransferFee_paid_to_company: 'origination_fees.812_wire_transfer_fee_paid_to_company',
  wireTransferFee_oral_disclosure: 'origination_fees.812_wire_transfer_fee_oral_disclosure',

  customItem800_label: 'origination_fees.800_custom_item_label',
  customItem800_payable_to: 'origination_fees.800_custom_item_payable_to',
  customItem800_d: 'origination_fees.800_custom_item_d',
  customItem800_charge: 'origination_fees.800_custom_item_charge',
  customItem800_broker: 'origination_fees.800_custom_item_broker',
  customItem800_others: 'origination_fees.800_custom_item_others',
  customItem800_apr: 'origination_fees.800_custom_item_apr',
  customItem800_paid_to_company: 'origination_fees.800_custom_item_paid_to_company',
  customItem800_oral_disclosure: 'origination_fees.800_custom_item_oral_disclosure',

  // 900 Items Required by Lender to be Paid in Advance
  interestForDays_payable_to: 'origination_fees.901_interest_for_days_payable_to',
  interestForDays_d: 'origination_fees.901_interest_for_days_d',
  interestForDays_charge: 'origination_fees.901_interest_for_days_charge',
  interestForDays_broker: 'origination_fees.901_interest_for_days_broker',
  interestForDays_others: 'origination_fees.901_interest_for_days_others',
  interestForDays_apr: 'origination_fees.901_interest_for_days_apr',
  interestForDays_paid_to_company: 'origination_fees.901_interest_for_days_paid_to_company',
  interestForDays_oral_disclosure: 'origination_fees.901_interest_for_days_oral_disclosure',

  mortgageInsurancePremiums_payable_to: 'origination_fees.902_mortgage_insurance_premiums_payable_to',
  mortgageInsurancePremiums_d: 'origination_fees.902_mortgage_insurance_premiums_d',
  mortgageInsurancePremiums_charge: 'origination_fees.902_mortgage_insurance_premiums_charge',
  mortgageInsurancePremiums_broker: 'origination_fees.902_mortgage_insurance_premiums_broker',
  mortgageInsurancePremiums_others: 'origination_fees.902_mortgage_insurance_premiums_others',
  mortgageInsurancePremiums_apr: 'origination_fees.902_mortgage_insurance_premiums_apr',
  mortgageInsurancePremiums_paid_to_company: 'origination_fees.902_mortgage_insurance_premiums_paid_to_company',
  mortgageInsurancePremiums_oral_disclosure: 'origination_fees.902_mortgage_insurance_premiums_oral_disclosure',

  hazardInsurancePremiums_payable_to: 'origination_fees.903_hazard_insurance_premiums_payable_to',
  hazardInsurancePremiums_d: 'origination_fees.903_hazard_insurance_premiums_d',
  hazardInsurancePremiums_charge: 'origination_fees.903_hazard_insurance_premiums_charge',
  hazardInsurancePremiums_broker: 'origination_fees.903_hazard_insurance_premiums_broker',
  hazardInsurancePremiums_others: 'origination_fees.903_hazard_insurance_premiums_others',
  hazardInsurancePremiums_apr: 'origination_fees.903_hazard_insurance_premiums_apr',
  hazardInsurancePremiums_paid_to_company: 'origination_fees.903_hazard_insurance_premiums_paid_to_company',
  hazardInsurancePremiums_oral_disclosure: 'origination_fees.903_hazard_insurance_premiums_oral_disclosure',

  countyPropertyTaxes_payable_to: 'origination_fees.904_county_property_taxes_payable_to',
  countyPropertyTaxes_d: 'origination_fees.904_county_property_taxes_d',
  countyPropertyTaxes_charge: 'origination_fees.904_county_property_taxes_charge',
  countyPropertyTaxes_broker: 'origination_fees.904_county_property_taxes_broker',
  countyPropertyTaxes_others: 'origination_fees.904_county_property_taxes_others',
  countyPropertyTaxes_apr: 'origination_fees.904_county_property_taxes_apr',
  countyPropertyTaxes_paid_to_company: 'origination_fees.904_county_property_taxes_paid_to_company',
  countyPropertyTaxes_oral_disclosure: 'origination_fees.904_county_property_taxes_oral_disclosure',

  vaFundingFee_payable_to: 'origination_fees.905_va_funding_fee_payable_to',
  vaFundingFee_d: 'origination_fees.905_va_funding_fee_d',
  vaFundingFee_charge: 'origination_fees.905_va_funding_fee_charge',
  vaFundingFee_broker: 'origination_fees.905_va_funding_fee_broker',
  vaFundingFee_others: 'origination_fees.905_va_funding_fee_others',
  vaFundingFee_apr: 'origination_fees.905_va_funding_fee_apr',
  vaFundingFee_paid_to_company: 'origination_fees.905_va_funding_fee_paid_to_company',
  vaFundingFee_oral_disclosure: 'origination_fees.905_va_funding_fee_oral_disclosure',

  customItem900_label: 'origination_fees.900_custom_item_label',
  customItem900_payable_to: 'origination_fees.900_custom_item_payable_to',
  customItem900_d: 'origination_fees.900_custom_item_d',
  customItem900_charge: 'origination_fees.900_custom_item_charge',
  customItem900_broker: 'origination_fees.900_custom_item_broker',
  customItem900_others: 'origination_fees.900_custom_item_others',
  customItem900_apr: 'origination_fees.900_custom_item_apr',
  customItem900_paid_to_company: 'origination_fees.900_custom_item_paid_to_company',
  customItem900_oral_disclosure: 'origination_fees.900_custom_item_oral_disclosure',

  // 1000 Reserves Deposited with Lender or Other
  hazardInsurance_months: 'origination_fees.1001_hazard_insurance_months',
  hazardInsurance_perMonth: 'origination_fees.1001_hazard_insurance_per_month',
  hazardInsurance_total: 'origination_fees.1001_hazard_insurance_total',
  hazardInsurance_charge: 'origination_fees.1001_hazard_insurance_charge',
  hazardInsurance_broker: 'origination_fees.1001_hazard_insurance_broker',
  hazardInsurance_others: 'origination_fees.1001_hazard_insurance_others',
  hazardInsurance_apr: 'origination_fees.1001_hazard_insurance_apr',
  hazardInsurance_paid_to_company: 'origination_fees.1001_hazard_insurance_paid_to_company',
  hazardInsurance_oral_disclosure: 'origination_fees.1001_hazard_insurance_oral_disclosure',

  mortgageInsurance_months: 'origination_fees.1002_mortgage_insurance_months',
  mortgageInsurance_perMonth: 'origination_fees.1002_mortgage_insurance_per_month',
  mortgageInsurance_total: 'origination_fees.1002_mortgage_insurance_total',
  mortgageInsurance_charge: 'origination_fees.1002_mortgage_insurance_charge',
  mortgageInsurance_broker: 'origination_fees.1002_mortgage_insurance_broker',
  mortgageInsurance_others: 'origination_fees.1002_mortgage_insurance_others',
  mortgageInsurance_apr: 'origination_fees.1002_mortgage_insurance_apr',
  mortgageInsurance_paid_to_company: 'origination_fees.1002_mortgage_insurance_paid_to_company',
  mortgageInsurance_oral_disclosure: 'origination_fees.1002_mortgage_insurance_oral_disclosure',

  coPropertyTaxes_months: 'origination_fees.1004_co_property_taxes_months',
  coPropertyTaxes_perMonth: 'origination_fees.1004_co_property_taxes_per_month',
  coPropertyTaxes_total: 'origination_fees.1004_co_property_taxes_total',
  coPropertyTaxes_charge: 'origination_fees.1004_co_property_taxes_charge',
  coPropertyTaxes_broker: 'origination_fees.1004_co_property_taxes_broker',
  coPropertyTaxes_others: 'origination_fees.1004_co_property_taxes_others',
  coPropertyTaxes_apr: 'origination_fees.1004_co_property_taxes_apr',
  coPropertyTaxes_paid_to_company: 'origination_fees.1004_co_property_taxes_paid_to_company',
  coPropertyTaxes_oral_disclosure: 'origination_fees.1004_co_property_taxes_oral_disclosure',

  customItem1000_label: 'origination_fees.1000_custom_item_label',
  customItem1000_payable_to: 'origination_fees.1000_custom_item_payable_to',
  customItem1000_d: 'origination_fees.1000_custom_item_d',
  customItem1000_charge: 'origination_fees.1000_custom_item_charge',
  customItem1000_broker: 'origination_fees.1000_custom_item_broker',
  customItem1000_others: 'origination_fees.1000_custom_item_others',
  customItem1000_apr: 'origination_fees.1000_custom_item_apr',
  customItem1000_paid_to_company: 'origination_fees.1000_custom_item_paid_to_company',
  customItem1000_oral_disclosure: 'origination_fees.1000_custom_item_oral_disclosure',

  // 1100 Title Charges
  settlementClosingFee_payable_to: 'origination_fees.1101_settlement_closing_fee_payable_to',
  settlementClosingFee_d: 'origination_fees.1101_settlement_closing_fee_d',
  settlementClosingFee_charge: 'origination_fees.1101_settlement_closing_fee_charge',
  settlementClosingFee_broker: 'origination_fees.1101_settlement_closing_fee_broker',
  settlementClosingFee_others: 'origination_fees.1101_settlement_closing_fee_others',
  settlementClosingFee_apr: 'origination_fees.1101_settlement_closing_fee_apr',
  settlementClosingFee_paid_to_company: 'origination_fees.1101_settlement_closing_fee_paid_to_company',
  settlementClosingFee_oral_disclosure: 'origination_fees.1101_settlement_closing_fee_oral_disclosure',

  docPreparationFee_payable_to: 'origination_fees.1105_doc_preparation_fee_payable_to',
  docPreparationFee_d: 'origination_fees.1105_doc_preparation_fee_d',
  docPreparationFee_charge: 'origination_fees.1105_doc_preparation_fee_charge',
  docPreparationFee_broker: 'origination_fees.1105_doc_preparation_fee_broker',
  docPreparationFee_others: 'origination_fees.1105_doc_preparation_fee_others',
  docPreparationFee_apr: 'origination_fees.1105_doc_preparation_fee_apr',
  docPreparationFee_paid_to_company: 'origination_fees.1105_doc_preparation_fee_paid_to_company',
  docPreparationFee_oral_disclosure: 'origination_fees.1105_doc_preparation_fee_oral_disclosure',

  notaryFee_payable_to: 'origination_fees.1106_notary_fee_payable_to',
  notaryFee_d: 'origination_fees.1106_notary_fee_d',
  notaryFee_charge: 'origination_fees.1106_notary_fee_charge',
  notaryFee_broker: 'origination_fees.1106_notary_fee_broker',
  notaryFee_others: 'origination_fees.1106_notary_fee_others',
  notaryFee_apr: 'origination_fees.1106_notary_fee_apr',
  notaryFee_paid_to_company: 'origination_fees.1106_notary_fee_paid_to_company',
  notaryFee_oral_disclosure: 'origination_fees.1106_notary_fee_oral_disclosure',

  titleInsurance_payable_to: 'origination_fees.1108_title_insurance_payable_to',
  titleInsurance_d: 'origination_fees.1108_title_insurance_d',
  titleInsurance_charge: 'origination_fees.1108_title_insurance_charge',
  titleInsurance_broker: 'origination_fees.1108_title_insurance_broker',
  titleInsurance_others: 'origination_fees.1108_title_insurance_others',
  titleInsurance_apr: 'origination_fees.1108_title_insurance_apr',
  titleInsurance_paid_to_company: 'origination_fees.1108_title_insurance_paid_to_company',
  titleInsurance_oral_disclosure: 'origination_fees.1108_title_insurance_oral_disclosure',

  customItem1100_label: 'origination_fees.1100_custom_item_label',
  customItem1100_payable_to: 'origination_fees.1100_custom_item_payable_to',
  customItem1100_d: 'origination_fees.1100_custom_item_d',
  customItem1100_charge: 'origination_fees.1100_custom_item_charge',
  customItem1100_broker: 'origination_fees.1100_custom_item_broker',
  customItem1100_others: 'origination_fees.1100_custom_item_others',
  customItem1100_apr: 'origination_fees.1100_custom_item_apr',
  customItem1100_paid_to_company: 'origination_fees.1100_custom_item_paid_to_company',
  customItem1100_oral_disclosure: 'origination_fees.1100_custom_item_oral_disclosure',

  // 1200 Government Recording and Transfer Charges
  recordingFees_payable_to: 'origination_fees.1201_recording_fees_payable_to',
  recordingFees_d: 'origination_fees.1201_recording_fees_d',
  recordingFees_charge: 'origination_fees.1201_recording_fees_charge',
  recordingFees_broker: 'origination_fees.1201_recording_fees_broker',
  recordingFees_others: 'origination_fees.1201_recording_fees_others',
  recordingFees_apr: 'origination_fees.1201_recording_fees_apr',
  recordingFees_paid_to_company: 'origination_fees.1201_recording_fees_paid_to_company',
  recordingFees_oral_disclosure: 'origination_fees.1201_recording_fees_oral_disclosure',

  // 1301 Add this line
  addThisLine_label: 'origination_fees.1301_add_this_line_label',
  addThisLine_payable_to: 'origination_fees.1301_add_this_line_payable_to',
  addThisLine_d: 'origination_fees.1301_add_this_line_d',
  addThisLine_charge: 'origination_fees.1301_add_this_line_charge',
  addThisLine_broker: 'origination_fees.1301_add_this_line_broker',
  addThisLine_others: 'origination_fees.1301_add_this_line_others',
  addThisLine_apr: 'origination_fees.1301_add_this_line_apr',
  addThisLine_paid_to_company: 'origination_fees.1301_add_this_line_paid_to_company',
  addThisLine_oral_disclosure: 'origination_fees.1301_add_this_line_oral_disclosure',

  cityCountyTaxStamps_payable_to: 'origination_fees.1202_city_county_tax_stamps_payable_to',
  cityCountyTaxStamps_d: 'origination_fees.1202_city_county_tax_stamps_d',
  cityCountyTaxStamps_charge: 'origination_fees.1202_city_county_tax_stamps_charge',
  cityCountyTaxStamps_broker: 'origination_fees.1202_city_county_tax_stamps_broker',
  cityCountyTaxStamps_others: 'origination_fees.1202_city_county_tax_stamps_others',
  cityCountyTaxStamps_apr: 'origination_fees.1202_city_county_tax_stamps_apr',
  cityCountyTaxStamps_paid_to_company: 'origination_fees.1202_city_county_tax_stamps_paid_to_company',
  cityCountyTaxStamps_oral_disclosure: 'origination_fees.1202_city_county_tax_stamps_oral_disclosure',

  customItem1200_label: 'origination_fees.1200_custom_item_label',
  customItem1200_payable_to: 'origination_fees.1200_custom_item_payable_to',
  customItem1200_d: 'origination_fees.1200_custom_item_d',
  customItem1200_charge: 'origination_fees.1200_custom_item_charge',
  customItem1200_broker: 'origination_fees.1200_custom_item_broker',
  customItem1200_others: 'origination_fees.1200_custom_item_others',
  customItem1200_apr: 'origination_fees.1200_custom_item_apr',
  customItem1200_paid_to_company: 'origination_fees.1200_custom_item_paid_to_company',
  customItem1200_oral_disclosure: 'origination_fees.1200_custom_item_oral_disclosure',

  // 1300 Additional Settlement Charges
  pestInspection_payable_to: 'origination_fees.1302_pest_inspection_payable_to',
  pestInspection_d: 'origination_fees.1302_pest_inspection_d',
  pestInspection_charge: 'origination_fees.1302_pest_inspection_charge',
  pestInspection_broker: 'origination_fees.1302_pest_inspection_broker',
  pestInspection_others: 'origination_fees.1302_pest_inspection_others',
  pestInspection_apr: 'origination_fees.1302_pest_inspection_apr',
  pestInspection_paid_to_company: 'origination_fees.1302_pest_inspection_paid_to_company',
  pestInspection_oral_disclosure: 'origination_fees.1302_pest_inspection_oral_disclosure',

  // Custom rows for 1300
  customItem1300_1_label: 'origination_fees.1300_custom_item_1_label',
  customItem1300_1_payable_to: 'origination_fees.1300_custom_item_1_payable_to',
  customItem1300_1_d: 'origination_fees.1300_custom_item_1_d',
  customItem1300_1_charge: 'origination_fees.1300_custom_item_1_charge',
  customItem1300_1_broker: 'origination_fees.1300_custom_item_1_broker',
  customItem1300_1_others: 'origination_fees.1300_custom_item_1_others',
  customItem1300_1_apr: 'origination_fees.1300_custom_item_1_apr',
  customItem1300_1_paid_to_company: 'origination_fees.1300_custom_item_1_paid_to_company',
  customItem1300_1_oral_disclosure: 'origination_fees.1300_custom_item_1_oral_disclosure',

  customItem1300_2_label: 'origination_fees.1300_custom_item_2_label',
  customItem1300_2_payable_to: 'origination_fees.1300_custom_item_2_payable_to',
  customItem1300_2_d: 'origination_fees.1300_custom_item_2_d',
  customItem1300_2_charge: 'origination_fees.1300_custom_item_2_charge',
  customItem1300_2_broker: 'origination_fees.1300_custom_item_2_broker',
  customItem1300_2_others: 'origination_fees.1300_custom_item_2_others',
  customItem1300_2_apr: 'origination_fees.1300_custom_item_2_apr',
  customItem1300_2_paid_to_company: 'origination_fees.1300_custom_item_2_paid_to_company',
  customItem1300_2_oral_disclosure: 'origination_fees.1300_custom_item_2_oral_disclosure',

  customItem1300_3_label: 'origination_fees.1300_custom_item_3_label',
  customItem1300_3_payable_to: 'origination_fees.1300_custom_item_3_payable_to',
  customItem1300_3_d: 'origination_fees.1300_custom_item_3_d',
  customItem1300_3_charge: 'origination_fees.1300_custom_item_3_charge',
  customItem1300_3_broker: 'origination_fees.1300_custom_item_3_broker',
  customItem1300_3_others: 'origination_fees.1300_custom_item_3_others',
  customItem1300_3_apr: 'origination_fees.1300_custom_item_3_apr',
  customItem1300_3_paid_to_company: 'origination_fees.1300_custom_item_3_paid_to_company',
  customItem1300_3_oral_disclosure: 'origination_fees.1300_custom_item_3_oral_disclosure',

  customItem1300_4_label: 'origination_fees.1300_custom_item_4_label',
  customItem1300_4_payable_to: 'origination_fees.1300_custom_item_4_payable_to',
  customItem1300_4_d: 'origination_fees.1300_custom_item_4_d',
  customItem1300_4_charge: 'origination_fees.1300_custom_item_4_charge',
  customItem1300_4_broker: 'origination_fees.1300_custom_item_4_broker',
  customItem1300_4_others: 'origination_fees.1300_custom_item_4_others',
  customItem1300_4_apr: 'origination_fees.1300_custom_item_4_apr',
  customItem1300_4_paid_to_company: 'origination_fees.1300_custom_item_4_paid_to_company',
  customItem1300_4_oral_disclosure: 'origination_fees.1300_custom_item_4_oral_disclosure',

  customItem1300_5_label: 'origination_fees.1300_custom_item_5_label',
  customItem1300_5_payable_to: 'origination_fees.1300_custom_item_5_payable_to',
  customItem1300_5_d: 'origination_fees.1300_custom_item_5_d',
  customItem1300_5_charge: 'origination_fees.1300_custom_item_5_charge',
  customItem1300_5_broker: 'origination_fees.1300_custom_item_5_broker',
  customItem1300_5_others: 'origination_fees.1300_custom_item_5_others',
  customItem1300_5_apr: 'origination_fees.1300_custom_item_5_apr',
  customItem1300_5_paid_to_company: 'origination_fees.1300_custom_item_5_paid_to_company',
  customItem1300_5_oral_disclosure: 'origination_fees.1300_custom_item_5_oral_disclosure',

  customItem1300_6_label: 'origination_fees.1300_custom_item_6_label',
  customItem1300_6_payable_to: 'origination_fees.1300_custom_item_6_payable_to',
  customItem1300_6_d: 'origination_fees.1300_custom_item_6_d',
  customItem1300_6_charge: 'origination_fees.1300_custom_item_6_charge',
  customItem1300_6_broker: 'origination_fees.1300_custom_item_6_broker',
  customItem1300_6_others: 'origination_fees.1300_custom_item_6_others',
  customItem1300_6_apr: 'origination_fees.1300_custom_item_6_apr',
  customItem1300_6_paid_to_company: 'origination_fees.1300_custom_item_6_paid_to_company',
  customItem1300_6_oral_disclosure: 'origination_fees.1300_custom_item_6_oral_disclosure',

  customItem1300_7_label: 'origination_fees.1300_custom_item_7_label',
  customItem1300_7_payable_to: 'origination_fees.1300_custom_item_7_payable_to',
  customItem1300_7_d: 'origination_fees.1300_custom_item_7_d',
  customItem1300_7_charge: 'origination_fees.1300_custom_item_7_charge',
  customItem1300_7_broker: 'origination_fees.1300_custom_item_7_broker',
  customItem1300_7_others: 'origination_fees.1300_custom_item_7_others',
  customItem1300_7_apr: 'origination_fees.1300_custom_item_7_apr',
  customItem1300_7_paid_to_company: 'origination_fees.1300_custom_item_7_paid_to_company',
  customItem1300_7_oral_disclosure: 'origination_fees.1300_custom_item_7_oral_disclosure',

  customItem1300_8_label: 'origination_fees.1300_custom_item_8_label',
  customItem1300_8_payable_to: 'origination_fees.1300_custom_item_8_payable_to',
  customItem1300_8_d: 'origination_fees.1300_custom_item_8_d',
  customItem1300_8_charge: 'origination_fees.1300_custom_item_8_charge',
  customItem1300_8_broker: 'origination_fees.1300_custom_item_8_broker',
  customItem1300_8_others: 'origination_fees.1300_custom_item_8_others',
  customItem1300_8_apr: 'origination_fees.1300_custom_item_8_apr',
  customItem1300_8_paid_to_company: 'origination_fees.1300_custom_item_8_paid_to_company',
  customItem1300_8_oral_disclosure: 'origination_fees.1300_custom_item_8_oral_disclosure',

  // Subtotal and Total
  subtotal_j: 'origination_fees.subtotal_j',
  subtotal_others: 'origination_fees.subtotal_others',
  total_j: 'origination_fees.total_j',

  // Compensation to Broker
  commissionFees_d: 'origination_fees.commission_fees_d',
  additionalCompensation_d: 'origination_fees.additional_compensation_d',

  // Payment of Other Obligations
  creditLifeDisabilityInsurance_label: 'origination_fees.credit_life_disability_insurance_label',
  loanDocumentationFee_d: 'origination_fees.loan_documentation_fee_d',
  customOtherObligation_label: 'origination_fees.custom_other_obligation_label',
  customOtherObligation_d: 'origination_fees.custom_other_obligation_d',

  // Payment to Existing Liens
  existingLien1_label: 'origination_fees.existing_lien_1_label',
  existingLien1_d: 'origination_fees.existing_lien_1_d',
  existingLien2_label: 'origination_fees.existing_lien_2_label',
  existingLien2_d: 'origination_fees.existing_lien_2_d',
  existingLien3_label: 'origination_fees.existing_lien_3_label',
  existingLien3_d: 'origination_fees.existing_lien_3_d',
};

const GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(200px, 1.5fr) 70px 90px 40px 40px 40px 40px 100px 110px',
  gap: '4px',
  alignItems: 'center',
};

export const OriginationFeesForm: React.FC<OriginationFeesFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (key: string) => values[key] || '';
  const setValue = (key: string, value: string) => onValueChange(key, value);
  const getBoolValue = (key: string) => values[key] === 'true';
  const setBoolValue = (key: string, value: boolean) => onValueChange(key, String(value));

  const parseNumber = (val: string): number => {
    const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  // Calculate insurance totals for 1000 section
  useEffect(() => {
    const m = parseNumber(getValue(FIELD_KEYS.hazardInsurance_months));
    const p = parseNumber(getValue(FIELD_KEYS.hazardInsurance_perMonth));
    if (m * p > 0) setValue(FIELD_KEYS.hazardInsurance_total, (m * p).toFixed(2));
  }, [values[FIELD_KEYS.hazardInsurance_months], values[FIELD_KEYS.hazardInsurance_perMonth]]);

  useEffect(() => {
    const m = parseNumber(getValue(FIELD_KEYS.mortgageInsurance_months));
    const p = parseNumber(getValue(FIELD_KEYS.mortgageInsurance_perMonth));
    if (m * p > 0) setValue(FIELD_KEYS.mortgageInsurance_total, (m * p).toFixed(2));
  }, [values[FIELD_KEYS.mortgageInsurance_months], values[FIELD_KEYS.mortgageInsurance_perMonth]]);

  useEffect(() => {
    const m = parseNumber(getValue(FIELD_KEYS.coPropertyTaxes_months));
    const p = parseNumber(getValue(FIELD_KEYS.coPropertyTaxes_perMonth));
    if (m * p > 0) setValue(FIELD_KEYS.coPropertyTaxes_total, (m * p).toFixed(2));
  }, [values[FIELD_KEYS.coPropertyTaxes_months], values[FIELD_KEYS.coPropertyTaxes_perMonth]]);

  // Standard fee row: Label | Payable to | Amount | Charge | Broker | Others | APR | Paid to Company | Oral Disclosure
  const renderFeeRow = (
    label: string,
    keys: {
      payableTo: string;
      d: string;
      charge: string;
      broker: string;
      others: string;
      apr: string;
      paidToCompany: string;
      oralDisclosure: string;
    },
    labelKey?: string
  ) => (
    <div style={GRID_STYLE} className="py-1 border-b border-border/50">
      {labelKey ? (
        <Input value={getValue(labelKey)} onChange={(e) => setValue(labelKey, e.target.value)} disabled={disabled} placeholder="Enter description" className="h-7 text-xs" />
      ) : (
        <div className="text-xs text-foreground">{label}</div>
      )}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Payable to</span>
      </div>
      <Input value={getValue(keys.d)} onChange={(e) => setValue(keys.d, e.target.value)} disabled={disabled} placeholder="" className="h-7 text-xs text-right" inputMode="decimal" />
      <div className="flex justify-center"><Checkbox checked={getBoolValue(keys.charge)} onCheckedChange={(c) => setBoolValue(keys.charge, !!c)} disabled={disabled} /></div>
      <div className="flex justify-center"><Checkbox checked={getBoolValue(keys.broker)} onCheckedChange={(c) => setBoolValue(keys.broker, !!c)} disabled={disabled} /></div>
      <div className="flex justify-center"><Checkbox checked={getBoolValue(keys.others)} onCheckedChange={(c) => setBoolValue(keys.others, !!c)} disabled={disabled} /></div>
      <div className="flex justify-center"><Checkbox checked={getBoolValue(keys.apr)} onCheckedChange={(c) => setBoolValue(keys.apr, !!c)} disabled={disabled} /></div>
      <Input value={getValue(keys.paidToCompany)} onChange={(e) => setValue(keys.paidToCompany, e.target.value)} disabled={disabled} className="h-7 text-xs" />
      <Input value={getValue(keys.oralDisclosure)} onChange={(e) => setValue(keys.oralDisclosure, e.target.value)} disabled={disabled} className="h-7 text-xs" />
    </div>
  );

  // Insurance row for 1000 section: Label | months | "months at" | per month | Total | Charge | Broker | Others | APR
  const renderInsuranceRow = (
    label: string,
    monthsKey: string,
    perMonthKey: string,
    totalKey: string,
    keys: { charge: string; broker: string; others: string; apr: string; paidToCompany: string; oralDisclosure: string }
  ) => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(160px, 1fr) 50px 60px 70px 40px 40px 40px 40px 100px 110px',
      gap: '4px',
      alignItems: 'center',
    }} className="py-1 border-b border-border/50">
      <div className="text-xs text-foreground">{label}</div>
      <Input type="number" inputMode="numeric" value={getValue(monthsKey)} onChange={(e) => setValue(monthsKey, e.target.value)} disabled={disabled} placeholder="0" className="h-7 text-xs text-right" />
      <span className="text-xs text-muted-foreground text-center">months at</span>
      <Input inputMode="decimal" value={getValue(perMonthKey)} onChange={(e) => setValue(perMonthKey, e.target.value)} disabled={disabled} placeholder="0.00" className="h-7 text-xs text-right" />
      <div className="flex justify-center"><Checkbox checked={getBoolValue(keys.charge)} onCheckedChange={(c) => setBoolValue(keys.charge, !!c)} disabled={disabled} /></div>
      <div className="flex justify-center"><Checkbox checked={getBoolValue(keys.broker)} onCheckedChange={(c) => setBoolValue(keys.broker, !!c)} disabled={disabled} /></div>
      <div className="flex justify-center"><Checkbox checked={getBoolValue(keys.others)} onCheckedChange={(c) => setBoolValue(keys.others, !!c)} disabled={disabled} /></div>
      <div className="flex justify-center"><Checkbox checked={getBoolValue(keys.apr)} onCheckedChange={(c) => setBoolValue(keys.apr, !!c)} disabled={disabled} /></div>
      <Input value={getValue(keys.paidToCompany)} onChange={(e) => setValue(keys.paidToCompany, e.target.value)} disabled={disabled} className="h-7 text-xs" />
      <Input value={getValue(keys.oralDisclosure)} onChange={(e) => setValue(keys.oralDisclosure, e.target.value)} disabled={disabled} className="h-7 text-xs" />
    </div>
  );

  // Simple row for bottom sections (label + amount only)
  const renderSimpleRow = (label: string, dKey: string, labelKey?: string) => (
    <div className="flex items-center gap-2 py-1 border-b border-border/50">
      {labelKey ? (
        <Input value={getValue(labelKey)} onChange={(e) => setValue(labelKey, e.target.value)} disabled={disabled} placeholder="Enter description" className="h-7 text-xs flex-1" />
      ) : (
        <div className="text-xs text-foreground flex-1">{label}</div>
      )}
      <Input inputMode="decimal" value={getValue(dKey)} onChange={(e) => setValue(dKey, e.target.value)} disabled={disabled} placeholder="" className="h-7 text-xs text-right w-24" />
    </div>
  );

  const makeKeys = (prefix: string) => ({
    payableTo: prefix + '_payable_to',
    d: prefix + '_d',
    charge: prefix + '_charge',
    broker: prefix + '_broker',
    others: prefix + '_others',
    apr: prefix + '_apr',
    paidToCompany: prefix + '_paid_to_company',
    oralDisclosure: prefix + '_oral_disclosure',
  });

  return (
    <div className="p-4 space-y-6 overflow-x-auto">
      {/* Column headers */}
      <div style={GRID_STYLE} className="py-2 border-b-2 border-foreground text-xs font-semibold text-foreground">
        <div>HUD-1 Item Paid to Others Paid to Broker</div>
        <div></div>
        <div></div>
        <div className="text-center">Charge</div>
        <div className="text-center">Broker</div>
        <div className="text-center">Others</div>
        <div className="text-center">APR</div>
        <div className="text-center">Paid to Company</div>
        <div className="text-center">Add to Oral Disclosure</div>
      </div>

      {/* 800 Items Payable in Connection with Loan */}
      <div className="space-y-0">
        <h3 className="font-semibold text-sm text-foreground underline mb-1">800 Items Payable in Connection with Loan</h3>
        {renderFeeRow("801 Lender's Loan Origination Fee", {
          payableTo: FIELD_KEYS.lendersLoanOriginationFee_payable_to, d: FIELD_KEYS.lendersLoanOriginationFee_d,
          charge: FIELD_KEYS.lendersLoanOriginationFee_charge, broker: FIELD_KEYS.lendersLoanOriginationFee_broker,
          others: FIELD_KEYS.lendersLoanOriginationFee_others, apr: FIELD_KEYS.lendersLoanOriginationFee_apr,
          paidToCompany: FIELD_KEYS.lendersLoanOriginationFee_paid_to_company, oralDisclosure: FIELD_KEYS.lendersLoanOriginationFee_oral_disclosure,
        })}
        {renderFeeRow("802 Lender's Loan Discount Fee", {
          payableTo: FIELD_KEYS.lendersLoanDiscountFee_payable_to, d: FIELD_KEYS.lendersLoanDiscountFee_d,
          charge: FIELD_KEYS.lendersLoanDiscountFee_charge, broker: FIELD_KEYS.lendersLoanDiscountFee_broker,
          others: FIELD_KEYS.lendersLoanDiscountFee_others, apr: FIELD_KEYS.lendersLoanDiscountFee_apr,
          paidToCompany: FIELD_KEYS.lendersLoanDiscountFee_paid_to_company, oralDisclosure: FIELD_KEYS.lendersLoanDiscountFee_oral_disclosure,
        })}
        {renderFeeRow('803 Appraisal Fee', {
          payableTo: FIELD_KEYS.appraisalFee_payable_to, d: FIELD_KEYS.appraisalFee_d,
          charge: FIELD_KEYS.appraisalFee_charge, broker: FIELD_KEYS.appraisalFee_broker,
          others: FIELD_KEYS.appraisalFee_others, apr: FIELD_KEYS.appraisalFee_apr,
          paidToCompany: FIELD_KEYS.appraisalFee_paid_to_company, oralDisclosure: FIELD_KEYS.appraisalFee_oral_disclosure,
        })}
        {renderFeeRow('804 Credit Report', {
          payableTo: FIELD_KEYS.creditReport_payable_to, d: FIELD_KEYS.creditReport_d,
          charge: FIELD_KEYS.creditReport_charge, broker: FIELD_KEYS.creditReport_broker,
          others: FIELD_KEYS.creditReport_others, apr: FIELD_KEYS.creditReport_apr,
          paidToCompany: FIELD_KEYS.creditReport_paid_to_company, oralDisclosure: FIELD_KEYS.creditReport_oral_disclosure,
        })}
        {renderFeeRow("805 Lender's Inspection Fee", {
          payableTo: FIELD_KEYS.lendersInspectionFee_payable_to, d: FIELD_KEYS.lendersInspectionFee_d,
          charge: FIELD_KEYS.lendersInspectionFee_charge, broker: FIELD_KEYS.lendersInspectionFee_broker,
          others: FIELD_KEYS.lendersInspectionFee_others, apr: FIELD_KEYS.lendersInspectionFee_apr,
          paidToCompany: FIELD_KEYS.lendersInspectionFee_paid_to_company, oralDisclosure: FIELD_KEYS.lendersInspectionFee_oral_disclosure,
        })}
        {renderFeeRow('808 Mortgage Broker Commission/Fee', {
          payableTo: FIELD_KEYS.mortgageBrokerFee_payable_to, d: FIELD_KEYS.mortgageBrokerFee_d,
          charge: FIELD_KEYS.mortgageBrokerFee_charge, broker: FIELD_KEYS.mortgageBrokerFee_broker,
          others: FIELD_KEYS.mortgageBrokerFee_others, apr: FIELD_KEYS.mortgageBrokerFee_apr,
          paidToCompany: FIELD_KEYS.mortgageBrokerFee_paid_to_company, oralDisclosure: FIELD_KEYS.mortgageBrokerFee_oral_disclosure,
        })}
        {renderFeeRow('809 Tax Service Fee', {
          payableTo: FIELD_KEYS.taxServiceFee_payable_to, d: FIELD_KEYS.taxServiceFee_d,
          charge: FIELD_KEYS.taxServiceFee_charge, broker: FIELD_KEYS.taxServiceFee_broker,
          others: FIELD_KEYS.taxServiceFee_others, apr: FIELD_KEYS.taxServiceFee_apr,
          paidToCompany: FIELD_KEYS.taxServiceFee_paid_to_company, oralDisclosure: FIELD_KEYS.taxServiceFee_oral_disclosure,
        })}
        {renderFeeRow('810 Processing Fee', {
          payableTo: FIELD_KEYS.processingFee_payable_to, d: FIELD_KEYS.processingFee_d,
          charge: FIELD_KEYS.processingFee_charge, broker: FIELD_KEYS.processingFee_broker,
          others: FIELD_KEYS.processingFee_others, apr: FIELD_KEYS.processingFee_apr,
          paidToCompany: FIELD_KEYS.processingFee_paid_to_company, oralDisclosure: FIELD_KEYS.processingFee_oral_disclosure,
        })}
        {renderFeeRow('811 Underwriting Fee', {
          payableTo: FIELD_KEYS.underwritingFee_payable_to, d: FIELD_KEYS.underwritingFee_d,
          charge: FIELD_KEYS.underwritingFee_charge, broker: FIELD_KEYS.underwritingFee_broker,
          others: FIELD_KEYS.underwritingFee_others, apr: FIELD_KEYS.underwritingFee_apr,
          paidToCompany: FIELD_KEYS.underwritingFee_paid_to_company, oralDisclosure: FIELD_KEYS.underwritingFee_oral_disclosure,
        })}
        {renderFeeRow('812 Wire Transfer Fee', {
          payableTo: FIELD_KEYS.wireTransferFee_payable_to, d: FIELD_KEYS.wireTransferFee_d,
          charge: FIELD_KEYS.wireTransferFee_charge, broker: FIELD_KEYS.wireTransferFee_broker,
          others: FIELD_KEYS.wireTransferFee_others, apr: FIELD_KEYS.wireTransferFee_apr,
          paidToCompany: FIELD_KEYS.wireTransferFee_paid_to_company, oralDisclosure: FIELD_KEYS.wireTransferFee_oral_disclosure,
        })}
        {renderFeeRow('', {
          payableTo: FIELD_KEYS.customItem800_payable_to, d: FIELD_KEYS.customItem800_d,
          charge: FIELD_KEYS.customItem800_charge, broker: FIELD_KEYS.customItem800_broker,
          others: FIELD_KEYS.customItem800_others, apr: FIELD_KEYS.customItem800_apr,
          paidToCompany: FIELD_KEYS.customItem800_paid_to_company, oralDisclosure: FIELD_KEYS.customItem800_oral_disclosure,
        }, FIELD_KEYS.customItem800_label)}
      </div>

      {/* 900 Items Required by Lender to be Paid in Advance */}
      <div className="space-y-0">
        <h3 className="font-semibold text-sm text-foreground underline mb-1">900 Items Required by Lender to be Paid in Advance</h3>
        {renderFeeRow('901 Interest for days at $ per day', {
          payableTo: FIELD_KEYS.interestForDays_payable_to, d: FIELD_KEYS.interestForDays_d,
          charge: FIELD_KEYS.interestForDays_charge, broker: FIELD_KEYS.interestForDays_broker,
          others: FIELD_KEYS.interestForDays_others, apr: FIELD_KEYS.interestForDays_apr,
          paidToCompany: FIELD_KEYS.interestForDays_paid_to_company, oralDisclosure: FIELD_KEYS.interestForDays_oral_disclosure,
        })}
        {renderFeeRow('902 Mortgage Insurance Premiums', {
          payableTo: FIELD_KEYS.mortgageInsurancePremiums_payable_to, d: FIELD_KEYS.mortgageInsurancePremiums_d,
          charge: FIELD_KEYS.mortgageInsurancePremiums_charge, broker: FIELD_KEYS.mortgageInsurancePremiums_broker,
          others: FIELD_KEYS.mortgageInsurancePremiums_others, apr: FIELD_KEYS.mortgageInsurancePremiums_apr,
          paidToCompany: FIELD_KEYS.mortgageInsurancePremiums_paid_to_company, oralDisclosure: FIELD_KEYS.mortgageInsurancePremiums_oral_disclosure,
        })}
        {renderFeeRow('903 Hazard Insurance Premiums', {
          payableTo: FIELD_KEYS.hazardInsurancePremiums_payable_to, d: FIELD_KEYS.hazardInsurancePremiums_d,
          charge: FIELD_KEYS.hazardInsurancePremiums_charge, broker: FIELD_KEYS.hazardInsurancePremiums_broker,
          others: FIELD_KEYS.hazardInsurancePremiums_others, apr: FIELD_KEYS.hazardInsurancePremiums_apr,
          paidToCompany: FIELD_KEYS.hazardInsurancePremiums_paid_to_company, oralDisclosure: FIELD_KEYS.hazardInsurancePremiums_oral_disclosure,
        })}
        {renderFeeRow('904 County Property Taxes', {
          payableTo: FIELD_KEYS.countyPropertyTaxes_payable_to, d: FIELD_KEYS.countyPropertyTaxes_d,
          charge: FIELD_KEYS.countyPropertyTaxes_charge, broker: FIELD_KEYS.countyPropertyTaxes_broker,
          others: FIELD_KEYS.countyPropertyTaxes_others, apr: FIELD_KEYS.countyPropertyTaxes_apr,
          paidToCompany: FIELD_KEYS.countyPropertyTaxes_paid_to_company, oralDisclosure: FIELD_KEYS.countyPropertyTaxes_oral_disclosure,
        })}
        {renderFeeRow('905 VA Funding Fee', {
          payableTo: FIELD_KEYS.vaFundingFee_payable_to, d: FIELD_KEYS.vaFundingFee_d,
          charge: FIELD_KEYS.vaFundingFee_charge, broker: FIELD_KEYS.vaFundingFee_broker,
          others: FIELD_KEYS.vaFundingFee_others, apr: FIELD_KEYS.vaFundingFee_apr,
          paidToCompany: FIELD_KEYS.vaFundingFee_paid_to_company, oralDisclosure: FIELD_KEYS.vaFundingFee_oral_disclosure,
        })}
        {renderFeeRow('', {
          payableTo: FIELD_KEYS.customItem900_payable_to, d: FIELD_KEYS.customItem900_d,
          charge: FIELD_KEYS.customItem900_charge, broker: FIELD_KEYS.customItem900_broker,
          others: FIELD_KEYS.customItem900_others, apr: FIELD_KEYS.customItem900_apr,
          paidToCompany: FIELD_KEYS.customItem900_paid_to_company, oralDisclosure: FIELD_KEYS.customItem900_oral_disclosure,
        }, FIELD_KEYS.customItem900_label)}
      </div>

      {/* 1000 Reserves Deposited with Lender or Other */}
      <div className="space-y-0">
        <h3 className="font-semibold text-sm text-foreground underline mb-1">1000 Reserves Deposited with Lender or Other</h3>
        {renderInsuranceRow('1001 Hazard Insurance', FIELD_KEYS.hazardInsurance_months, FIELD_KEYS.hazardInsurance_perMonth, FIELD_KEYS.hazardInsurance_total, {
          charge: FIELD_KEYS.hazardInsurance_charge, broker: FIELD_KEYS.hazardInsurance_broker,
          others: FIELD_KEYS.hazardInsurance_others, apr: FIELD_KEYS.hazardInsurance_apr,
          paidToCompany: FIELD_KEYS.hazardInsurance_paid_to_company, oralDisclosure: FIELD_KEYS.hazardInsurance_oral_disclosure,
        })}
        {renderInsuranceRow('1002 Mortgage Insurance', FIELD_KEYS.mortgageInsurance_months, FIELD_KEYS.mortgageInsurance_perMonth, FIELD_KEYS.mortgageInsurance_total, {
          charge: FIELD_KEYS.mortgageInsurance_charge, broker: FIELD_KEYS.mortgageInsurance_broker,
          others: FIELD_KEYS.mortgageInsurance_others, apr: FIELD_KEYS.mortgageInsurance_apr,
          paidToCompany: FIELD_KEYS.mortgageInsurance_paid_to_company, oralDisclosure: FIELD_KEYS.mortgageInsurance_oral_disclosure,
        })}
        {renderInsuranceRow('1004 Co. Property Taxes', FIELD_KEYS.coPropertyTaxes_months, FIELD_KEYS.coPropertyTaxes_perMonth, FIELD_KEYS.coPropertyTaxes_total, {
          charge: FIELD_KEYS.coPropertyTaxes_charge, broker: FIELD_KEYS.coPropertyTaxes_broker,
          others: FIELD_KEYS.coPropertyTaxes_others, apr: FIELD_KEYS.coPropertyTaxes_apr,
          paidToCompany: FIELD_KEYS.coPropertyTaxes_paid_to_company, oralDisclosure: FIELD_KEYS.coPropertyTaxes_oral_disclosure,
        })}
        {renderFeeRow('', {
          payableTo: FIELD_KEYS.customItem1000_payable_to, d: FIELD_KEYS.customItem1000_d,
          charge: FIELD_KEYS.customItem1000_charge, broker: FIELD_KEYS.customItem1000_broker,
          others: FIELD_KEYS.customItem1000_others, apr: FIELD_KEYS.customItem1000_apr,
          paidToCompany: FIELD_KEYS.customItem1000_paid_to_company, oralDisclosure: FIELD_KEYS.customItem1000_oral_disclosure,
        }, FIELD_KEYS.customItem1000_label)}
      </div>

      {/* 1100 Title Charges */}
      <div className="space-y-0">
        <h3 className="font-semibold text-sm text-foreground underline mb-1">1100 Title Charges</h3>
        {renderFeeRow('1101 Settlement or Closing/Escrow Fee', {
          payableTo: FIELD_KEYS.settlementClosingFee_payable_to, d: FIELD_KEYS.settlementClosingFee_d,
          charge: FIELD_KEYS.settlementClosingFee_charge, broker: FIELD_KEYS.settlementClosingFee_broker,
          others: FIELD_KEYS.settlementClosingFee_others, apr: FIELD_KEYS.settlementClosingFee_apr,
          paidToCompany: FIELD_KEYS.settlementClosingFee_paid_to_company, oralDisclosure: FIELD_KEYS.settlementClosingFee_oral_disclosure,
        })}
        {renderFeeRow('1105 Document Preparation Fee Paid to', {
          payableTo: FIELD_KEYS.docPreparationFee_payable_to, d: FIELD_KEYS.docPreparationFee_d,
          charge: FIELD_KEYS.docPreparationFee_charge, broker: FIELD_KEYS.docPreparationFee_broker,
          others: FIELD_KEYS.docPreparationFee_others, apr: FIELD_KEYS.docPreparationFee_apr,
          paidToCompany: FIELD_KEYS.docPreparationFee_paid_to_company, oralDisclosure: FIELD_KEYS.docPreparationFee_oral_disclosure,
        })}
        {renderFeeRow('1106 Notary Fee Paid to', {
          payableTo: FIELD_KEYS.notaryFee_payable_to, d: FIELD_KEYS.notaryFee_d,
          charge: FIELD_KEYS.notaryFee_charge, broker: FIELD_KEYS.notaryFee_broker,
          others: FIELD_KEYS.notaryFee_others, apr: FIELD_KEYS.notaryFee_apr,
          paidToCompany: FIELD_KEYS.notaryFee_paid_to_company, oralDisclosure: FIELD_KEYS.notaryFee_oral_disclosure,
        })}
        {renderFeeRow('1108 Title Insurance Paid to', {
          payableTo: FIELD_KEYS.titleInsurance_payable_to, d: FIELD_KEYS.titleInsurance_d,
          charge: FIELD_KEYS.titleInsurance_charge, broker: FIELD_KEYS.titleInsurance_broker,
          others: FIELD_KEYS.titleInsurance_others, apr: FIELD_KEYS.titleInsurance_apr,
          paidToCompany: FIELD_KEYS.titleInsurance_paid_to_company, oralDisclosure: FIELD_KEYS.titleInsurance_oral_disclosure,
        })}
        {renderFeeRow('', {
          payableTo: FIELD_KEYS.customItem1100_payable_to, d: FIELD_KEYS.customItem1100_d,
          charge: FIELD_KEYS.customItem1100_charge, broker: FIELD_KEYS.customItem1100_broker,
          others: FIELD_KEYS.customItem1100_others, apr: FIELD_KEYS.customItem1100_apr,
          paidToCompany: FIELD_KEYS.customItem1100_paid_to_company, oralDisclosure: FIELD_KEYS.customItem1100_oral_disclosure,
        }, FIELD_KEYS.customItem1100_label)}
      </div>

      {/* 1200 Government Recording and Transfer Charges */}
      <div className="space-y-0">
        <h3 className="font-semibold text-sm text-foreground underline mb-1">1200 Government Recording and Transfer Charges</h3>
        {renderFeeRow('1201 Recording Fees', {
          payableTo: FIELD_KEYS.recordingFees_payable_to, d: FIELD_KEYS.recordingFees_d,
          charge: FIELD_KEYS.recordingFees_charge, broker: FIELD_KEYS.recordingFees_broker,
          others: FIELD_KEYS.recordingFees_others, apr: FIELD_KEYS.recordingFees_apr,
          paidToCompany: FIELD_KEYS.recordingFees_paid_to_company, oralDisclosure: FIELD_KEYS.recordingFees_oral_disclosure,
        })}
        {renderFeeRow('', {
          payableTo: FIELD_KEYS.addThisLine_payable_to, d: FIELD_KEYS.addThisLine_d,
          charge: FIELD_KEYS.addThisLine_charge, broker: FIELD_KEYS.addThisLine_broker,
          others: FIELD_KEYS.addThisLine_others, apr: FIELD_KEYS.addThisLine_apr,
          paidToCompany: FIELD_KEYS.addThisLine_paid_to_company, oralDisclosure: FIELD_KEYS.addThisLine_oral_disclosure,
        }, FIELD_KEYS.addThisLine_label)}
        {renderFeeRow('1202 City/County Tax/Stamps', {
          payableTo: FIELD_KEYS.cityCountyTaxStamps_payable_to, d: FIELD_KEYS.cityCountyTaxStamps_d,
          charge: FIELD_KEYS.cityCountyTaxStamps_charge, broker: FIELD_KEYS.cityCountyTaxStamps_broker,
          others: FIELD_KEYS.cityCountyTaxStamps_others, apr: FIELD_KEYS.cityCountyTaxStamps_apr,
          paidToCompany: FIELD_KEYS.cityCountyTaxStamps_paid_to_company, oralDisclosure: FIELD_KEYS.cityCountyTaxStamps_oral_disclosure,
        })}
        {renderFeeRow('', {
          payableTo: FIELD_KEYS.customItem1200_payable_to, d: FIELD_KEYS.customItem1200_d,
          charge: FIELD_KEYS.customItem1200_charge, broker: FIELD_KEYS.customItem1200_broker,
          others: FIELD_KEYS.customItem1200_others, apr: FIELD_KEYS.customItem1200_apr,
          paidToCompany: FIELD_KEYS.customItem1200_paid_to_company, oralDisclosure: FIELD_KEYS.customItem1200_oral_disclosure,
        }, FIELD_KEYS.customItem1200_label)}
      </div>

      {/* 1300 Additional Settlement Charges */}
      <div className="space-y-0">
        <h3 className="font-semibold text-sm text-foreground underline mb-1">1300 Additional Settlement Charges</h3>
        {renderFeeRow('1302 Pest Inspection', {
          payableTo: FIELD_KEYS.pestInspection_payable_to, d: FIELD_KEYS.pestInspection_d,
          charge: FIELD_KEYS.pestInspection_charge, broker: FIELD_KEYS.pestInspection_broker,
          others: FIELD_KEYS.pestInspection_others, apr: FIELD_KEYS.pestInspection_apr,
          paidToCompany: FIELD_KEYS.pestInspection_paid_to_company, oralDisclosure: FIELD_KEYS.pestInspection_oral_disclosure,
        })}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const prefix = `origination_fees.1300_custom_item_${i}`;
          return renderFeeRow('', {
            payableTo: `${prefix}_payable_to`, d: `${prefix}_d`,
            charge: `${prefix}_charge`, broker: `${prefix}_broker`,
            others: `${prefix}_others`, apr: `${prefix}_apr`,
            paidToCompany: `${prefix}_paid_to_company`, oralDisclosure: `${prefix}_oral_disclosure`,
          }, `${prefix}_label`);
        })}
      </div>

      {/* Subtotal and Total */}
      <div className="space-y-1 pt-4 border-t-2 border-foreground">
        <div className="flex items-center gap-2 py-1">
          <div className="text-sm font-semibold text-foreground flex-1">Subtotal</div>
          <div className="flex items-center w-28">
            <span className="text-sm mr-1">$</span>
            <Input inputMode="decimal" value={getValue(FIELD_KEYS.subtotal_j)} onChange={(e) => setValue(FIELD_KEYS.subtotal_j, e.target.value)} disabled={disabled} placeholder="0.00" className="h-7 text-xs text-right" />
          </div>
        </div>
        <div className="flex items-center gap-2 py-1">
          <div className="text-sm font-bold text-foreground flex-1">Total</div>
          <div className="flex items-center w-28">
            <span className="text-sm mr-1 font-bold">$</span>
            <Input inputMode="decimal" value={getValue(FIELD_KEYS.total_j)} onChange={(e) => setValue(FIELD_KEYS.total_j, e.target.value)} disabled={disabled} placeholder="0.00" className="h-7 text-xs text-right font-bold" />
          </div>
        </div>
      </div>

      {/* Compensation to Broker */}
      <div className="space-y-0">
        <h3 className="font-semibold text-sm text-foreground mb-1">Compensation to Broker (Not Paid Out of Loan Proceeds):</h3>
        {renderSimpleRow('Commission / Fees', FIELD_KEYS.commissionFees_d)}
        {renderSimpleRow('Additional Compensation from Lender', FIELD_KEYS.additionalCompensation_d)}
      </div>

      {/* Payment of Other Obligations */}
      <div className="space-y-0">
        <h3 className="font-semibold text-sm text-foreground underline mb-1">Payment of Other Obligations</h3>
        <div className="py-1 border-b border-border/50">
          <span className="text-xs text-foreground">Credit Life and/or Disability Insurance</span>
        </div>
        {renderSimpleRow('Loan Documentation Fee', FIELD_KEYS.loanDocumentationFee_d)}
        {renderSimpleRow('', FIELD_KEYS.customOtherObligation_d, FIELD_KEYS.customOtherObligation_label)}
      </div>

      {/* Payment to Existing Liens */}
      <div className="space-y-0">
        <h3 className="font-semibold text-sm text-foreground underline mb-1">Payment to Existing Liens</h3>
        <p className="text-xs text-muted-foreground italic mb-1">Fills from data on "Properties"</p>
        {renderSimpleRow('', FIELD_KEYS.existingLien1_d, FIELD_KEYS.existingLien1_label)}
        {renderSimpleRow('', FIELD_KEYS.existingLien2_d, FIELD_KEYS.existingLien2_label)}
        {renderSimpleRow('', FIELD_KEYS.existingLien3_d, FIELD_KEYS.existingLien3_label)}
      </div>
    </div>
  );
};

export default OriginationFeesForm;
