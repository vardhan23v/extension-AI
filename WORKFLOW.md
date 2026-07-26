# FE-03 Workflow Comparison

For this drill, I built the same TalentDash-style alert preferences feature twice on separate branches: `fe-03-vague-settings-form` and `fe-03-precise-settings-form`.

The vague round was intentionally one sentence in spirit: make a settings form. The result was fast to generate, but shallow. It added a single page with local `useState`, a basic `<form>`, one free-text location field, a frequency dropdown, and a success message that appeared for any submission. The branch diff is only 91 added lines across two files: `src/app/settings/page.tsx` and a tools entry in `src/app/tools/page.tsx`. That speed felt good at first, but the review burden was high because almost every important behavior still needed human checking. The form accepted invalid email values, had no required-field enforcement, no constrained options for alert types or locations, no reset path, no test coverage, and no reusable validation logic.

The precise round used a much tighter prompt: file-aware context, constraints, expected behavior, and a verification step. That branch added 556 lines across five files, but most of the extra weight was purposeful structure, not noise. The key differences were specific:

- `src/lib/alert-preferences.ts` centralizes allowed values, schema rules, defaults, and summary formatting.
- `src/app/settings/page.tsx` uses `react-hook-form` with `zodResolver`, accessible labels, error messages, checkbox groups, and a preview/saved-summary sidebar.
- `tests/alert-preferences.test.mts` verifies valid parsing, rejection cases, compensation bounds, and summary formatting.
- `package.json` gained an `npm test` command so verification is part of the workflow, not an afterthought.

Correctness improved the most. In the better branch, email format, minimum compensation bounds, required selections, and trimmed input handling are enforced before save. Accessibility also improved because inputs now have explicit labels, `aria-invalid`, and `aria-describedby` wiring instead of relying on visual layout alone. Edge cases were clearer too: empty multi-select groups, out-of-range compensation, and bad email input now fail predictably.

The most useful lesson was that round two looked slower but was faster end-to-end. I spent more time specifying the shape up front, but far less time mentally simulating failure cases during review. One AI mistake I caught in the stronger round was a type mismatch between Zod-coerced numeric input and the React Hook Form generic type. That bug only surfaced during verification, and fixing it reinforced the point of the assignment: careful prompting still needs tests and a real review loop.
