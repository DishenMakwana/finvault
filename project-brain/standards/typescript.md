# Standards: TypeScript — Project Brain v2

## Rules
- Strict mode enabled (`"strict": true` in `tsconfig.json`).
- Explicit function parameter types and return types for all Server Actions.
- No usage of `any`. Use `unknown` with type guards or explicit zod/interface schemas.
- Interfaces over type aliases for data contracts and model extensions.
- Enums or const unions for transaction categories and loan statuses.
- All types and interfaces used in components MUST be defined in `src/types/*.types.ts` (never inline in `src/components/`).
- All imports MUST be at the top level of the file (zero in-between or function-level imports).
