import express from 'express';
import { optionalAuth } from '../middleware/auth.js';
import {
  findRelevantTools,
  formatToolRecommendations,
  getCategories,
  getToolById,
  getToolStats
} from '../services/toolSearch.js';

const router = express.Router();

/**
 * POST /api/tools/search
 * Search for AI tools based on query
 */
router.post('/tools/search', optionalAuth, async (req, res) => {
  try {
    const { query, limit, categories, freeOnly, minRating } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required' });
    }

    console.log(`[TOOL SEARCH API] Query: "${query}"`);

    // Find relevant tools (now async with live scraping)
    const tools = await findRelevantTools(query, {
      limit: limit || 5,
      categories,
      freeOnly,
      minRating
    });

    // Format into a readable message
    const formattedMessage = formatToolRecommendations(query, tools);

    // Return both tools array and formatted message
    res.json({
      query,
      tools,
      message: formattedMessage,
      totalFound: tools.length,
      metadata: {
        searchedAt: new Date().toISOString(),
        filters: {
          limit: limit || 5,
          freeOnly: freeOnly || false,
          minRating: minRating || 0,
          categories: categories || null
        }
      }
    });

  } catch (error) {
    console.error('[TOOL SEARCH API] Error:', error);
    res.status(500).json({
      error: 'Tool search failed',
      message: error.message
    });
  }
});

/**
 * GET /api/tools/categories
 * Get all available tool categories
 */
router.get('/tools/categories', (req, res) => {
  try {
    const categories = getCategories();
    res.json({
      categories,
      total: categories.length
    });
  } catch (error) {
    console.error('[TOOL CATEGORIES API] Error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

/**
 * GET /api/tools/:id
 * Get a specific tool by ID
 */
router.get('/tools/:id', (req, res) => {
  try {
    const { id } = req.params;
    const tool = getToolById(id);

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({ tool });
  } catch (error) {
    console.error('[TOOL GET API] Error:', error);
    res.status(500).json({ error: 'Failed to get tool' });
  }
});

/**
 * GET /api/tools/stats
 * Get statistics about the tool database
 */
router.get('/tools/stats', (req, res) => {
  try {
    const stats = getToolStats();
    res.json(stats);
  } catch (error) {
    console.error('[TOOL STATS API] Error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
