# Extensio AI 2.0 — Upgrade Plan

_Status as of 2026-11-03. Phase 1 is in progress on branch `phase1-stabilize-supabase`. Nothing below is "done" unless marked **verified** in the Phase 1 report at the end._

## 1. Existing architecture (audited)

| Layer | Technology | Location |
|---|---|---|
| Frontend | React 18, Vite 4, Tailwind 3, React Router 6, axios, framer-motion | `frontend/` |
| Backend | Node / Express 4 (CommonJS), served as a Vercel function via `api/index.js` | `backend/` |
| Database | MongoDB via Mongoose 7 (`User`, `Extension`) → **moving to Supabase Postgres** | `backend/models/` |
| Auth | Custom bcrypt + 30-day JWT in `localStorage` → **moving to Supabase Auth** | `backend/controllers/auth.controller.js` |
| AI | Groq (Llama 3.3 70B) → Gemini 2.0 Flash → OpenRouter fallback chain, raw `fetch` | `backend/services/gemini.service.js` |
| Packaging | `archiver` writing temp folders + zip into `os.tmpdir()` | `backend/services/zipper.service.js` |
| Deploy | Vercel: builds `frontend/`, rewrites `/api/*` to `api/index.js` | `vercel.json` |

### Current features (working as far as code reading shows)
Prompt → extension generation, prompt "enhance", conversational iteration, AI "fix bug", AI security audit, ZIP download, dashboard list/delete, public gallery with upvote/clone, shared view page, templates page, sandboxed iframe popup preview with mocked `chrome.*`, diff viewer and version timeline (client-side).

### Unrelated / legacy code (documented, **not deleted**)
- Repo root `package.json` (`talentdash`), `src/app/**`, `src/components/**`, `src/lib/**`, `prisma/`, `next.config.ts`, `postcss.config.mjs`, `prisma.config.ts`, `eslint.config.mjs`, `AGENTS.md`, `CLAUDE.md`: a separate Next.js salary/company-review product. Not deployed by `vercel.json`. Recommend moving to its own repository.
- `extensio-ai/`: older duplicate of backend/frontend with Azure/Docker configs.
- `frontend/dist/`: committed build output.
- `add_commits.sh`, `.activity_log`: script that fabricates back-dated commits under other people's names. Recommend removing.
- `backend/test-ai.js`, `test-gemini.js`, `test-openrouter.js`: manual provider smoke scripts, not tests.

## 2. Technical debt
- No automated tests (`jest` referenced but not installed).
- Frontend `npm run lint` crashes: with no local config ESLint picks up the root Next.js config.
- AI output is never validated; `manifest.json` is not parsed.
- Prompt promises auto-injected icons that are never created → ZIPs fail to load in Chrome.
- Prompt suggests Tailwind via CDN — remote scripts are blocked by MV3 extension CSP.
- `iterate` / `debug` regenerate from the original prompt and discard the current code.
- ZIP path stored in DB but file lives in ephemeral `/tmp`.
- No provider timeouts; frontend timeout (30 s) shorter than generations.
- Gallery populates a non-existent `username` field.
- Three near-identical provider code paths duplicated in `generate`, `audit`, `enhance`.

## 3. Security concerns
| # | Issue | Severity |
|---|---|---|
| S1 | Audit fallback returns `{score:100,isSafe:true}` when providers fail | Critical |
| S2 | Preview "open in new tab" `document.write`s generated HTML into a same-origin window → can read auth token | High |
| S3 | ZIP builder joins AI-controlled filenames into paths → path traversal / zip-slip | High |
| S4 | CORS allows every origin; 50 MB JSON body; no rate limiting; no security headers | Medium |
| S5 | Upvote unauthenticated and unlimited; audit runnable by anyone on public extensions (cost abuse) | Medium |
| S6 | 500 responses echo `error.message`; webhook / monetization URLs injected into prompts unvalidated | Medium |
| S7 | Store assets hotlinked from third-party image service with user text | Low |
| S8 | Weak password rules, long-lived JWT in `localStorage` | Medium (addressed by Supabase Auth) |

## 4. Proposed architecture
Keep Express + React/Vite (incremental, no framework migration).

```
frontend (Vite/React) ──supabase-js (anon key)──▶ Supabase Auth (sign up / sign in / session)
      │  Bearer <supabase access token>
      ▼
backend (Express on Vercel)
  middleware: helmet · CORS allowlist · rate limits · auth (supabase.auth.getUser) · id validation
  services/ai/providers.js   provider adapters (Groq, Gemini, OpenRouter) w/ timeout + retry
  services/generation.js     prompt → parse → sanitize → icons → validate → (1 repair) → result
  services/validator.service MV3 + file-reference + syntax checks (parse only, never executes)
  services/security/*        deterministic static checks + optional AI summary, explicit status
  services/zipper.service    in-memory ZIP streamed to client
  repositories/*             Supabase data access (service-role key, ownership enforced in code)
      ▼
Supabase Postgres (RLS enabled as defence in depth)
```

