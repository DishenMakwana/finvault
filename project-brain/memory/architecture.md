# Memory Layer: Architecture — FinVault

## Architectural Pattern
- **Framework**: Next.js 16.4.6 App Router
- **Runtime**: Node.js v26.13.1 (Latest LTS)
- **Package Manager**: Bun
- **Architecture Model**: Direct Database Access Pattern via Server Actions & Server Components
- **No Standalone Backend**: All database operations and sensitive computations run within Next.js Server Actions on the server side. Credentials and database connections never leak to the client browser.

## Component Boundary Strategy
- **Server Components (RSC)**: Layouts and data-fetching page roots (`src/app/page.tsx`, `src/app/transactions/page.tsx`, etc.).
- **Client Components (`'use client'`)**: Interactive UI elements including modal forms, filter inputs, Recharts graphs, and Framer Motion animated cards.
- **Server Actions (`'use server'`)**: Atomic database mutations located in `src/lib/actions/`.
