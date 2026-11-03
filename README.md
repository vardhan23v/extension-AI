# ✨ Extension AI

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vardhan23v/extension-AI)
**[🚀 View Live Demo on Vercel](https://extension-ai-five.vercel.app/)**

**Extension AI** is an intelligent web application that empowers users to build fully functional Chrome Extensions using plain English prompts. Powered by AI models (Groq, Gemini, OpenRouter), it generates and validates Manifest V3 code, provides a sandboxed visual preview, and packages the extension into a ready-to-load `.zip` file in seconds.

## 🚀 Features

- **Text-to-Extension**: Describe your idea, and the AI generates `manifest.json`, background scripts, content scripts, and popup UI.
- **Interactive Live Preview**: Test your generated extensions in a responsive browser frame (Popup, Tablet, Full Width) right from the dashboard.
- **Conversational Iteration**: Not quite what you wanted? Use the built-in AI Copilot chat to modify and refine the generated code.
- **Template Gallery**: Start fast by choosing from 20+ curated extension templates across categories like Productivity, Dev Tools, and Social Media.
- **Community Sharing**: Publish your extensions to the public gallery, upvote community creations, and clone them with one click.
- **One-Click Download**: Instantly download your generated code as a packaged `.zip` file, ready to drop into `chrome://extensions/`.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, React Router, Supabase JS (auth)
- **Backend**: Node.js, Express (helmet, rate limiting)
- **Database & Auth**: Supabase (Postgres + Supabase Auth, Row Level Security)
- **AI Integration**: Groq (Llama 3.3) → Google Gemini → OpenRouter fallback chain
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
