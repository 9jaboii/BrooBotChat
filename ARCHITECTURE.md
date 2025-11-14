# 🏗️ BrooBot Architecture Documentation

## Overview

This document describes the architectural patterns and consistency rules for BrooBot to prevent breaking changes and ensure maintainability.

---

## 🎯 Core Principles

### 1. **Consistent Message Format**
All messages follow a strict structure across frontend and backend.

### 2. **Error Handling Hierarchy**
Errors are caught, normalized, and handled consistently at every layer.

### 3. **Type Safety**
TypeScript types enforce contracts between frontend and backend.

### 4. **Graceful Degradation**
System falls back to mock mode if APIs are unavailable.

### 5. **Validation Everywhere**
Input validation at API boundaries prevents cascading failures.

---

## 📋 Message Structure (CONTRACT)

This is the **single source of truth** for message format:

```typescript
interface Message {
  id: string;                    // Format: msg_{timestamp}_{random}
  role: 'user' | 'assistant';    // Message sender
  content: string;               // Message text (markdown supported)
  timestamp: Date;               // ISO 8601 string from backend → Date in frontend
  mode: AppMode;                 // Current AI mode
  metadata?: MessageMetadata;    // Optional additional data
}
```

### Backend Response Format

```javascript
{
  message: {
    id: "msg_1234567890_abc123",
    role: "assistant",
    content: "Response text...",
    timestamp: "2025-11-13T19:00:00.000Z",  // ISO 8601 string
    mode: "buddy",
    metadata: { /* optional */ }
  },
  sessionId: "session-123",
  usage: { /* optional */ }
}
```

### Frontend Normalization

```typescript
// Frontend MUST normalize backend responses
const normalizedMessage = {
  ...backendMessage,
  id: backendMessage.id || generateId(),
  timestamp: new Date(backendMessage.timestamp),  // Convert string → Date
  metadata: backendMessage.metadata || {}
};
```

---

## 🔧 Utility Functions (MUST USE)

### Backend: `utils/helpers.js`

```javascript
import { formatMessageResponse } from '../utils/helpers.js';

// ✅ CORRECT - Use helper
const message = formatMessageResponse(content, mode, metadata);

// ❌ WRONG - Don't create manually
const message = {
  id: `msg_${Date.now()}`,  // Inconsistent format
  role: 'assistant',
  // Missing required fields...
};
```

### Frontend: `utils/apiHelpers.ts`

```typescript
import { normalizeMessage, extractErrorMessage } from '@/utils/apiHelpers';

// ✅ CORRECT - Normalize backend response
const message = normalizeMessage(backendResponse.message);

// ❌ WRONG - Direct use without validation
const message = backendResponse.message;  // Might be missing fields!
```

---

## 🛡️ Error Handling Pattern

### 1. Backend Error Handling

```javascript
// api/chat.js
try {
  const result = await handleBuddyMode(messages, userId, sessionId);
  res.json(result);
} catch (error) {
  console.error('[CHAT API] Error:', error);
  res.status(500).json({
    error: 'Failed to process chat request',
    message: error.message
  });
}
```

### 2. Service Layer Error Handling

```javascript
// services/buddyMode.js
try {
  const response = await anthropic.messages.create({...});
  return { message: formatMessageResponse(...) };
} catch (error) {
  console.error('[BUDDY MODE] Error:', error);

  // Fallback to mock on errors
  if (error.status === 429 || !anthropic) {
    return handleBuddyModeMock(messages, userId, sessionId);
  }

  throw error;
}
```

### 3. Frontend Error Handling

```typescript
// services/chatService.ts
try {
  const response = await retryRequest(
    () => chatAPI.sendMessage(request),
    2,  // Retry twice
    1000  // 1 second delay
  );

  return { message: normalizeMessage(response.message) };
} catch (error) {
  const errorMessage = extractErrorMessage(error);

  // Fallback to mock if backend unavailable
  if (error.code === 'ERR_NETWORK') {
    return await simulateAIResponse(request);
  }

  throw new Error(errorMessage);
}
```

---

## 🔄 API Request Flow

```
User Action
    ↓
Frontend Component (Chat.tsx)
    ↓
Service Layer (chatService.ts)
    ├─→ Validate Request (apiHelpers.validateChatRequest)
    ├─→ Add Retry Logic (apiHelpers.retryRequest)
    └─→ Make API Call
            ↓
Backend API (api/chat.js)
    ├─→ Authenticate (middleware/auth.js)
    ├─→ Validate Request
    └─→ Route to Service
            ↓
Service Layer (services/buddyMode.js)
    ├─→ Call External API (Claude)
    ├─→ Format Response (helpers.formatMessageResponse)
    └─→ Handle Errors (fallback to mock)
            ↓
Backend Response
    ↓
Frontend Service (chatService.ts)
    ├─→ Normalize Response (apiHelpers.normalizeMessage)
    ├─→ Validate Response
    └─→ Return to Component
            ↓
UI Update
```

---

## 🚨 Common Errors & Prevention

### Error 1: Port Already in Use

**Cause**: Backend server already running or port not released

**Prevention**:
```bash
# Use the startup script
./backend/start.sh

# Or check manually
lsof -ti:3001 | xargs kill -9
```

**Fix**: Created `backend/start.sh` that automatically handles this

---

### Error 2: Missing Message ID

**Cause**: Backend not using `formatMessageResponse` helper

**Prevention**:
```javascript
// ❌ WRONG
return { message: { role: 'assistant', content: '...' } };

// ✅ CORRECT
return { message: formatMessageResponse(content, mode, metadata) };
```