## 5. Database changes (MongoDB → Supabase)
Migration: `supabase/migrations/20261103000000_init.sql` (rollback: `supabase/rollbacks/20261103000000_init.down.sql`).

| Table | Purpose |
|---|---|
| `auth.users` | Supabase Auth (replaces `User` collection) |
| `profiles` | display name, `legacy_mongo_id` |
| `extensions` | replaces `Extension`; `files`, `store_assets`, `iteration_history` as JSONB; `legacy_mongo_id` |
| `extension_versions` | snapshot before every AI edit (rollback) |
| `extension_upvotes` | one vote per user (PK) |

RPCs: `upvote_extension`, `increment_clone_count` (service-role only). Trigger creates a profile on sign-up.
Data migration: `backend/scripts/migrate-mongo-to-supabase.js` copies users (bcrypt hashes preserved via the Admin API `password_hash`) and extensions; idempotent via `legacy_mongo_id`; dry-run by default.
Later phases add: `project_files` (normalised), `conversations`, `ai_generations`, `templates`, `security_reports`, `test_reports`, `provider_configs` (encrypted BYOK), `usage_records`.

## 6. Phases
1. **Stabilize** — Supabase migration, validation, safe ZIP, icons, provider layer, honest audit, API hardening, preview isolation, tests. _(this branch)_
2. **Core workspace** — conversational editing with diffs, file explorer, Monaco, project persistence, version history/rollback UI, autosave.
3. **Testing & security** — Security Center UI, dependency scanning, Playwright + Chromium `--load-extension` test runner (background job), AI repair loop with attempt limits.
4. **Visual development** — isolated preview origin, theme controls, component library, inspector.
5. **Integrations** — GitHub OAuth (minimal scopes), import/export, Web Store publishing assistant (checklist, descriptions, privacy draft).
6. **Ecosystem** — template marketplace with moderation, analytics (opt-in), BYOK with encrypted keys, teams, monetization hooks.

Each phase is planned, implemented, and verified separately.

## 7. Migration risks
- **Auth switch logs everyone out.** Users must sign in again; migrated users keep their password (bcrypt hash import). If Supabase rejects a hash, the user must reset their password.
- **IDs change** from ObjectId to UUID → old shared links (`/shared/<objectId>`) break. Mitigation: `legacy_mongo_id` columns allow a redirect later.
- **Email confirmation**: if enabled in Supabase, new sign-ups must confirm before signing in.
- Supabase free-tier row/size limits — extension files are stored as JSONB (same as Mongo).
- Pollinations store-asset URLs are no longer generated for new extensions (UI shows a placeholder).

## 8. Testing strategy
- Jest unit tests: validator, sanitizer, zipper, icon generator, static security checks, AI response parsing, audit status logic (providers mocked).
- Supertest route tests with the repository and auth layers mocked: 401 without token, ownership 404s, invalid ids, malformed AI output, rate limiting, upvote rules.
- Frontend: build + lint.
- Manual/automated E2E (requires real keys): generate → download → load unpacked in Chromium. Reported as unverified when not run.

## 9. Phase 1 report

**Implemented (backend unit/route tests verified):** Supabase schema + RLS + rollback; Supabase Auth token verification; repository layer with ownership filters; Mongo → Supabase migration script (dry-run default, idempotent); path-safe sanitizer; in-memory ZIP; generated PNG icons; MV3 validator; provider layer with timeouts, one retry and fallback; one-shot AI repair loop; context-preserving iterate/debug with version snapshots and restore endpoints; deterministic security checks with explicit audit statuses; helmet, CORS allowlist, 2 MB body limit, rate limits, UUID validation, generic 5xx messages; authenticated one-per-user upvotes; owner-only audits; preview isolation (removed same-origin `document.write`, preview disclaimer); frontend Supabase sign-in/up, AI timeouts, validator errors, audit status UI; frontend ESLint config.

**Test results:** `backend: npm test` → 6 suites, 72 tests passing. `frontend: npm run build` passes; `npx eslint src` → 0 errors, 31 pre-existing warnings.

**Verified manually:** a fixture extension run through sanitize → icons → validate → ZIP unpacks to the expected files with zero validation errors.

**Not yet verified:**
- Against a live Supabase project (migration SQL, RLS, Auth sign-up/sign-in, the Mongo migration script).
- Real AI generation with live keys.
- Loading a generated ZIP in Chrome/Chromium (Playwright browsers not installed).
- The UI in a browser.

**Known limitations:** manual edits in the Code tab are still client-only and not saved (Phase 2); the existing version timeline UI still restores by re-prompting rather than using the new restore endpoint (Phase 2); the preview's mocked `chrome.storage` uses `localStorage`, which throws inside the sandboxed iframe; old Mongo ObjectId share links will not resolve; rate limits are in-memory per serverless instance.
