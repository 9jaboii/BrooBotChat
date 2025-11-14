import axios from 'axios';
import { AI_TOOLS } from '../data/aiTools.js';

// Cache for scraped tools from theresanaiforthat.com
let scrapedToolsCache = {
  tools: [],
  lastUpdated: null,
  TTL: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

/**
 * Scrape free AI tools from theresanaiforthat.com
 * Uses Jina Reader API to extract content
 */
async function scrapeLatestTools() {
  // Check cache first
  const now = Date.now();
  if (scrapedToolsCache.lastUpdated && (now - scrapedToolsCache.lastUpdated) < scrapedToolsCache.TTL) {
    console.log('[TOOL SCRAPER] Using cached tools');
    return scrapedToolsCache.tools;
  }

  try {
    console.log('[TOOL SCRAPER] Fetching latest free AI tools from theresanaiforthat.com...');

    const response = await axios.get(
      `https://r.jina.ai/${encodeURIComponent('https://theresanaiforthat.com/s/free/')}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Return-Format': 'text'
        },
        timeout: 15000
      }
    );

    const content = response.data.data?.content || response.data.content || response.data || '';

    // Parse the content to extract tools
    const tools = parseToolsFromContent(content);

    console.log(`[TOOL SCRAPER] ✓ Scraped ${tools.length} free AI tools`);

    // Update cache
    scrapedToolsCache = {
      tools,
      lastUpdated: now,
      TTL: scrapedToolsCache.TTL
    };

    return tools;
  } catch (error) {
    console.error('[TOOL SCRAPER] Failed to scrape tools:', error.message);
    // Return cached tools if available, or empty array
    return scrapedToolsCache.tools || [];
  }
}

/**
 * Parse scraped content to extract tool information
 */
function parseToolsFromContent(content) {
  const tools = [];

  try {
    // Split content into lines for parsing
    const lines = content.split('\n').filter(line => line.trim());

    // Look for tool entries (basic pattern matching)
    // theresanaiforthat.com typically lists tools with name, description, and tags
    let currentTool = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and headers
      if (!line || line.length < 10) continue;

      // Detect tool entries (heuristic: lines with URLs or certain keywords)
      if (line.includes('http') && !line.startsWith('#')) {
        // Save previous tool if exists
        if (currentTool && currentTool.name) {
          tools.push(formatScrapedTool(currentTool));
        }

        // Start new tool
        currentTool = {
          url: extractUrl(line),
          rawText: line,
          description: '',
          tags: []
        };
      } else if (currentTool) {
        // Accumulate description
        currentTool.description += ' ' + line;

        // Extract tags from text
        const foundTags = extractTags(line);
        currentTool.tags.push(...foundTags);
      }
    }

    // Add last tool
    if (currentTool && currentTool.name) {
      tools.push(formatScrapedTool(currentTool));
    }

    // If parsing failed, create generic entries from URLs found
    if (tools.length === 0) {
      const urlPattern = /https?:\/\/[^\s]+/g;
      const urls = content.match(urlPattern) || [];

      urls.slice(0, 20).forEach((url, idx) => {
        const name = extractToolNameFromUrl(url);
        if (name) {
          tools.push({
            id: `scraped_${Date.now()}_${idx}`,
            name,
            description: `Free AI tool from theresanaiforthat.com`,
            category: 'Free AI Tools',
            subcategories: ['Free', 'Trending'],
            url: url.replace(/[,;]$/, ''),
            isFree: true,
            freeTier: {
              features: ['Free tier available']
            },
            useCases: ['AI automation', 'Productivity'],
            tags: ['free', 'ai', 'latest'],
            rating: 4.0,
            isScraped: true
          });
        }
      });
    }

  } catch (error) {
    console.error('[TOOL SCRAPER] Parse error:', error.message);
  }

  return tools;
}

/**
 * Format scraped tool data to match our schema
 */
function formatScrapedTool(toolData) {
  const name = toolData.name || extractToolNameFromUrl(toolData.url) || 'Unknown Tool';

  return {
    id: `scraped_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: toolData.description.trim() || 'AI tool from theresanaiforthat.com',
    category: 'Free AI Tools',
    subcategories: ['Free', 'Trending'],
    url: toolData.url,
    isFree: true,
    freeTier: {
      features: ['Free tier available']
    },
    useCases: toolData.tags.slice(0, 5),
    tags: [...new Set(['free', 'latest', ...toolData.tags])],
    rating: 4.0,
    isScraped: true
  };
}

/**
 * Extract URL from text
 */
function extractUrl(text) {
  const urlMatch = text.match(/https?:\/\/[^\s,;)]+/);
  return urlMatch ? urlMatch[0] : '';
}

/**
 * Extract tool name from URL
 */
function extractToolNameFromUrl(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const name = domain.split('.')[0];
    // Capitalize first letter
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return null;
  }
}

