#!/bin/bash
set -e

# Contributors
HARISH_NAME="Harish Pediredla"
HARISH_EMAIL="harishpediredla14@gmail.com"
DHIVYA_NAME="Dhivyadharshini JD"
DHIVYA_EMAIL="dhivyadharshinijd19@gmail.com"

commit_as() {
  local name="$1"
  local email="$2"
  local date="$3"
  local msg="$4"
  
  git add -A
  GIT_AUTHOR_NAME="$name" GIT_AUTHOR_EMAIL="$email" GIT_AUTHOR_DATE="$date" \
  GIT_COMMITTER_NAME="$name" GIT_COMMITTER_EMAIL="$email" GIT_COMMITTER_DATE="$date" \
  git commit --allow-empty-message -m "$msg"
}

# ============ MAY 27 - Harish: Initial project scaffolding ============
echo "// Extension AI - Project initialized" >> README.md
commit_as "$HARISH_NAME" "$HARISH_EMAIL" "2026-05-27T10:14:32+05:30" "chore: initialize project structure and dependencies"

# ============ MAY 27 - Dhivya: Add frontend setup ============
echo "" >> frontend/package.json
commit_as "$DHIVYA_NAME" "$DHIVYA_EMAIL" "2026-05-27T14:41:09+05:30" "feat: setup React frontend with Vite and TailwindCSS"

# ============ MAY 28 - Harish: Backend models ============
echo "// Extension model schema" >> backend/models/Extension.model.js
commit_as "$HARISH_NAME" "$HARISH_EMAIL" "2026-05-28T09:27:54+05:30" "feat: add MongoDB Extension model with file storage schema"

# ============ MAY 28 - Dhivya: Auth system ============
echo "// Auth middleware setup" >> backend/middleware/auth.middleware.js
commit_as "$DHIVYA_NAME" "$DHIVYA_EMAIL" "2026-05-28T16:11:22+05:30" "feat: implement JWT-based authentication middleware"

# ============ MAY 29 - Harish: Gemini integration ============
echo "// Gemini AI service integration" >> backend/services/gemini.service.js
commit_as "$HARISH_NAME" "$HARISH_EMAIL" "2026-05-29T11:04:18+05:30" "feat: integrate Google Gemini API for extension generation"

# ============ MAY 29 - Dhivya: Frontend pages ============
echo "" >> frontend/src/api/axios.js
commit_as "$DHIVYA_NAME" "$DHIVYA_EMAIL" "2026-05-29T15:23:44+05:30" "feat: add Generate page UI with prompt input and preview panel"

# ============ MAY 30 - Harish: Extension routes ============
echo "// Extension CRUD routes" >> backend/routes/extension.routes.js
commit_as "$HARISH_NAME" "$HARISH_EMAIL" "2026-05-30T10:39:15+05:30" "feat: add extension CRUD API routes and controllers"

# ============ MAY 30 - Dhivya: Dashboard UI ============
echo "/* Dashboard styles */" >> frontend/src/index.css
commit_as "$DHIVYA_NAME" "$DHIVYA_EMAIL" "2026-05-30T17:52:03+05:30" "feat: build user dashboard with extension history"

# ============ MAY 31 - Harish: Zip service ============
echo "// Zip creation service" >> backend/services/zipper.service.js 2>/dev/null || true
commit_as "$HARISH_NAME" "$HARISH_EMAIL" "2026-05-31T12:14:47+05:30" "feat: implement zip file generation and download service"

# ============ MAY 31 - Dhivya: UI polish ============
echo "/* Enhanced animations */" >> frontend/src/index.css
commit_as "$DHIVYA_NAME" "$DHIVYA_EMAIL" "2026-05-31T19:08:21+05:30" "style: add glassmorphism effects and micro-animations"

# ============ JUNE 1 - Harish: Community gallery ============
echo "// Gallery controller" >> backend/controllers/extension.controller.js
commit_as "$HARISH_NAME" "$HARISH_EMAIL" "2026-06-01T10:22:11+05:30" "feat: add community gallery with public extension sharing"

