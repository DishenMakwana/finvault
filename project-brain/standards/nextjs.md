# Standards: React & Next.js — Project Brain v2

## React Standards
- Favor React Server Components (RSC) by default for zero client JS bundle.
- Only mark components with `'use client'` when browser APIs, event listeners, or client state (`useState`, `useTransition`, `framer-motion`) are required.
- Isolate client components to the smallest leaf components.

## Next.js Standards
- Next.js 16.4.6 App Router conventions.
- Mutate database state using `'use server'` Server Actions.
- Revalidate paths with `revalidatePath('/path')` after mutations to ensure instantaneous UI synchronization.
- Never expose Prisma client instances to client components.
