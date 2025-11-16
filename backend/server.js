// IMPORTANT: Load environment variables FIRST, before any other imports
// that might need to access process.env
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import chatRouter from './api/chat.js';
import toolsRouter from './api/tools.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - Allow multiple origins (development, Amplify, and custom domain)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://main.d30xhrarb6l9rh.amplifyapp.com',
  'https://broobot.com',
  'https://www.broobot.com',
  process.env.FRONTEND_URL,
  process.env.CUSTOM_DOMAIN_URL
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      console.warn(`[CORS] Allowed origins:`, allowedOrigins);
      // Temporarily allow all origins for debugging - REMOVE IN PRODUCTION
      callback(null, true);
    }
  },
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    mockMode: process.env.USE_MOCK_MODE === 'true'
  });
});

// API Routes
app.use('/api', chatRouter);
app.use('/api', toolsRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 BrooBot Backend Server Started!');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🤖 Claude API: ${process.env.ANTHROPIC_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🔍 Serper API: ${process.env.SERPER_API_KEY ? '✅ Configured' : '❌ Not configured (optional)'}`);
  console.log(`🎭 Mock Mode: ${process.env.USE_MOCK_MODE === 'true' ? '✅ Enabled' : '❌ Disabled'}`);
  console.log('\n📝 Available endpoints:');
  console.log('   GET  /health');
  console.log('   POST /api/chat');
  console.log('   POST /api/tools/search');
  console.log('\n');
});
