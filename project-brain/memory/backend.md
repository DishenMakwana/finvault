# Memory Layer: Backend & Auth — FinVault

## Authentication
- **Strategy**: Passport-JWT (`passport-jwt`) extractor pattern + `jsonwebtoken` for sign/verify.
- **Password Hashing**: `bcryptjs` with salt rounds (10).
- **Session Table**: Stored in PostgreSQL `sessions` table.
- **Active Session Tracking**: Each login creates a `Session` record. Header displays active count. Users can revoke individual sessions or all other devices.
- **Cookie Security**: `HttpOnly`, `Secure` in production, `SameSite=Lax`, `Path=/`.

## Server Actions (`src/lib/actions/`)
- `auth.actions.ts`: `loginUser`, `registerUser`, `logoutUser`, `revokeSession`, `getActiveSessions`.
- `house.actions.ts`: `createHouse`, `updateInitialCash`, `getHouses`, `deleteHouse`.
- `cashflow.actions.ts`: `addInflow`, `addOutflow`, `getTransactions`, `softDeleteTransaction`, `restoreTransaction`.
- `loan.actions.ts`: `addLoan`, `recordRepayment`, `getLoans`, `deleteLoan`.