**Fix**: All backend services now use helper function

---

### Error 3: Timestamp Format Mismatch

**Cause**: Backend sends string, frontend expects Date

**Prevention**:
```typescript
// Backend sends ISO string
timestamp: new Date().toISOString()

// Frontend normalizes to Date object
timestamp: new Date(backendMessage.timestamp)
```

**Fix**: `normalizeMessage` helper handles conversion

---

### Error 4: Undefined Metadata

**Cause**: Frontend assumes metadata exists

**Prevention**:
```typescript
// ❌ WRONG
const sources = message.metadata.sources;  // Crash if undefined!

// ✅ CORRECT
const sources = message.metadata?.sources || [];
```

**Fix**: All messages default `metadata: {}` in helpers

---

## 📝 Development Checklist

When adding new features, ensure:

### Backend Changes
- [ ] Use `formatMessageResponse` for all message creation
- [ ] Use `validateRequest` for input validation
- [ ] Add try-catch blocks with proper error messages
- [ ] Log errors with context: `console.error('[SERVICE] Error:', error)`
- [ ] Provide fallback/mock mode when possible
- [ ] Return consistent response format

### Frontend Changes
- [ ] Use `normalizeMessage` for all backend responses
- [ ] Use `extractErrorMessage` for error handling
- [ ] Use `retryRequest` for network calls
- [ ] Validate requests before sending
- [ ] Handle backend unavailable gracefully
- [ ] Update TypeScript types if changing contracts

### Testing
- [ ] Test with backend running
- [ ] Test with backend stopped (should fallback to mock)
- [ ] Test with invalid API keys (should handle errors)
- [ ] Test with network errors (should retry)
- [ ] Check all three AI modes
- [ ] Verify message format consistency

---

## 🔐 Type Safety Rules

### 1. Never Use `any` for Messages

```typescript
// ❌ WRONG
const message: any = backendResponse.message;

// ✅ CORRECT
const message: Message = normalizeMessage(backendResponse.message);
```

### 2. Always Validate External Data

```typescript
// Backend responses are "unknown" until validated
const validated = normalizeMessage(unknownData);
```

### 3. Use Type Guards

```typescript
function isMessage(obj: any): obj is Message {
  return obj &&
    typeof obj.id === 'string' &&
    typeof obj.role === 'string' &&
    typeof obj.content === 'string' &&
    obj.timestamp instanceof Date &&
    typeof obj.mode === 'string';
}
```

---

## 📦 Module Organization

```
backend/
├── server.js              # Entry point
├── api/                   # Route handlers
│   ├── chat.js           # Use helpers & validation
│   └── tools.js          # Use helpers & validation
├── services/              # Business logic
│   ├── buddyMode.js      # Use formatMessageResponse
│   ├── toolSearch.js     # Pure functions
│   └── deepResearch.js   # Use formatMessageResponse
├── middleware/            # Cross-cutting concerns
│   └── auth.js           # Authentication
└── utils/                 # Shared utilities
    └── helpers.js        # ⭐ MUST USE for messages

frontend/
├── src/
│   ├── services/          # API layer
│   │   └── chatService.ts # Use apiHelpers
│   ├── utils/             # Shared utilities
│   │   └── apiHelpers.ts  # ⭐ MUST USE for responses
│   ├── components/        # UI components
│   ├── contexts/          # State management
│   └── types/             # TypeScript definitions
```

---

## 🎯 Key Takeaways

1. **Always use helper functions** - Don't create messages manually
2. **Validate at boundaries** - API endpoints and responses
3. **Normalize external data** - Backend responses → Frontend types
4. **Handle errors gracefully** - Provide fallbacks
5. **Log with context** - Include service name in logs
6. **Test both modes** - Real API + Mock/Fallback
7. **Follow TypeScript types** - They define the contract

---

## 🚀 Quick Reference

### Backend Message Creation
```javascript
import { formatMessageResponse } from '../utils/helpers.js';
const message = formatMessageResponse(content, mode, metadata);
```

### Frontend Message Normalization
```typescript
import { normalizeMessage } from '@/utils/apiHelpers';
const message = normalizeMessage(backendResponse.message);
```

### Error Handling
```typescript
import { extractErrorMessage } from '@/utils/apiHelpers';
const errorMsg = extractErrorMessage(error);
```

### Request Validation
```typescript
import { validateChatRequest } from '@/utils/apiHelpers';
const { valid, error } = validateChatRequest(messages, mode);
```

### Retry Logic
```typescript
import { retryRequest } from '@/utils/apiHelpers';
const result = await retryRequest(() => apiCall(), 2, 1000);
```

---

## 🔧 Maintenance

### When Updating Message Format

1. Update TypeScript types in `src/types/index.ts`
2. Update `formatMessageResponse` in `backend/utils/helpers.js`
3. Update `normalizeMessage` in `src/utils/apiHelpers.ts`
4. Run tests to catch breaking changes
5. Update this documentation

### When Adding New API Endpoints

1. Use `validateRequest` helper
2. Use `formatMessageResponse` or appropriate helper
3. Add proper error handling
4. Log with service context
5. Update API documentation

---

## 📚 Related Documents

- `BACKEND_SETUP_GUIDE.md` - Setup instructions
- `TROUBLESHOOTING.md` - Common issues
- `WHATS_NEXT.md` - Feature roadmap
- `src/types/index.ts` - Type definitions

---

**Last Updated**: 2025-11-13
**Version**: 1.1.0
**Status**: ✅ Consistent Architecture Implemented
