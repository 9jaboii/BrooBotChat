import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization - create client when needed, not at module load time
let anthropicClient = null;

function getAnthropicClient() {
  const USE_MOCK = process.env.USE_MOCK_MODE === 'true';

  if (USE_MOCK || !process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    console.log('[DEEP RESEARCH] Anthropic client initialized');
  }

  return anthropicClient;
}

/**
 * Perform deep research using web scraping + Claude synthesis
 * Cost: ~$0.02-0.05 per research (within free API tiers)
 */
export async function performDeepResearch(query, options = {}) {
  const {
    maxSources = 5,
    outputFormats = ['markdown'],
    depth = 'standard'
  } = options;

  try {
    console.log(`[DEEP RESEARCH] Starting research for: "${query}"`);

    // Stage 1: Search for sources
    console.log('[DEEP RESEARCH] Stage 1: Searching for sources...');
    const searchResults = await searchWeb(query, maxSources);

    if (searchResults.length === 0) {
      throw new Error('No search results found');
    }

    // Stage 2: Scrape content from sources
    console.log(`[DEEP RESEARCH] Stage 2: Scraping ${searchResults.length} sources...`);
    const scrapedContent = await scrapeMultipleSources(searchResults);

    if (scrapedContent.length === 0) {
      throw new Error('Failed to scrape any content');
    }

    // Stage 3: Synthesize research with Claude
    console.log('[DEEP RESEARCH] Stage 3: Synthesizing research...');
    const synthesis = await synthesizeResearch(query, scrapedContent);

    console.log('[DEEP RESEARCH] Research completed successfully');

    return {
      query,
      report: synthesis.report,
      sources: scrapedContent.map(s => ({
        title: s.title,
        url: s.url,
        excerpt: s.content.slice(0, 200) + '...'
      })),
      metadata: {
        sourcesScraped: scrapedContent.length,
        model: synthesis.model,
        usage: synthesis.usage,
        cost: synthesis.cost
      }
    };
  } catch (error) {
    console.error('[DEEP RESEARCH] Error:', error);

    // Fallback to mock research
    const USE_MOCK = process.env.USE_MOCK_MODE === 'true';
    if (!getAnthropicClient() || USE_MOCK || error.status === 429) {
      console.log('[DEEP RESEARCH] Falling back to mock research');
      return performMockResearch(query);
    }

    throw error;
  }
}

/**
 * Search the web using Serper API (free tier: 2,500/month)
 * Falls back to Jina Search if Serper not available
 */
