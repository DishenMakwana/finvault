# System Layer — Project Brain v2

## Purpose
Defines the global engineering workflow and execution boundaries for FinVault.

## Responsibilities
- Receive user prompts and classify task intent
- Enforce strict sequential execution order
- Never store raw architecture here (handled in `memory/architecture.md`)
- Never store project memory here (handled in `memory/`)
- Never store implementation details here (handled in code and actions)

## Lifecycle Rules
1. Every task must pass through `system/workflow.md`.
2. Graph retrieval must precede context loading.
3. Static validation (`npm run typecheck` / `bun run build`) must pass before code is accepted.
4. Incremental memory updates must follow every completed task.
