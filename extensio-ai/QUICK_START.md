# Extensio.ai - Quick Start Checklist

Follow these steps to get Extensio.ai running locally within 15 minutes.

## ✅ Prerequisites (5 mins)

- [ ] Download Node.js 20+ from nodejs.org
- [ ] Create MongoDB Atlas account (mongodb.com/cloud/atlas)
- [ ] Get Google Gemini API key (ai.google.dev)

## ✅ Configuration (3 mins)

### Step 1: Set Backend Environment Variables

Create `backend/.env`:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/extensio-ai?retryWrites=true&w=majority
JWT_SECRET=generate_a_random_string_at_least_32_chars_long
GEMINI_API_KEY=paste_your_gemini_api_key_here
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Step 2: Set Frontend Environment Variables

Create `frontend/.env.local`:
```
VITE_API_URL=http://localhost:5000/api
```

## ✅ Installation (5 mins)

### Terminal 1 - Backend Setup:
```bash
cd backend
npm install
npm run dev
# ✓ Server should run on http://localhost:5000
# ✓ Look for "✓ MongoDB connected" message
```

### Terminal 2 - Frontend Setup:
```bash
cd frontend
npm install
npm run dev
# ✓ Frontend should run on http://localhost:5173
```

## ✅ Testing (2 mins)

1. Open http://localhost:5173
2. Click "Start Building Free" → "Create Account"
3. Register with test email: `test@example.com` / password: `test123`
4. Click "Generate Extension"
5. Describe an extension: "Block ads on YouTube"
6. Click "Generate Extension"
7. View generated files in the right panel
8. Click "Download .zip"
9. Go to chrome://extensions/
10. Enable "Developer mode"
11. Click "Load unpacked"
12. Extract downloaded zip and select the folder

## ✨ Success Indicators

When running locally, you should see:

**Backend Terminal:**
```
✓ MongoDB connected
✓ Server running on port 5000
```

**Frontend Console:**
```
VITE v4.4.9  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

**Browser:**
- Landing page loads with gradient background
- Can register and login
- Generator page has left and right panels
- File preview shows syntax-highlighted code

## 🔧 MongoDB Atlas Setup (Detailed)

1. Go to mongodb.com/cloud/atlas
2. Create account → Create organization
3. Create free cluster (choose region closest to you)
4. Click "Build a Database" → Create Cluster
5. Wait 5-10 minutes for cluster to initialize
6. Click "Connect" → "Drivers"
7. Copy connection string:
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/extensio-ai?retryWrites=true&w=majority
   ```
8. Replace `<username>` and `<password>` with your database user credentials

## 🔑 Google Gemini API Key (Detailed)

1. Go to ai.google.dev
2. Click "Get started" → "Get API Key"
3. Click "Create API Key"
4. Copy the API key
5. Paste into `backend/.env` as `GEMINI_API_KEY`

## ❌ Troubleshooting

### Backend won't start
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
→ Check MongoDB connection string in `.env`
→ Verify MongoDB Atlas cluster is running

### Frontend won't start
```
Error: ENOENT: no such file or directory
```
→ Run `npm install` in frontend folder
→ Delete `node_modules` and `package-lock.json`, then reinstall

### "Invalid token" errors
→ Clear browser localStorage: F12 → Application → Local Storage → Delete
→ Re-register

### AI generation returns error
→ Check GEMINI_API_KEY is correct
→ Try simpler prompt: "Create a dark mode extension"
→ Check API quota at ai.google.dev

## 📱 Testing Different Scenarios

**Test 1: Generate Simple Extension**
- Prompt: "Show the time on any webpage"
- Expected: manifest.json, popup.html, popup.js, content.js

**Test 2: Download & Load into Chrome**
- Generate extension → Download .zip
- Extract to folder
- chrome://extensions/ → Load unpacked
- Select extracted folder
- Extension should appear

**Test 3: Dashboard**
- Generate 2-3 extensions
- Go to Dashboard
- See all generated extensions
- Search by title
- Download, Iterate, and Delete

**Test 4: Iterate Extension**
- Generate extension
- Click "Iterate / Modify"
- Add more requirements: "Also add a settings page"
- See updated files

## 🚀 Next Steps After Local Testing

1. **Deploy Backend to Azure App Service**
   - Follow SETUP_GUIDE.md Azure section
   - Set production environment variables
   - GitHub Actions will auto-deploy

2. **Deploy Frontend to Azure Static Web Apps**
   - Follow SETUP_GUIDE.md Azure section
   - Update VITE_API_URL to production backend
   - GitHub Actions will auto-deploy

3. **Custom Domain**
   - Map custom domain to Azure resources
   - Update CORS settings for production URLs

## 📞 Still Having Issues?

1. Check SETUP_GUIDE.md for detailed troubleshooting
2. Verify all 3 API keys are correctly set
3. Check browser console for errors (F12)
4. Check terminal output for server errors
5. Try clearing `.env` and starting fresh

---

**You're ready to go! Happy building! 🎉**
