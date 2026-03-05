import React, { useState } from 'react';
import { useEventJournalEntries, type EventJournalEntry, type FieldChange } from '@/hooks/useEventJournal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { BookOpen } from 'lucide-react';

interface EventJournalViewerProps {
  dealId: string;
}

function formatDetailsPreview(details: FieldChange[]): string {
  const text = details
    .map(d => `${d.fieldLabel}: ${d.oldValue || '(empty)'} → ${d.newValue || '(empty)'}`)
    .join('; ');
  return text.length > 80 ? text.substring(0, 80) + '…' : text;
}

function formatDetailsFull(details: FieldChange[]): React.ReactNode {
  return (
    <div className="space-y-2">
      {details.map((d, i) => (
        <div key={i} className="text-sm">
          <span className="font-medium text-foreground">{d.fieldLabel}:</span>{' '}
          <span className="text-muted-foreground">{d.oldValue || '(empty)'}</span>
          <span className="mx-1 text-primary">→</span>
          <span className="text-foreground">{d.newValue || '(empty)'}</span>
        </div>
      ))}
    </div>
  );
}

export const EventJournalViewer: React.FC<EventJournalViewerProps> = ({ dealId }) => {
  const { data: entries, isLoading } = useEventJournalEntries(dealId);
  const [selectedEntry, setSelectedEntry] = useState<EventJournalEntry | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-muted-foreground">Loading event journal…</p>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Event Journal</h3>
          <p className="text-muted-foreground">No changes recorded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Event #</TableHead>
            <TableHead className="w-[150px]">User</TableHead>
            <TableHead className="w-[120px]">Section</TableHead>
            <TableHead>Details</TableHead>
            <TableHead className="w-[160px]">Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-mono">{entry.event_number}</TableCell>
              <TableCell>{entry.actor_name}</TableCell>
              <TableCell className="capitalize">{entry.section.replace(/_/g, ' ')}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground truncate max-w-[300px]">
                    {formatDetailsPreview(entry.details)}
                  </span>
                  {entry.details.length > 0 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="shrink-0 px-1 h-auto"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      Show More
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Event #{selectedEntry?.event_number} — {selectedEntry?.section.replace(/_/g, ' ')}
            </DialogTitle>
            <DialogDescription>
              By {selectedEntry?.actor_name} on{' '}
              {selectedEntry ? format(new Date(selectedEntry.created_at), 'MMM d, yyyy h:mm a') : ''}
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && formatDetailsFull(selectedEntry.details)}
        </DialogContent>
      </Dialog>
    </div>
  );
};
