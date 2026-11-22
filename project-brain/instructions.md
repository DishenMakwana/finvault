# Project Instructions & Engineering Directives — FinVault

> **Mandatory AI Directives**: Any AI agent working on this codebase must strictly adhere to the standards outlined below. Do not deviate without explicit user instructions.

---

## 1. Parallel Database Execution & Page Latency Optimization
- **Rule**: Independent database queries, server actions, or external fetches must **always** be executed concurrently using `Promise.all`.
- **Server Component Pages**:
  - Always resolve `searchParams` first (as an instant microtask promise):
    ```ts
    const resolvedParams = await searchParams;
    ```
  - Consolidate all independent page queries into a single `Promise.all`:
    ```ts
    const [dataA, dataB, dataC] = await Promise.all([
      fetchA(resolvedParams.filter),
      fetchB(),
      fetchC(),
    ]);
    ```
  - **Anti-pattern**: Never sequentially `await` independent database queries or server actions one after the other.

---

## 2. Local Memory Caching & Invalidation
- **Rule**: Cache high-frequency, read-heavy queries in local memory cache using `cacheGet` and `cacheSet` from `@/lib/cache`.
- **TTL & Tagging**:
  - Always associate cached items with descriptive cache tags (e.g., `["dashboard", "transactions", "houses", "loans", "analytics", "categories"]`).
  - Cache TTL should be appropriately set (typically 30,000ms to 60,000ms).
- **Cache Invalidation**:
  - Every mutating action (create, update, delete, Excel import) must call `cacheInvalidateTag(...)` or dedicated invalidation helpers to immediately purge stale cache.

---

## 3. Component Types Centralization in `src/types/`
- **Rule**: All types, interfaces, view enums, and data contracts used in `src/components/` **must** be declared inside the respective file in `src/types/*.types.ts`.
- **Mapping Guide**:
  - Dashboard components $\rightarrow$ `src/types/dashboard.types.ts`
  - Analytics components $\rightarrow$ `src/types/analytics.types.ts`
  - Transactions components $\rightarrow$ `src/types/transactions.types.ts`
  - Houses components $\rightarrow$ `src/types/houses.types.ts`
  - Loans components $\rightarrow$ `src/types/loans.types.ts`
  - Layout / Header / Sidebar $\rightarrow$ `src/types/layout.types.ts`
  - Shared UI modals / controls $\rightarrow$ `src/types/ui.types.ts`
- **Anti-pattern**: Never declare `type ...` or `interface ...` inside files under `src/components/`. Always export from `src/types/` and import into the component.

---

## 4. Top-Level Imports Hygiene
- **Rule**: All `import` declarations must reside strictly at the top level of the file, immediately after optional directive banners (e.g., `"use client";` or `"use server";`).
- **Standard Import Order**:
  1. React & Next.js core modules
  2. Third-party packages (e.g., Lucide, Recharts, Prisma)
  3. Internal root aliases (`@/lib/...`, `@/components/...`, `@/stores/...`)
  4. Sibling / relative modules (`./...`)
  5. Type imports (`import type { ... }` or `@/types/...`)
- **Anti-pattern**: Zero in-between imports, zero inline `require()` calls, and zero dynamic imports inside functions.

---

## 5. Dead Code Pruning with Knip
- **Rule**: Always run `bun x knip` after modifying, refactoring, or deleting components or actions.
- **Requirement**: Maintain 0 issues in Knip at all times. Unused exports, dangling imports, or orphaned files must be pruned immediately.

---

## 6. Zero Hardcoded Entity Logic
- **Rule**: Never apply business logic, heuristics, multipliers, or conditional branches based on hardcoded property names, house names, or entity titles.
- **Requirement**: All business configurations (rental targets, vacancy tracking, payment rules) must be derived dynamically from database records.
