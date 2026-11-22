# Recent Context — Project Brain v2

## Session State
- Removed all indirect re-exports (`A -> B -> C`). All consumers import directly (`A -> C`) from `src/types/`.
  - `ExportTransactionItem`: direct from `@/types/transactions.types`.
  - `JwtPayload`: direct from `@/types/settings.types`.
  - `TransactionFilterOptions`: direct from `@/types/transactions.types`.
  - `UserProfile, HouseOption, UserState`: direct from `@/types/settings.types`.
- `bun x knip`: 0 issues found.
- `bun test`: All 8 test suites pass.
- `bun next build --webpack`: Passes cleanly.
- `package.json`: 0 changes.