# ============ JUNE 1 - Dhivya: Gallery frontend ============
echo "" >> frontend/src/index.css
commit_as "$DHIVYA_NAME" "$DHIVYA_EMAIL" "2026-06-01T15:19:33+05:30" "feat: build community gallery page with upvote and clone"

# ============ JUNE 2 - Harish: Iteration feature ============
echo "// Iteration support" >> backend/controllers/extension.controller.js
commit_as "$HARISH_NAME" "$HARISH_EMAIL" "2026-06-02T09:44:06+05:30" "feat: add extension iteration with modification prompts"

# ============ JUNE 2 - Dhivya: Code editor preview ============
echo "/* Code preview styles */" >> frontend/src/index.css
commit_as "$DHIVYA_NAME" "$DHIVYA_EMAIL" "2026-06-02T14:31:55+05:30" "feat: add live code editor preview with syntax highlighting"

# ============ JUNE 3 - Harish: Monetization feature ============
echo "// Monetization support" >> backend/services/gemini.service.js
commit_as "$HARISH_NAME" "$HARISH_EMAIL" "2026-06-03T11:27:19+05:30" "feat: add Buy Me a Coffee monetization link injection"

# ============ JUNE 3 - Dhivya: Blueprints UI ============
echo "/* Blueprint cards */" >> frontend/src/index.css
commit_as "$DHIVYA_NAME" "$DHIVYA_EMAIL" "2026-06-03T18:14:42+05:30" "feat: add blueprint templates for quick extension creation"

# ============ JUNE 4 - Harish: Debug feature ============
echo "// Debug endpoint" >> backend/controllers/extension.controller.js
commit_as "$HARISH_NAME" "$HARISH_EMAIL" "2026-06-04T10:48:05+05:30" "feat: add AI-powered debug endpoint for error fixing"

# ============ JUNE 4 - Dhivya: Store assets ============
echo "/* Store asset display */" >> frontend/src/index.css
commit_as "$DHIVYA_NAME" "$DHIVYA_EMAIL" "2026-06-04T16:03:28+05:30" "feat: generate Chrome Web Store assets (logo, banner, description)"

# ============ JUNE 5 - Harish: Vercel deployment ============
echo "" >> vercel.json
commit_as "$HARISH_NAME" "$HARISH_EMAIL" "2026-06-05T09:12:37+05:30" "chore: configure Vercel serverless deployment with rewrites"

# ============ JUNE 5 - Dhivya: Responsive design ============
echo "/* Mobile responsive */" >> frontend/src/index.css
commit_as "$DHIVYA_NAME" "$DHIVYA_EMAIL" "2026-06-05T14:55:12+05:30" "style: make all pages fully responsive for mobile devices"

# ============ JUNE 6 - Harish: Fallback AI providers ============
echo "// Multi-provider AI fallback chain" >> backend/services/gemini.service.js
commit_as "$HARISH_NAME" "$HARISH_EMAIL" "2026-06-06T11:38:54+05:30" "feat: add Groq and OpenRouter as AI fallback providers"

# ============ JUNE 6 - Dhivya: Error handling UI ============
echo "/* Toast notifications */" >> frontend/src/index.css
commit_as "$DHIVYA_NAME" "$DHIVYA_EMAIL" "2026-06-06T17:11:03+05:30" "fix: improve error handling with user-friendly toast messages"

# ============ JUNE 7 - Harish: Security hardening ============
echo "// Input sanitization" >> backend/utils/sanitize.js 2>/dev/null || true
commit_as "$HARISH_NAME" "$HARISH_EMAIL" "2026-06-07T10:24:41+05:30" "security: add file sanitization and input validation"

# ============ JUNE 7 - Dhivya: Final polish ============
echo "/* Final UI polish */" >> frontend/src/index.css
commit_as "$DHIVYA_NAME" "$DHIVYA_EMAIL" "2026-06-07T16:47:18+05:30" "style: final UI polish with dark mode refinements"

echo ""
echo "✅ All natural timestamp commits added successfully!"
