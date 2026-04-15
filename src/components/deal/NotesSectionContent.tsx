import React, { useState, useCallback, useMemo } from 'react';
import { useDealNavigationOptional } from '@/contexts/DealNavigationContext';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotesSubNavigation, type NotesSubSection } from './NotesSubNavigation';
import { NotesDetailForm } from './NotesDetailForm';
import { NotesTableView, type NoteData, type AttachmentMeta } from './NotesTableView';
import { NotesModal } from './NotesModal';
import { useDirtyFields, DirtyFieldsProvider } from '@/contexts/DirtyFieldsContext';
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
      incoming: values[`${prefix}.incoming`] === 'true',
      outgoing: values[`${prefix}.outgoing`] === 'true',
      date: values[`${prefix}.date`] || '',
      asOfDate: values[`${prefix}.as_of_date`] || '',
      account: values[`${prefix}.account`] || '',
      name: values[`${prefix}.name`] || '',
      reference: values[`${prefix}.reference`] || '',
      content: values[`${prefix}.content`] || '',
      type: values[`${prefix}.type`] || '',
      attachments,
      followupReminder: values[`${prefix}.followup_reminder`] || '',
      completed: values[`${prefix}.completed`] || '',
      assignedOn: values[`${prefix}.assigned_on`] || '',
      assignedTo: values[`${prefix}.assigned_to`] || '',
      assignedDepartment: values[`${prefix}.assigned_department`] || '',
      assignedBy: values[`${prefix}.assigned_by`] || '',
      completedBy: values[`${prefix}.completed_by`] || '',
      completedOn: values[`${prefix}.completed_on`] || '',
      publish: values[`${prefix}.publish`] === 'true',
      addToParticipants: values[`${prefix}.add_to_participants`] === 'true',
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
  const nav = useDealNavigationOptional();
  const activeSubSection = (nav?.getSubSection('notes') ?? 'notes') as NotesSubSection;
  const setActiveSubSection = (sub: NotesSubSection) => nav?.setSubSection('notes', sub);
  const selectedNotePrefix = nav?.getSelectedPrefix('notes') ?? 'notes_entry1';
  const setSelectedNotePrefix = (prefix: string) => nav?.setSelectedPrefix('notes', prefix);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteData | null>(null);
  const [asOfFilter, setAsOfFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const notes = useMemo(() => extractNotesFromValues(values), [values]);

  const filteredNotes = useMemo(() => {
    if (!asOfFilter) return notes;
    return notes.filter(n => n.asOfDate === asOfFilter);
  }, [notes, asOfFilter]);

  const totalFiltered = filteredNotes.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedNotes = filteredNotes.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const isDetailView = activeSubSection === 'detail';

  const selectedNoteName = useMemo(() => {
    const note = notes.find(n => n.id === selectedNotePrefix);
    if (note) {
      return note.name || note.type || `Entry ${selectedNotePrefix.replace('notes_entry', '')}`;
    }
    return 'Conversation Log';
  }, [notes, selectedNotePrefix]);

  const handleAddNote = useCallback(() => { setEditingNote(null); setModalOpen(true); }, []);
  const handleEditNote = useCallback((note: NoteData) => { setEditingNote(note); setModalOpen(true); }, []);

  const handleRowClick = useCallback((note: NoteData) => {
    setSelectedNotePrefix(note.id);
    setActiveSubSection('detail');
  }, []);

  const handleBackToTable = useCallback(() => {
    setActiveSubSection('notes');
  }, []);

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
    onValueChange(`${prefix}.incoming`, noteData.incoming ? 'true' : 'false');
    onValueChange(`${prefix}.outgoing`, noteData.outgoing ? 'true' : 'false');
    onValueChange(`${prefix}.date`, noteData.date);
    onValueChange(`${prefix}.as_of_date`, noteData.asOfDate || '');
    onValueChange(`${prefix}.account`, noteData.account);
    onValueChange(`${prefix}.name`, noteData.name);
    onValueChange(`${prefix}.reference`, noteData.reference);
    onValueChange(`${prefix}.content`, noteData.content);
    onValueChange(`${prefix}.type`, noteData.type);
    onValueChange(`${prefix}.attachments`, JSON.stringify(noteData.attachments || []));
    onValueChange(`${prefix}.followup_reminder`, noteData.followupReminder || '');
    onValueChange(`${prefix}.completed`, noteData.completed || '');
    onValueChange(`${prefix}.assigned_on`, noteData.assignedOn || '');
    onValueChange(`${prefix}.assigned_to`, noteData.assignedTo || '');
    onValueChange(`${prefix}.assigned_department`, noteData.assignedDepartment || '');
    onValueChange(`${prefix}.assigned_by`, noteData.assignedBy || '');
    onValueChange(`${prefix}.completed_by`, noteData.completedBy || '');
    onValueChange(`${prefix}.completed_on`, noteData.completedOn || '');
    onValueChange(`${prefix}.publish`, noteData.publish ? 'true' : 'false');
    onValueChange(`${prefix}.add_to_participants`, noteData.addToParticipants ? 'true' : 'false');
    setModalOpen(false);
  }, [editingNote, values, onValueChange]);

  const handleDetailSave = useCallback((noteData: NoteData) => {
    const prefix = noteData.id;
    onValueChange(`${prefix}.high_priority`, noteData.highPriority ? 'true' : 'false');
    onValueChange(`${prefix}.incoming`, noteData.incoming ? 'true' : 'false');
    onValueChange(`${prefix}.outgoing`, noteData.outgoing ? 'true' : 'false');
    onValueChange(`${prefix}.date`, noteData.date);
    onValueChange(`${prefix}.as_of_date`, noteData.asOfDate || '');
    onValueChange(`${prefix}.account`, noteData.account);
    onValueChange(`${prefix}.name`, noteData.name);
    onValueChange(`${prefix}.reference`, noteData.reference);
    onValueChange(`${prefix}.content`, noteData.content);
    onValueChange(`${prefix}.type`, noteData.type);
    onValueChange(`${prefix}.attachments`, JSON.stringify(noteData.attachments || []));
    onValueChange(`${prefix}.followup_reminder`, noteData.followupReminder || '');
    onValueChange(`${prefix}.completed`, noteData.completed || '');
    onValueChange(`${prefix}.assigned_on`, noteData.assignedOn || '');
    onValueChange(`${prefix}.assigned_to`, noteData.assignedTo || '');
    onValueChange(`${prefix}.assigned_department`, noteData.assignedDepartment || '');
    onValueChange(`${prefix}.assigned_by`, noteData.assignedBy || '');
    onValueChange(`${prefix}.completed_by`, noteData.completedBy || '');
    onValueChange(`${prefix}.completed_on`, noteData.completedOn || '');
    onValueChange(`${prefix}.publish`, noteData.publish ? 'true' : 'false');
    onValueChange(`${prefix}.add_to_participants`, noteData.addToParticipants ? 'true' : 'false');
  }, [onValueChange]);

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

  const selectedNote = useMemo(() => {
    return notes.find(n => n.id === selectedNotePrefix) || null;
  }, [notes, selectedNotePrefix]);

  const renderSubSectionContent = () => {
    switch (activeSubSection) {
      case 'notes':
        return (
          <NotesTableView
            notes={paginatedNotes}
            onAddNote={handleAddNote}
            onEditNote={handleEditNote}
            onRowClick={handleRowClick}
            onDeleteNote={handleDeleteNote}
            onExport={handleExport}
            onRefresh={onRefresh}
            disabled={disabled}
            asOfFilter={asOfFilter}
            onAsOfFilterChange={(v) => { setAsOfFilter(v); setCurrentPage(1); }}
            currentPage={safePage}
            totalPages={totalPages}
            totalCount={totalFiltered}
            onPageChange={setCurrentPage}
          />
        );
      case 'detail':
        return (
          <NotesDetailForm
            note={selectedNote}
            onSave={handleDetailSave}
            disabled={disabled}
            dealId={dealId}
            defaultName={userName}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex flex-col border border-border rounded-lg bg-background overflow-hidden">
        {isDetailView && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToTable}
              className="gap-1 h-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <span className="text-sm font-medium text-foreground">
              {selectedNoteName}
            </span>
          </div>
        )}

        <div className="flex flex-1">
          <NotesSubNavigation
            activeSubSection={activeSubSection}
            onSubSectionChange={setActiveSubSection}
            isDetailView={isDetailView}
          />
          <div className="flex-1 min-w-0 overflow-auto">
            {renderSubSectionContent()}
          </div>
        </div>
      </div>

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
