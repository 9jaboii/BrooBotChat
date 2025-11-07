# BrooBot Quick Start Guide

Get BrooBot running in under 5 minutes using CodeSandbox!

## 🚀 Fastest Way to Get Started (CodeSandbox)

### Step 1: Upload to CodeSandbox

1. Go to [codesandbox.io](https://codesandbox.io)
2. Sign in (free account)
3. Click "Import" → "From GitHub" or drag your BrooBot folder
4. Wait for CodeSandbox to load and install dependencies automatically

### Step 2: Run the App

CodeSandbox will automatically:
- Install all dependencies
- Start the dev server
- Open a preview window

**That's it!** You should now see the BrooBot sign-in page.

### Step 3: Test the Application

1. **Sign Up/Sign In**:
   - Click "Sign Up"
   - Enter any email (e.g., `test@example.com`)
   - Enter any password (min 8 characters)
   - Click "Sign Up"

2. **You're in!** You'll see the chat interface with three modes:

   **💬 Buddy Mode** (Default)
   - Type: "Hello, how are you?"
   - Get a friendly AI response

   **🔧 AI Tool Assistant**
   - Click the "AI Tool Assistant" mode button
   - Type: "I need a tool for image generation"
   - See AI tool recommendations with links

   **🔍 Deep Research**
   - Click the "Deep Research" mode button
   - Type: "Research the benefits of TypeScript"
   - Get a structured research response with sources

## 📱 Features You Can Test

### Chat Features
- ✅ Send messages
- ✅ View message history
- ✅ Switch between modes
- ✅ Create new chats
- ✅ View past conversations
- ✅ Auto-scrolling messages

### Authentication
- ✅ Sign up with email/password
- ✅ Sign in with existing account
- ✅ Sign out
- ✅ Protected routes
- ⚠️ Google OAuth (UI ready, needs Amplify setup)

### Three Modes
- ✅ Buddy Mode - General chat
- ✅ AI Tool Assistant - Tool recommendations
- ✅ Deep Research - Research with sources

## 🔧 Current Implementation Status

### ✅ Complete & Working
- React + TypeScript setup
- All three chat modes
- Authentication UI (mock backend)
- Chat interface with sidebar
- Session management
- Message history
- Responsive design
- Error boundaries
- Loading states

### ⚠️ Ready for Integration
- Claude API (mock responses now)
- AWS Amplify Auth (mock auth now)
- Web scraping backend
- Document generation
- Real database storage

## 🎨 Customization

### Change App Name
Edit `package.json`:
```json
{
  "name": "your-app-name"
}
```

### Change Colors
Edit `src/styles/index.css`:
```css
:root {
  --primary-color: #10a37f;  /* Change to your brand color */
  --secondary-color: #0084ff;
}
```

### Modify Mock Responses
Edit `src/services/chatService.ts`:
```typescript
const generateBuddyResponse = (userMessage: string): string => {
  // Customize your mock responses here
};
```

## 🐛 Common Issues

### Issue: Dependencies not installing
**Solution**: Refresh the CodeSandbox browser tab

### Issue: Preview not showing
**Solution**: Click the "Preview" tab or the external link icon

### Issue: TypeScript errors showing
**Solution**: This is normal in development. The app will still run.

### Issue: "Cannot find module" errors
**Solution**: CodeSandbox should auto-install. If not, check `package.json`

## 📊 Next Steps After Testing

### 1. Get Claude API Key
- Sign up at [anthropic.com](https://www.anthropic.com)
- Get API key
- Add to environment variables

### 2. Set Up AWS Account
- Create AWS account
- Access Amplify Console
- Prepare for deployment

### 3. Deploy to Production
- Follow `DEPLOYMENT_GUIDE.md`
- Use Amplify Console (no CLI needed)
- Add real authentication

### 4. Add Backend Services
- Web scraping Lambda function
- Document generation service
- Database for chat history

## 💡 Pro Tips

1. **Testing Different Modes**:
   - Each mode has unique UI elements
   - AI Tool Assistant shows tool cards
   - Deep Research shows sources
   - Try all three!

2. **Session Management**:
   - Create multiple chats
   - Switch between them
   - Delete old conversations

3. **Mobile Testing**:
   - CodeSandbox has mobile preview
   - Sidebar auto-hides on mobile
   - Responsive design works great

4. **Code Exploration**:
   - Start with `src/App.tsx`
   - Check out `src/pages/Chat.tsx`
   - Review `src/components/`

## 📚 Key Files to Understand

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main app with routing |
| `src/pages/Chat.tsx` | Main chat interface |
| `src/contexts/AuthContext.tsx` | Authentication logic |
| `src/contexts/ChatContext.tsx` | Chat state management |
| `src/services/chatService.ts` | API calls (mock for now) |
| `src/components/MessageItem.tsx` | Individual message display |
| `src/styles/Chat.css` | Chat interface styling |

## 🎯 Testing Checklist

- [ ] Sign up with new account
- [ ] Sign in with existing account
- [ ] Send message in Buddy Mode
- [ ] Switch to AI Tool Assistant
- [ ] Ask for tool recommendations
- [ ] Switch to Deep Research
- [ ] Ask research question
- [ ] Create new chat
- [ ] Switch between chats
- [ ] Delete a chat
- [ ] Sign out
- [ ] Sign back in
- [ ] Verify chat history persists
- [ ] Test on mobile preview
- [ ] Check responsive design

## 🚀 You're Ready!

Your BrooBot instance is now running! The app is in development mode with mock data, but all UI and features are fully functional.

When you're ready to go to production:
1. Follow the `DEPLOYMENT_GUIDE.md`
2. Integrate Claude API
3. Set up AWS Amplify Auth
4. Deploy to AWS

**Happy building!** 🎉
