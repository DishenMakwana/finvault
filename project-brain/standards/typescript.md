# Standards: TypeScript — Project Brain v2

## Rules
- Strict mode enabled (`"strict": true` in `tsconfig.json`).
- Explicit function parameter types and return types for all Server Actions.
- No usage of `any`. Use `unknown` with type guards or explicit zod/interface schemas.
- Interfaces over type aliases for data contracts and model extensions.
- Enums or const unions for transaction categories and loan statuses.
