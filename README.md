<div align="center">

# ✨ Extensio AI

### Build, edit, audit and export Chrome extensions — just by describing them.

<br />

[![Live Demo](https://img.shields.io/badge/🚀_LIVE_DEMO-extension--ai--five.vercel.app-4F46E5?style=for-the-badge)](https://extension-ai-five.vercel.app/)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy_with-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/new/clone?repository-url=https://github.com/vardhan23v/extension-AI)

[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest_V3-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
[![Tests](https://img.shields.io/badge/Backend_tests-96_passing-16A34A?style=for-the-badge&logo=jest&logoColor=white)](backend/tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge)](LICENSE)

[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwindcss&logoColor=38BDF8)](https://tailwindcss.com/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://microsoft.github.io/monaco-editor/)

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

[![Groq](https://img.shields.io/badge/Groq-F55036?style=for-the-badge&logoColor=white)](https://groq.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-6566F1?style=for-the-badge)](https://openrouter.ai/)

[![Last commit](https://img.shields.io/github/last-commit/vardhan23v/extension-AI?style=for-the-badge&logo=github)](https://github.com/vardhan23v/extension-AI/commits/main)
[![Stars](https://img.shields.io/github/stars/vardhan23v/extension-AI?style=for-the-badge&logo=github)](https://github.com/vardhan23v/extension-AI/stargazers)
[![Issues](https://img.shields.io/github/issues/vardhan23v/extension-AI?style=for-the-badge&logo=github)](https://github.com/vardhan23v/extension-AI/issues)

</div>

---

**Extensio AI** turns a plain-English idea into a complete, validated Manifest V3 Chrome extension project. You can edit it in a real code editor, refine it with an AI assistant that shows a diff before changing anything, run security checks, and download a ZIP that is ready for `chrome://extensions`.

## 🚀 Features

- **Text-to-extension**: describe the idea and get `manifest.json`, popup, scripts and generated icons.
- **Agent crew**: a Product Planner (least-privilege spec), Extension Engineer, QA Reviewer and Security Analyst build and check every project, with live progress in the builder.
- **Validated output**: every result is checked for MV3 structure, missing files, remote or inline scripts and JavaScript syntax before it is saved.
- **Code Studio**: file tree, Monaco editor, search across files, autosave, formatting and version history with restore.
- **AI assistant with review**: ask for changes or paste an error; the assistant proposes edits as a diff you apply or discard.
- **Security Center**: deterministic checks for broad permissions, `eval`, unsafe DOM use, CSP issues and exposed keys, plus a plain-language explanation. Not a certification.
- **Visual preview**: popup and options pages in a sandboxed frame with simulated Chrome APIs, in light and dark mode.
- **Templates and Community**: 20 starter prompts, plus a public gallery to share, upvote and clone extensions.
- **One-click ZIP**: download and load with “Load unpacked”.

## 🛠️ Technology Stack

- **Frontend**: React 18 (Vite), Tailwind CSS, React Router, Monaco Editor, Supabase JS (auth)
- **Backend**: Node.js, Express (helmet, rate limiting), Jest + Supertest
- **Database & Auth**: Supabase (Postgres, Supabase Auth, Row Level Security)
- **AI**: Groq (`openai/gpt-oss-120b`) → Google Gemini → OpenRouter fallback chain
- **Deployment**: Vercel

## 🧭 App overview

- **Dashboard** — recent projects and a quick prompt box
- **AI Builder** (`/new`) — describe an extension (optional support link, webhook, translations)
- **My Projects** — search, filter by status, rename, duplicate, download, delete
- **Code Studio** (`/projects/:id`) — file tree, Monaco editor with autosave, AI assistant that proposes changes as a reviewable diff, visual preview, problems list, version history with restore, security audit
- **Security Center** — audit status across all projects
- **Templates**, **Community**, **Settings**

## 🔒 What happens to generated code

1. The AI output is parsed and every filename is checked (no absolute paths, `..`, or unexpected file types).
2. Icons referenced by the manifest are generated as real PNG files.
3. A Manifest V3 validator checks the manifest, every referenced file, remote/inline scripts (blocked by MV3 CSP), permissions, and JavaScript syntax (code is parsed, never executed).
4. If validation fails, the AI gets one repair attempt; otherwise the request fails with the list of errors.
5. Security audits combine deterministic checks with an optional AI explanation and report `passed`, `findings`, `incomplete` or `failed` — an audit is never reported as passed when the AI review could not run. It is not a security certification.

The in-app preview is a visual mock only (sandboxed iframe, mocked Chrome APIs). Load the downloaded ZIP in `chrome://extensions` to test real behavior.

## ⚙️ Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- At least one AI key: Groq, Gemini or OpenRouter

### 1. Database

Run the files in `supabase/migrations/` in order in the Supabase SQL editor (or `supabase db push`):

1. `20261103000000_init.sql` — users' projects, versions, upvotes
2. `20261104000000_phase2.sql` — project status/description, saved audits, assistant conversations

Rollbacks live in `supabase/rollbacks/`. In Supabase → Authentication → URL Configuration, set the Site URL to your deployed URL so confirmation emails link there.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and AI keys
npm run dev
npm test
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Open `http://localhost:5173`.

### Vercel environment variables

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS`, AI keys, and `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` for the frontend build.

See [EXTENSIO_UPGRADE_PLAN.md](EXTENSIO_UPGRADE_PLAN.md) for the roadmap.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/vardhan23v/extension-AI/issues).

## 📄 License

This project is licensed under the MIT License.
