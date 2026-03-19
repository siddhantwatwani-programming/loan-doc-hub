import React, { useState, useEffect, useRef } from 'react';
import { format, parse } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
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

const getEmptyNote = (defaultAccount: string, defaultName: string): NoteData => {
  const now = new Date();
  return {
    id: `notes_entry_${Date.now()}`,
    highPriority: false,
    date: now.toISOString(),
    asOfDate: now.toISOString(),
    account: defaultAccount,
    name: defaultName,
    reference: '',
    content: '',
    type: '',
    attachments: [],
  };
};

const NOTE_TYPES_FALLBACK = ['Conversation Log', 'Attorney / Client', 'Internal'];

export const NotesModal: React.FC<NotesModalProps> = ({
  open, onOpenChange, note, onSave, isEdit = false, defaultAccount = '', defaultName = '',
}) => {
  const [formData, setFormData] = useState<NoteData>(getEmptyNote(defaultAccount, defaultName));
  const [noteTypes, setNoteTypes] = useState<string[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTypesLoading(true);
    supabase
      .from('conversation_log_types')
      .select('label')
      .eq('is_active', true)
      .order('display_order')
      .then(({ data, error }) => {
        if (error || !data?.length) {
          setNoteTypes(NOTE_TYPES_FALLBACK);
        } else {
          setNoteTypes(data.map((r: any) => r.label));
        }
        setTypesLoading(false);
      });
  }, [open]);

  useEffect(() => {
    if (open) setFormData(note ? { ...note, attachments: note.attachments || [], asOfDate: note.asOfDate || '' } : getEmptyNote(defaultAccount, defaultName));
  }, [open, note, defaultAccount, defaultName]);

  const asOfDateObj = formData.asOfDate ? (() => {
    try {
      const d = new Date(formData.asOfDate);
      return isNaN(d.getTime()) ? undefined : d;
    } catch { return undefined; }
  })() : undefined;

  const [asOfDateOpen, setAsOfDateOpen] = useState(false);

  const handleAsOfDateSelect = (date: Date | undefined) => {
    if (date) {
      // Preserve existing time portion if present, otherwise use current time
      const existing = formData.asOfDate ? new Date(formData.asOfDate) : new Date();
      const hasValidTime = !isNaN(existing.getTime());
      date.setHours(hasValidTime ? existing.getHours() : new Date().getHours());
      date.setMinutes(hasValidTime ? existing.getMinutes() : new Date().getMinutes());
      date.setSeconds(hasValidTime ? existing.getSeconds() : new Date().getSeconds());
      setFormData(prev => ({ ...prev, asOfDate: date.toISOString() }));
    } else {
      setFormData(prev => ({ ...prev, asOfDate: '' }));
    }
    setAsOfDateOpen(false);
  };

  const formatAsOfDisplay = (isoDate: string) => {
    if (!isoDate) return '';
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate;
      return formatDateTimeDisplay(isoDate);
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
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-4"
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}
      >
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
              <Popover modal={true} open={asOfDateOpen} onOpenChange={setAsOfDateOpen}>
                <PopoverTrigger asChild>
                  <div className="relative flex-1 cursor-pointer">
                    <Input
                      value={formData.asOfDate ? formatAsOfDisplay(formData.asOfDate) : ''}
                      readOnly
                      placeholder="Select date..."
                      className="h-7 text-xs flex-1 pr-7 cursor-pointer"
                    />
                    <CalendarIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto z-[9999]" align="start">
                  <Calendar
                    mode="single"
                    selected={asOfDateObj}
                    onSelect={handleAsOfDateSelect}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                  <div className="flex items-center gap-1 px-3 pb-3 border-t border-border pt-2">
                    <Label className="text-xs text-muted-foreground mr-1">Time:</Label>
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={asOfDateObj ? String(asOfDateObj.getHours()).padStart(2, '0') : '00'}
                      onChange={(e) => {
                        const h = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                        const d = asOfDateObj ? new Date(asOfDateObj) : new Date();
                        d.setHours(h);
                        setFormData(prev => ({ ...prev, asOfDate: d.toISOString() }));
                      }}
                      className="h-7 w-12 text-xs text-center px-1"
                    />
                    <span className="text-xs text-muted-foreground">:</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={asOfDateObj ? String(asOfDateObj.getMinutes()).padStart(2, '0') : '00'}
                      onChange={(e) => {
                        const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                        const d = asOfDateObj ? new Date(asOfDateObj) : new Date();
                        d.setMinutes(m);
                        setFormData(prev => ({ ...prev, asOfDate: d.toISOString() }));
                      }}
                      className="h-7 w-12 text-xs text-center px-1"
                    />
                    <span className="text-xs text-muted-foreground">:</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      value={asOfDateObj ? String(asOfDateObj.getSeconds()).padStart(2, '0') : '00'}
                      onChange={(e) => {
                        const s = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                        const d = asOfDateObj ? new Date(asOfDateObj) : new Date();
                        d.setSeconds(s);
                        setFormData(prev => ({ ...prev, asOfDate: d.toISOString() }));
                      }}
                      className="h-7 w-12 text-xs text-center px-1"
                    />
                  </div>
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
                value={formData.type || undefined}
                onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
              >
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  {noteTypes.length > 0 ? noteTypes.map(t => (
                    <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                  )) : (
                    <SelectItem value="__none__" disabled className="text-xs text-muted-foreground">No options available</SelectItem>
                  )}
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
