

## Plan: Replace State Input with Dropdown in Broker 1099 Form

### Problem
The State field in the Broker 1099 form (`src/components/contacts/broker-detail/Broker1099.tsx`, line 71) is a free-text `Input` instead of a `Select` dropdown with US states.

### Fix
**File:** `src/components/contacts/broker-detail/Broker1099.tsx`

1. Add a `US_STATES` array (same abbreviation list used elsewhere in the codebase)
2. Replace the State `Input` on line 71 with a `Select` dropdown using the same pattern as `BrokerInfoForm.tsx`

The change is localized to line 71 — replacing:
```tsx
<div><Label>State</Label><Input value={form.state} onChange={e => update('state', e.target.value)} /></div>
```
with a `Select` component populated by `US_STATES`.

### What is NOT changed
- No other files modified
- No layout, spacing, or formatting changes
- No database changes
- No other fields affected

