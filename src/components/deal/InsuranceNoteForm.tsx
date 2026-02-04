import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';

interface InsuranceNoteFormProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const InsuranceNoteForm: React.FC<InsuranceNoteFormProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg text-foreground">Notes</span>
      </div>

      <div className="border-b border-border pb-2">
        <span className="font-semibold text-sm text-primary">Insurance Notes</span>
      </div>

      <div>
        <Label className="text-sm text-foreground sr-only">Notes</Label>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter notes about this insurance policy..."
          disabled={disabled}
          className="min-h-[300px] text-sm"
        />
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Notes are saved per insurance record and can be used to track important information about this policy.
        </p>
      </div>
    </div>
  );
};

export default InsuranceNoteForm;
