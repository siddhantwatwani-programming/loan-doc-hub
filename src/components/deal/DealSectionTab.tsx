import React from 'react';
import { DealFieldInput } from './DealFieldInput';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldDefinition } from '@/hooks/useDealFields';

interface DealSectionTabProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  missingRequiredFields: FieldDefinition[];
  showValidation?: boolean;
}

export const DealSectionTab: React.FC<DealSectionTabProps> = ({
  fields,
  values,
  onValueChange,
  missingRequiredFields,
  showValidation = false,
}) => {
  const missingFieldKeys = new Set(missingRequiredFields.map(f => f.field_key));
  const isComplete = missingRequiredFields.length === 0;
  const requiredFields = fields.filter(f => f.is_required);
  const filledRequired = requiredFields.filter(f => !missingFieldKeys.has(f.field_key));

  if (fields.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No fields in this section</p>
      </div>
    );
  }

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
              <span>{missingRequiredFields.length} required field{missingRequiredFields.length > 1 ? 's' : ''} missing</span>
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
        {fields.map(field => (
          <DealFieldInput
            key={field.field_key}
            field={field}
            value={values[field.field_key] || ''}
            onChange={(value) => onValueChange(field.field_key, value)}
            error={missingFieldKeys.has(field.field_key)}
            showValidation={showValidation}
          />
        ))}
      </div>
    </div>
  );
};

export default DealSectionTab;