async function searchWeb(query, numResults = 5) {
  // Try Serper API first
  if (process.env.SERPER_API_KEY) {
    try {
      console.log('[SEARCH] Using Serper API...');
      const response = await axios.post(
        'https://google.serper.dev/search',
        {
          q: query,
          num: numResults,
          gl: 'us',
          hl: 'en'
        },
        {
          headers: {
            'X-API-KEY': process.env.SERPER_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      return response.data.organic.map(result => ({
        title: result.title,
        url: result.link,
        snippet: result.snippet
      }));
    } catch (error) {
      console.error('[SEARCH] Serper API error:', error.message);
    }
  }

  // Fallback: Use mock search results
  console.log('[SEARCH] Using mock search results');
  return getMockSearchResults(query, numResults);
}

/**
 * Scrape multiple sources using Jina Reader (FREE, no API key needed!)
 */
async function scrapeMultipleSources(sources) {
  const scrapePromises = sources.map(async (source) => {
    try {
      console.log(`[SCRAPE] Scraping: ${source.url}`);

      // Use Jina Reader API (free, no auth needed!)
      const response = await axios.get(
        `https://r.jina.ai/${encodeURIComponent(source.url)}`,
        {
          headers: {
            'Accept': 'application/json',
            'X-Return-Format': 'text'
          },
          timeout: 15000
        }
      );

      const content = response.data.data?.content || response.data.content || response.data || '';

      console.log(`[SCRAPE] ✓ Success: ${source.url} (${content.length} chars)`);

      return {
        title: source.title,
        url: source.url,
        content: content.slice(0, 5000), // Limit to 5000 chars per source
        success: true
      };
    } catch (error) {
      console.error(`[SCRAPE] ✗ Failed: ${source.url} - ${error.message}`);

      // Fallback to snippet
      return {
        title: source.title,
        url: source.url,
        content: source.snippet,
        success: false
      };
    }
  });

  const results = await Promise.all(scrapePromises);
  return results.filter(r => r.content && r.content.length > 100);
}

/**
 * Synthesize research using Claude
 */
async function synthesizeResearch(query, sources) {
  const anthropic = getAnthropicClient();

  if (!anthropic) {
    return synthesizeMockResearch(query, sources);
  }

  const sourcesText = sources.map((source, i) => `
## Source ${i + 1}: ${source.title}
URL: ${source.url}

${source.content.slice(0, 3000)}${source.content.length > 3000 ? '\n...(content truncated)' : ''}
`).join('\n\n---\n\n');

  const prompt = `Research Query: "${query}"

You are a research assistant. Synthesize the following sources into a comprehensive research report.

Sources:
${sourcesText}

Create a well-structured research report with:

1. **Executive Summary** (2-3 sentences highlighting key findings)
2. **Key Findings** (4-6 bullet points of main discoveries)
3. **Detailed Analysis** (2-4 paragraphs exploring the topic in depth)
4. **Insights & Implications** (1-2 paragraphs on what this means)
5. **Conclusion** (1 paragraph summarizing everything)
6. **Sources** (numbered list of all sources used)

Throughout the report, cite sources using [1], [2], etc. Format in clean Markdown.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 4096,
    temperature: 0.3,
    messages: [{ role: 'user', content: prompt }]
  });

  const cost = (response.usage.input_tokens * 3 / 1_000_000) +
               (response.usage.output_tokens * 15 / 1_000_000);

  console.log(`[SYNTHESIS] Cost: $${cost.toFixed(4)}, Tokens: ${response.usage.input_tokens + response.usage.output_tokens}`);

  return {
    report: response.content[0].text,
    model: 'claude-3-sonnet',
    usage: response.usage,
    cost
  };
}

/**
 * Mock search results for testing
 */
function getMockSearchResults(query, num = 5) {
  return [
    {
      title: `Understanding ${query} - Comprehensive Guide`,
      url: `https://example.com/${query.toLowerCase().replace(/\s+/g, '-')}`,
      snippet: `A detailed exploration of ${query} covering all the essential aspects you need to know.`
    },
    {
      title: `${query}: Best Practices and Tips`,
      url: `https://example.org/best-practices-${query.toLowerCase().replace(/\s+/g, '-')}`,
      snippet: `Learn the best practices and expert tips for ${query} in this comprehensive guide.`
    },
    {
      title: `The Ultimate Guide to ${query}`,
      url: `https://example.net/ultimate-guide-${query.toLowerCase().replace(/\s+/g, '-')}`,
      snippet: `Everything you need to know about ${query} from basics to advanced concepts.`
    }
  ].slice(0, num);
}

/**
 * Mock research for testing without APIs
 */
function performMockResearch(query) {
  const mockSources = getMockSearchResults(query, 3);

  return {
    query,
    report: `# Research Report: ${query}

**[MOCK MODE]** This is a mock research report. To enable real research:
1. Add ANTHROPIC_API_KEY to your .env file
2. (Optional) Add SERPER_API_KEY for better search results
3. Restart the backend server

## Executive Summary

This research explores ${query} and its various aspects. The findings indicate that this is an important topic with multiple dimensions worth exploring.

## Key Findings

- ${query} is a complex topic with multiple perspectives
- There are various approaches to understanding ${query}
- Expert opinions vary on different aspects of ${query}
- Recent developments have added new dimensions to ${query}

## Detailed Analysis

The topic of ${query} has gained significant attention in recent times. Multiple factors contribute to its importance and relevance in today's context.

Research indicates that ${query} encompasses various elements that need to be considered holistically. The interconnected nature of these elements makes it essential to approach the topic systematically.

## Insights & Implications

Understanding ${query} has practical implications for various stakeholders. The insights gained from this research can inform decision-making and strategy development.

## Conclusion

${query} remains an important area for continued exploration and research. The complexity of the topic necessitates ongoing investigation and analysis.

## Sources

[1] Understanding ${query} - Comprehensive Guide (example.com)
[2] ${query}: Best Practices and Tips (example.org)
[3] The Ultimate Guide to ${query} (example.net)

---

**Note:** This is a mock report. Configure Claude API for real research synthesis.`,
    sources: mockSources.map(s => ({
      title: s.title,
      url: s.url,
      excerpt: s.snippet
    })),
    metadata: {
      sourcesScraped: mockSources.length,
      model: 'mock',
      isMock: true,
      usage: { input_tokens: 0, output_tokens: 0 },
      cost: 0
    }
  };
}

/**
 * Mock synthesis when API not available
 */
function synthesizeMockResearch(query, sources) {
  const sourcesText = sources.map((s, i) => `[${i + 1}] ${s.title} (${s.url})`).join('\n');

  return {
    report: `# Research Report: ${query}

**[MOCK MODE - API KEY REQUIRED]** Real synthesis requires Claude API.

## Sources Found

${sourcesText}

## Content Collected

Successfully scraped ${sources.length} sources with a total of ${sources.reduce((sum, s) => sum + s.content.length, 0)} characters of content.

To get AI-synthesized research, add your ANTHROPIC_API_KEY to the .env file and restart the server.`,
    model: 'mock',
    usage: { input_tokens: 0, output_tokens: 0 },
    cost: 0
  };
}
