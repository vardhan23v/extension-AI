# Extensio.ai - Complete Setup Guide

A production-ready Text-to-Chrome-Extension Generator Platform using Google Gemini AI, React, Node.js, and MongoDB.

## Prerequisites

- Node.js 20+
- npm or yarn
- MongoDB Atlas account (free tier available)
- Google Gemini API key
- Azure account (for deployment)
- Git

## Local Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. MongoDB Atlas Setup

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account and cluster
3. Create a database user with username/password
4. Get your connection string (looks like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/extensio-ai?retryWrites=true&w=majority
   ```

### 3. Google Gemini API Setup

1. Go to https://ai.google.dev
2. Click "Get API Key" and create a new API key
3. Copy your API key

### 4. Environment Variables

**Backend (.env)**

Create `backend/.env`:

```
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/extensio-ai?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_min_32_chars
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend (.env.local)**

Create `frontend/.env.local`:

```
VITE_API_URL=http://localhost:5000/api
```

### 5. Run Locally

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### 6. Test the Application

1. Open http://localhost:5173
2. Click "Start Building Free"
3. Register with an email and password
4. Try generating a Chrome extension by describing it in plain English
5. Download and test the generated .zip file

## Folder Structure

```
extensio-ai/
├── backend/
│   ├── server.js           # Express server
│   ├── .env                # Environment variables
│   ├── package.json        # Dependencies
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── extension.routes.js
│   │   └── user.routes.js
│   ├── controllers/        # Business logic
│   ├── models/             # MongoDB schemas
│   ├── middleware/         # Auth & validation
│   ├── services/           # Gemini AI & Zipper
│   └── utils/              # Helpers
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css       # Tailwind styles
│   │   ├── api/            # Axios config
│   │   ├── context/        # Auth context
│   │   ├── pages/          # 5 main pages
│   │   └── components/     # Reusable components
│   └── Dockerfile
│
└── azure/
    ├── azure-backend.yml   # GitHub Actions
    └── azure-frontend.yml  # GitHub Actions
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (protected)

### Extensions

- `POST /api/extensions/generate` - Generate extension (protected)
- `GET /api/extensions/download/:id` - Download extension zip (protected)
- `POST /api/extensions/iterate/:id` - Modify existing extension (protected)
- `GET /api/extensions/my` - Get user's extensions (protected)
- `DELETE /api/extensions/:id` - Delete extension (protected)

### User

- `GET /api/user/profile` - Get profile (protected)
- `PUT /api/user/profile` - Update profile (protected)

## Deployment to Azure

### Backend: Azure App Service

1. Create Azure App Service (Node.js 20 runtime)
2. Create Azure Container Registry
3. Set environment variables in App Service:
   ```
   MONGO_URI
   JWT_SECRET
   GEMINI_API_KEY
   FRONTEND_URL (your frontend URL)
   ```
4. Push to GitHub main branch (GitHub Actions will auto-deploy)

### Frontend: Azure Static Web Apps

1. Create Azure Static Web App
2. Connect GitHub repository
3. Set Build Configuration:
   - Build Location: `frontend`
   - App Location: `frontend/dist`
   - Output Location: `dist`
4. Set Environment Variable:
   ```
   VITE_API_URL=https://your-backend-app.azurewebsites.net/api
   ```
5. Push to GitHub main branch (GitHub Actions will auto-deploy)

### GitHub Secrets Required

```
AZURE_CREDENTIALS              # From 'az ad sp create-for-rbac'
AZURE_STATIC_WEB_APPS_API_TOKEN # From Azure Portal
ACR_USERNAME                   # Azure Container Registry
ACR_PASSWORD                   # Azure Container Registry
API_URL                        # Backend API URL
```

## Key Features Explained

### 1. AI Generation (Gemini)

The backend sends a carefully crafted system prompt to Google Gemini to generate:
- `manifest.json` (Manifest V3)
- `content.js` (injection script)
- `popup.html` (UI)
- `popup.js` (logic)

### 2. File Sanitization

Security layer that blocks:
- `eval()` calls
- Direct `document.cookie` access
- Unwhitelisted fetch/XHR requests
- Obfuscated code patterns

### 3. Zip Packaging

Uses `archiver` npm package to:
- Create temporary folders
- Write generated files
- Compress into .zip
- Serve for download
- Clean up temp files

### 4. JWT Authentication

- 30-day expiration
- Stored in localStorage
- Attached to every API request
- Verified on protected routes

## Troubleshooting

**"AI output was not valid JSON"**
- Gemini sometimes returns markdown-wrapped JSON
- The system prompt explicitly forbids this
- Try a simpler extension description

**"CORS error"**
- Make sure `FRONTEND_URL` in backend .env matches your frontend URL
- In development: `http://localhost:5173`
- In production: your Azure Static Web App URL

**MongoDB Connection Error**
- Verify connection string format
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

**Zip Download Fails**
- Check temp folder permissions
- Ensure `archiver` is properly installed
- Try downloading a different extension

## Performance Optimization

- Frontend: Built with Vite for fast HMR
- Syntax highlighting: Server-side rendered on demand
- Database: Indexed on `userId` and `createdAt`
- API: Gzip compression enabled
- Images: Use CDN for static assets

## Security Best Practices

✓ JWT tokens with expiration
✓ Password hashing with bcrypt
✓ CORS enabled only for frontend domain
✓ Environment variables for secrets
✓ File content sanitization
✓ MongoDB injection prevention via Mongoose

## Next Steps

1. Add rate limiting on extension generation
2. Implement email verification
3. Add extension marketplace
4. Support more file types
5. Analytics dashboard
6. User team collaboration

## License

MIT

---

**Built with ❤️ using React, Node.js, Google Gemini, and Azure**
