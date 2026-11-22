# FinVault 🏦
> **Precision Physical Cash & Relative Loan Management Platform**

FinVault is a modern, high-performance web application designed to replace manual paper notebooks and scattered registers for families and individuals. It enables deterministic physical cash tracking across multiple properties (houses) and manages informal loans lent to relatives with multi-part installment logs, promise dates, and visual analytics.

---

## 📑 Table of Contents
- [Problem & Philosophy](#-problem--philosophy)
- [Key Features](#-key-features)
  - [1. Multi-House Cash Vaults](#1-multi-house-cash-vaults)
  - [2. Deterministic Mathematical Reconciliation](#2-deterministic-mathematical-reconciliation)
  - [3. Transactions Engine & Typo-Tolerant Search](#3-transactions-engine--typo-tolerant-search)
  - [4. Excel Statement Sync & Custom XLSX Export](#4-excel-statement-sync--custom-xlsx-export)
  - [5. Relative Loans Ledger & Installment Tracker](#5-relative-loans-ledger--installment-tracker)
  - [6. Visual Analytics & Benchmark Charts](#6-visual-analytics--benchmark-charts)
  - [7. Session Registry & Device Revocation](#7-session-registry--device-revocation)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Folder Structure](#-folder-structure)
- [Local Development Setup](#-local-development-setup)
- [Environment Configuration](#-environment-configuration)
- [Available Scripts](#-available-scripts)
- [Security & Performance Practices](#-security--performance-practices)

---

## 🎯 Problem & Philosophy

### The Problem
Physical cash inflow (rents, salaries, agricultural yields, business drawings) and outflow (household expenses, medical bills, maintenance, travel) frequently flow through multiple physical locations or houses without formal banking paper trails. When money is lent to relatives or friends, repayments often happen unpredictably in partial installments over months or years. Relying on paper diaries causes arithmetic errors, duplicate logs, and forgotten loan balances.

### The Philosophy
- **Deterministic Math**: Every single rupee is calculated from first principles via database transactions.
- **Privacy by Default**: Direct server-side database access using Next.js Server Actions—database credentials never touch the browser.
- **Enterprise-Grade UI**: Dark-mode fintech design inspired by Dribbble & Linear, featuring responsive charts, glowing status indicators, and keyboard-friendly modals.

---

## 🚀 Key Features

### 1. Multi-House Cash Vaults
- **Baseline Initialization**: Set an initial physical cash balance and opening date for each house or property.
- **Per-House or Combined Scoping**: Toggle effortlessly between viewing all houses combined or focusing on a specific property via the global header selector.
- **Property Management**: Add, update, and soft-delete properties with automated cascading safeguards.

### 2. Deterministic Mathematical Reconciliation
FinVault eliminates calculation discrepancies using an exact formula applied to all non-deleted records:

$$\text{Current Cash} = \text{Initial Cash} + \sum \text{Inflow} - \sum \text{Outflow} - \sum \text{Loans Disbursed} + \sum \text{Repayments Received}$$

- **Real-time Status**: Overview cards instantly display reconciled totals, total initial cash, net cash flow, and outstanding balances.
- **Uniform Currency Formatting**: Standardized typography and Indian numbering formatting (`₹ 1,00,000.00`, Lakhs, and Crores) for visual balance across cards.

### 3. Transactions Engine & Typo-Tolerant Search
- **Dual Flow Recording**: Add Cash Inflow (green) or Cash Outflow (red) with amount, category, date, and description.
- **Category Normalization**: Categories are stored in clean lowercase in PostgreSQL and rendered in clean Title Case in the UI, with automatic custom category fallback.
- **4-Tier Waterfall Search**:
  1. Exact string match.
  2. Prefix & token match.
  3. Levenshtein distance typo tolerance (handles common misspellings).
  4. Multi-token logical `AND` matching across title, category, house, and notes.
- **Soft Deletion & Edit**: Update transaction details with a single click or soft-delete with confirmation modals.

### 4. Excel Statement Sync & Custom XLSX Export
- **Bulk Excel Import**: Upload `.xlsx` statements with support for standard Indian date formats (`DD/MM/YYYY`, `DD-MM-YYYY`) and native Excel serial timestamps.
- **Smart Deduplication**: Automatically detects and skips duplicate records based on date, amount, category, and title hash.
- **ExcelJS XLSX Export**: Generates professional Excel sheets featuring custom column styling, bold totals, Indian Rupee (`₹`) number formatting, and built-in `=SUM()` formulas.

### 5. Relative Loans Ledger & Installment Tracker
- **Borrower Ledgers**: Log money lent to relatives with contact name, initial loan date, originating house, and optional notes.
- **Status Lifecycle**:
  - `PENDING`: 0% repaid.
  - `PARTIALLY_PAID`: Active installment log with percentage progress.
  - `FULLY_PAID`: 100% principal settled.
- **Dual-Mode Repayments**: Record single one-shot complete repayments or track incremental installments with next payment promise dates.
- **Default High-to-Low Amount Sorting**: Cards automatically sort by total loan amount from highest to lowest for immediate focus on major balances.

### 6. Visual Analytics & Benchmark Charts
- **Cash Inflow vs Outflow Trend**:
  - Responsive Recharts area chart contrasting monthly inflows and outflows.
  - Segmented timeframe filter: `1Y` (12 months), `2Y` (24 months), `3Y` (36 months), and `ALL` (entire recorded timeline).
  - Client-side slice cache for instantaneous (0ms) range switching.
- **Category Distribution & Benchmark**:
  - Ranked bar chart comparing spending across categories.
  - Dynamic toggle between Percentage Share (`%`) and Total Amount (`₹`).
  - Distinct color coding: **Emerald Green (`#10b981`)** for Inflows, **Coral Red (`#f43f5e`)** for Outflows.
  - Category Average Baseline reference line and `#1 Hero Category` badge.

### 7. Session Registry & Device Revocation
- **JWT Authentication**: Encrypted JSON Web Tokens stored in secure `httpOnly`, `sameSite=lax` cookies.
- **Active Session Tracking**: Logs client device type, browser, IP address, and creation timestamps in the database.
- **Remote Revocation**: Log out individual active devices or clear other sessions from the Settings tab.

---

## 🛠 Architecture & Tech Stack

```mermaid
graph TD
    Client["Client Browser (React 19 / Next.js)"]
    RSC["React Server Components (RSC)"]
    SA["Server Actions (src/lib/actions/)"]
    Cache["Local Tagged In-Memory Cache (cache.ts)"]
    Prisma["Prisma ORM 7.10.1 (@prisma/adapter-pg)"]
    DB[("PostgreSQL 16+ Database")]

    Client -->|Page Request| RSC
    Client -->|Form Mutation / Filter| SA
    RSC -->|Parallel Promise.all| Cache
    SA -->|Invalidate & Write| Cache
    Cache -->|Cache Miss| Prisma
    Prisma -->|pg Connection Pool| DB
```

- **Framework**: [Next.js 16.4.6](https://nextjs.org/) App Router
- **Language**: [TypeScript 5.7](https://www.typescriptlang.org/)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts 2.15](https://recharts.org/)
- **Database & ORM**: [PostgreSQL 16+](https://www.postgresql.org/), [Prisma 7.10.1](https://www.prisma.io/) with native connection pooling (`@prisma/adapter-pg`)
- **Excel Processing**: [ExcelJS 4.4](https://github.com/exceljs/exceljs)
- **Runtime & Tools**: [Bun](https://bun.sh/) package manager & test runner, [Knip](https://knip.dev/) for dead-code pruning

---

## 📁 Folder Structure

```
finvault/
├── prisma/
│   ├── migrations/             # Versioned SQL database migrations
│   ├── seeds/
│   │   ├── admin.ts            # Default admin credentials seed
│   │   └── seed.ts             # Primary database seeding script
│   ├── prisma.config.ts        # Prisma datasource and config
│   └── schema.prisma           # Relational schema (User, Session, House, Transaction, Loan)
├── src/
│   ├── app/                    # Next.js App Router (RSC & API Routes)
│   │   ├── (auth)/login/       # Secure login portal
│   │   ├── analytics/          # Visual financial charts & category benchmarks
│   │   ├── houses/             # Property and initial cash vault management
│   │   ├── loans/              # Relative loan ledgers & repayment schedules
│   │   ├── settings/           # Active sessions and account security
│   │   ├── transactions/       # Transaction table, filtering & Excel import
│   │   ├── api/export/         # ExcelJS file streaming endpoints
│   │   ├── page.tsx            # Dashboard overview with KPI cards and recent feed
│   │   └── layout.tsx          # Root shell layout with sidebar and header
│   ├── components/             # Reusable UI Components
│   │   ├── analytics/          # CategoryBarChart, CashflowAnalyticsChart
│   │   ├── dashboard/          # KpiCard, CashflowChart, AddModals, RecentFeed
│   │   ├── houses/             # HouseList, HouseActions
│   │   ├── loans/              # LoanCard, RepaymentModal, LoanActions
│   │   ├── transactions/       # TransactionTable, FilterBar, UploadStatementModal
│   │   ├── settings/           # SessionManager
│   │   ├── providers/          # Store providers (UserStoreProvider)
│   │   └── ui/                 # Modal, CustomSelect, ConfirmDeleteModal
│   ├── helpers/
│   │   └── search.ts           # 4-tier waterfall & Levenshtein search algorithm
│   ├── lib/
│   │   ├── actions/            # Next.js Server Actions (Database mutations)
│   │   ├── auth.ts             # JWT authentication, verification, cookie management
│   │   ├── cache.ts            # In-memory tagged cache with automatic TTL
│   │   ├── excel-export.ts     # ExcelJS workbook formatting and formula builder
│   │   ├── formatters.ts       # INR currency, Indian numbering, and DD/MM/YYYY parsers
│   │   ├── passport-jwt.ts     # Passport JWT extraction strategy
│   │   └── prisma.ts           # PrismaClient singleton with PG adapter
│   ├── stores/
│   │   └── use-user-store.ts   # Zustand client state for active house and preferences
│   └── types/                  # Centralized TypeScript declarations (Direct A -> C imports)
│       ├── analytics.types.ts
│       ├── dashboard.types.ts
│       ├── houses.types.ts
│       ├── loans.types.ts
│       └── transactions.types.ts
├── knip.json                   # Dead-code and unused dependency configuration
├── next.config.ts              # Next.js configuration
├── package.json
└── tsconfig.json
```

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: `>= 26.13.1` (or latest LTS)
- **Bun**: `>= 1.1`
- **PostgreSQL**: `>= 16` running locally or via Docker

### 1. Clone & Install
```bash
git clone https://github.com/your-username/finvault.git
cd finvault
bun install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=finvault"
DB_SCHEMA="finvault"

# Security & Auth
JWT_SECRET="finvault_super_secret_jwt_key_2026_change_in_production"
ACCESS_TOKEN_EXPIRES_IN="1d"
SALT_ROUNDS=12

# Admin Seed Account
ADMIN_EMAIL="admin@finvault.com"
ADMIN_PASSWORD="Admin@123"

# Application Settings
NEXT_PUBLIC_APP_NAME="FinVault"
LOGGING="false"
```

### 3. Setup Database & Seed
```bash
# Run database migrations
bun run prisma:migrate

# Seed admin user and starter houses
bun run prisma:seed
```

### 4. Start the Application
```bash
bun dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
Log in using:
- **Email**: `admin@finvault.com`
- **Password**: `Admin@123`

---

## ⚙ Environment Configuration

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string including schema | — |
| `DB_SCHEMA` | Active PostgreSQL schema | `finvault` |
| `JWT_SECRET` | Secret key for signing authentication tokens | *Required* |
| `ACCESS_TOKEN_EXPIRES_IN` | JWT cookie expiration window | `1d` |
| `SALT_ROUNDS` | Bcrypt hashing rounds for password security | `12` |
| `ADMIN_EMAIL` | Default administrator account seeded on setup | `admin@finvault.com` |
| `ADMIN_PASSWORD` | Default administrator password | `Admin@123` |
| `LOGGING` | Enable or disable SQL query and debug logs | `false` |

---

## 🧪 Available Scripts

| Command | Action |
| :--- | :--- |
| `bun dev` | Starts Next.js development server on port 3000 |
| `bun run build` | Compiles production Next.js build |
| `bun x knip` | Audits for unused exports, dead code, and unreferenced packages |
| `bun run format` | Auto-formats TypeScript and TSX files using Prettier |
| `bun run prisma:studio`| Launches Prisma Studio to view database tables in browser |

---

## 🛡 Security & Performance Practices

- **Zero Client-Side DB Access**: All mutations occur via server-validated Server Actions; no direct database credentials or API secrets are exposed to the client.
- **Direct Imports Architecture**: Strict `A -> C` direct imports prevent circular dependency trees and keep bundle size lean.
- **Soft Deletion (`deletedAt`)**: Critical records (houses, transactions, loans) are never permanently removed on accidental click, allowing safe audit logging.
- **Local In-Memory Cache**: Database queries for dashboard summaries, transaction lists, and active sessions are cached in memory and invalidated dynamically upon data mutations.

---

## 📄 License
This project is proprietary and confidential. All rights reserved.
