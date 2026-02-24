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

interface SaveConfirmationDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SaveConfirmationDialog: React.FC<SaveConfirmationDialogProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Do you want to save changes?</AlertDialogTitle>
          <AlertDialogDescription>
            This will save your current changes as a draft.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onCancel}>No</Button>
          <Button onClick={onConfirm}>Yes</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
