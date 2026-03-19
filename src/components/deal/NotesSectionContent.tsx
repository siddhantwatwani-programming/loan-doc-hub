import React, { useState, useCallback, useMemo } from 'react';
import { NotesTableView, type NoteData, type AttachmentMeta } from './NotesTableView';
import { NotesModal } from './NotesModal';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface NotesSectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  onRemoveValuesByPrefix?: (prefix: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
  dealNumber?: string;
  dealId?: string;
  userName?: string;
  onRefresh?: () => void;
}

const extractNotesFromValues = (values: Record<string, string>): NoteData[] => {
  const notes: NoteData[] = [];
  const prefixes = new Set<string>();

  Object.keys(values).forEach(key => {
    const match = key.match(/^(notes_entry\d+)\./);
    if (match) prefixes.add(match[1]);
  });

  prefixes.forEach(prefix => {
    let attachments: (string | AttachmentMeta)[] = [];
    const rawAtt = values[`${prefix}.attachments`];
    if (rawAtt) {
      try {
        const parsed = JSON.parse(rawAtt);
        attachments = Array.isArray(parsed) ? parsed : [];
      } catch {
        attachments = [];
      }
    }

    notes.push({
      id: prefix,
      highPriority: values[`${prefix}.high_priority`] === 'true',
      date: values[`${prefix}.date`] || '',
      asOfDate: values[`${prefix}.as_of_date`] || '',
      account: values[`${prefix}.account`] || '',
      name: values[`${prefix}.name`] || '',
      reference: values[`${prefix}.reference`] || '',
      content: values[`${prefix}.content`] || '',
      type: values[`${prefix}.type`] || '',
      attachments,
    });
  });

  notes.sort((a, b) => {
    const numA = parseInt(a.id.replace('notes_entry', ''));
    const numB = parseInt(b.id.replace('notes_entry', ''));
    return numA - numB;
  });

  return notes;
};

const getNextNotePrefix = (values: Record<string, string>): string => {
  const prefixes = new Set<string>();
  Object.keys(values).forEach(key => {
    const match = key.match(/^(notes_entry\d+)\./);
    if (match) prefixes.add(match[1]);
  });
  let n = 1;
  while (prefixes.has(`notes_entry${n}`)) n++;
  return `notes_entry${n}`;
};

export const NotesSectionContent: React.FC<NotesSectionContentProps> = ({
  values, onValueChange, onRemoveValuesByPrefix, disabled = false, dealNumber = '', dealId = '', userName = '', onRefresh,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteData | null>(null);
  const [asOfFilter, setAsOfFilter] = useState('');

  const notes = useMemo(() => extractNotesFromValues(values), [values]);

  const filteredNotes = useMemo(() => {
    if (!asOfFilter) return notes;
    return notes.filter(n => n.asOfDate === asOfFilter);
  }, [notes, asOfFilter]);

  const handleAddNote = useCallback(() => { setEditingNote(null); setModalOpen(true); }, []);
  const handleEditNote = useCallback((note: NoteData) => { setEditingNote(note); setModalOpen(true); }, []);
  const handleRowClick = useCallback((note: NoteData) => { /* row click now handled by NotesTableView detail dialog */ }, []);

  const handleDeleteNote = useCallback((note: NoteData) => {
    if (onRemoveValuesByPrefix) {
      onRemoveValuesByPrefix(note.id);
    } else {
      Object.keys(values).forEach(key => {
        if (key.startsWith(`${note.id}.`)) onValueChange(key, '');
      });
    }
  }, [values, onValueChange, onRemoveValuesByPrefix]);

  const handleSaveNote = useCallback((noteData: NoteData) => {
    const prefix = editingNote ? editingNote.id : getNextNotePrefix(values);
    onValueChange(`${prefix}.high_priority`, noteData.highPriority ? 'true' : 'false');
    onValueChange(`${prefix}.date`, noteData.date);
    onValueChange(`${prefix}.as_of_date`, noteData.asOfDate || '');
    onValueChange(`${prefix}.account`, noteData.account);
    onValueChange(`${prefix}.name`, noteData.name);
    onValueChange(`${prefix}.reference`, noteData.reference);
    onValueChange(`${prefix}.content`, noteData.content);
    onValueChange(`${prefix}.type`, noteData.type);
    onValueChange(`${prefix}.attachments`, JSON.stringify(noteData.attachments || []));
    setModalOpen(false);
  }, [editingNote, values, onValueChange]);

  const handleExport = useCallback(() => {
    if (notes.length === 0) return;
    const headers = ['Date', 'Account', 'Name', 'Reference', 'High Priority', 'Content'];
    const escape = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    const rows = notes.map(n => [n.date, n.account, n.name, n.reference, n.highPriority ? 'Yes' : 'No', n.content].map(escape).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `notes_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }, [notes]);

  return (
    <>
      <NotesTableView
        notes={filteredNotes}
        onAddNote={handleAddNote}
        onEditNote={handleEditNote}
        onRowClick={handleRowClick}
        onDeleteNote={handleDeleteNote}
        onExport={handleExport}
        onRefresh={onRefresh}
        disabled={disabled}
        asOfFilter={asOfFilter}
        onAsOfFilterChange={setAsOfFilter}
      />

      <NotesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        note={editingNote}
        onSave={handleSaveNote}
        isEdit={!!editingNote}
        defaultAccount={dealNumber}
        defaultName={userName}
        dealId={dealId}
      />
    </>
  );
};

export default NotesSectionContent;
