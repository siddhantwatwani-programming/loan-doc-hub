

# Fix: Long Attachment Filenames Breaking Layout in Conversation Log Modal

## Problem
The attachment list container at line 381 has `pl-[100px]` padding, and the parent div lacks `overflow-hidden`. Although the individual attachment row has `truncate` and `min-w-0`, the container itself can expand beyond the modal width because there's no overflow constraint on the wrapper `div.space-y-2` (the attachments section parent).

## Root Cause
The `div.space-y-1.pl-[100px]` container (line 381) is not width-constrained. It sits inside a `div.space-y-2` which also lacks overflow control. The flex item with `truncate` only works when its ancestor chain properly constrains width — but here the ancestors allow expansion.

## Fix (single file: `src/components/deal/NotesModal.tsx`)

**Line 381** — Add `overflow-hidden` to the attachment list container:
```
// Before
<div className="space-y-1 pl-[100px]">

// After
<div className="space-y-1 pl-[100px] overflow-hidden">
```

**Line 383** — Add `max-w-full` to each attachment row to ensure it respects the container boundary:
```
// Before
<div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 overflow-hidden">

// After
<div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 overflow-hidden max-w-full">
```

**Line 395-403** — Add `shrink-0` to the remove button so it never collapses:
```
// Before
className="h-5 w-5"

// After  
className="h-5 w-5 shrink-0"
```

## What Will NOT Change
- No attachment functionality (upload, remove, download) modified
- No APIs, database schema, or document generation logic touched
- No layout changes outside the attachment rows in this modal

