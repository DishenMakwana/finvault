# Changelog — FinVault

## [2026-11-20] Authentication: Integrated ACCESS_TOKEN_EXPIRES_IN & Comprehensive Token Expiry Handling
- **Environment-Driven JWT Expiry (`src/lib/auth.ts`)**:
  - Implemented `getAccessTokenExpiry()` which reads `ACCESS_TOKEN_EXPIRES_IN` (e.g. `'1d'`) from `.env`.
  - Implemented `parseExpiryToMs()` supporting flexible human-readable units (`1d`, `24h`, `60m`, `3600s`).
  - Configured `createSession` to sign JWT tokens using `expiresIn: getAccessTokenExpiry()`, while synchronizing the database `Session.expiresAt` and browser cookie `expires`/`maxAge` to the exact same expiration timestamp.
- **Robust Expiry Handling (`src/lib/auth.ts`, `src/proxy.ts`, `src/lib/passport-jwt.ts`)**:
  - **Middleware (`src/proxy.ts`)**: Added fast `isTokenExpired()` decoding; when accessing protected routes with an expired token, the user is redirected to `/login` and the stale cookie is deleted. Prevents infinite redirect loops on `/login`.
  - **Server Actions & Helpers (`src/lib/auth.ts`)**: `getCurrentUser()` automatically validates token expiration with `jwt.verify` (handling `TokenExpiredError`), cleans up expired database sessions, and clears the client cookie.
  - **Session Cleanup (`src/lib/auth.ts`)**: `getActiveSessions` opportunistically purges expired sessions (`expiresAt <= NOW()`) from the database.
