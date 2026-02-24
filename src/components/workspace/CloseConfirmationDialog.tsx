import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface CloseConfirmationDialogProps {
  open: boolean;
  onSaveAndClose: () => void;
  onDiscard: () => void;
  onStay: () => void;
}

export const CloseConfirmationDialog: React.FC<CloseConfirmationDialogProps> = ({
  open,
  onSaveAndClose,
  onDiscard,
  onStay,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onStay(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Do you want to save changes before leaving?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Choose what to do before closing this file.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onStay}>Stay</Button>
          <Button variant="destructive" onClick={onDiscard}>Discard</Button>
          <Button onClick={onSaveAndClose}>Save &amp; Close</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
