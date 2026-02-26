

## Plan: Change Default Date Format to DD/MM/YYYY

### Problem
The default date format in document generation outputs `MM/DD/YYYY` (e.g., `02/26/2026`). The requirement is `DD/MM/YYYY` (e.g., `26/02/2026`).

### Changes

**File: `supabase/functions/_shared/formatting.ts`**

1. Add a new function `formatDateDDMMYYYY` that outputs `DD/MM/YYYY`:
```typescript
export function formatDateDDMMYYYY(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
```

2. Update the **default** `"date"` case in `applyTransform` (line ~228) to call `formatDateDDMMYYYY` instead of `formatDateMMDDYYYY`. The explicit `"date_mmddyyyy"` case remains unchanged for templates that specifically request MM/DD/YYYY.

3. Update the **default** `"date"` case in `formatByDataType` (line ~270) to call `formatDateDDMMYYYY`.

**No other files changed.** The `formatDateMMDDYYYY` function is preserved — it remains available for any template that explicitly uses the `date_mmddyyyy` transform rule.

### Summary of behavior after change
| Transform rule | Output |
|---|---|
| (default / `"date"`) | DD/MM/YYYY |
| `"date_mmddyyyy"` | MM/DD/YYYY |
| `"date_long"` | February 26, 2026 |
| `"date_short"` | Feb 26, 2026 |

