# 🚀 BrooBot Backend Setup Guide

## ✅ What's Been Built

Your complete backend is now ready with:
- ✅ Express server with CORS and error handling
- ✅ **Buddy Mode** - Claude AI integration (with mock fallback)
- ✅ **AI Tool Assistant** - 12 AI tools database with smart search
- ✅ **Deep Research** - Web scraping + Claude synthesis
- ✅ Authentication middleware (mock for development)
- ✅ All API endpoints configured
- ✅ Frontend connected to backend

---

## 📁 Backend Structure

```
backend/
├── server.js                 # Express server (main entry point)
├── package.json              # Dependencies
├── .env                      # Environment configuration
├── .env.example              # Environment template
│
├── api/
│   ├── chat.js              # Chat endpoints (Buddy + Deep Research)
│   └── tools.js             # AI Tool search endpoints
│
├── services/
│   ├── buddyMode.js         # Claude AI integration
│   ├── toolSearch.js        # AI tool search engine
│   └── deepResearch.js      # Web research + scraping
│
├── middleware/
│   └── auth.js              # Authentication (mock for now)
│
└── data/
    └── aiTools.js           # 12 AI tools database
```

---

## 🎮 Quick Start (2 Steps!)

### **Step 1: Start the Backend**

Open a terminal and run:

```bash
cd backend
npm start
```

You should see:
```
🚀 BrooBot Backend Server Started!
📡 Server running on http://localhost:3001
🌐 Frontend URL: http://localhost:5173
🤖 Claude API: ❌ Not configured
🔍 Serper API: ❌ Not configured (optional)
🎭 Mock Mode: ✅ Enabled
```

### **Step 2: Start the Frontend**

Open **another terminal** and run:

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

**That's it!** Open http://localhost:5173 in your browser.

---

## 🧪 Testing Your Setup

### 1. Test Backend Health

Visit: http://localhost:3001/health

You should see:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T...",
  "mockMode": true
}
```

### 2. Test Buddy Mode

1. Sign in with any email/password
2. Default mode is Buddy Mode (💬)
3. Type: "Hello, how are you?"
4. You should get a response!

**Current behavior:** Mock responses (because Claude API key not set)

### 3. Test AI Tool Assistant

1. Click the mode selector at top
2. Select "AI Tool Assistant" (🔧)
3. Type: "I need an image generator"
4. You should see tool cards with:
   - Midjourney
   - DALL-E 3
   - And others!

**Current behavior:** Real search through 12 AI tools! ✅

### 4. Test Deep Research

1. Switch to "Deep Research" mode (🔍)
2. Type: "Research the benefits of TypeScript"
3. You should get a formatted research report

**Current behavior:** Mock research (because Claude API key not set)

---

## 🔑 Adding Real AI (Optional)

### Get Claude API Key

1. Go to https://console.anthropic.com
2. Sign up (if needed)
3. Create an API key
4. Copy the key (starts with `sk-ant-...`)

### Add to Backend

1. Open `backend/.env`
2. Update this line:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```
3. Change mock mode:
   ```bash
   USE_MOCK_MODE=false
   ```
4. Restart the backend:
   ```bash
   # Press Ctrl+C to stop
   npm start
   ```

Now you'll get **real AI responses**! 🎉

**Cost:** ~$0.0005 per conversation with Claude Haiku (super cheap!)

---

## 🌐 Adding Better Research (Optional)

For better web search in Deep Research mode:

### Get Serper API Key (Free: 2,500/month)

1. Go to https://serper.dev
2. Sign up
3. Get your API key
4. Add to `backend/.env`:
   ```bash
   SERPER_API_KEY=your-serper-key-here
   ```
5. Restart backend

Now Deep Research will use real Google search results!

---

## 📡 API Endpoints Reference

### Health Check
```bash
GET http://localhost:3001/health
```

### Chat Endpoints

#### Send Chat Message (Buddy Mode or Deep Research)
```bash
POST http://localhost:3001/api/chat
Headers: Authorization: Bearer mock-token
Body: {
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "mode": "buddy",
  "sessionId": "session-123"
}
```

#### Get Available Modes
```bash
GET http://localhost:3001/api/chat/modes
```

### Tool Search Endpoints

#### Search AI Tools
```bash
POST http://localhost:3001/api/tools/search
Headers: Authorization: Bearer mock-token
Body: {
  "query": "image generation",
  "limit": 5,
  "freeOnly": false
}
```

#### Get Tool Categories
```bash
GET http://localhost:3001/api/tools/categories
```

#### Get Tool Stats
```bash
GET http://localhost:3001/api/tools/stats
```

---

## 🎯 Current Mode Status

| Mode | Status | API Required | Cost | Notes |
|------|--------|--------------|------|-------|
| **Buddy Mode** 💬 | ✅ Working | Claude API | $0.0005/msg | Uses mock if no API key |
| **AI Tool Assistant** 🔧 | ✅ Fully Working | None! | $0 | 12 tools, smart search |
| **Deep Research** 🔍 | ✅ Working | Claude API | $0.02-0.05 | Mock research if no API |

