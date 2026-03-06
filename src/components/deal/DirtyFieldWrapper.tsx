import React from 'react';
import { cn } from '@/lib/utils';
import { useDirtyFields } from '@/contexts/DirtyFieldsContext';

interface DirtyFieldWrapperProps {
  fieldKey: string;
  children: React.ReactNode;
  className?: string;
}

export const DirtyFieldWrapper: React.FC<DirtyFieldWrapperProps> = ({
  fieldKey,
  children,
  className,
}) => {
  const { dirtyFieldKeys } = useDirtyFields();
  const isDirty = dirtyFieldKeys.has(fieldKey);

  return (
    <div className={cn(
      'rounded-sm px-1 -mx-1 transition-colors relative',
      isDirty && 'bg-warning/10 ring-1 ring-warning/30',
      className
    )}>
      {children}
    </div>
  );
};

export default DirtyFieldWrapper;
