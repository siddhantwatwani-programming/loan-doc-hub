import React from 'react';
import { GripVertical, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
}

interface ColumnConfigPopoverProps {
  columns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  disabled?: boolean;
}

export const ColumnConfigPopover: React.FC<ColumnConfigPopoverProps> = ({
  columns,
  onColumnsChange,
  disabled = false,
}) => {
  const visibleCount = columns.filter((col) => col.visible).length;

  const handleVisibilityChange = (columnId: string, visible: boolean) => {
    // Ensure at least one column remains visible
    if (!visible && visibleCount <= 1) {
      return;
    }
    
    const updatedColumns = columns.map((col) =>
      col.id === columnId ? { ...col, visible } : col
    );
    onColumnsChange(updatedColumns);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    
    if (dragIndex === dropIndex) return;
    
    const newColumns = [...columns];
    const [draggedColumn] = newColumns.splice(dragIndex, 1);
    newColumns.splice(dropIndex, 0, draggedColumn);
    
    onColumnsChange(newColumns);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1"
        >
          <Settings2 className="h-4 w-4" />
          Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground mb-3">
            Configure Columns
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Drag to reorder, toggle to show/hide
          </p>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {columns.map((column, index) => (
              <div
                key={column.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-move group"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                <Checkbox
                  checked={column.visible}
                  onCheckedChange={(checked) =>
                    handleVisibilityChange(column.id, !!checked)
                  }
                  disabled={column.visible && visibleCount <= 1}
                />
                <span className="text-sm flex-1">{column.label}</span>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColumnConfigPopover;
