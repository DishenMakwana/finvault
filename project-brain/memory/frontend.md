# Memory Layer: Frontend Design — FinVault

## Visual Theme (Dark Fintech Reference)
- Canvas Background: `#0B0E14` (Deep Charcoal Matte Black)
- Sidebar Canvas: `#090C12` with border `#1B2230`
- Cards: `#131823` with border `#20293A` and hover glow
- Inflow Accent: Emerald Mint (`#00D084` / `#10B981`)
- Outflow Accent: Crimson Rose (`#F43F5E`)
- Loan Accent: Electric Violet (`#6366F1`)
- Warning / Due Date: Golden Amber (`#F59E0B`)
- Security / Sessions: Vibrant Cyan (`#06B6D4`)

## Animations & Graphics
- **Framer Motion**: Smooth modal dialog popovers, hover transitions, and progress bar animations.
- **Recharts**: Responsive area chart for cashflow trajectory and category spending breakdown.
- **Lucide Icons**: Featherweight vector icons with glowing container badges.

## Client Global State Architecture (Zustand v5)
- **Store Location**: `src/stores/use-user-store.ts` (`useUserStore`)
- **State Managed**:
  - `user`: Active authenticated user profile (`id`, `email`, `name`).
  - `houses`: Available house options list (`id`, `name`, `initialCash`).
  - `activeHouseId`: Active house selection (`number | 'ALL'`).
  - `activeSessionsCount`: Live active JWT session counter.
  - `isHydrated`: Client initialization flag.
- **Persistence**: Configured with `persist` middleware storing `activeHouseId` in `localStorage` so user property preferences persist across page reloads.
- **Hydration Bridge**: `src/components/providers/user-store-provider.tsx` bridges Next.js Server Component data from `RootLayout` (`src/app/layout.tsx`) into Zustand without hydration mismatches.
- **Subscribed Consumers**:
  - `<Sidebar />`: Subscribes directly to `user.name` and `user.email`.
  - `<Header />`: Subscribes to `houses`, `activeHouseId`, `setActiveHouseId`, and `activeSessionsCount`.
  - `<SessionManager />`: Calls `decrementActiveSessionsCount()` on session revocation.
