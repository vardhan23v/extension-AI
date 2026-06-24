# ✨ Extension AI

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vardhan23v/extension-AI)
**[🚀 View Live Demo on Vercel](https://extension-ai-five.vercel.app/)**

**Extension AI** is an intelligent web application that empowers users to build fully functional Chrome Extensions using plain English prompts. Powered by advanced AI models (Gemini & Groq), it generates Manifest V3 compliant code, provides a sandboxed live preview, and packages the extension into a ready-to-load `.zip` file in seconds.

## 🚀 Features

- **Text-to-Extension**: Describe your idea, and the AI generates `manifest.json`, background scripts, content scripts, and popup UI.
- **Interactive Live Preview**: Test your generated extensions in a responsive browser frame (Popup, Tablet, Full Width) right from the dashboard.
- **Conversational Iteration**: Not quite what you wanted? Use the built-in AI Copilot chat to modify and refine the generated code.
- **Template Gallery**: Start fast by choosing from 20+ curated extension templates across categories like Productivity, Dev Tools, and Social Media.
- **Community Sharing**: Publish your extensions to the public gallery, upvote community creations, and clone them with one click.
- **One-Click Download**: Instantly download your generated code as a packaged `.zip` file, ready to drop into `chrome://extensions/`.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, React Router
- **Backend**: Node.js, Express
- **Database**: MongoDB (Mongoose)
- **AI Integration**: Google Gemini 2.0 Flash, Groq (Llama 3.3)
- **Deployment**: Vercel

## ⚙️ Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB connection URI
- API Keys for Gemini and/or Groq

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vardhan23v/extension-AI.git
   cd extension-AI
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5050
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key
   ```
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```
   Start the frontend development server:
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   Navigate to `http://localhost:5173` to start building extensions!

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/vardhan23v/extension-AI/issues).

## 📄 License

This project is licensed under the MIT License.
