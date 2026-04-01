

# Fix: Long Attachment File Names Breaking Layout in Conversation Log Details Modal

## Problem
In the Conversation Log Details modal, long attachment file names overflow the container, pushing the Download button and other elements out of view. Although `truncate` is on the filename `<span>`, it doesn't work because the flex parent lacks `overflow-hidden` and `min-w-0`.

## Fix (4 files, same pattern in each)

### Changes per file
1. Add `overflow-hidden` to the attachment row `<div>` container
2. Add `min-w-0` to the filename `<span>` so `truncate` works inside flex
3. Wrap the filename `<span>` in a `Tooltip` showing the full name on hover
4. Add `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` imports

### Files
| File | Lines (approx) |
|---|---|
| `src/components/deal/NotesTableView.tsx` | ~378-380 |
| `src/components/contacts/borrower-detail/BorrowerConversationLog.tsx` | ~460-462 |
| `src/components/contacts/broker-detail/BrokerConversationLog.tsx` | ~461-463 |
| `src/components/contacts/lender-detail/LenderConversationLog.tsx` | ~460-462 |

### Code Change (same in all 4 files)

**Before:**
```tsx
<div key={idx} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-3 py-2 border border-border">
  <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
  <span className="flex-1 truncate font-medium">{getAttachmentName(att)}</span>
```

**After:**
```tsx
<div key={idx} className="flex items-center gap-2 text-xs bg-muted/50 rounded px-3 py-2 border border-border overflow-hidden">
  <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex-1 min-w-0 truncate font-medium">{getAttachmentName(att)}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm break-all">
        <p>{getAttachmentName(att)}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
```

### What Will NOT Change
- No attachment functionality (upload, download, preview) modified
- No APIs, database schema, or document generation logic touched
- No layout changes outside the attachment rows in these modals

