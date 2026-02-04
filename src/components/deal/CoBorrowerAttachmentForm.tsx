import React, { useState, useCallback } from 'react';
import { Upload, Download, Trash2, MoreVertical, Mail, FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface CoBorrowerAttachmentFormProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
  coBorrowerId?: string;
}

export const CoBorrowerAttachmentForm: React.FC<CoBorrowerAttachmentFormProps> = ({
  values,
  onValueChange,
  disabled = false,
  coBorrowerId,
}) => {
  const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);

  // Parse attachments from values (stored as JSON in coborrower.attachments)
  const getAttachments = useCallback((): Attachment[] => {
    const attachmentsJson = values['coborrower.attachments'];
    if (!attachmentsJson) return [];
    try {
      return JSON.parse(attachmentsJson);
    } catch {
      return [];
    }
  }, [values]);

  const attachments = getAttachments();

  const handleUpload = useCallback(() => {
    // Create a hidden file input for upload
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const newAttachments: Attachment[] = [...attachments];
        
        Array.from(files).forEach((file) => {
          const newAttachment: Attachment = {
            id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: formatFileSize(file.size),
            uploadedAt: new Date().toISOString(),
            uploadedBy: 'Current User',
          };
          newAttachments.push(newAttachment);
        });
        
        onValueChange('coborrower.attachments', JSON.stringify(newAttachments));
        toast.success(`${files.length} file(s) uploaded successfully`);
      }
    };
    input.click();
  }, [attachments, onValueChange]);

  const handleDownload = useCallback(() => {
    if (selectedAttachments.length === 0) {
      toast.error('Please select attachments to download');
      return;
    }
    toast.info('Download functionality will be available when storage is configured');
  }, [selectedAttachments]);

  const handleDelete = useCallback(() => {
    if (selectedAttachments.length === 0) {
      toast.error('Please select attachments to delete');
      return;
    }
    
    const updatedAttachments = attachments.filter(
      (att) => !selectedAttachments.includes(att.id)
    );
    onValueChange('coborrower.attachments', JSON.stringify(updatedAttachments));
    setSelectedAttachments([]);
    toast.success(`${selectedAttachments.length} attachment(s) deleted`);
  }, [selectedAttachments, attachments, onValueChange]);

  const handleEmail = useCallback(() => {
    if (selectedAttachments.length === 0) {
      toast.error('Please select attachments to email');
      return;
    }
    toast.info('Email functionality will be available when email is configured');
  }, [selectedAttachments]);

  const handleRefresh = useCallback(() => {
    toast.info('Refreshing attachments...');
    // In a real implementation, this would reload from the server
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedAttachments.length === attachments.length) {
      setSelectedAttachments([]);
    } else {
      setSelectedAttachments(attachments.map((a) => a.id));
    }
  }, [selectedAttachments, attachments]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedAttachments((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }, []);

  return (
    <div className="p-6 space-y-4">
      {/* Header with title and action buttons */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-primary">Co-Borrower Attachments</h3>
        
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleUpload}
            disabled={disabled}
            title="Upload"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleDownload}
            disabled={disabled || selectedAttachments.length === 0}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleDelete}
            disabled={disabled || selectedAttachments.length === 0}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={disabled}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={toggleSelectAll}>
                {selectedAttachments.length === attachments.length ? 'Deselect All' : 'Select All'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleEmail}
            disabled={disabled || selectedAttachments.length === 0}
            title="Email"
          >
            <Mail className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={disabled}
            title="View Document"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleRefresh}
            disabled={disabled}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Attachments Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[40px]">
                <input
                  type="checkbox"
                  checked={attachments.length > 0 && selectedAttachments.length === attachments.length}
                  onChange={toggleSelectAll}
                  disabled={disabled || attachments.length === 0}
                  className="h-4 w-4"
                />
              </TableHead>
              <TableHead>NAME</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>SIZE</TableHead>
              <TableHead>UPLOADED</TableHead>
              <TableHead>BY</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attachments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No attachments found.
                </TableCell>
              </TableRow>
            ) : (
              attachments.map((attachment) => (
                <TableRow
                  key={attachment.id}
                  className={selectedAttachments.includes(attachment.id) ? 'bg-muted/30' : ''}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedAttachments.includes(attachment.id)}
                      onChange={() => toggleSelect(attachment.id)}
                      disabled={disabled}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{attachment.name}</TableCell>
                  <TableCell>{attachment.type}</TableCell>
                  <TableCell>{attachment.size}</TableCell>
                  <TableCell>{formatDate(attachment.uploadedAt)}</TableCell>
                  <TableCell>{attachment.uploadedBy}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer with OK/Cancel buttons to match screenshot */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="default" size="sm" disabled={disabled}>
          OK
        </Button>
        <Button variant="outline" size="sm" disabled={disabled}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default CoBorrowerAttachmentForm;
