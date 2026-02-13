import React, { useState, useEffect } from 'react';
import { StickyNote } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RichTextEditor } from './RichTextEditor';
import type { NoteData } from './NotesTableView';

interface NotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note?: NoteData | null;
  onSave: (note: NoteData) => void;
  isEdit?: boolean;
  defaultAccount?: string;
  defaultName?: string;
}

const getEmptyNote = (defaultAccount: string, defaultName: string): NoteData => ({
  id: `notes_entry_${Date.now()}`,
  highPriority: false,
  date: new Date().toISOString().split('T')[0],
  account: defaultAccount,
  name: defaultName,
  reference: '',
  content: '',
});

export const NotesModal: React.FC<NotesModalProps> = ({
  open, onOpenChange, note, onSave, isEdit = false, defaultAccount = '', defaultName = '',
}) => {
  const [formData, setFormData] = useState<NoteData>(getEmptyNote(defaultAccount, defaultName));

  useEffect(() => {
    if (open) setFormData(note ? note : getEmptyNote(defaultAccount, defaultName));
  }, [open, note, defaultAccount, defaultName]);

  const handleSave = () => { onSave(formData); onOpenChange(false); };

  const renderInlineField = (field: keyof NoteData, label: string, props: Record<string, any> = {}) => (
    <div className="flex items-center gap-2">
      <Label className="w-[100px] shrink-0 text-xs text-foreground">{label}</Label>
      <Input
        value={formData[field] as string}
        onChange={(e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))}
        className="h-7 text-xs flex-1"
        {...props}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <StickyNote className="h-4 w-4 text-primary" />
            {isEdit ? 'Edit Note' : 'Add Note'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          {/* High Priority */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={formData.highPriority}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, highPriority: !!checked }))}
            />
            <Label className="text-xs text-foreground">High Priority</Label>
          </div>

          {renderInlineField('date', 'Date', { type: 'date' })}
          {renderInlineField('account', 'Account')}
          {renderInlineField('name', 'Name')}
          {renderInlineField('reference', 'Reference')}

          {/* Notes content - Rich Text Editor */}
          <div className="space-y-1">
            <Label className="text-xs text-foreground">Notes</Label>
            <RichTextEditor
              value={formData.content}
              onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
              placeholder="Enter note content..."
              minHeight="200px"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NotesModal;
