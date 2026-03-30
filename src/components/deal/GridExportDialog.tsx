import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Download, CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { format, parse, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

export interface ExportColumn {
  id: string;
  label: string;
}

interface GridExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: ExportColumn[];
  data: Record<string, any>[];
  fileName?: string;
}

export const GridExportDialog: React.FC<GridExportDialogProps> = ({
  open,
  onOpenChange,
  columns,
  data,
  fileName = 'export',
}) => {
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(columns.map((c) => c.id))
  );
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const toggleColumn = (id: string) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedColumns.size === columns.length) {
      setSelectedColumns(new Set());
    } else {
      setSelectedColumns(new Set(columns.map((c) => c.id)));
    }
  };

  const handleExport = () => {
    const exportCols = columns.filter((c) => selectedColumns.has(c.id));
    if (exportCols.length === 0) return;

    let filteredData = [...data];

    // Apply date range filter if set
    if (dateFrom || dateTo) {
      filteredData = filteredData.filter((row) => {
        const dateFields = ['date', 'dateOfCharge', 'fundingDate', 'expiration', 'created_at', 'appraisedDate'];
        const dateVal = dateFields.reduce((found, field) => {
          if (found) return found;
          const val = row[field];
          if (val) return new Date(val);
          return null;
        }, null as Date | null);

        if (!dateVal || isNaN(dateVal.getTime())) return true;

        if (dateFrom && dateVal < new Date(dateFrom)) return false;
        if (dateTo && dateVal > new Date(dateTo + 'T23:59:59')) return false;
        return true;
      });
    }

    // Build CSV
    const header = exportCols.map((c) => `"${c.label}"`).join(',');
    const rows = filteredData.map((row) =>
      exportCols
        .map((c) => {
          const val = row[c.id];
          if (val == null) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    );

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onOpenChange(false);
  };

  // Reset selections when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedColumns(new Set(columns.map((c) => c.id)));
      setDateFrom('');
      setDateTo('');
    }
  }, [open, columns]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date Range (optional)</Label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('h-8 text-xs flex-1 justify-start text-left font-normal', !dateFrom && 'text-muted-foreground')}>
                    {dateFrom ? (() => { try { const d = parse(dateFrom, 'yyyy-MM-dd', new Date()); return isValid(d) ? format(d, 'dd-MM-yyyy') : dateFrom; } catch { return dateFrom; } })() : 'From'}
                    <CalendarIcon className="ml-auto h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                  <EnhancedCalendar mode="single" selected={dateFrom ? (() => { try { const d = parse(dateFrom, 'yyyy-MM-dd', new Date()); return isValid(d) ? d : undefined; } catch { return undefined; } })() : undefined} onSelect={(d) => setDateFrom(d ? format(d, 'yyyy-MM-dd') : '')} onClear={() => setDateFrom('')} onToday={() => setDateFrom(format(new Date(), 'yyyy-MM-dd'))} initialFocus />
                </PopoverContent>
              </Popover>
              <span className="text-xs text-muted-foreground">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('h-8 text-xs flex-1 justify-start text-left font-normal', !dateTo && 'text-muted-foreground')}>
                    {dateTo ? (() => { try { const d = parse(dateTo, 'yyyy-MM-dd', new Date()); return isValid(d) ? format(d, 'dd-MM-yyyy') : dateTo; } catch { return dateTo; } })() : 'To'}
                    <CalendarIcon className="ml-auto h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                  <EnhancedCalendar mode="single" selected={dateTo ? (() => { try { const d = parse(dateTo, 'yyyy-MM-dd', new Date()); return isValid(d) ? d : undefined; } catch { return undefined; } })() : undefined} onSelect={(d) => setDateTo(d ? format(d, 'yyyy-MM-dd') : '')} onClear={() => setDateTo('')} onToday={() => setDateTo(format(new Date(), 'yyyy-MM-dd'))} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Column Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Columns to Export</Label>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={toggleAll}>
                {selectedColumns.size === columns.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            <div className="max-h-[200px] overflow-y-auto border border-border rounded-md p-2 space-y-1">
              {columns.map((col) => (
                <div key={col.id} className="flex items-center gap-2 py-0.5">
                  <Checkbox
                    id={`export-col-${col.id}`}
                    checked={selectedColumns.has(col.id)}
                    onCheckedChange={() => toggleColumn(col.id)}
                  />
                  <Label htmlFor={`export-col-${col.id}`} className="text-xs cursor-pointer">
                    {col.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {data.length} total records will be exported
            {selectedColumns.size > 0 && ` with ${selectedColumns.size} columns`}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleExport} disabled={selectedColumns.size === 0}>
            <Download className="h-3.5 w-3.5 mr-1" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GridExportDialog;
