import React, { useState, useCallback, useMemo } from 'react';
import { NotesTableView, type NoteData } from './NotesTableView';
import { NotesModal } from './NotesModal';
import type { FieldDefinition } from '@/hooks/useDealFields';
import type { CalculationResult } from '@/lib/calculationEngine';

interface NotesSectionContentProps {
  fields: FieldDefinition[];
  values: Record<string, string>;
  onValueChange: (fieldKey: string, value: string) => void;
  showValidation?: boolean;
  disabled?: boolean;
  calculationResults?: Record<string, CalculationResult>;
  dealNumber?: string;
  userName?: string;
}

const extractNotesFromValues = (values: Record<string, string>): NoteData[] => {
  const notes: NoteData[] = [];
  const prefixes = new Set<string>();

  Object.keys(values).forEach(key => {
    const match = key.match(/^(notes_entry\d+)\./);
    if (match) prefixes.add(match[1]);
  });

  prefixes.forEach(prefix => {
    notes.push({
      id: prefix,
      highPriority: values[`${prefix}.high_priority`] === 'true',
      date: values[`${prefix}.date`] || '',
      account: values[`${prefix}.account`] || '',
      name: values[`${prefix}.name`] || '',
      reference: values[`${prefix}.reference`] || '',
      content: values[`${prefix}.content`] || '',
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
  values, onValueChange, disabled = false, dealNumber = '', userName = '',
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteData | null>(null);

  const notes = useMemo(() => extractNotesFromValues(values), [values]);

  const handleAddNote = useCallback(() => { setEditingNote(null); setModalOpen(true); }, []);
  const handleEditNote = useCallback((note: NoteData) => { setEditingNote(note); setModalOpen(true); }, []);
  const handleRowClick = useCallback((note: NoteData) => { setEditingNote(note); setModalOpen(true); }, []);

  const handleSaveNote = useCallback((noteData: NoteData) => {
    const prefix = editingNote ? editingNote.id : getNextNotePrefix(values);
    onValueChange(`${prefix}.high_priority`, noteData.highPriority ? 'true' : 'false');
    onValueChange(`${prefix}.date`, noteData.date);
    onValueChange(`${prefix}.account`, noteData.account);
    onValueChange(`${prefix}.name`, noteData.name);
    onValueChange(`${prefix}.reference`, noteData.reference);
    onValueChange(`${prefix}.content`, noteData.content);
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
        notes={notes}
        onAddNote={handleAddNote}
        onEditNote={handleEditNote}
        onRowClick={handleRowClick}
        onExport={handleExport}
        disabled={disabled}
      />

      <NotesModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        note={editingNote}
        onSave={handleSaveNote}
        isEdit={!!editingNote}
        defaultAccount={dealNumber}
        defaultName={userName}
      />
    </>
  );
};

export default NotesSectionContent;
