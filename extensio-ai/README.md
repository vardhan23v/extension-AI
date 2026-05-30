# Extensio.ai - Text-to-Chrome-Extension Generator

Build Chrome extensions by describing them in plain English. Powered by Google Gemini 1.5 Flash AI.

## 🚀 Features

- **AI-Powered Code Generation** - Describe your extension, get complete code instantly
- **Full Chrome Extension V3 Support** - All generated extensions use Manifest V3
- **Save & Iterate** - Save extensions and refine them with additional prompts
- **Instant Download** - Get packaged .zip files ready to load into Chrome
- **Secure** - File sanitization prevents malicious code
- **Production-Ready** - Deployed on Azure with GitHub Actions CI/CD

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite) + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas
- **AI**: Google Gemini 1.5 Flash API
- **Auth**: JWT (JSON Web Tokens)
- **Deployment**: Azure App Service + Azure Static Web Apps
- **Packaging**: Archiver

## 📋 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (free)
- Google Gemini API key
- Azure account (optional, for production)

### Local Development

1. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd extensio-ai
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   # Create .env with your credentials
   npm run dev
   ```

3. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Access the app:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed configuration.

## 📁 Project Structure

```
extensio-ai/
├── backend/              # Express.js server
│   ├── routes/          # API routes
│   ├── controllers/      # Business logic
│   ├── models/          # MongoDB schemas
│   ├── services/        # Gemini & Zipper
│   ├── middleware/      # Auth & validation
│   └── utils/           # Helpers
│
├── frontend/            # React + Vite app
│   ├── src/
│   │   ├── pages/       # 5 main pages
│   │   ├── components/  # Reusable UI
│   │   ├── context/     # Auth state
│   │   └── api/         # Axios config
│   └── Dockerfile
│
├── azure/               # GitHub Actions CI/CD
└── SETUP_GUIDE.md      # Complete setup guide
```

## 🔑 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register user |
| POST | `/api/auth/login` | ❌ | Login user |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/extensions/generate` | ✅ | Generate extension |
| GET | `/api/extensions/my` | ✅ | Get user's extensions |
| GET | `/api/extensions/download/:id` | ✅ | Download .zip |
| POST | `/api/extensions/iterate/:id` | ✅ | Modify extension |
| DELETE | `/api/extensions/:id` | ✅ | Delete extension |

## 🎯 How It Works

1. **User describes** a Chrome extension in plain English
2. **System prompt** is sent to Gemini along with description
3. **Gemini generates** valid Manifest V3 files (manifest.json, content.js, popup.html, popup.js)
4. **Files are sanitized** to prevent malicious code
5. **Files are zipped** and saved to database
6. **User downloads** the .zip file
7. **User loads extension** into Chrome via developer mode

## 🚀 Deployment

### Azure App Service (Backend)
```bash
# GitHub Actions auto-deploys on push to main
# Requires: AZURE_CREDENTIALS, ACR_USERNAME, ACR_PASSWORD
```

### Azure Static Web Apps (Frontend)
```bash
# GitHub Actions auto-deploys on push to main
# Requires: AZURE_STATIC_WEB_APPS_API_TOKEN
```

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete deployment instructions.

## 🔒 Security

- ✅ JWT authentication with 30-day expiration
- ✅ Bcrypt password hashing
- ✅ File content sanitization
- ✅ CORS protection
- ✅ Environment variable secrets management
- ✅ MongoDB injection prevention via Mongoose

## 📝 Environment Variables

### Backend (.env)
```
MONGO_URI=<mongodb-connection-string>
JWT_SECRET=<your-secret-key>
GEMINI_API_KEY=<your-gemini-api-key>
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
```

## 🐛 Troubleshooting

**MongoDB Connection Error?**
- Verify connection string
- Check IP whitelist in MongoDB Atlas
- Ensure user has database access

**AI Generation Fails?**
- Check Gemini API key is valid
- Try a clearer extension description
- Check API quota limits

**CORS Issues?**
- Verify FRONTEND_URL in backend .env
- Check frontend URL matches CORS config
- Clear browser cache

## 📚 Example Usage

**User Input:**
```
"Create a Chrome extension that blocks ads on YouTube"
```

**Generated Output:**
- manifest.json (Manifest V3 config)
- content.js (Ad-blocking logic)
- popup.html (Extension UI)
- popup.js (Extension controls)
- ✨ All packaged in a .zip ready to load

## 🎨 Design System

- **Theme**: Dark mode (gray-950 background)
- **Accent**: Purple-to-blue gradient
- **Font**: Inter (Google Fonts)
- **Components**: Tailwind CSS utility classes
- **Responsive**: Mobile-first, fully responsive design

## 📊 Performance

- Vite dev server with fast HMR
- Optimized database queries with indexes
- Gzip compression on backend
- Syntax highlighting on-demand
- Image optimization ready

## 🔄 Future Enhancements

- [ ] Rate limiting on generation
- [ ] Email verification
- [ ] Extension marketplace
- [ ] Team collaboration
- [ ] Analytics dashboard
- [ ] More file type support
- [ ] Version history

## 📄 License

MIT License - Feel free to use for personal and commercial projects.

## 🤝 Contributing

Contributions welcome! Please fork and create a pull request.

## 💬 Support

For issues or questions:
1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. Review API documentation
3. Check GitHub Issues
4. Contact: support@extensio.ai

---

**Built with ❤️ using React, Node.js, Google Gemini, and Azure**

**Start building Chrome extensions with AI today!** 🚀
