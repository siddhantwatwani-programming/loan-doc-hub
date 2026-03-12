import React, { useCallback, useMemo, useState } from 'react';
import { Plus, Download, Search, ChevronLeft, ChevronRight, Loader2, Filter, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ColumnConfigPopover, ColumnConfig } from '@/components/deal/ColumnConfigPopover';
import { useTableColumnConfig } from '@/hooks/useTableColumnConfig';
import type { ContactRecord } from '@/hooks/useContactsCrud';

interface ContactsListViewProps {
  title: string;
  contacts: ContactRecord[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onPageChange: (page: number) => void;
  onRowClick: (contact: ContactRecord) => void;
  onCreateNew: () => void;
  defaultColumns: ColumnConfig[];
  tableConfigKey: string;
  addButtonLabel?: string;
  breadcrumbLabel?: string;
  filterColumns?: { id: string; label: string }[];
  renderCellValue?: (contact: ContactRecord, columnId: string) => React.ReactNode;
}

type SortDir = 'asc' | 'desc' | null;

export const ContactsListView: React.FC<ContactsListViewProps> = ({
  title,
  contacts,
  totalCount,
  totalPages,
  currentPage,
  isLoading,
  searchQuery,
  onSearchChange,
  onPageChange,
  onRowClick,
  onCreateNew,
  defaultColumns,
  tableConfigKey,
  addButtonLabel,
  breadcrumbLabel,
  filterColumns,
  renderCellValue,
}) => {
  const [columns, setColumns, resetColumns] = useTableColumnConfig(tableConfigKey, defaultColumns);
  const visibleColumns = columns.filter((c) => c.visible);
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const handleSort = (colId: string) => {
    if (sortColumn === colId) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortColumn(null); setSortDir(null); }
      else setSortDir('asc');
    } else {
      setSortColumn(colId);
      setSortDir('asc');
    }
  };

  const handleExport = useCallback(() => {
    if (contacts.length === 0) return;
    const headers = visibleColumns.map((c) => c.label);
    const rows = contacts.map((contact) =>
      visibleColumns.map((c) => {
        const val = getCellValue(contact, c.id);
        return typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val || '');
      })
    );
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [contacts, visibleColumns, title]);

  const getCellValue = (contact: ContactRecord, columnId: string): string => {
    const topLevel: Record<string, string> = {
      contact_id: contact.contact_id,
      full_name: contact.full_name,
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone,
      city: contact.city,
      state: contact.state,
      company: contact.company,
    };
    if (columnId in topLevel) return topLevel[columnId] || '';
    return (contact.contact_data as Record<string, string>)?.[columnId] || '';
  };

  // Apply client-side column filter
  const filteredContacts = (filterColumn && filterValue)
    ? contacts.filter((c) => {
        const val = getCellValue(c, filterColumn).toLowerCase();
        return val.includes(filterValue.toLowerCase());
      })
    : contacts;

  // Apply client-side sorting
  const sortedContacts = useMemo(() => {
    if (!sortColumn || !sortDir) return filteredContacts;
    return [...filteredContacts].sort((a, b) => {
      const aVal = getCellValue(a, sortColumn).toLowerCase();
      const bVal = getCellValue(b, sortColumn).toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredContacts, sortColumn, sortDir]);

  const defaultRenderCell = (contact: ContactRecord, columnId: string): React.ReactNode => {
    const val = getCellValue(contact, columnId);
    if (val === 'true') return '✓';
    if (val === 'false') return '';
    if (columnId === 'full_name') return <span className="font-medium">{val || '-'}</span>;
    return val || '-';
  };

  const filterableCols = filterColumns || visibleColumns.map((c) => ({ id: c.id, label: c.label }));

  const SortIcon = ({ colId }: { colId: string }) => {
    if (sortColumn !== colId) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    if (sortDir === 'asc') return <ArrowUp className="h-3 w-3 ml-1" />;
    return <ArrowDown className="h-3 w-3 ml-1" />;
  };

  return (
    <div className="p-6 space-y-4">
      {/* Breadcrumb */}
      {breadcrumbLabel && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-default">Contact</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{breadcrumbLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1">
            <Download className="h-4 w-4" /> Export
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-9 w-[200px]"
            />
          </div>
          {/* Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" /> Filter
                {filterColumn && filterValue && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-xs">1</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 space-y-3" align="end">
              <p className="text-sm font-medium text-foreground">Filter by column</p>
              <Select value={filterColumn} onValueChange={(v) => { setFilterColumn(v); setFilterValue(''); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {filterableCols.map((col) => (
                    <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filterColumn && (
                <Input
                  placeholder="Filter value..."
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="h-9"
                />
              )}
              {(filterColumn || filterValue) && (
                <Button variant="ghost" size="sm" onClick={() => { setFilterColumn(''); setFilterValue(''); }}>
                  Clear filter
                </Button>
              )}
            </PopoverContent>
          </Popover>
          <ColumnConfigPopover columns={columns} onColumnsChange={setColumns} onResetColumns={resetColumns} />
          <Button variant="outline" size="sm" onClick={onCreateNew} className="gap-1">
            <Plus className="h-4 w-4" /> {addButtonLabel || 'Create New'}
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-x-auto">
        <Table className="min-w-[1000px]">
          <TableHeader>
            <TableRow className="bg-muted/50">
              {visibleColumns.map((col) => (
                <TableHead
                  key={col.id}
                  className="cursor-pointer select-none hover:bg-muted/80"
                  onClick={() => handleSort(col.id)}
                >
                  <div className="flex items-center">
                    {col.label.toUpperCase()}
                    <SortIcon colId={col.id} />
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-muted-foreground">
                  {totalCount === 0
                    ? `No contacts yet. Click "${addButtonLabel || 'Create New'}" to add one.`
                    : 'No contacts match your search or filter.'}
                </TableCell>
              </TableRow>
            ) : (
              sortedContacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => onRowClick(contact)}
                >
                  {visibleColumns.map((col) => (
                    <TableCell key={col.id}>
                      {renderCellValue
                        ? renderCellValue(contact, col.id)
                        : defaultRenderCell(contact, col.id)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Total: {totalCount}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
