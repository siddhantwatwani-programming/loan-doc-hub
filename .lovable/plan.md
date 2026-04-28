## Goal

Update the **Contacts → Broker → Banking** section's **Type** dropdown to match the values shown in the uploaded screenshot. The rest of the Banking layout already matches the screenshot exactly.

## What I found

- The active Banking screen at Contacts → Broker → Banking is rendered by `src/components/deal/BrokerBankingForm.tsx` (mounted from `ContactBrokerDetailLayout.tsx` line 188).
- The form already contains every field shown in the screenshot, in the same three-column layout, persisted via the existing `onValueChange` → `BROKER_BANKING_KEYS` save pipeline (no schema or API change needed):
  - **Column 1 (Bank/ACH):** ACH Status, Bank, Routing Number, Account Number, Type, Name, ID, Further Credit To
  - **Column 2 (Check / Mailing):** By Check, Same as Mailing, Address, City, Zip Code
  - **Column 3 (Credit Card):** Cardholder Name, Card Number, Security Code, Expiration, Zip Code
- The annotation in red on the screenshot calls out exactly one issue: the **Type** dropdown options are wrong. Current options are `Checking / Savings`. Required options:
  - Personal Banking
  - Business Banking
  - Personal Checking
  - Business Checking
- The legacy file `src/components/contacts/broker-detail/BrokerBanking.tsx` is no longer wired into the active layout (only the unused `BrokerDetailLayout.tsx` references it). Leaving it untouched per minimal-change rule.

## Change

`src/components/deal/BrokerBankingForm.tsx` lines 168–171 — replace the two existing `<SelectItem>`s for the Type dropdown with the four required options, in the order shown in the screenshot. The `<Select>`, `<DirtyFieldWrapper>`, label, styling, storage key, and persistence wiring all stay exactly as today.

```tsx
<SelectContent>
  <SelectItem value="Personal Banking">Personal Banking</SelectItem>
  <SelectItem value="Business Banking">Business Banking</SelectItem>
  <SelectItem value="Personal Checking">Personal Checking</SelectItem>
  <SelectItem value="Business Checking">Business Checking</SelectItem>
</SelectContent>
```

## What is NOT changing

- No layout, spacing, alignment, or styling changes — same `<Select>` cell, same column structure.
- No new fields added — every other field in the screenshot is already present.
- No schema, API, or storage changes — the existing `accountType` field key already persists via `BROKER_BANKING_KEYS` through the standard save flow.
- No edits to `BrokerBanking.tsx`, `BrokerDetailLayout.tsx`, `fieldKeyMap.ts`, or any other file.
- Backward compatible: any broker record currently storing `Checking` or `Savings` will simply show an empty Select placeholder until the user picks one of the new options (no data loss, no error).

## Acceptance check

1. Open Contacts → Broker → (any broker) → Banking → Type dropdown shows exactly: Personal Banking, Business Banking, Personal Checking, Business Checking.
2. Pick a value → save → reload → value re-populates.
3. No other field, label, or layout changes anywhere on the screen.
