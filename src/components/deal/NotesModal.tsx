import React, { useState, useEffect, useRef } from 'react';
import { format, parse } from 'date-fns';
import { StickyNote, Paperclip, X, CalendarIcon } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RichTextEditor } from './RichTextEditor';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
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

const formatDateTimeDisplay = (isoStr: string): string => {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${mm}/${dd}/${yyyy} ${hh}:${min}:${ss}`;
  } catch { return isoStr; }
};

const getEmptyNote = (defaultAccount: string, defaultName: string): NoteData => ({
  id: `notes_entry_${Date.now()}`,
  highPriority: false,
  date: new Date().toISOString(),
  asOfDate: '',
  account: defaultAccount,
  name: defaultName,
  reference: '',
  content: '',
  type: '',
  attachments: [],
});

const NOTE_TYPES = ['Conversation Log', 'Attorney / Client', 'Internal'];

export const NotesModal: React.FC<NotesModalProps> = ({
  open, onOpenChange, note, onSave, isEdit = false, defaultAccount = '', defaultName = '',
}) => {
  const [formData, setFormData] = useState<NoteData>(getEmptyNote(defaultAccount, defaultName));
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setFormData(note ? { ...note, attachments: note.attachments || [], asOfDate: note.asOfDate || '' } : getEmptyNote(defaultAccount, defaultName));
  }, [open, note, defaultAccount, defaultName]);

  const asOfDateObj = formData.asOfDate ? (() => {
    try {
      const d = new Date(formData.asOfDate + 'T00:00:00');
      return isNaN(d.getTime()) ? undefined : d;
    } catch { return undefined; }
  })() : undefined;

  const handleAsOfDateSelect = (date: Date | undefined) => {
    if (date) {
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const yyyy = date.getFullYear();
      setFormData(prev => ({ ...prev, asOfDate: `${yyyy}-${mm}-${dd}` }));
    } else {
      setFormData(prev => ({ ...prev, asOfDate: '' }));
    }
  };

  const formatAsOfDisplay = (isoDate: string) => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate + 'T00:00:00');
      if (isNaN(d.getTime())) return isoDate;
      return format(d, 'MM/dd/yyyy');
    } catch { return isoDate; }
  };

  const handleSave = () => { onSave(formData); onOpenChange(false); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newNames = Array.from(files).map(f => f.name);
    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...newNames] }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== index) }));
  };

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <StickyNote className="h-4 w-4 text-primary" />
            {isEdit ? 'Edit Conversation Log' : 'Add New Conversation Log'}
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

          {/* Row 1: Date-Time | As Of */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs text-foreground">Date - Time</Label>
              <Input
                value={formatDateTimeDisplay(formData.date)}
                readOnly
                disabled
                className="h-7 text-xs flex-1 bg-muted"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs text-foreground">As Of</Label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-7 text-xs flex-1 justify-start text-left font-normal",
                      !formData.asOfDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {formData.asOfDate ? formatAsOfDisplay(formData.asOfDate) : <span>Select date...</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto z-[9999]" align="start">
                  <Calendar
                    mode="single"
                    selected={asOfDateObj}
                    onSelect={handleAsOfDateSelect}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Row 2: Account | Name */}
          <div className="grid grid-cols-2 gap-4">
            {renderInlineField('account', 'Account')}
            {renderInlineField('name', 'Name')}
          </div>

          {/* Row 3: Type | Reference */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Label className="w-[100px] shrink-0 text-xs text-foreground">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
              >
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map(t => (
                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderInlineField('reference', 'Reference')}
          </div>


          {/* Notes content - Rich Text Editor */}
          <div className="space-y-1 shrink-0">
            <Label className="text-xs text-foreground">Conversation Log</Label>
            <div className="h-[200px] border border-border rounded-md overflow-hidden">
              <RichTextEditor
                value={formData.content}
                onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
                placeholder="Enter conversation log content..."
                minHeight="60px"
              />
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-foreground">Attachments</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-3 w-3" />
                Attach File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".doc,.docx,.xls,.xlsx,.pdf,.csv,.txt,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />
            </div>
            {formData.attachments.length > 0 && (
              <div className="space-y-1 pl-[100px]">
                {formData.attachments.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                    <Paperclip className="h-3 w-3 shrink-0" />
                    <span className="flex-1 truncate">{name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => removeAttachment(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
