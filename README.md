# BrooBot - AI Assistant Platform

A production-ready AI assistant platform with three distinct modes: Buddy Mode, AI Tool Assistant, and Deep Research Mode. Built with React, TypeScript, and designed for deployment on AWS Amplify.

## Features

### 🤖 Three Intelligent Modes

1. **Buddy Mode** 💬
   - General conversational AI
   - Ask any question
   - Powered by Claude AI

2. **AI Tool Assistant** 🔧
   - Discover free AI tools for your needs
   - Personalized recommendations
   - Comprehensive tool database

3. **Deep Research Mode** 🔍
   - AI-powered web research
   - Multi-format outputs (PDF, PPTX, DOCX, images, code)
   - Cited sources and structured reports

### 🔐 Authentication
- Email/Password authentication
- Google OAuth integration
- AWS Amplify Auth (ready for integration)

### 💎 Production Features
- TypeScript for type safety
- Error boundaries for graceful error handling
- Responsive design (mobile & desktop)
- Real-time message streaming (ready)
- Session management
- Chat history

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Context API
- **Styling**: CSS Modules with CSS Variables
- **AI**: Anthropic Claude API (ready for integration)
- **Auth**: AWS Amplify Auth
- **Deployment**: AWS Amplify Hosting

## Getting Started

### Prerequisites

If your local machine has CLI issues, we recommend using **CodeSandbox** for browser-based development:

### Option 1: CodeSandbox Setup (Recommended)

1. Go to [CodeSandbox](https://codesandbox.io)
2. Click "Create Sandbox" → "Import from GitHub" or "Upload Files"
3. Upload the BrooBot folder
4. CodeSandbox will automatically:
   - Detect the project type
   - Install dependencies
   - Start the dev server

### Option 2: Local Development (with CLI dev tools)

1. Navigate to the project directory:
```bash
cd ~/Desktop/BrooBot
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```env
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open your browser to `http://localhost:3000`

## Project Structure

```
BrooBot/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ErrorBoundary.tsx
│   │   ├── MessageInput.tsx
│   │   ├── MessageItem.tsx
│   │   ├── MessageList.tsx
│   │   ├── ModeSelector.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── Sidebar.tsx
│   ├── contexts/          # React Context providers
│   │   ├── AppContext.tsx
│   │   ├── AuthContext.tsx
│   │   └── ChatContext.tsx
│   ├── pages/             # Page components
│   │   ├── Chat.tsx
│   │   ├── SignIn.tsx
│   │   └── SignUp.tsx
│   ├── services/          # API services
│   │   └── chatService.ts
│   ├── styles/            # CSS files
│   │   ├── index.css
│   │   ├── App.css
│   │   ├── Auth.css
│   │   ├── Chat.css
│   │   └── ErrorBoundary.css
│   ├── types/             # TypeScript types
│   │   ├── index.ts
│   │   └── auth.ts
│   ├── App.tsx            # Main App component
│   ├── main.tsx           # Entry point
│   └── vite-env.d.ts      # Vite type definitions
├── .env.example           # Environment variables template
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Development Workflow

### Testing the Application

1. **Sign Up/Sign In**
   - Navigate to `/signin` or `/signup`
   - Use any email/password (mock auth for development)
   - Google OAuth button is ready for Amplify integration

2. **Test Buddy Mode**
   - Default mode when you sign in
   - Type any question
   - Get simulated AI responses

3. **Test AI Tool Assistant**
   - Switch mode using top selector
   - Ask about AI tools for specific tasks
   - View tool recommendations with links

4. **Test Deep Research Mode**
   - Switch to Research mode
   - Ask a research question
   - View simulated research results with sources

### Current State (Mock Mode)

The application currently runs in **development/mock mode** with:
- ✅ Full UI implemented
- ✅ All three modes functional
- ✅ Mock authentication (localStorage)
- ✅ Simulated AI responses
- ⚠️ Ready for Claude API integration
- ⚠️ Ready for AWS Amplify Auth integration
- ⚠️ Ready for web scraping backend

## Next Steps for Production

### 1. Integrate Claude API

Update `src/services/chatService.ts`:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
});

export const sendChatMessage = async (request: ChatCompletionRequest) => {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: request.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
  });

  return {
    message: {
      id: response.id,
      role: 'assistant',
      content: response.content[0].text,
      timestamp: new Date(),
      mode: request.mode,
    },
    sessionId: request.sessionId || '',
  };
};
```

### 2. Set Up AWS Amplify Auth

```bash
# Install Amplify CLI (if not already installed)
npm install -g @aws-amplify/cli

# Initialize Amplify in your project
amplify init

# Add authentication
amplify add auth

# Configure Google OAuth
amplify update auth

# Push to AWS
amplify push
```

Then update `src/contexts/AuthContext.tsx` to use real Amplify Auth.

### 3. Create Backend for Deep Research

Set up AWS Lambda functions for:
- Web scraping (Puppeteer/Playwright)
- Document generation (PDF, PPTX, DOCX)
- Image generation integration
- Multi-agent research orchestration

### 4. Deploy to AWS Amplify

```bash
# Connect to Amplify Console (web UI preferred)
# OR use CLI

amplify add hosting

amplify publish
```

Alternatively, use the Amplify Console:
1. Go to AWS Amplify Console
2. Click "New App" → "Host Web App"
3. Connect your Git repository
4. Configure build settings (auto-detected from package.json)
5. Deploy

## Environment Variables

Required environment variables (`.env` file):

```env
# Anthropic Claude API
VITE_ANTHROPIC_API_KEY=sk-ant-xxx

# AWS Amplify (auto-generated after amplify init)
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=us-east-1_xxx
VITE_AWS_USER_POOL_WEB_CLIENT_ID=xxx

# API Endpoints
VITE_API_ENDPOINT=https://your-api.amazonaws.com

# App Configuration
VITE_APP_NAME=BrooBot
VITE_APP_VERSION=1.0.0
```

## Build for Production

```bash
# Type check
npm run type-check

# Build
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### CodeSandbox Issues

1. **Dependencies not installing**: Refresh the sandbox
2. **Port already in use**: CodeSandbox handles this automatically
3. **Hot reload not working**: Restart the dev server from the sidebar

### Local Development Issues

1. **CLI commands failing**: Use CodeSandbox instead
2. **TypeScript errors**: Run `npm run type-check` to see details
3. **Port 3000 in use**: Change port in `vite.config.ts`

## Features Roadmap

- [ ] Real Claude API integration
- [ ] AWS Amplify Auth integration
- [ ] Web scraping backend
- [ ] Document generation (PDF, PPTX, DOCX)
- [ ] Image generation
- [ ] Voice input/output
- [ ] Chat export functionality
- [ ] Advanced search in chat history
- [ ] Team collaboration features
- [ ] Custom AI tool database

## Contributing

This is a production-ready foundation. To contribute:

1. Create a new branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Proprietary - All rights reserved

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the code comments
3. Contact the development team

---

**Built with ❤️ for intelligent productivity**
