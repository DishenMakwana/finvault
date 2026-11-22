# Memory Layer: Database — FinVault

## ORM & Engine
- **ORM**: Prisma v7.10.1 (`@prisma/client@7.10.1`, `prisma@7.10.1`)
- **Driver Adapter**: `@prisma/adapter-pg` with native `pg` connection pooling
- **Configuration**: Root-level `prisma.config.ts` managing datasource URLs, migrations, and seed scripts
- **Database**: PostgreSQL 16+

## Models Summary (All tables use `id Int @id @default(autoincrement())`)
1. `User`: `id (Int)`, `email`, `password`, `name`, `createdAt`, `updatedAt`
2. `Session`: `id (Int)`, `userId (Int fk -> User)`, `token`, `userAgent`, `ipAddress`, `expiresAt`, `createdAt`, `updatedAt`
3. `House`: `id (Int)`, `userId (Int fk -> User)`, `name`, `address`, `initialCash`, `initialCashDate`, `createdAt`, `updatedAt`, `deletedAt`
4. `Transaction`: `id (Int)`, `userId (Int fk -> User)`, `houseId (Int fk -> House)`, `type` (INFLOW | OUTFLOW), `amount`, `title`, `desc`, `category`, `dateOfAdd`, `createdAt`, `updatedAt`, `deletedAt`
5. `Loan`: `id (Int)`, `userId (Int fk -> User)`, `houseId (Int? fk -> House)`, `relativeName`, `totalAmount`, `amountPaid`, `nextPaymentDueDate`, `status` (PENDING | PARTIALLY_PAID | FULLY_PAID), `notes`, `loanDate`, `createdAt`, `updatedAt`, `deletedAt`
6. `LoanRepayment`: `id (Int)`, `loanId (Int fk -> Loan)`, `houseId (Int? fk -> House)`, `amount`, `repaymentDate`, `notes`, `createdAt`, `updatedAt`

## Indexing Strategy for High-Performance Retrieval
- **`sessions`**:
  - `@@index([userId, expiresAt])`: Fast retrieval of active, unexpired user sessions.
  - `@@index([expiresAt])`: Efficient periodic cleanup of expired tokens.
- **`houses`**:
  - `@@index([userId, deletedAt])`: Instant lookup of active properties belonging to the logged-in user.
- **`transactions`**:
  - `@@index([userId, deletedAt, dateOfAdd])`: Composite index covering user transaction feeds ordered chronologically.
  - `@@index([houseId, deletedAt, dateOfAdd])`: Composite index covering house transaction history and statement generation.
  - `@@index([userId, houseId, type, deletedAt])`: High-speed aggregation of total inflows vs outflows per user/house for cash reconciliation.
  - `@@index([category, deletedAt])`: Instant category-filtered queries (Rent, Salary, Medical, etc.).
  - `@@index([dateOfAdd])`: Accelerates custom date-range queries (e.g. monthly/annual statements).
  - `@@index([deletedAt])`: Fast soft-deletion filtering.
- **`loans`**:
  - `@@index([userId, deletedAt, status])`: Rapid lookup of pending, partially paid, or settled loans for the dashboard.
  - `@@index([houseId, deletedAt])`: Filter loans originating from specific properties.
  - `@@index([relativeName])`: Sub-millisecond name-based search across relative loan accounts.
  - `@@index([status])`: Filter by loan payoff status.
  - `@@index([nextPaymentDueDate])`: Accelerates alerts and timeline schedules for upcoming due dates.
  - `@@index([deletedAt])`: Fast soft-deletion filtering.
- **`loan_repayments`**:
  - `@@index([loanId, repaymentDate])`: Instant retrieval of repayment history and installment timeline for any loan.
  - `@@index([houseId, repaymentDate])`: Fast retrieval of repayment cash flowing back into a specific house.

## Environment & Security Settings
- `SALT_ROUNDS`: Loaded dynamically from `process.env.SALT_ROUNDS` (default: 12) across all bcrypt password hashing and verification routines.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: Loaded by `prisma/seeds/admin.ts` to seed initial administrator user and default house.

## Reconciled Balance Formula
$$\text{Current Cash} = \text{Initial Cash} + \sum \text{Inflows} - \sum \text{Outflows} - \sum \text{Loans Given} + \sum \text{Repayments Received}$$
*(Filtered where `deletedAt IS NULL`)*
