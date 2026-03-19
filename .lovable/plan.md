

# Fix: Remove Empty Parentheses from Packet Dropdown

## Problem
Line 761 in `src/pages/csr/DealDocumentsPage.tsx` always appends parentheses with state info. When `all_states` is false and `states` is empty, it renders `PacketName ()`.

## Change

**File: `src/pages/csr/DealDocumentsPage.tsx` (line 761)**

Update the display logic to only show parentheses when there is content:

```tsx
// From:
{p.name} {p.all_states ? '(All States)' : `(${(p.states || []).join(', ')})`}

// To:
{p.name}{p.all_states ? ' (All States)' : (p.states?.length ? ` (${p.states.join(', ')})` : '')}
```

Single line change. No other files affected.

