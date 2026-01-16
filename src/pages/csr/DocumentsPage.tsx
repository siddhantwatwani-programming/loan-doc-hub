import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Upload, FolderOpen } from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">Manage loan documents</p>
        </div>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <div className="section-card text-center py-16">
        <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Document Management</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          This section is part of Phase 1A - CSR data capture. Document generation will be available in a future phase.
        </p>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Upload supporting documents for your deals</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Organize documents by deal or borrower</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
