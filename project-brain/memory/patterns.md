# Memory Layer: Patterns & Utilities — FinVault

## Currency Formatting
- Utility: `src/lib/formatters.ts` -> `formatINR(amount)`
- Standards:
  - Formats with the Indian Rupee symbol `₹`.
  - Uses the Indian numbering grouping (e.g. `1,00,000.00` for 1 Lakh).
  - Handles positive (`text-emerald-400`), negative (`text-rose-400`), and neutral formats.

## Soft Deletion Pattern
- Inflow/outflow transactions and houses retain a `deletedAt` field.
- Normal queries enforce `{ where: { deletedAt: null } }`.
- Restoration is supported by setting `deletedAt: null`.

## Excel Export Pattern (ExcelJS)
- Generates binary buffer directly via ExcelJS workbook.
- Creates styled headers, fills background colors matching dark/light themes, sets auto-column widths, applies `₹ #,##,##0.00` number formatting, and appends a `SUM()` formula row at the bottom.
