import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { handleBuddyMode } from '../services/buddyMode.js';
import { performDeepResearch } from '../services/deepResearch.js';
import { validateRequest, formatMessageResponse, errorResponse } from '../utils/helpers.js';

const router = express.Router();

/**
 * POST /api/chat
 * Main chat endpoint - routes to appropriate mode handler
 */
router.post('/chat', authenticate, async (req, res) => {
  try {
    const { messages, mode, sessionId } = req.body;
    const userId = req.user.id;

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!mode) {
      return res.status(400).json({ error: 'Mode is required' });
    }

    console.log(`[CHAT API] User: ${userId}, Mode: ${mode}, Session: ${sessionId}`);

    let response;

    // Route to appropriate mode handler
    switch (mode) {
      case 'buddy':
        response = await handleBuddyMode(messages, userId, sessionId);
        break;

      case 'deep_research':
        // Extract the user's query from the last message
        const userQuery = messages[messages.length - 1]?.content || '';
        const researchResult = await performDeepResearch(userQuery, {
          maxSources: 5,
          outputFormats: ['markdown']
        });

        // Format as a chat message
        response = {
          message: formatMessageResponse(
            researchResult.report,
            'deep_research',
            {
              sources: researchResult.sources,
              ...researchResult.metadata
            }
          ),
          sessionId
        };
        break;

      case 'ai_tool_assistant':
        // This mode is handled by the /api/tools/search endpoint
        // But we can provide a helpful redirect message here
        return res.status(400).json({
          error: 'AI Tool Assistant uses /api/tools/search endpoint',
          hint: 'Use POST /api/tools/search with { query: "your search" }'
        });

      default:
        return res.status(400).json({
          error: 'Invalid mode',
          validModes: ['buddy', 'ai_tool_assistant', 'deep_research']
        });
    }

    res.json(response);

  } catch (error) {
    console.error('[CHAT API] Error:', error);

    res.status(500).json({
      error: 'Failed to process chat request',
      message: error.message
    });
  }
});

/**
 * GET /api/chat/modes
 * Get information about available chat modes
 */
router.get('/chat/modes', (req, res) => {
  res.json({
    modes: [
      {
        id: 'buddy',
        name: 'Buddy Mode',
        description: 'General conversational AI for all your questions',
        icon: '💬',
        features: ['General chat', 'Writing help', 'Coding assistance', 'Learning support']
      },
      {
        id: 'ai_tool_assistant',
        name: 'AI Tool Assistant',
        description: 'Find the perfect AI tools for your needs',
        icon: '🔧',
        features: ['Tool recommendations', 'Free & paid options', 'Direct links', 'Ratings & reviews']
      },
      {
        id: 'deep_research',
        name: 'Deep Research',
        description: 'AI-powered web research with cited sources',
        icon: '🔍',
        features: ['Web scraping', 'Source citations', 'Comprehensive reports', 'Export options']
      }
    ]
  });
});

export default router;
