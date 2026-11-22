# Memory Layer: Overview — FinVault

## Vision
FinVault is a digital cash management platform designed to replace manual paper notebooks for families and individuals managing physical cash across multiple houses, while tracking loans given to relatives with multi-installment repayments.

## Core Problem
Physical cash inflow (rent, salary, bonus, upad/drawings) and cash outflow (medical, vehicle, household expenses) are scattered across multiple physical properties. Reconciling balances manually leads to arithmetic errors and lost records. Relatives borrowing money often repay in multiple installments across unpredictable intervals.

## Core Solution
1. **Starting Balances**: Initialize baseline physical cash in hand for each house.
2. **Deterministic Reconciliation**:
   `Current Cash = Initial Cash + Inflows - Outflows - Loans Disbursed + Repayments Received`
3. **Relative Loan Ledger**: Dual-mode repayment tracking (full 1-shot settlement or multi-installment payments with next payment promise dates).
4. **Dark Fintech UI**: High-density Dribbble-inspired dashboard with glowing status badges and Recharts visualizations.
5. **Session Security**: JWT active session tracking in PostgreSQL with device revocation.
6. **Excel Export**: ExcelJS-powered XLSX export with custom formatting and formulas.
