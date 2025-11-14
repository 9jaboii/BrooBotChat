import { AI_TOOLS } from '../data/aiTools.js';

/**
 * Find relevant AI tools using keyword matching
 * Cost: $0 (No API calls - pure algorithmic search!)
 */
export function findRelevantTools(userQuery, options = {}) {
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

  // Score each tool based on relevance
  const scoredTools = AI_TOOLS.map(tool => {
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

    // 8. Rating bonus (slight boost for highly rated tools)
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

    response += `### ${index + 1}. ${tool.name} ${freeText}${price}\n`;
    response += `${tool.description}\n\n`;
    response += `**Best for:** ${tool.useCases.slice(0, 3).join(', ')}\n`;
    response += `**Rating:** ${'⭐'.repeat(Math.floor(tool.rating))} ${tool.rating}/5\n`;
    response += `**Link:** [Visit ${tool.name}](${tool.url})\n\n`;

    if (tool.freeTier) {
      response += `✨ **Free tier:** ${tool.freeTier.features.slice(0, 2).join(', ')}\n\n`;
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
