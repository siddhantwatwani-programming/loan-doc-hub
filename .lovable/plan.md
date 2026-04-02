

## Fix: Long Attachment Filenames Breaking Modal Layout

### Problem
The `DialogContent` component uses CSS `grid` layout. Grid children default to `min-width: auto`, which prevents `truncate` (text-overflow: ellipsis) from working on nested elements. Despite previous fixes adding `truncate` and `min-w-0` to the filename span and attachment row, the parent grid child containers don't constrain their width, so the filename still expands the modal.

### Solution
Add `min-w-0` to the main content `div` (the direct grid child inside `DialogContent`) so that the width constraint propagates down to the attachment filename span where `truncate` is already applied. This is a single-class addition on one element.

### File Change

**`src/components/deal/NotesModal.tsx`** (line 228):
- Change: `<div className="space-y-3 mt-3">` 
- To: `<div className="space-y-3 mt-3 min-w-0">`

This ensures the grid child respects the modal's `max-w-2xl` constraint, allowing the existing `truncate` on the filename span to activate properly. No other changes needed — tooltip, button alignment, and all existing functionality remain untouched.

