import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import type { CalculationResult } from '@/lib/calculationEngine';

interface OriginationFeesFormProps {
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

// Field keys for Origination Fees (based on 885 template)
const FIELD_KEYS = {
  // 800 Items Payable in Connection with Loan
  lendersLoanOriginationFee_d: 'origination_fees.801_lenders_loan_origination_fee_d',
  lendersLoanOriginationFee_broker: 'origination_fees.801_lenders_loan_origination_fee_broker',
  lendersLoanOriginationFee_others: 'origination_fees.801_lenders_loan_origination_fee_others',
  
  lendersLoanDiscountFee_d: 'origination_fees.802_lenders_loan_discount_fee_d',
  lendersLoanDiscountFee_broker: 'origination_fees.802_lenders_loan_discount_fee_broker',
  lendersLoanDiscountFee_others: 'origination_fees.802_lenders_loan_discount_fee_others',
  
  appraisalFee_d: 'origination_fees.803_appraisal_fee_d',
  appraisalFee_broker: 'origination_fees.803_appraisal_fee_broker',
  appraisalFee_others: 'origination_fees.803_appraisal_fee_others',
  
  creditReport_d: 'origination_fees.804_credit_report_d',
  creditReport_broker: 'origination_fees.804_credit_report_broker',
  creditReport_others: 'origination_fees.804_credit_report_others',
  
  lendersInspectionFee_d: 'origination_fees.805_lenders_inspection_fee_d',
  lendersInspectionFee_broker: 'origination_fees.805_lenders_inspection_fee_broker',
  lendersInspectionFee_others: 'origination_fees.805_lenders_inspection_fee_others',
  
  mortgageBrokerFee_d: 'origination_fees.808_mortgage_broker_fee_d',
  mortgageBrokerFee_broker: 'origination_fees.808_mortgage_broker_fee_broker',
  mortgageBrokerFee_others: 'origination_fees.808_mortgage_broker_fee_others',
  
  taxServiceFee_d: 'origination_fees.809_tax_service_fee_d',
  taxServiceFee_broker: 'origination_fees.809_tax_service_fee_broker',
  taxServiceFee_others: 'origination_fees.809_tax_service_fee_others',
  
  processingFee_d: 'origination_fees.810_processing_fee_d',
  processingFee_broker: 'origination_fees.810_processing_fee_broker',
  processingFee_others: 'origination_fees.810_processing_fee_others',
  
  underwritingFee_d: 'origination_fees.811_underwriting_fee_d',
  underwritingFee_broker: 'origination_fees.811_underwriting_fee_broker',
  underwritingFee_others: 'origination_fees.811_underwriting_fee_others',
  
  wireTransferFee_d: 'origination_fees.812_wire_transfer_fee_d',
  wireTransferFee_broker: 'origination_fees.812_wire_transfer_fee_broker',
  wireTransferFee_others: 'origination_fees.812_wire_transfer_fee_others',
  
  customItem800_label: 'origination_fees.800_custom_item_label',
  customItem800_d: 'origination_fees.800_custom_item_d',
  customItem800_broker: 'origination_fees.800_custom_item_broker',
  customItem800_others: 'origination_fees.800_custom_item_others',

  // 900 Items Required by Lender to be Paid in Advance
  interestForDays_d: 'origination_fees.901_interest_for_days_d',
  interestForDays_broker: 'origination_fees.901_interest_for_days_broker',
  interestForDays_others: 'origination_fees.901_interest_for_days_others',
  
  mortgageInsurancePremiums_d: 'origination_fees.902_mortgage_insurance_premiums_d',
  mortgageInsurancePremiums_broker: 'origination_fees.902_mortgage_insurance_premiums_broker',
  mortgageInsurancePremiums_others: 'origination_fees.902_mortgage_insurance_premiums_others',
  
  hazardInsurancePremiums_d: 'origination_fees.903_hazard_insurance_premiums_d',
  hazardInsurancePremiums_broker: 'origination_fees.903_hazard_insurance_premiums_broker',
  hazardInsurancePremiums_others: 'origination_fees.903_hazard_insurance_premiums_others',
  
  countyPropertyTaxes_d: 'origination_fees.904_county_property_taxes_d',
  countyPropertyTaxes_broker: 'origination_fees.904_county_property_taxes_broker',
  countyPropertyTaxes_others: 'origination_fees.904_county_property_taxes_others',
  
  vaFundingFee_d: 'origination_fees.905_va_funding_fee_d',
  vaFundingFee_broker: 'origination_fees.905_va_funding_fee_broker',
  vaFundingFee_others: 'origination_fees.905_va_funding_fee_others',
  
  customItem900_label: 'origination_fees.900_custom_item_label',
  customItem900_d: 'origination_fees.900_custom_item_d',
  customItem900_broker: 'origination_fees.900_custom_item_broker',
  customItem900_others: 'origination_fees.900_custom_item_others',

  // 1000 Reserves Deposited with Lender or Other
  hazardInsurance_months: 'origination_fees.1001_hazard_insurance_months',
  hazardInsurance_perMonth: 'origination_fees.1001_hazard_insurance_per_month',
  hazardInsurance_total: 'origination_fees.1001_hazard_insurance_total',
  hazardInsurance_broker: 'origination_fees.1001_hazard_insurance_broker',
  hazardInsurance_others: 'origination_fees.1001_hazard_insurance_others',
  
  mortgageInsurance_months: 'origination_fees.1002_mortgage_insurance_months',
  mortgageInsurance_perMonth: 'origination_fees.1002_mortgage_insurance_per_month',
  mortgageInsurance_total: 'origination_fees.1002_mortgage_insurance_total',
  mortgageInsurance_broker: 'origination_fees.1002_mortgage_insurance_broker',
  mortgageInsurance_others: 'origination_fees.1002_mortgage_insurance_others',
  
  coPropertyTaxes_months: 'origination_fees.1004_co_property_taxes_months',
  coPropertyTaxes_perMonth: 'origination_fees.1004_co_property_taxes_per_month',
  coPropertyTaxes_total: 'origination_fees.1004_co_property_taxes_total',
  coPropertyTaxes_broker: 'origination_fees.1004_co_property_taxes_broker',
  coPropertyTaxes_others: 'origination_fees.1004_co_property_taxes_others',
  
  customItem1000_label: 'origination_fees.1000_custom_item_label',
  customItem1000_d: 'origination_fees.1000_custom_item_d',
  customItem1000_broker: 'origination_fees.1000_custom_item_broker',
  customItem1000_others: 'origination_fees.1000_custom_item_others',

  // 1100 Title Charges
  settlementClosingFee_d: 'origination_fees.1101_settlement_closing_fee_d',
  settlementClosingFee_broker: 'origination_fees.1101_settlement_closing_fee_broker',
  settlementClosingFee_others: 'origination_fees.1101_settlement_closing_fee_others',
  
  docPreparationFee_d: 'origination_fees.1105_doc_preparation_fee_d',
  docPreparationFee_broker: 'origination_fees.1105_doc_preparation_fee_broker',
  docPreparationFee_others: 'origination_fees.1105_doc_preparation_fee_others',
  
  notaryFee_d: 'origination_fees.1106_notary_fee_d',
  notaryFee_broker: 'origination_fees.1106_notary_fee_broker',
  notaryFee_others: 'origination_fees.1106_notary_fee_others',
  
  titleInsurance_d: 'origination_fees.1108_title_insurance_d',
  titleInsurance_broker: 'origination_fees.1108_title_insurance_broker',
  titleInsurance_others: 'origination_fees.1108_title_insurance_others',
  
  customItem1100_label: 'origination_fees.1100_custom_item_label',
  customItem1100_d: 'origination_fees.1100_custom_item_d',
  customItem1100_broker: 'origination_fees.1100_custom_item_broker',
  customItem1100_others: 'origination_fees.1100_custom_item_others',

  // 1200 Government Recording and Transfer Charges
  recordingFees_d: 'origination_fees.1201_recording_fees_d',
  recordingFees_broker: 'origination_fees.1201_recording_fees_broker',
  recordingFees_others: 'origination_fees.1201_recording_fees_others',
  
  cityCountyTaxStamps_d: 'origination_fees.1202_city_county_tax_stamps_d',
  cityCountyTaxStamps_broker: 'origination_fees.1202_city_county_tax_stamps_broker',
  cityCountyTaxStamps_others: 'origination_fees.1202_city_county_tax_stamps_others',
  
  customItem1200_label: 'origination_fees.1200_custom_item_label',
  customItem1200_d: 'origination_fees.1200_custom_item_d',
  customItem1200_broker: 'origination_fees.1200_custom_item_broker',
  customItem1200_others: 'origination_fees.1200_custom_item_others',

  // 1300 Additional Settlement Charges
  pestInspection_d: 'origination_fees.1302_pest_inspection_d',
  pestInspection_broker: 'origination_fees.1302_pest_inspection_broker',
  pestInspection_others: 'origination_fees.1302_pest_inspection_others',
  
  // Expandable rows for 1300
  customItem1300_1_label: 'origination_fees.1300_custom_item_1_label',
  customItem1300_1_d: 'origination_fees.1300_custom_item_1_d',
  customItem1300_1_broker: 'origination_fees.1300_custom_item_1_broker',
  customItem1300_1_others: 'origination_fees.1300_custom_item_1_others',
  
  customItem1300_2_label: 'origination_fees.1300_custom_item_2_label',
  customItem1300_2_d: 'origination_fees.1300_custom_item_2_d',
  customItem1300_2_broker: 'origination_fees.1300_custom_item_2_broker',
  customItem1300_2_others: 'origination_fees.1300_custom_item_2_others',
  
  customItem1300_3_label: 'origination_fees.1300_custom_item_3_label',
  customItem1300_3_d: 'origination_fees.1300_custom_item_3_d',
  customItem1300_3_broker: 'origination_fees.1300_custom_item_3_broker',
  customItem1300_3_others: 'origination_fees.1300_custom_item_3_others',
  
  customItem1300_4_label: 'origination_fees.1300_custom_item_4_label',
  customItem1300_4_d: 'origination_fees.1300_custom_item_4_d',
  customItem1300_4_broker: 'origination_fees.1300_custom_item_4_broker',
  customItem1300_4_others: 'origination_fees.1300_custom_item_4_others',
  
  customItem1300_5_label: 'origination_fees.1300_custom_item_5_label',
  customItem1300_5_d: 'origination_fees.1300_custom_item_5_d',
  customItem1300_5_broker: 'origination_fees.1300_custom_item_5_broker',
  customItem1300_5_others: 'origination_fees.1300_custom_item_5_others',
  
  customItem1300_6_label: 'origination_fees.1300_custom_item_6_label',
  customItem1300_6_d: 'origination_fees.1300_custom_item_6_d',
  customItem1300_6_broker: 'origination_fees.1300_custom_item_6_broker',
  customItem1300_6_others: 'origination_fees.1300_custom_item_6_others',
  
  customItem1300_7_label: 'origination_fees.1300_custom_item_7_label',
  customItem1300_7_d: 'origination_fees.1300_custom_item_7_d',
  customItem1300_7_broker: 'origination_fees.1300_custom_item_7_broker',
  customItem1300_7_others: 'origination_fees.1300_custom_item_7_others',
  
  customItem1300_8_label: 'origination_fees.1300_custom_item_8_label',
  customItem1300_8_d: 'origination_fees.1300_custom_item_8_d',
  customItem1300_8_broker: 'origination_fees.1300_custom_item_8_broker',
  customItem1300_8_others: 'origination_fees.1300_custom_item_8_others',

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

export const OriginationFeesForm: React.FC<OriginationFeesFormProps> = ({
  values,
  onValueChange,
  disabled = false,
}) => {
  const getValue = (key: string) => values[key] || '';
  const setValue = (key: string, value: string) => onValueChange(key, value);
  const getBoolValue = (key: string) => values[key] === 'true';
  const setBoolValue = (key: string, value: boolean) => onValueChange(key, String(value));
  
  // Parse currency value for calculations
  const parseNumber = (val: string): number => {
    const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  };

  // Calculate insurance totals (J = D × H) for 1000 section
  useEffect(() => {
    const hazardMonths = parseNumber(getValue(FIELD_KEYS.hazardInsurance_months));
    const hazardPerMonth = parseNumber(getValue(FIELD_KEYS.hazardInsurance_perMonth));
    const hazardTotal = hazardMonths * hazardPerMonth;
    if (hazardTotal > 0) {
      setValue(FIELD_KEYS.hazardInsurance_total, hazardTotal.toFixed(2));
    }
  }, [values[FIELD_KEYS.hazardInsurance_months], values[FIELD_KEYS.hazardInsurance_perMonth]]);

  useEffect(() => {
    const mortgageMonths = parseNumber(getValue(FIELD_KEYS.mortgageInsurance_months));
    const mortgagePerMonth = parseNumber(getValue(FIELD_KEYS.mortgageInsurance_perMonth));
    const mortgageTotal = mortgageMonths * mortgagePerMonth;
    if (mortgageTotal > 0) {
      setValue(FIELD_KEYS.mortgageInsurance_total, mortgageTotal.toFixed(2));
    }
  }, [values[FIELD_KEYS.mortgageInsurance_months], values[FIELD_KEYS.mortgageInsurance_perMonth]]);

  useEffect(() => {
    const coMonths = parseNumber(getValue(FIELD_KEYS.coPropertyTaxes_months));
    const coPerMonth = parseNumber(getValue(FIELD_KEYS.coPropertyTaxes_perMonth));
    const coTotal = coMonths * coPerMonth;
    if (coTotal > 0) {
      setValue(FIELD_KEYS.coPropertyTaxes_total, coTotal.toFixed(2));
    }
  }, [values[FIELD_KEYS.coPropertyTaxes_months], values[FIELD_KEYS.coPropertyTaxes_perMonth]]);

  // Render a standard fee row with D column, Broker checkbox, Others checkbox
  const renderFeeRow = (
    label: string,
    dKey: string,
    brokerKey: string,
    othersKey: string,
    labelKey?: string
  ) => (
    <div className="grid grid-cols-12 gap-2 items-center py-1.5 border-b border-border/50">
      {/* Label - spans columns A-C (or editable if labelKey provided) */}
      {labelKey ? (
        <div className="col-span-4">
          <Input
            value={getValue(labelKey)}
            onChange={(e) => setValue(labelKey, e.target.value)}
            disabled={disabled}
            placeholder="Enter description"
            className="h-8 text-sm"
          />
        </div>
      ) : (
        <div className="col-span-4 text-sm text-foreground">{label}</div>
      )}
      
      {/* Column D - Currency Amount */}
      <div className="col-span-2">
        <Input
          type="text"
          inputMode="decimal"
          value={getValue(dKey)}
          onChange={(e) => setValue(dKey, e.target.value)}
          disabled={disabled}
          placeholder="0.00"
          className="h-8 text-sm text-right"
        />
      </div>
      
      {/* Spacer for columns E-G */}
      <div className="col-span-2"></div>
      
      {/* Column K - Broker checkbox */}
      <div className="col-span-2 flex items-center justify-center">
        <Checkbox
          checked={getBoolValue(brokerKey)}
          onCheckedChange={(checked) => setBoolValue(brokerKey, !!checked)}
          disabled={disabled}
        />
      </div>
      
      {/* Column N - Others checkbox */}
      <div className="col-span-2 flex items-center justify-center">
        <Checkbox
          checked={getBoolValue(othersKey)}
          onCheckedChange={(checked) => setBoolValue(othersKey, !!checked)}
          disabled={disabled}
        />
      </div>
    </div>
  );

  // Render insurance row with D = months, H = per month, J = total calculation
  const renderInsuranceRow = (
    label: string,
    monthsKey: string,
    perMonthKey: string,
    totalKey: string,
    brokerKey: string,
    othersKey: string
  ) => (
    <div className="grid grid-cols-12 gap-2 items-center py-1.5 border-b border-border/50">
      {/* Label */}
      <div className="col-span-3 text-sm text-foreground">{label}</div>
      
      {/* Column D - Number of months */}
      <div className="col-span-1">
        <Input
          type="number"
          inputMode="numeric"
          value={getValue(monthsKey)}
          onChange={(e) => setValue(monthsKey, e.target.value)}
          disabled={disabled}
          placeholder="0"
          className="h-8 text-sm text-right"
        />
      </div>
      
      {/* "months at" label */}
      <div className="col-span-1 text-sm text-muted-foreground text-center">months at</div>
      
      {/* Column H - Per month amount */}
      <div className="col-span-2">
        <Input
          type="text"
          inputMode="decimal"
          value={getValue(perMonthKey)}
          onChange={(e) => setValue(perMonthKey, e.target.value)}
          disabled={disabled}
          placeholder="0.00"
          className="h-8 text-sm text-right"
        />
      </div>
      
      {/* Column J - Total (calculated: D × H) */}
      <div className="col-span-2">
        <Input
          type="text"
          value={getValue(totalKey)}
          readOnly
          disabled
          placeholder="0.00"
          className="h-8 text-sm text-right bg-muted/50"
        />
      </div>
      
      {/* Column K - Broker checkbox */}
      <div className="col-span-1 flex items-center justify-center">
        <Checkbox
          checked={getBoolValue(brokerKey)}
          onCheckedChange={(checked) => setBoolValue(brokerKey, !!checked)}
          disabled={disabled}
        />
      </div>
      
      {/* Column N - Others checkbox */}
      <div className="col-span-2 flex items-center justify-center">
        <Checkbox
          checked={getBoolValue(othersKey)}
          onCheckedChange={(checked) => setBoolValue(othersKey, !!checked)}
          disabled={disabled}
        />
      </div>
    </div>
  );

  // Render simple amount row for bottom sections
  const renderSimpleRow = (label: string, dKey: string, labelKey?: string) => (
    <div className="grid grid-cols-12 gap-2 items-center py-1.5 border-b border-border/50">
      {labelKey ? (
        <div className="col-span-6">
          <Input
            value={getValue(labelKey)}
            onChange={(e) => setValue(labelKey, e.target.value)}
            disabled={disabled}
            placeholder="Enter description"
            className="h-8 text-sm"
          />
        </div>
      ) : (
        <div className="col-span-6 text-sm text-foreground">{label}</div>
      )}
      
      <div className="col-span-2">
        <Input
          type="text"
          inputMode="decimal"
          value={getValue(dKey)}
          onChange={(e) => setValue(dKey, e.target.value)}
          disabled={disabled}
          placeholder="0.00"
          className="h-8 text-sm text-right"
        />
      </div>
      
      <div className="col-span-4"></div>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      {/* Header row with column labels */}
      <div className="grid grid-cols-12 gap-2 items-center py-2 border-b-2 border-foreground font-medium text-sm">
        <div className="col-span-4">HUD-1 Item Paid to Others Paid to Broker</div>
        <div className="col-span-2 text-center">Amount (D)</div>
        <div className="col-span-2"></div>
        <div className="col-span-2 text-center">Broker</div>
        <div className="col-span-2 text-center">Others</div>
      </div>

      {/* 800 Items Payable in Connection with Loan */}
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground underline">800 Items Payable in Connection with Loan</h3>
        
        {renderFeeRow('801 Lender\'s Loan Origination Fee', FIELD_KEYS.lendersLoanOriginationFee_d, FIELD_KEYS.lendersLoanOriginationFee_broker, FIELD_KEYS.lendersLoanOriginationFee_others)}
        {renderFeeRow('802 Lender\'s Loan Discount Fee', FIELD_KEYS.lendersLoanDiscountFee_d, FIELD_KEYS.lendersLoanDiscountFee_broker, FIELD_KEYS.lendersLoanDiscountFee_others)}
        {renderFeeRow('803 Appraisal Fee', FIELD_KEYS.appraisalFee_d, FIELD_KEYS.appraisalFee_broker, FIELD_KEYS.appraisalFee_others)}
        {renderFeeRow('804 Credit Report', FIELD_KEYS.creditReport_d, FIELD_KEYS.creditReport_broker, FIELD_KEYS.creditReport_others)}
        {renderFeeRow('805 Lender\'s Inspection Fee', FIELD_KEYS.lendersInspectionFee_d, FIELD_KEYS.lendersInspectionFee_broker, FIELD_KEYS.lendersInspectionFee_others)}
        {renderFeeRow('808 Mortgage Broker Commission/Fee', FIELD_KEYS.mortgageBrokerFee_d, FIELD_KEYS.mortgageBrokerFee_broker, FIELD_KEYS.mortgageBrokerFee_others)}
        {renderFeeRow('809 Tax Service Fee', FIELD_KEYS.taxServiceFee_d, FIELD_KEYS.taxServiceFee_broker, FIELD_KEYS.taxServiceFee_others)}
        {renderFeeRow('810 Processing Fee', FIELD_KEYS.processingFee_d, FIELD_KEYS.processingFee_broker, FIELD_KEYS.processingFee_others)}
        {renderFeeRow('811 Underwriting Fee', FIELD_KEYS.underwritingFee_d, FIELD_KEYS.underwritingFee_broker, FIELD_KEYS.underwritingFee_others)}
        {renderFeeRow('812 Wire Transfer Fee', FIELD_KEYS.wireTransferFee_d, FIELD_KEYS.wireTransferFee_broker, FIELD_KEYS.wireTransferFee_others)}
        {renderFeeRow('', FIELD_KEYS.customItem800_d, FIELD_KEYS.customItem800_broker, FIELD_KEYS.customItem800_others, FIELD_KEYS.customItem800_label)}
      </div>

      {/* 900 Items Required by Lender to be Paid in Advance */}
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground underline">900 Items Required by Lender to be Paid in Advance</h3>
        
        {renderFeeRow('901 Interest for days at $ per day', FIELD_KEYS.interestForDays_d, FIELD_KEYS.interestForDays_broker, FIELD_KEYS.interestForDays_others)}
        {renderFeeRow('902 Mortgage Insurance Premiums', FIELD_KEYS.mortgageInsurancePremiums_d, FIELD_KEYS.mortgageInsurancePremiums_broker, FIELD_KEYS.mortgageInsurancePremiums_others)}
        {renderFeeRow('903 Hazard Insurance Premiums', FIELD_KEYS.hazardInsurancePremiums_d, FIELD_KEYS.hazardInsurancePremiums_broker, FIELD_KEYS.hazardInsurancePremiums_others)}
        {renderFeeRow('904 County Property Taxes', FIELD_KEYS.countyPropertyTaxes_d, FIELD_KEYS.countyPropertyTaxes_broker, FIELD_KEYS.countyPropertyTaxes_others)}
        {renderFeeRow('905 VA Funding Fee', FIELD_KEYS.vaFundingFee_d, FIELD_KEYS.vaFundingFee_broker, FIELD_KEYS.vaFundingFee_others)}
        {renderFeeRow('', FIELD_KEYS.customItem900_d, FIELD_KEYS.customItem900_broker, FIELD_KEYS.customItem900_others, FIELD_KEYS.customItem900_label)}
      </div>

      {/* 1000 Reserves Deposited with Lender or Other */}
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground underline">1000 Reserves Deposited with Lender or Other</h3>
        
        {renderInsuranceRow('1001 Hazard Insurance', FIELD_KEYS.hazardInsurance_months, FIELD_KEYS.hazardInsurance_perMonth, FIELD_KEYS.hazardInsurance_total, FIELD_KEYS.hazardInsurance_broker, FIELD_KEYS.hazardInsurance_others)}
        {renderInsuranceRow('1002 Mortgage Insurance', FIELD_KEYS.mortgageInsurance_months, FIELD_KEYS.mortgageInsurance_perMonth, FIELD_KEYS.mortgageInsurance_total, FIELD_KEYS.mortgageInsurance_broker, FIELD_KEYS.mortgageInsurance_others)}
        {renderInsuranceRow('1004 Co. Property Taxes', FIELD_KEYS.coPropertyTaxes_months, FIELD_KEYS.coPropertyTaxes_perMonth, FIELD_KEYS.coPropertyTaxes_total, FIELD_KEYS.coPropertyTaxes_broker, FIELD_KEYS.coPropertyTaxes_others)}
        {renderFeeRow('', FIELD_KEYS.customItem1000_d, FIELD_KEYS.customItem1000_broker, FIELD_KEYS.customItem1000_others, FIELD_KEYS.customItem1000_label)}
      </div>

      {/* 1100 Title Charges */}
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground underline">1100 Title Charges</h3>
        
        {renderFeeRow('1101 Settlement or Closing/Escrow Fee', FIELD_KEYS.settlementClosingFee_d, FIELD_KEYS.settlementClosingFee_broker, FIELD_KEYS.settlementClosingFee_others)}
        {renderFeeRow('1105 Document Preparation Fee Paid to', FIELD_KEYS.docPreparationFee_d, FIELD_KEYS.docPreparationFee_broker, FIELD_KEYS.docPreparationFee_others)}
        {renderFeeRow('1106 Notary Fee Paid to', FIELD_KEYS.notaryFee_d, FIELD_KEYS.notaryFee_broker, FIELD_KEYS.notaryFee_others)}
        {renderFeeRow('1108 Title Insurance Paid to', FIELD_KEYS.titleInsurance_d, FIELD_KEYS.titleInsurance_broker, FIELD_KEYS.titleInsurance_others)}
        {renderFeeRow('', FIELD_KEYS.customItem1100_d, FIELD_KEYS.customItem1100_broker, FIELD_KEYS.customItem1100_others, FIELD_KEYS.customItem1100_label)}
      </div>

      {/* 1200 Government Recording and Transfer Charges */}
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground underline">1200 Government Recording and Transfer Charges</h3>
        
        {renderFeeRow('1201 Recording Fees', FIELD_KEYS.recordingFees_d, FIELD_KEYS.recordingFees_broker, FIELD_KEYS.recordingFees_others)}
        {renderFeeRow('1202 City/County Tax/Stamps', FIELD_KEYS.cityCountyTaxStamps_d, FIELD_KEYS.cityCountyTaxStamps_broker, FIELD_KEYS.cityCountyTaxStamps_others)}
        {renderFeeRow('', FIELD_KEYS.customItem1200_d, FIELD_KEYS.customItem1200_broker, FIELD_KEYS.customItem1200_others, FIELD_KEYS.customItem1200_label)}
      </div>

      {/* 1300 Additional Settlement Charges */}
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground underline">1300 Additional Settlement Charges</h3>
        
        {renderFeeRow('1302 Pest Inspection', FIELD_KEYS.pestInspection_d, FIELD_KEYS.pestInspection_broker, FIELD_KEYS.pestInspection_others)}
        
        {/* Expandable rows */}
        {renderFeeRow('', FIELD_KEYS.customItem1300_1_d, FIELD_KEYS.customItem1300_1_broker, FIELD_KEYS.customItem1300_1_others, FIELD_KEYS.customItem1300_1_label)}
        {renderFeeRow('', FIELD_KEYS.customItem1300_2_d, FIELD_KEYS.customItem1300_2_broker, FIELD_KEYS.customItem1300_2_others, FIELD_KEYS.customItem1300_2_label)}
        {renderFeeRow('', FIELD_KEYS.customItem1300_3_d, FIELD_KEYS.customItem1300_3_broker, FIELD_KEYS.customItem1300_3_others, FIELD_KEYS.customItem1300_3_label)}
        {renderFeeRow('', FIELD_KEYS.customItem1300_4_d, FIELD_KEYS.customItem1300_4_broker, FIELD_KEYS.customItem1300_4_others, FIELD_KEYS.customItem1300_4_label)}
        {renderFeeRow('', FIELD_KEYS.customItem1300_5_d, FIELD_KEYS.customItem1300_5_broker, FIELD_KEYS.customItem1300_5_others, FIELD_KEYS.customItem1300_5_label)}
        {renderFeeRow('', FIELD_KEYS.customItem1300_6_d, FIELD_KEYS.customItem1300_6_broker, FIELD_KEYS.customItem1300_6_others, FIELD_KEYS.customItem1300_6_label)}
        {renderFeeRow('', FIELD_KEYS.customItem1300_7_d, FIELD_KEYS.customItem1300_7_broker, FIELD_KEYS.customItem1300_7_others, FIELD_KEYS.customItem1300_7_label)}
        {renderFeeRow('', FIELD_KEYS.customItem1300_8_d, FIELD_KEYS.customItem1300_8_broker, FIELD_KEYS.customItem1300_8_others, FIELD_KEYS.customItem1300_8_label)}
      </div>

      {/* Subtotal and Total */}
      <div className="space-y-1 pt-4 border-t-2 border-foreground">
        <div className="grid grid-cols-12 gap-2 items-center py-1.5">
          <div className="col-span-6 font-semibold text-foreground">Subtotal</div>
          <div className="col-span-2"></div>
          <div className="col-span-2">
            <div className="flex items-center">
              <span className="text-sm mr-1">$</span>
              <Input
                type="text"
                inputMode="decimal"
                value={getValue(FIELD_KEYS.subtotal_j)}
                onChange={(e) => setValue(FIELD_KEYS.subtotal_j, e.target.value)}
                disabled={disabled}
                placeholder="0.00"
                className="h-8 text-sm text-right"
              />
            </div>
          </div>
          <div className="col-span-2">
            <div className="flex items-center">
              <span className="text-sm mr-1">$</span>
              <Input
                type="text"
                inputMode="decimal"
                value={getValue(FIELD_KEYS.subtotal_others)}
                onChange={(e) => setValue(FIELD_KEYS.subtotal_others, e.target.value)}
                disabled={disabled}
                placeholder="0.00"
                className="h-8 text-sm text-right"
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-2 items-center py-1.5">
          <div className="col-span-6 font-bold text-foreground">Total</div>
          <div className="col-span-2"></div>
          <div className="col-span-2">
            <div className="flex items-center">
              <span className="text-sm mr-1 font-bold">$</span>
              <Input
                type="text"
                inputMode="decimal"
                value={getValue(FIELD_KEYS.total_j)}
                onChange={(e) => setValue(FIELD_KEYS.total_j, e.target.value)}
                disabled={disabled}
                placeholder="0.00"
                className="h-8 text-sm text-right font-bold"
              />
            </div>
          </div>
          <div className="col-span-4"></div>
        </div>
      </div>

      {/* Compensation to Broker */}
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground underline">Compensation to Broker (Not Paid Out of Loan Proceeds):</h3>
        
        {renderSimpleRow('Commission / Fees', FIELD_KEYS.commissionFees_d)}
        {renderSimpleRow('Additional Compensation from Lender', FIELD_KEYS.additionalCompensation_d)}
      </div>

      {/* Payment of Other Obligations */}
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground underline">Payment of Other Obligations</h3>
        
        <div className="grid grid-cols-12 gap-2 items-center py-1.5 border-b border-border/50">
          <div className="col-span-8 text-sm text-foreground">Credit Life and/or Disability Insurance</div>
          <div className="col-span-4"></div>
        </div>
        
        {renderSimpleRow('Loan Documentation Fee', FIELD_KEYS.loanDocumentationFee_d)}
        {renderSimpleRow('', FIELD_KEYS.customOtherObligation_d, FIELD_KEYS.customOtherObligation_label)}
      </div>

      {/* Payment to Existing Liens */}
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground underline">Payment to Existing Liens</h3>
        <p className="text-xs text-muted-foreground italic">Fills from data on "Properties"</p>
        
        {renderSimpleRow('', FIELD_KEYS.existingLien1_d, FIELD_KEYS.existingLien1_label)}
        {renderSimpleRow('', FIELD_KEYS.existingLien2_d, FIELD_KEYS.existingLien2_label)}
        {renderSimpleRow('', FIELD_KEYS.existingLien3_d, FIELD_KEYS.existingLien3_label)}
      </div>
    </div>
  );
};

export default OriginationFeesForm;