---

## 🔧 Configuration Options

### Mock Mode vs Real API

**Mock Mode** (Default - No API Keys Needed)
- Perfect for testing the interface
- No costs
- Instant responses
- Limited functionality

**Real API Mode** (Requires Claude API Key)
- Real AI responses
- Full capabilities
- Small cost per request
- Production-ready

### Environment Variables

```bash
# backend/.env

# Server
PORT=3001                          # Backend port
NODE_ENV=development               # Environment

# APIs
ANTHROPIC_API_KEY=                 # Claude API (optional for mock mode)
SERPER_API_KEY=                    # Search API (optional)

# Frontend
FRONTEND_URL=http://localhost:5173 # For CORS

# Mode
USE_MOCK_MODE=true                 # true = no API calls
```

---

## 🐛 Troubleshooting

### Backend won't start

**Problem:** `Error: Cannot find module...`

**Solution:**
```bash
cd backend
rm -rf node_modules
npm install
npm start
```

---

### Frontend can't connect to backend

**Problem:** Network error in console

**Solution:**
1. Make sure backend is running (`npm start` in backend folder)
2. Check http://localhost:3001/health works
3. Check CORS - frontend should be on port 5173

---

### Mock mode not working

**Problem:** Getting errors even with mock mode

**Solution:**
1. Open `backend/.env`
2. Ensure: `USE_MOCK_MODE=true`
3. Restart backend

---

### Claude API errors

**Problem:** API key not working

**Solution:**
1. Check your key is correct (starts with `sk-ant-`)
2. Verify at https://console.anthropic.com
3. Check you have credits
4. Try mock mode first: `USE_MOCK_MODE=true`

---

## 📊 What Each Mode Does

### 💬 Buddy Mode
- **Purpose:** General AI assistant
- **Backend:** `services/buddyMode.js`
- **API:** Claude Haiku (or mock)
- **Response Time:** ~1-2 seconds
- **Features:**
  - Conversational AI
  - Writing help
  - Coding assistance
  - General questions

### 🔧 AI Tool Assistant
- **Purpose:** Find AI tools
- **Backend:** `services/toolSearch.js`
- **API:** None (local database!)
- **Response Time:** Instant
- **Features:**
  - 12 curated AI tools
  - Smart keyword search
  - Free/Paid filtering
  - Direct links

### 🔍 Deep Research
- **Purpose:** Web research
- **Backend:** `services/deepResearch.js`
- **APIs:** Serper (optional) + Claude (for synthesis)
- **Response Time:** ~5-10 seconds
- **Features:**
  - Web scraping (Jina Reader - free!)
  - Multi-source research
  - Claude synthesis
  - Formatted reports

---

## 🚀 Next Steps

### For Testing Now:
1. ✅ Start backend
2. ✅ Start frontend
3. ✅ Test all three modes
4. ✅ Try different queries

### For Production:
1. Get Claude API key
2. Get Serper API key (optional)
3. Update `.env` with keys
4. Set `USE_MOCK_MODE=false`
5. Test with real APIs
6. Deploy (follow DEPLOYMENT_GUIDE.md)

---

## 💡 Pro Tips

1. **Start with Mock Mode**
   - Test the interface first
   - No costs while testing
   - Add APIs later

2. **AI Tool Assistant Works Now**
   - No API needed
   - 12 tools already loaded
   - Try queries like:
     - "image generation"
     - "writing assistant"
     - "coding help"

3. **Monitor Costs**
   - Backend logs all API calls
   - Check terminal for cost info
   - Haiku is super cheap (~$0.0005/msg)

4. **Keep Backend Running**
   - Don't close the backend terminal
   - Frontend needs it to work
   - Restart if you change .env

---

## 📞 Quick Commands

```bash
# Start backend
cd backend && npm start

# Start frontend (in another terminal)
npm run dev

# Check backend health
curl http://localhost:3001/health

# View backend logs
# Just watch the terminal where backend is running

# Stop backend
# Press Ctrl+C in backend terminal
```

---

## ✨ You're All Set!

### What Works Right Now:
- ✅ Backend server running
- ✅ Frontend connected
- ✅ AI Tool Assistant (fully functional!)
- ✅ Buddy Mode (mock mode)
- ✅ Deep Research (mock mode)
- ✅ All UI components
- ✅ Authentication flow

### To Enable Full Features:
1. Add Claude API key (5 minutes)
2. Restart backend
3. Test with real AI!

**Start the servers and test it out!** 🎉

---

**Questions?** Check the terminal logs - they're very helpful!

**Costs?** ~$0.05 per 100 messages with real API

**Ready to test?** Run the Quick Start commands above! 🚀