/**
 * Extract tags from text
 */
function extractTags(text) {
  const tags = [];
  const commonTags = [
    'writing', 'coding', 'image', 'video', 'audio', 'design',
    'marketing', 'research', 'productivity', 'chatbot', 'generation',
    'analytics', 'automation', 'text', 'speech', 'translation'
  ];

  const lowerText = text.toLowerCase();
  commonTags.forEach(tag => {
    if (lowerText.includes(tag)) {
      tags.push(tag);
    }
  });

  return tags;
}

/**
 * Find relevant AI tools using keyword matching + live scraping
 * Cost: $0 (No API calls - uses free Jina Reader + algorithmic search!)
 */
export async function findRelevantTools(userQuery, options = {}) {
  const {
    limit = 5,
    categories = null,
    freeOnly = false,
    minRating = 0
  } = options;

  const queryLower = userQuery.toLowerCase();
  const queryWords = queryLower
    .split(/\s+/)
    .filter(word => word.length > 2);  // Ignore short words like 'an', 'is', etc.

  console.log(`[TOOL SEARCH] Query: "${userQuery}" | Words: ${queryWords.join(', ')}`);

  // Fetch latest scraped tools from theresanaiforthat.com
  const scrapedTools = await scrapeLatestTools();

  // Combine static database with scraped tools (scraped tools first for freshness)
  const allTools = [...scrapedTools, ...AI_TOOLS];

  console.log(`[TOOL SEARCH] Searching ${allTools.length} tools (${scrapedTools.length} scraped + ${AI_TOOLS.length} static)`);

  // Score each tool based on relevance
  const scoredTools = allTools.map(tool => {
    let score = 0;

    // 1. Exact name match (highest priority)
    if (tool.name.toLowerCase() === queryLower) {
      score += 50;
    } else if (tool.name.toLowerCase().includes(queryLower)) {
      score += 30;
    }

    // 2. Category match
    if (tool.category.toLowerCase().includes(queryLower)) {
      score += 25;
    }

    // 3. Subcategory matches
    tool.subcategories?.forEach(sub => {
      if (queryLower.includes(sub.toLowerCase()) || sub.toLowerCase().includes(queryLower)) {
        score += 15;
      }
    });

    // 4. Tag matches (very important!)
    tool.tags.forEach(tag => {
      // Exact tag match
      if (queryWords.includes(tag.toLowerCase())) {
        score += 12;
      }
      // Partial tag match
      queryWords.forEach(word => {
        if (tag.toLowerCase().includes(word) || word.includes(tag.toLowerCase())) {
          score += 6;
        }
      });
    });

    // 5. Use case matches
    tool.useCases?.forEach(useCase => {
      const useCaseLower = useCase.toLowerCase();
      queryWords.forEach(word => {
        if (useCaseLower.includes(word)) {
          score += 4;
        }
      });
    });

    // 6. Description match
    queryWords.forEach(word => {
      if (tool.description.toLowerCase().includes(word)) {
        score += 3;
      }
    });

    // 7. Boost for "free" keyword
    if (tool.isFree && queryWords.includes('free')) {
      score += 15;
    }

    // 8. MAJOR BOOST for free tools (prioritize free over paid)
    if (tool.isFree) {
      score += 20;  // Strong preference for free tools
    }

    // 9. Extra boost for scraped tools (fresh from theresanaiforthat.com)
    if (tool.isScraped) {
      score += 10;  // Prioritize latest tools from the website
    }

    // 10. Rating bonus (slight boost for highly rated tools)
    score += (tool.rating || 0) * 0.5;

    return { ...tool, relevanceScore: score };
  });

  // Filter tools with score > 0
  let results = scoredTools.filter(tool => tool.relevanceScore > 0);

  // Apply additional filters
  if (freeOnly) {
    results = results.filter(tool => tool.isFree);
  }
  if (minRating > 0) {
    results = results.filter(tool => (tool.rating || 0) >= minRating);
  }
  if (categories && categories.length > 0) {
    results = results.filter(tool => categories.includes(tool.category));
  }

  // Sort by relevance score (descending)
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Limit results
  const limitedResults = results.slice(0, limit);

  console.log(`[TOOL SEARCH] Found ${results.length} tools, returning top ${limitedResults.length}`);
  if (limitedResults.length > 0) {
    console.log(`[TOOL SEARCH] Top result: ${limitedResults[0].name} (score: ${limitedResults[0].relevanceScore.toFixed(1)})`);
  }

  return limitedResults;
}