- **Verification**: Created [src/lib/auth-expiry.test.ts](file:///Users/dishen/Downloads/finvault/src/lib/auth-expiry.test.ts); verified 1d (86,400s) token generation and expired token rejection; `bun test` and `bun run build` passing cleanly.

## [2026-11-20] Header Branding: Synchronized Logo Icon & Title Font Size with Sidebar
- **Unified Brand Logo in Header (`src/components/header.tsx`)**:
  - Replaced the generic `TrendingUp` icon with the emerald `Coins` logo mark badge (`w-9 h-9 rounded-xl bg-primary shadow-md shadow-primary/20 text-black`) matching the sidebar.
- **Matched Font Size & Typography Scale**:
  - Increased header title font size from `text-xs` (12px) to `text-base font-bold` (16px), identical in scale to the sidebar brand title.
  - Formatted page title as `FinVault – [Page Title]` with high-contrast `text-neutral-200 font-medium`.
- **Verification**: Zero TypeScript errors; Next.js production build clean in 3.0s; tests passing.

## [2026-11-20] Date Range Pill: Full UX Redesign (Eliminated Redundant Browser Icons)
- **Redesigned Date Range Pill (`src/components/transactions/filter-bar.tsx`)**:
  - Removed raw unstyled `<input type="date">` elements that were displaying duplicate native browser calendar icons (`📅`) and awkward browser placeholders.
  - Implemented clean, formatted date pill (`dd/mm/yyyy – dd/mm/yyyy` in subtle `text-neutral-400` when unselected, or active `DD/MM/YYYY` in `text-white font-medium`).
  - Added programmatic trigger via `.showPicker()` alongside seamless invisible inputs, allowing the native dark calendar picker to open instantly on click without showing any extra icons.
  - Added one-click Clear (`×`) button when dates are selected.
  - Standardized height to `h-10` matching the Search bar, Presets dropdown, Filters button, and Export button on the toolbar.
- **Verification**: Zero TypeScript errors; Next.js production build clean in 3.0s; tests passing.

## [2026-11-20] Dynamic Database Categories & Custom "Other" Category Input
- **Dynamic Database Categories (`src/lib/actions/cashflow.actions.ts`)**:
  - Implemented `getUniqueCategories(type?: 'INFLOW' | 'OUTFLOW')` querying distinct categories directly from `prisma.transaction.findMany({ select: { category: true }, distinct: ['category'], where: { deletedAt: null } })`.
  - Removed all hardcoded static category arrays from [src/app/transactions/page.tsx](file:///Users/dishen/Downloads/finvault/src/app/transactions/page.tsx) and [src/components/dashboard/quick-modals.tsx](file:///Users/dishen/Downloads/finvault/src/components/dashboard/quick-modals.tsx).
- **"Other" Category Custom Input Field (`src/components/dashboard/quick-modals.tsx`)**:
  - In `AddInflowModal` and `AddOutflowModal`, selecting the `Other` option dynamically reveals an auto-focused **Category Name** input field (`customCategory`).
  - Upon submission, the custom category name is passed to `addTransactionAction` and saved into the database in the `category` column of `transactions`.
  - Automatically triggers Next.js server cache revalidation (`revalidatePath`), immediately reflecting the new category in:
    1. The Inflow & Outflow modal dropdowns
    2. The Transactions & Analytics Filter Bar pill selections
    3. The Dashboard category breakdown
    4. The Excel export data
- **Verification**: Zero TypeScript errors; Next.js production build clean in 3.0s; reconciliation test suite passing.

## [2026-11-20] Transactions & Analytics: Added All Properties to Filter Options
- **Loaded All Family Properties into Filter Options (`src/app/transactions/page.tsx`)**:
  - Replaced user-isolated `getUserHouses()` with `getAllHouses()`, passing the full collection of properties into the `<FilterBar />` modal dialog.
  - The `HOUSE / PROPERTY` filter section now displays pill selectors for all properties registered across the family ledger.
- **Global Store & Action Alignment**:
  - Updated [src/app/layout.tsx](file:///Users/dishen/Downloads/finvault/src/app/layout.tsx) and [src/app/loans/page.tsx](file:///Users/dishen/Downloads/finvault/src/app/loans/page.tsx) to provide all properties to the header dropdown and loans management.
  - Updated `getTransactions` and `getDashboardSummary` to support querying transactions across all properties.
- **Verification**: Zero TypeScript errors; Next.js production build clean in 3.1s; reconciliation test suite passing.

## [2026-11-20] Branding: Unified Application Name as "FinVault" Across All Surfaces
- **Sidebar Top Branding (`src/components/sidebar.tsx`)**:
  - Replaced split `Family \n Vault` branding with `FinVault` as the primary app title with `Cash Management` subtitle.
- **Global Header (`src/components/header.tsx`)**:
  - Updated breadcrumb title prefix from `Family Vault - ...` to `FinVault - [Page Title]`.
- **Dashboard & Auth Screens**:
  - [src/app/page.tsx](file:///Users/dishen/Downloads/finvault/src/app/page.tsx): Updated page title to `FinVault Dashboard`.
  - [src/app/login/page.tsx](file:///Users/dishen/Downloads/finvault/src/app/login/page.tsx): Replaced `Family Portfolio` with `FinVault` and updated subtitle to `Create your FinVault account`.
- **Verification**: Zero TypeScript errors; Next.js build clean in 2.7s; tests passing.

## [2026-11-20] Header: Removed Back Button Across All Pages
- **Removed Back Chevron Button (`src/components/header.tsx`)**:
  - Removed the `w-7 h-7 rounded-lg bg-surface border border-border-muted` back chevron button (`<ChevronLeft />`) from the breadcrumb title section in the global header.
  - The header title now cleanly begins directly with the `TrendingUp` icon and page title (`Family Vault - [Page Title]`), eliminating redundant navigation across all pages.
- **Verification**: Zero TypeScript errors; Next.js production build clean in 3.4s; all tests passing.

## [2026-11-20] Modal & Form UX Redesign: Enhanced Title/Label Spacing and Input Proportions
- **Label & Input Vertical Rhythm (`src/components/dashboard/quick-modals.tsx`, `src/components/ui/custom-select.tsx`, `src/components/houses/house-list.tsx`, `src/components/loans/repayment-modal.tsx`)**:
  - Increased label-to-input margin from cramped `mb-1` (4px) to comfortable `mb-2` (8px) with `text-xs font-medium text-neutral-300`, preventing labels and borders from visually colliding.
  - Increased form group vertical rhythm from `space-y-4` to `space-y-5`, creating a 2.5:1 inter-group vs intra-group spacing ratio in line with the Gestalt law of proximity.
  - Increased horizontal grid gap from `gap-3` (12px) to `gap-4` (16px) for two-column field pairings.
- **Input & CustomSelect Height Alignment**:
  - Set explicit `h-10 px-3.5 text-xs text-white` on both text/number/date inputs and the `CustomSelect` trigger button, ensuring matching heights and baselines in 2-column layouts.
  - Added native dark calendar picker theme support (`[color-scheme:dark]`) on all `type="date"` fields.
  - Upgraded textarea padding to `p-3.5` with `resize-none` and clean placeholder contrast.
- **Button & Footer Spacing**:
  - Enhanced modal action footers with `pt-3 mt-6 border-t border-border-subtle flex items-center justify-end gap-3`.
  - Upgraded action buttons with balanced `px-5 py-2.5` touch/click targets.
- **Verification**: Zero TypeScript errors; Next.js production build clean in 3.2s; reconciliation and export tests passing.

## [2026-11-20] Dropdown Menu Optimization: Eliminate Unwanted Modal Scroll
- **Reduced Dropdown Menu Max Height (`src/components/ui/custom-select.tsx`)**:
  - Replaced bulky `max-h-60` (240px) with sleek, compact `max-h-36` (144px).
  - Reduced item vertical padding from `py-2` to `py-1.5`, allowing 5 options to display comfortably with internal scrolling.
  - Added configurable `menuMaxHeight` prop defaulting to `'max-h-36'`.
- **Eliminated Unwanted Modal Overflow**:
  - Opening the Category dropdown in the Inflow, Outflow, or Loan modals now stays comfortably within the container bounds without triggering an outer modal scrollbar.
- **Verification**: TypeScript check passing; Next.js build clean in 2.7s; tests passing.

## [2026-11-20] Transactions Bar: Remove "Refresh All" Button
- **Removed "Refresh All" Button (`src/components/transactions/filter-bar.tsx`)**:
  - Removed the `RotateCw` "Refresh All" button, state, and handler from the Transactions & Analytics search and filter bar.
  - The bar now cleanly transitions directly from `Filters` to `Export` at the end.
- **Verification**: Zero TypeScript errors; Next.js build passing in 2.7s; tests passing.

## [2026-11-20] House Cards: Remove Delete Option & Move Ownership Tag to Top Right Corner
- **Removed Delete Action (`src/components/houses/house-list.tsx`)**:
  - Removed the trash can delete button (`Trash2`) and `handleDelete` confirmation dialog from all house cards.
  - Baseline starting properties remain permanently recorded once established.
- **Relocated Ownership Tag to Top Right Corner (`src/components/houses/house-list.tsx`)**:
  - Moved the `Own House` badge (`bg-primary/15`, `border-primary/40`, `text-primary`) and `Family • [Owner]` badge (`bg-surface-pill`, `border-border-active`) from inline beside the house title to the top right corner of each card.
  - Enhanced title layout with clean truncation and address alignment.
- **Verification**: Zero TypeScript errors (`tsc --noEmit`); Next.js production build passing in 2.7s; test suite passing.

## [2026-11-20] Centralized Design Tokens & CSS Variables Migration (Eliminated Hardcoded Inline Colors)
- **Centralized All CSS Theme Variables in `src/app/globals.css`**:
  - Defined all color palettes, surfaces, and borders under `:root` as CSS variables:
    - Canvas / Containers: `--background` (`#0A0A0A`), `--sidebar` (`#0D0D0D`), `--card` (`#141414`), `--surface` (`#181818`), `--surface-hover` (`#1C1C1C`), `--surface-elevated` (`#202020`), `--surface-pill` (`#1F1F1F`), `--surface-modal` (`#121212`).
    - Borders: `--border-subtle` (`#242424`), `--border-muted` (`#262626`), `--border-hover` (`#333333`), `--border-contrast` (`#383838`), `--border-active` (`#2E2E2E`).
    - Accents & RGB Channels (for full alpha opacity support):
      - Primary Emerald: `--primary-rgb` (`0 208 132`), `--color-primary` (`#00D084`), `--bg-primary-tint` (`#0D1912`).
      - Danger Rose: `--danger-rgb` (`244 63 94`), `--color-danger` (`#F43F5E`), `--bg-danger-tint` (`#221215`).
      - Loan Indigo: `--loan-rgb` (`99 102 241`), `--loan-light-rgb` (`129 140 248`), `--color-loan` (`#6366F1`).
      - Amber & Cyan: `--amber-rgb` (`245 158 11`), `--cyan-rgb` (`6 182 212`).
- **Mapped Theme to Tailwind (`tailwind.config.ts`)**:
  - Connected Tailwind classes (`bg-background`, `bg-sidebar`, `bg-card`, `bg-surface`, `bg-surface-hover`, `border-border-subtle`, `border-border-muted`, `border-border-hover`, `text-primary`, `bg-primary`, `bg-primary/10`, `border-primary/40`, `text-danger`, `bg-danger`, `text-loan-light`, `bg-loan/10`, etc.) directly to the CSS variables.
- **Refactored All UI Components & Pages**:
  - Replaced over 300 instances of arbitrary hex classes (`bg-[#0A0A0A]`, `bg-[#141414]`, `border-[#242424]`, `text-[#00D084]`, `bg-[#181818]`, `border-[#262626]`, etc.) across all components:
    - [src/app/layout.tsx](file:///Users/dishen/Downloads/finvault/src/app/layout.tsx)
    - [src/app/page.tsx](file:///Users/dishen/Downloads/finvault/src/app/page.tsx)
    - [src/app/login/page.tsx](file:///Users/dishen/Downloads/finvault/src/app/login/page.tsx)
    - [src/app/loans/page.tsx](file:///Users/dishen/Downloads/finvault/src/app/loans/page.tsx)
    - [src/components/sidebar.tsx](file:///Users/dishen/Downloads/finvault/src/components/sidebar.tsx)
    - [src/components/header.tsx](file:///Users/dishen/Downloads/finvault/src/components/header.tsx)
    - [src/components/dashboard/kpi-card.tsx](file:///Users/dishen/Downloads/finvault/src/components/dashboard/kpi-card.tsx)
    - [src/components/dashboard/cashflow-chart.tsx](file:///Users/dishen/Downloads/finvault/src/components/dashboard/cashflow-chart.tsx)
    - [src/components/dashboard/recent-feed.tsx](file:///Users/dishen/Downloads/finvault/src/components/dashboard/recent-feed.tsx)
    - [src/components/dashboard/quick-modals.tsx](file:///Users/dishen/Downloads/finvault/src/components/dashboard/quick-modals.tsx)
    - [src/components/transactions/filter-bar.tsx](file:///Users/dishen/Downloads/finvault/src/components/transactions/filter-bar.tsx)
    - [src/components/transactions/transaction-table.tsx](file:///Users/dishen/Downloads/finvault/src/components/transactions/transaction-table.tsx)
    - [src/components/houses/house-list.tsx](file:///Users/dishen/Downloads/finvault/src/components/houses/house-list.tsx)
    - [src/components/loans/loan-card.tsx](file:///Users/dishen/Downloads/finvault/src/components/loans/loan-card.tsx)
    - [src/components/loans/repayment-modal.tsx](file:///Users/dishen/Downloads/finvault/src/components/loans/repayment-modal.tsx)
    - [src/components/settings/session-manager.tsx](file:///Users/dishen/Downloads/finvault/src/components/settings/session-manager.tsx)
    - [src/components/ui/modal.tsx](file:///Users/dishen/Downloads/finvault/src/components/ui/modal.tsx)
    - [src/components/ui/custom-select.tsx](file:///Users/dishen/Downloads/finvault/src/components/ui/custom-select.tsx)
- **Benefit**: Any future brand color or theme adjustments can be made exclusively in [src/app/globals.css](file:///Users/dishen/Downloads/finvault/src/app/globals.css) and will instantaneously propagate across the entire project.
- **Verification**: Zero TypeScript errors (`tsc --noEmit`); Next.js production build passing with 9/9 routes; test suite passing.

## [2026-11-20] Houses & Initial Cash In Hand: All Houses List & "Own House" Identification Tag
- **Display All Houses Across Portfolio (`src/lib/actions/house.actions.ts`, `src/app/houses/page.tsx`)**:
  - Implemented `getAllHouses()` which queries all active houses across the family vault (`where: { deletedAt: null }`), including user details (`name`, `email`).
  - Sorted houses so the logged-in user's own houses appear at the top of the list, followed by other properties.
  - Sanitized decimal `initialCash` values to standard JavaScript numbers (`Number(h.initialCash)`) to eliminate Next.js Server-to-Client component serialization errors.
- **Added Visual Identification Badges (`src/components/houses/house-list.tsx`)**:
  - **Own House**: Rendered a badge (`#00D084`/15 bg, `#00D084`/40 border, `#00D084` text) with a `User` icon indicating "Own House".
  - **Family Properties**: Rendered a neutral tag (`#1F1F1F` bg, `#2E2E2E` border, `text-neutral-400`) displaying `Family • [Owner Name]` or `Family Property`.
- **Protected House Deletions**:
  - Restricted the delete action (`Trash2`) so users can only delete properties that belong to them (`house.isOwner`), preventing accidental deletions of other members' houses.
- **Verification**: Zero TypeScript errors; Next.js 16 build passing cleanly in 3.3s; all tests passed.

## [2026-11-20] Dribbble/Pinterest Dark Fintech KPI Cards Redesign
- **Redesigned `KpiCard` (`src/components/dashboard/kpi-card.tsx`)**:
  - Solved cramped horizontal squeezing and 2-line badge wrapping:
    - **Top Ambient Glow & Subtle Gradient**: Layered `from-[#161616] to-[#111111]` background with soft glowing radial blur in top-right corner keyed to metric color.
    - **Header & Metric**: Refined labels (`text-xs font-semibold text-neutral-400`), larger bold mono numbers (`text-2xl font-extrabold font-mono text-white`), and scaled hover transitions.
    - **Micro Sparkline Chart**: Embedded lightweight SVG gradient trendline showing trend trajectories directly under each figure.
    - **Pill Delta & Subtext Balance**: Replaced bulky wrapped text blocks with pill-shaped badges (`rounded-full`) and directional arrows (`ArrowUpRight` / `ArrowDownRight`), pairing seamlessly with right-aligned subtexts with zero clipping.
- **Adaptive Responsive Layout**: Configured `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4` on the dashboard, giving cards ample breathing room across laptop and desktop screens.
- **Verification**: Zero TypeScript errors; Next.js 16 build passing in 3.0s.

## [2026-11-20] High-Fidelity Transactions Search & Filter Module Overhaul
- **Engineered Modular Search & Filter Bar (`src/components/transactions/filter-bar.tsx`)**:
  - Matched user reference screenshots with a streamlined, horizontal dark control bar:
    1. **Search Input**: Full-width pill input with leading search icon, clear `X` button, and real-time query support.
    2. **Date Range Picker**: Clean pill with emerald calendar icon (`#00D084`) and paired date pickers (`From - To`).
    3. **Presets Dropdown**: Interactive popover with options for *All Time*, *Today*, *Yesterday*, *This Week*, *This Month*, *Last Month*, and *This Year (YTD)*.
    4. **Filters Button with Badge**: `SlidersHorizontal` button showing the active filters count badge (`1`, `2`, ...) in emerald green and opening the modal.
    5. **Refresh All**: `RotateCw` button for instant cache revalidation.
    6. **Export Button at Last**: Positioned at the very end with download icon calling `/api/export/transactions` for XLSX export.
  - **Active Filter Chips Row**: Dynamically displays applied filter tags with remove `X` icons and a "Clear all" button directly under the control bar.
  - **"Transactions Tab Filters" Modal**: High-contrast dialog with chip pills for *House / Property*, *Transaction Type*, *Category*, and *Amount Range*, with "Clear all" and "Show [N] results" actions.
- **Verification**: Zero TypeScript errors; Next.js 16 build passing in 3.0s.

## [2026-11-20] Neutral Black & Dark Gray Theme Transformation
- **Adapted Exact Color Scheme from User Reference Screenshot**:
  - Replaced the blueish/navy dark colors (`#0B0E14`, `#090C12`, `#131823`, `#20293A`) with clean, high-contrast pitch blacks and dark neutral grays:
    - **Canvas Background**: `#0A0A0A`
    - **Sidebar & Header**: `#0D0D0D` with `#1F1F1F` borders
    - **Surface / Cards**: `#141414` with `#242424` borders (`#333333` on hover)
    - **Inputs / Inner Boxes**: `#181818` with `#262626` borders
    - **Secondary Buttons / Badges**: `#202020` / `#222222`
  - **Sidebar Active Nav Pill**: Matched screenshot exactly with dark green tinted background (`#0D1912`), crisp emerald green border (`#00D084`), green typography, and small solid green indicator dot on the right.
  - **Logo & Branding**: Solid mint green (`#00D084`) rounded square badge with black trending icon and "Family Portfolio" typography.
  - **Header Breadcrumb**: Added top navigation collapse toggle and breadcrumb matching the screenshot pattern.
  - **Scrollbars & Typography**: Neutral gray scrollbars and `text-neutral-400` / `text-neutral-500` secondary text.

## [2026-11-20] Remove Edit Starting Cash from House Cards
- **Removed Edit Button from House Cards (`src/components/houses/house-list.tsx`)**:
  - Removed the `Edit3` ("Edit Starting Cash") button from property cards.
  - Removed `editingHouse` state, `handleUpdate`, and the "Edit Starting Cash" modal. Baseline starting cash remains an immutable baseline initialized upon house creation.
  - Retained house deletion action when more than one house exists.
  - Cleaned up unused imports in `src/app/houses/page.tsx` and `src/components/houses/house-list.tsx`.

## [2026-11-20] Dark Fintech Custom Dropdown Design Overhaul
- **Created `CustomSelect` (`src/components/ui/custom-select.tsx`)**:
  - Engineered a high-polish dark fintech dropdown component replacing all native browser `<select>` tags across all pages and modals.
  - Features: `#0E131F` trigger button, `#131823` frosted backdrop popover, subtle `#20293A` borders with `#00D084` focus ring, smooth Framer Motion entry/exit transitions, rotating chevron indicator, emerald checkmark badge for selected options, outside click listener, and Escape key dismissal.
  - Fully compatible with HTML forms and Server Actions via automatic hidden input `<input type="hidden" name={name} value={...} />`.
- **Replaced Selects Across All Pages & Modals**:
  - `src/components/transactions/filter-bar.tsx`: Replaced native `House`, `Type`, and `Category` selectors with `CustomSelect` featuring `Home`, `ArrowLeftRight`, and `Tag` icons.
  - `src/components/header.tsx`: Replaced header property switcher dropdown with `CustomSelect` synced to Zustand.
  - `src/components/dashboard/quick-modals.tsx`: Replaced house and category dropdowns in `AddInflowModal`, `AddOutflowModal`, and `AddLoanModal`.
  - `src/components/loans/repayment-modal.tsx`: Replaced received-into house selector with `CustomSelect`.
- **Verification**: Zero raw `<select>` tags remaining; zero TypeScript errors; Next.js 16 build passing in 3.1s.

## [2026-11-20] Comprehensive Route Audit & Decimal Sanitization
- **Audited All App Router Pages**:
  - `src/app/houses/page.tsx`: Sanitized house props passed to `<HouseList />` with `initialCash: Number(h.initialCash)`.
  - `src/app/transactions/page.tsx`: Stripped non-essential fields and sanitized house options passed to `<FilterBar />`.
  - `src/app/loans/page.tsx`: Sanitized house options passed to `<LoanCard />`.
  - `src/app/page.tsx`: Verified all KPI cards, chart feeds, and recent transactions.
  - `src/app/settings/page.tsx`: Verified plain session data passed to `<SessionManager />`.
  - `src/app/layout.tsx`: Verified `<UserStoreProvider />` serialization.

## [2026-11-20] Fix Decimal Object Serialization Across Server-Client Boundary
- **Resolved RSC Serialization Error**: Fixed `"Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported"` by converting Prisma `Decimal` instances (`initialCash`, `amount`, `totalAmount`, `amountPaid`) into standard JavaScript `number` primitives before crossing the RSC boundary in:
  - `src/lib/actions/house.actions.ts` (`getUserHouses`)
  - `src/lib/actions/cashflow.actions.ts` (`getTransactions`, `getDashboardSummary`)
  - `src/lib/actions/loan.actions.ts` (`getLoans`)

## [2026-11-20] Fix Next.js RSC Non-Serializable Function Props on KpiCard
- **Resolved RSC Serialization Error**: Fixed `"Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use server'"` by replacing Lucide component function passing (`icon={IndianRupee}`) with serializable string names (`iconName="cash"`).
- **Updated `KpiCard`**: Added internal `ICON_MAP` mapping serializable icon names to their respective Lucide React icon components within the client boundary.

## [2026-11-20] Full Migration to Prisma 7.10.1 & Driver Adapters
- **Updated Dependencies**: Upgraded `@prisma/client` and `prisma` CLI to matching `v7.10.1`. Added `@prisma/adapter-pg` and `pg`.
- **Created `prisma.config.ts`**: Replaced deprecated `package.json#prisma` with modern `defineConfig` configuration handling `schema`, `datasource.url`, and `migrations.seed`.
- **Updated `prisma/schema.prisma`**: Removed `url = env("DATABASE_URL")` as mandated by Prisma 7.
- **Configured Client Adapter (`src/lib/prisma.ts`)**: Wired `@prisma/adapter-pg` (`PrismaPg`) with connection pooling into `PrismaClient`.
- **Validation**: Re-generated client, passed TypeScript type check (0 errors), passed Next.js build (0 errors).

## [2026-11-20] Zustand Global Client State Management Integration
- **Installed Zustand v5**: Added `zustand@^5.1.0` as primary client global state manager.
- **Created Store**: `src/stores/use-user-store.ts` managing `user`, `houses`, `activeHouseId`, and `activeSessionsCount` with `persist` middleware for `activeHouseId`.
- **Created Hydrator**: `src/components/providers/user-store-provider.tsx` mounted in `src/app/layout.tsx` to bridge Next.js Server Components into Zustand on initial render and revalidations.
- **Decoupled Components**:
  - `src/components/sidebar.tsx`: Reads active user info directly from `useUserStore`.
  - `src/components/header.tsx`: Connects property selection dropdown and active sessions badge to Zustand.
  - `src/components/settings/session-manager.tsx`: Decrements active sessions counter in Zustand on session revocation.
- **Verified**: Strict TypeScript pass (0 errors) and Next.js production build pass (0 errors).

## [2026-11-20] Database Table Column Indexes for Fast Retrieval
- **Composite & Filter Indexes Added**:
  - `sessions`: `[userId, expiresAt]`, `[expiresAt]`
  - `houses`: `[userId, deletedAt]`
  - `transactions`: `[userId, deletedAt, dateOfAdd]`, `[houseId, deletedAt, dateOfAdd]`, `[userId, houseId, type, deletedAt]`, `[category, deletedAt]`, `[dateOfAdd]`, `[deletedAt]`
  - `loans`: `[userId, deletedAt, status]`, `[houseId, deletedAt]`, `[relativeName]`, `[status]`, `[nextPaymentDueDate]`, `[deletedAt]`
  - `loan_repayments`: `[loanId, repaymentDate]`, `[houseId, repaymentDate]`
- **Regenerated Prisma Client**: Updated `@prisma/client` with the new index definitions.

## [2026-11-20] Dynamic SALT_ROUNDS & Seeder Validation
- **Environment SALT_ROUNDS**: Configured `SALT_ROUNDS` to be dynamically loaded from `.env` (`process.env.SALT_ROUNDS`) across `src/lib/auth.ts` and `prisma/seeds/admin.ts`.
- **Seeder Architecture (`prisma/seeds/`)**:
  - Validated and refined `admin.ts` to match `User` model (`email`, `name`, `password`).
  - Added default fallback values for `ADMIN_EMAIL` (`admin@finvault.com`), `ADMIN_PASSWORD` (`Admin@123`), and `SALT_ROUNDS` (12).
  - Configured `"prisma": { "seed": "bun prisma/seeds/seed.ts" }` in `package.json`.
  - Added default `House` creation upon admin seeding so the admin account has an operational house immediately.
  - Ensured `prisma.$disconnect()` is called on exit and errors re-thrown to avoid false-positive seed results.
