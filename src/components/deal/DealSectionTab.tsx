import React from 'react';
import { DealFieldInput } from './DealFieldInput';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';
import { useFieldPermissions } from '@/hooks/useFieldPermissions';
import { useAuth } from '@/contexts/AuthContext';

interface DealSectionTabProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  missingRequiredFields: FieldDefinition[];
  showValidation?: boolean;
  calculationResults?: Record<string, CalculationResult>;
}

export const DealSectionTab: React.FC<DealSectionTabProps> = ({
  fields,
  values,
  onValueChange,
  missingRequiredFields,
  showValidation = false,
  calculationResults = {},
}) => {
  const { checkCanView, checkCanEdit } = useFieldPermissions();
  const { isExternalUser } = useAuth();
  const missingFieldKeys = new Set(missingRequiredFields.map(f => f.field_key));

  // Filter fields based on view permissions for external users
  const visibleFields = isExternalUser 
    ? fields.filter(f => checkCanView(f.field_key))
    : fields;

  // Create a map of which fields are read-only for the current user
  const readOnlyFields = new Set(
    visibleFields
      .filter(f => !checkCanEdit(f.field_key))
      .map(f => f.field_key)
  );

  if (visibleFields.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {fields.length === 0 ? 'No fields in this section' : 'No accessible fields in this section'}
        </p>
      </div>
    );
  }

  // Recalculate missing based on visible fields only
  const visibleMissingFields = missingRequiredFields.filter(f => 
    visibleFields.some(vf => vf.field_key === f.field_key)
  );
  
  const isComplete = visibleMissingFields.length === 0;
  const requiredFields = visibleFields.filter(f => f.is_required);
  const filledRequired = requiredFields.filter(f => !missingFieldKeys.has(f.field_key));

  return (
    <div className="space-y-6">
      {/* Section status */}
      <div className={cn(
        'flex items-center justify-between px-4 py-3 rounded-lg text-sm',
        isComplete ? 'bg-success/10' : 'bg-warning/10'
      )}>
        <div className={cn(
          'flex items-center gap-2',
          isComplete ? 'text-success' : 'text-warning'
        )}>
          {isComplete ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>All required fields are complete</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>{visibleMissingFields.length} required field{visibleMissingFields.length > 1 ? 's' : ''} missing</span>
            </>
          )}
        </div>
        {requiredFields.length > 0 && (
          <span className="text-muted-foreground text-xs">
            {filledRequired.length}/{requiredFields.length} required fields filled
          </span>
        )}
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {visibleFields.map(field => (
          <DealFieldInput
            key={field.field_key}
            field={field}
            value={values[field.field_key] || ''}
            onChange={(value) => onValueChange(field.field_key, value)}
            error={missingFieldKeys.has(field.field_key)}
            showValidation={showValidation}
            calculationResult={calculationResults[field.field_key]}
            disabled={readOnlyFields.has(field.field_key)}
          />
        ))}
      </div>
    </div>
  );
};

export default DealSectionTab;