/**
 * Get all available categories
 */
export function getCategories() {
  const categories = [...new Set(AI_TOOLS.map(tool => tool.category))];
  return categories.sort();
}

/**
 * Get tool by ID
 */
export function getToolById(id) {
  return AI_TOOLS.find(tool => tool.id === id);
}

/**
 * Format tool recommendations into a readable message
 */
export function formatToolRecommendations(query, tools) {
  if (tools.length === 0) {
    return `I couldn't find any AI tools matching "${query}". Try:\n- Being more specific (e.g., "image generation" instead of "images")\n- Using different keywords\n- Asking about a tool category (e.g., "writing tools", "coding assistants")`;
  }

  let response = `Based on your request for **"${query}"**, here are the best AI tools I found:\n\n`;

  tools.forEach((tool, index) => {
    const freeText = tool.isFree ? '🟢 **FREE**' : '🔵 **PAID**';
    const price = tool.paidTier?.price ? ` (${tool.paidTier.price})` : '';
    const latestBadge = tool.isScraped ? ' 🆕 **LATEST**' : '';

    response += `### ${index + 1}. ${tool.name} ${freeText}${price}${latestBadge}\n`;
    response += `${tool.description}\n\n`;
    response += `**Best for:** ${tool.useCases.slice(0, 3).join(', ')}\n`;
    response += `**Rating:** ${'⭐'.repeat(Math.floor(tool.rating))} ${tool.rating}/5\n`;
    response += `**Link:** [Visit ${tool.name}](${tool.url})\n\n`;

    if (tool.freeTier) {
      response += `✨ **Free tier:** ${tool.freeTier.features.slice(0, 2).join(', ')}\n\n`;
    }

    if (tool.isScraped) {
      response += `📌 **Source:** Fresh from theresanaiforthat.com\n\n`;
    }

    response += `---\n\n`;
  });

  response += `💡 **Tip:** Click any link above to visit the tool directly!`;

  return response;
}

/**
 * Get stats about the tool database
 */
export function getToolStats() {
  const totalTools = AI_TOOLS.length;
  const freeTools = AI_TOOLS.filter(t => t.isFree).length;
  const categories = getCategories();

  return {
    totalTools,
    freeTools,
    paidTools: totalTools - freeTools,
    categories: categories.length,
    categoryList: categories
  };
}
