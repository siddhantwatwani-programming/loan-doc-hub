/**
 * Calculation Engine for Computed Fields
 * 
 * Provides deterministic calculations for deal fields based on formulas
 * defined in the field_dictionary.
 * 
 * Supported formula syntax:
 * - {field_key} + N months   → Adds N months to a date field
 * - {field_key} + N days     → Adds N days to a date field  
 * - {field_key} + {field_key2} months → Adds value of field2 as months to field1
 * - {field_key} + {field_key2} days   → Adds value of field2 as days to field1
 */

import { addMonths, addDays, parseISO, format, isValid } from 'date-fns';

export interface CalculatedField {
  field_key: string;
  calculation_formula: string;
  calculation_dependencies: string[];
  data_type: string;
}

export interface CalculationResult {
  field_key: string;
  value: string | null;
  computed: boolean;
  error?: string;
}

/**
 * Check if all dependencies have valid values
 */
function allDependenciesPresent(
  dependencies: string[],
  values: Record<string, string>
): boolean {
  return dependencies.every(dep => {
    const val = values[dep];
    return val !== undefined && val !== null && val.trim() !== '';
  });
}

/**
 * Parse a formula and extract the operation type
 * Examples:
 * - "{first_payment_date} + {term_months} months"
 * - "{next_due_date} + {grace_days} + 4 days"
 */
function parseFormula(formula: string): {
  type: 'date_add_months' | 'date_add_days' | 'unknown';
  baseField: string;
  addendField: string | null;
  staticValue: number | null;
} | null {
  // Pattern: {base_field} + {other_field} months/days
  // or: {base_field} + {other_field} + N months/days
  // or: {base_field} + N months/days
  
  const cleanFormula = formula.trim();
  
  // Match patterns like: {field1} + {field2} months
  const fieldAddPattern = /^\{([^}]+)\}\s*\+\s*\{([^}]+)\}\s*(months?|days?)$/i;
  let match = cleanFormula.match(fieldAddPattern);
  if (match) {
    const unit = match[3].toLowerCase();
    return {
      type: unit.startsWith('month') ? 'date_add_months' : 'date_add_days',
      baseField: match[1],
      addendField: match[2],
      staticValue: null,
    };
  }
  
  // Match patterns like: {field1} + {field2} + N days
  const fieldAndStaticPattern = /^\{([^}]+)\}\s*\+\s*\{([^}]+)\}\s*\+\s*(\d+)\s*(months?|days?)$/i;
  match = cleanFormula.match(fieldAndStaticPattern);
  if (match) {
    const unit = match[4].toLowerCase();
    return {
      type: unit.startsWith('month') ? 'date_add_months' : 'date_add_days',
      baseField: match[1],
      addendField: match[2],
      staticValue: parseInt(match[3], 10),
    };
  }
  
  // Match patterns like: {field1} + N months
  const staticAddPattern = /^\{([^}]+)\}\s*\+\s*(\d+)\s*(months?|days?)$/i;
  match = cleanFormula.match(staticAddPattern);
  if (match) {
    const unit = match[3].toLowerCase();
    return {
      type: unit.startsWith('month') ? 'date_add_months' : 'date_add_days',
      baseField: match[1],
      addendField: null,
      staticValue: parseInt(match[2], 10),
    };
  }
  
  return null;
}

/**
 * Compute a single calculated field
 */
function computeField(
  field: CalculatedField,
  values: Record<string, string>
): CalculationResult {
  // Check if all dependencies are present
  if (!allDependenciesPresent(field.calculation_dependencies, values)) {
    return {
      field_key: field.field_key,
      value: null,
      computed: false,
    };
  }
  
  const parsed = parseFormula(field.calculation_formula);
  if (!parsed) {
    return {
      field_key: field.field_key,
      value: null,
      computed: false,
      error: `Unknown formula format: ${field.calculation_formula}`,
    };
  }
  
  try {
    const baseValue = values[parsed.baseField];
    
    if (parsed.type === 'date_add_months' || parsed.type === 'date_add_days') {
      // Parse the base date
      const baseDate = parseISO(baseValue);
      if (!isValid(baseDate)) {
        return {
          field_key: field.field_key,
          value: null,
          computed: false,
          error: `Invalid date value for ${parsed.baseField}`,
        };
      }
      
      // Get the amount to add
      let amount = parsed.staticValue || 0;
      if (parsed.addendField) {
        const addendValue = parseFloat(values[parsed.addendField]);
        if (isNaN(addendValue)) {
          return {
            field_key: field.field_key,
            value: null,
            computed: false,
            error: `Invalid numeric value for ${parsed.addendField}`,
          };
        }
        amount += addendValue;
      }
      
      // Compute the result
      const resultDate = parsed.type === 'date_add_months'
        ? addMonths(baseDate, amount)
        : addDays(baseDate, amount);
      
      return {
        field_key: field.field_key,
        value: format(resultDate, 'yyyy-MM-dd'),
        computed: true,
      };
    }
    
    return {
      field_key: field.field_key,
      value: null,
      computed: false,
      error: 'Unsupported calculation type',
    };
  } catch (err: any) {
    return {
      field_key: field.field_key,
      value: null,
      computed: false,
      error: err.message || 'Calculation error',
    };
  }
}

/**
 * Compute all calculated fields based on current values
 * Returns a map of field_key -> computed value
 */
export function computeCalculatedFields(
  calculatedFields: CalculatedField[],
  values: Record<string, string>
): Record<string, CalculationResult> {
  const results: Record<string, CalculationResult> = {};
  
  // Sort fields by dependency order (simple topological sort)
  // Fields with fewer dependencies computed first
  const sortedFields = [...calculatedFields].sort((a, b) => 
    a.calculation_dependencies.length - b.calculation_dependencies.length
  );
  
  // Working copy of values (in case calculated fields depend on each other)
  const workingValues = { ...values };
  
  for (const field of sortedFields) {
    const result = computeField(field, workingValues);
    results[field.field_key] = result;
    
    // Update working values if computed successfully
    if (result.computed && result.value !== null) {
      workingValues[field.field_key] = result.value;
    }
  }
  
  return results;
}

/**
 * Merge computed values into existing values
 */
export function mergeCalculatedValues(
  values: Record<string, string>,
  results: Record<string, CalculationResult>
): Record<string, string> {
  const merged = { ...values };
  
  for (const [fieldKey, result] of Object.entries(results)) {
    if (result.computed && result.value !== null) {
      merged[fieldKey] = result.value;
    }
  }
  
  return merged;
}

/**
 * Get list of calculated field keys that failed to compute
 */
export function getCalculationErrors(
  results: Record<string, CalculationResult>
): Array<{ field_key: string; error: string }> {
  return Object.values(results)
    .filter(r => r.error)
    .map(r => ({ field_key: r.field_key, error: r.error! }));
}
