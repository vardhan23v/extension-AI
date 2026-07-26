@AGENTS.md

## Project rules

1. Settings and form flows must use `react-hook-form` with a Zod schema as the source of truth; do not ship uncontrolled inputs or submit handlers that bypass validation.
2. Shared validation, option lists, and formatting helpers belong in `src/lib`, and pages should import them instead of duplicating labels, allowed values, or parsing logic inline.
3. Any user-facing calculation or validation helper added under `src/lib` must ship with an automated test in `tests/` and a runnable `npm test` command before the task is considered complete.
