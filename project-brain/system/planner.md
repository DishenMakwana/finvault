# Planner Module — Project Brain v2

## Responsibilities
- **Prompt Decomposition**: Break user intent into atomic execution units.
- **Complexity Estimation**:
  - `Low`: Isolated copy, styling tweak, or single component prop.
  - `Medium`: Single feature addition (e.g., adding an Excel column, new category pill).
  - `High`: Cross-cutting concerns (authentication, schema migration, multi-step transaction recalculation).
- **Risk Assessment**:
  - Financial data accuracy & rounding regressions.
  - Session state leakage or broken JWT validation.
  - Database schema breaking changes.
- **Task Classification**: Feature, Bugfix, Refactor, Performance, or Documentation.
- **Rollback Strategy**: Git commit boundaries per atomic change.
