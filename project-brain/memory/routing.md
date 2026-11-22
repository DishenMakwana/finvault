# Memory Layer: Routing — FinVault

## Route Map
- `/login`: Public auth page for login & registration.
- `/`: Protected root dashboard overview (Bento KPI cards, quick action modals, Recharts trend graph, recent transactions).
- `/transactions`: Protected detailed transaction log with multi-filter bar (Date, Category, House, Type, Amount) and ExcelJS XLSX export.
- `/loans`: Protected relative loans management with progress bars, dual repayment modals (1-shot vs partial), and repayment history timeline.
- `/houses`: Protected house management (create house, set/edit initial cash in hand).
- `/settings`: Protected session management (view active JWT sessions, devices, and revoke tokens).
- `middleware.ts`: Route protection interceptor checking JWT cookie and redirecting unauthenticated requests to `/login`.
