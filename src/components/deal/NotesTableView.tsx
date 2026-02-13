import React from 'react';
import { Plus, Pencil, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ColumnConfigPopover, ColumnConfig } from './ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';

export interface NoteData {
  id: string;
  highPriority: boolean;
  date: string;
  account: string;
  name: string;
  reference: string;
  content: string;
}

interface NotesTableViewProps {
  notes: NoteData[];
  onAddNote: () => void;
  onEditNote: (note: NoteData) => void;
  onRowClick: (note: NoteData) => void;
  onExport?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'date', label: 'Date', visible: true },
  { id: 'account', label: 'Account', visible: true },
  { id: 'name', label: 'Name', visible: true },
  { id: 'reference', label: 'Reference', visible: true },
];

export const NotesTableView: React.FC<NotesTableViewProps> = ({
  notes, onAddNote, onEditNote, onRowClick, onExport, disabled = false, isLoading = false,
}) => {
  const [columns, setColumns] = useTableColumnConfig('notes', DEFAULT_COLUMNS);
  const visibleColumns = columns.filter((col) => col.visible);

  const renderCellValue = (note: NoteData, columnId: string) => {
    switch (columnId) {
      case 'date': return note.date || '-';
      case 'account': return note.account || '-';
      case 'name': return note.name || '-';
      case 'reference': return note.reference || '-';
      default: return '-';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">Notes</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExport} disabled={disabled || notes.length === 0} className="gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <ColumnConfigPopover columns={columns} onColumnsChange={setColumns} disabled={disabled} />
          <Button variant="outline" size="sm" onClick={onAddNote} disabled={disabled} className="gap-1">
            <Plus className="h-4 w-4" />
            Add Notes
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {visibleColumns.map((col) => (
                <TableHead key={col.id}>{col.label.toUpperCase()}</TableHead>
              ))}
              <TableHead className="w-[80px]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: visibleColumns.length + 1 }).map((_, ci) => (
                    <TableCell key={`sc-${ci}`}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : notes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                  No notes added. Click "Add Notes" to add one.
                </TableCell>
              </TableRow>
            ) : (
              notes.map((note) => (
                <TableRow key={note.id} className="cursor-pointer hover:bg-muted/30" onClick={() => onRowClick(note)}>
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id}>{renderCellValue(note, col.id)}</TableCell>
                  ))}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={() => onEditNote(note)} disabled={disabled} className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      {notes.length > 0 && (
        <div className="flex justify-end">
          <div className="text-sm text-muted-foreground">Total Notes: {notes.length}</div>
        </div>
      )}
    </div>
  );
};

export default NotesTableView;
