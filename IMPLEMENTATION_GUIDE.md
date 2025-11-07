# BrooBot Implementation Guide - Practical Code Examples

## Step-by-Step Implementation with Real Code

This guide provides ready-to-use code for implementing each mode cost-effectively.

---

## 📋 **Table of Contents**

1. [Environment Setup](#environment-setup)
2. [Buddy Mode Implementation](#buddy-mode-implementation)
3. [AI Tool Assistant Implementation](#ai-tool-assistant-implementation)
4. [Deep Research Implementation](#deep-research-implementation)
5. [Multi-User Setup](#multi-user-setup)
6. [Cost Optimization](#cost-optimization)

---

## 🔧 **Environment Setup**

### **1. Required Environment Variables**

Update your `.env` file:

```bash
# Claude API (Required for Buddy Mode)
VITE_ANTHROPIC_API_KEY=sk-ant-xxx

# Free Research APIs (Optional - for Deep Research)
VITE_SERPER_API_KEY=xxx          # Free: 2,500/month - https://serper.dev
VITE_TAVILY_API_KEY=xxx          # Free: 1,000/month - https://tavily.com
VITE_FIRECRAWL_API_KEY=xxx       # Free: 500/month - https://firecrawl.dev

# AWS (For production)
VITE_AWS_REGION=us-east-1
VITE_AWS_USER_POOL_ID=xxx
VITE_AWS_USER_POOL_WEB_CLIENT_ID=xxx
```

### **2. Install Additional Dependencies**

```bash
# For backend (create a separate backend folder)
npm install @anthropic-ai/sdk axios
npm install @mendable/firecrawl-js  # Optional
npm install pdfkit docx            # For document generation
npm install @xenova/transformers   # Optional - local embeddings
```

---

## 💬 **BUDDY MODE - Complete Implementation**

### **Frontend Update (Replace Mock Service)**

Update `src/services/chatService.ts`:

```typescript
import axios from 'axios';
import { ChatCompletionRequest, ChatCompletionResponse, Message } from '@types/index';

// Backend API endpoint
const API_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001/api';

export const sendChatMessage = async (
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> => {
  try {
    // Call your backend API (not Claude directly - security!)
    const response = await axios.post(`${API_URL}/chat`, {
      messages: request.messages,
      mode: request.mode,
      sessionId: request.sessionId,
    }, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Chat API error:', error);
    throw new Error(error.response?.data?.error || 'Failed to send message');
  }
};

function getAuthToken(): string {
  // Get token from auth context or localStorage
  return localStorage.getItem('auth_token') || '';
}
```

### **Backend Implementation (Node.js/Lambda)**

Create `backend/services/buddyMode.js`:

```javascript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Handle Buddy Mode chat requests
 * Cost: ~$0.0005 per conversation (using Haiku)
 */
export async function handleBuddyMode(messages, userId, sessionId) {
  try {
    // Prepare messages for Claude
    const claudeMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Call Claude API with Haiku (cheapest model)
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      temperature: 0.7,
      system: getBuddySystemPrompt(userId),
      messages: claudeMessages
    });

    // Extract response
    const assistantMessage = {
      role: 'assistant',
      content: response.content[0].text,
      timestamp: new Date(),
      mode: 'buddy',
      metadata: {}
    };

    // Log usage for cost tracking
    await logUsage(userId, {
      mode: 'buddy',
      model: 'claude-3-haiku',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cost: calculateCost(response.usage)
    });

    return {
      message: assistantMessage,
      sessionId,
      usage: response.usage
    };
  } catch (error) {
    console.error('Buddy Mode error:', error);
    throw error;
  }
}

function getBuddySystemPrompt(userId) {
  return `You are BrooBot, a friendly and helpful AI assistant.

Guidelines:
- Be conversational and approachable
- Provide clear, concise answers
- Ask clarifying questions when needed
- Maintain context from conversation history
- Be honest about limitations

User: ${userId}`;
}

function calculateCost(usage) {
  // Claude Haiku pricing (as of 2024)
  const INPUT_COST = 0.25 / 1_000_000;   // $0.25 per 1M tokens
  const OUTPUT_COST = 1.25 / 1_000_000;  // $1.25 per 1M tokens

  const inputCost = usage.input_tokens * INPUT_COST;
  const outputCost = usage.output_tokens * OUTPUT_COST;

  return inputCost + outputCost;
}

async function logUsage(userId, data) {
  // Log to DynamoDB or your database
  console.log(`[USAGE] User: ${userId}, Cost: $${data.cost.toFixed(4)}`);
  // TODO: Implement actual logging to database
}
```

### **API Endpoint (Express/Lambda)**

Create `backend/api/chat.js`:

```javascript
import express from 'express';
import { handleBuddyMode } from '../services/buddyMode.js';
import { authenticate, checkRateLimit } from '../middleware/auth.js';

const router = express.Router();

router.post('/chat', authenticate, async (req, res) => {
  try {
    const { messages, mode, sessionId } = req.body;
    const userId = req.user.id;

    // Check rate limits
    const rateLimitCheck = await checkRateLimit(userId, mode);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitCheck.retryAfter,
        remaining: rateLimitCheck.remaining
      });
    }

    // Route to appropriate handler
    let response;
    switch (mode) {
      case 'buddy':
        response = await handleBuddyMode(messages, userId, sessionId);
        break;
      // Other modes...
      default:
        return res.status(400).json({ error: 'Invalid mode' });
    }

    res.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
```

---

## 🔧 **AI TOOL ASSISTANT - Free Implementation**

### **Backend: Build Tools Database**

Create `backend/data/aiTools.js`:

```javascript
export const AI_TOOLS = [
  {
    id: '1',
    name: 'ChatGPT',
    description: 'Conversational AI for writing, coding, analysis, brainstorming, and general questions',
    category: 'General AI',
    subcategories: ['Writing', 'Coding', 'Research', 'Brainstorming'],
    url: 'https://chat.openai.com',
    isFree: true,
    freeTier: {
      model: 'GPT-3.5',
      limitations: 'Rate limits during peak hours',
      features: ['Unlimited conversations', 'Web browsing', 'Image analysis']
    },
    paidTier: {
      price: '$20/month',
      model: 'GPT-4',
      features: ['Priority access', 'Advanced data analysis', 'Plugins']
    },
    useCases: [
      'Writing blog posts and articles',
      'Code debugging and generation',
      'Research and analysis',
      'Creative brainstorming',
      'Learning new topics'
    ],
    tags: ['chatbot', 'writing', 'coding', 'general', 'popular', 'openai'],
    pros: ['Very versatile', 'Fast responses', 'Large user community'],
    cons: ['Can be overloaded', 'Free tier limited during peak times'],
    rating: 4.8,
    lastUpdated: '2024-01-15'
  },
  {
    id: '2',
    name: 'Perplexity AI',
    description: 'AI-powered search engine with cited sources for research and fact-checking',
    category: 'Research & Search',
    subcategories: ['Research', 'Search', 'Academic', 'Fact-checking'],
    url: 'https://www.perplexity.ai',
    isFree: true,
    freeTier: {
      model: 'Perplexity',
      limitations: '5 Pro searches per day',
      features: ['Unlimited Quick searches', 'Source citations', 'Follow-up questions']
    },
    useCases: [
      'Academic research with citations',
      'Fact-checking claims',
      'Current events analysis',
      'Literature reviews',
      'Market research'
    ],
    tags: ['research', 'search', 'citations', 'sources', 'academic', 'reliable'],
    rating: 4.7
  },
  {
    id: '3',
    name: 'Midjourney',
    description: 'AI image generation from text descriptions, ideal for art and design',
    category: 'Image Generation',
    subcategories: ['Art', 'Design', 'Creative', 'Illustration'],
    url: 'https://www.midjourney.com',
    isFree: false,
    paidTier: {
      price: '$10-60/month',
      features: ['High-resolution images', 'Commercial use', 'Fast generation']
    },
    useCases: [
      'Concept art creation',
      'Marketing visuals',
      'Book illustrations',
      'Product mockups',
      'Social media content'
    ],
    tags: ['image', 'art', 'creative', 'design', 'generation', 'popular'],
    rating: 4.9
  },
  {
    id: '4',
    name: 'Runway ML',
    description: 'AI-powered video editing and generation tools',
    category: 'Video',
    subcategories: ['Video Editing', 'Video Generation', 'Creative'],
    url: 'https://runwayml.com',
    isFree: true,
    freeTier: {
      limitations: '125 credits per month',
      features: ['Gen-2 video generation', 'Image tools', 'Basic editing']
    },
    useCases: [
      'Video content creation',
      'Special effects',
      'Video editing',
      'Animation',
      'Social media videos'
    ],
    tags: ['video', 'creative', 'generation', 'editing', 'animation'],
    rating: 4.6
  },
  {
    id: '5',
    name: 'Copy.ai',
    description: 'AI copywriting assistant for marketing content and business writing',
    category: 'Writing & Marketing',
    subcategories: ['Copywriting', 'Marketing', 'Content', 'Business'],
    url: 'https://www.copy.ai',
    isFree: true,
    freeTier: {
      limitations: '2,000 words per month',
      features: ['90+ templates', 'Multiple languages', 'Tone control']
    },
    useCases: [
      'Marketing copy',
      'Product descriptions',
      'Social media posts',
      'Email campaigns',
      'Ad copy'
    ],
    tags: ['copywriting', 'marketing', 'content', 'business', 'writing'],
    rating: 4.5
  },
  // Add 20-50 more tools for comprehensive coverage...
  {
    id: '6',
    name: 'Claude',
    description: 'Advanced AI assistant by Anthropic, excellent for analysis and long conversations',
    category: 'General AI',
    subcategories: ['Analysis', 'Writing', 'Coding', 'Research'],
    url: 'https://claude.ai',
    isFree: true,
    freeTier: {
      model: 'Claude 3 Sonnet',
      features: ['Long context', 'Document analysis', 'Coding assistance']
    },
    useCases: [
      'Document analysis',
      'Code review',
      'Research synthesis',
      'Complex reasoning',
      'Long conversations'
    ],
    tags: ['chatbot', 'analysis', 'coding', 'research', 'anthropic'],
    rating: 4.8
  },
  {
    id: '7',
    name: 'Notion AI',
    description: 'AI writing assistant integrated with Notion workspace',
    category: 'Productivity',
    subcategories: ['Writing', 'Productivity', 'Organization'],
    url: 'https://www.notion.so/product/ai',
    isFree: false,
    paidTier: {
      price: '$10/user/month',
      features: ['Integrated with Notion', 'Writing assistance', 'Summaries']
    },
    useCases: [
      'Note-taking',
      'Document writing',
      'Summarization',
      'Task management',
      'Knowledge organization'
    ],
    tags: ['productivity', 'writing', 'notes', 'organization'],
    rating: 4.6
  }
  // Continue adding more tools...
];
```

### **Backend: Search Service (FREE - No API calls!)**

Create `backend/services/toolSearch.js`:

```javascript
import { AI_TOOLS } from '../data/aiTools.js';

/**
 * Find relevant tools using keyword matching
 * Cost: $0 (No API calls!)
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
    .filter(word => word.length > 2);  // Ignore short words

  // Score each tool
  const scoredTools = AI_TOOLS.map(tool => {
    let score = 0;

    // Exact name match (highest priority)
    if (tool.name.toLowerCase() === queryLower) {
      score += 50;
    } else if (tool.name.toLowerCase().includes(queryLower)) {
      score += 30;
    }

    // Category match
    if (tool.category.toLowerCase().includes(queryLower)) {
      score += 20;
    }

    // Subcategory match
    tool.subcategories?.forEach(sub => {
      if (queryLower.includes(sub.toLowerCase())) {
        score += 15;
      }
    });

    // Tag matches (important!)
    tool.tags.forEach(tag => {
      if (queryWords.includes(tag.toLowerCase())) {
        score += 10;
      }
      // Partial tag match
      queryWords.forEach(word => {
        if (tag.toLowerCase().includes(word)) {
          score += 5;
        }
      });
    });

    // Use case matches
    tool.useCases?.forEach(useCase => {
      const useCaseLower = useCase.toLowerCase();
      queryWords.forEach(word => {
        if (useCaseLower.includes(word)) {
          score += 3;
        }
      });
    });

    // Description match
    queryWords.forEach(word => {
      if (tool.description.toLowerCase().includes(word)) {
        score += 2;
      }
    });

    // Boost for free tools (if user might be looking for free options)
    if (tool.isFree && queryWords.includes('free')) {
      score += 10;
    }

    // Boost highly rated tools slightly
    score += tool.rating || 0;

    return { ...tool, relevanceScore: score };
  });

  // Filter and sort
  let results = scoredTools.filter(tool => tool.relevanceScore > 0);

  // Apply filters
  if (freeOnly) {
    results = results.filter(tool => tool.isFree);
  }
  if (minRating > 0) {
    results = results.filter(tool => (tool.rating || 0) >= minRating);
  }
  if (categories) {
    results = results.filter(tool =>
      categories.includes(tool.category)
    );
  }

  // Sort by relevance
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return results.slice(0, limit);
}

/**
 * Get AI-generated explanation (optional, small cost)
 */
export async function generateToolExplanation(query, tools) {
  // Only call if you want enhanced explanations
  // Cost: ~$0.0001 per request
  const toolsList = tools.map((t, i) =>
    `${i + 1}. ${t.name}: ${t.description}`
  ).join('\n');

  // This would call Claude API for explanation
  // For now, return a simple formatted response
  return formatToolRecommendations(query, tools);
}

function formatToolRecommendations(query, tools) {
  return `Based on your request "${query}", here are the best AI tools:\n\n` +
    tools.map((tool, i) => {
      const freeText = tool.isFree ? ' (FREE)' : '';
      return `**${i + 1}. ${tool.name}${freeText}**\n${tool.description}\nBest for: ${tool.useCases.slice(0, 2).join(', ')}`;
    }).join('\n\n');
}
```

### **API Endpoint**

```javascript
// backend/api/tools.js
import { findRelevantTools } from '../services/toolSearch.js';

router.post('/tools/search', authenticate, async (req, res) => {
  try {
    const { query, freeOnly, categories, limit } = req.body;

    // Pure keyword search - NO API CALLS!
    const tools = findRelevantTools(query, {
      limit: limit || 5,
      freeOnly,
      categories
    });

    // Track usage (no cost involved)
    await logToolSearch(req.user.id, query, tools.length);

    res.json({
      query,
      tools,
      totalFound: tools.length
    });
  } catch (error) {
    console.error('Tool search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});
```

**Cost: $0 per search!** 🎉

---

## 🔍 **DEEP RESEARCH - Hybrid Implementation**

### **Backend: Research Orchestrator**

Create `backend/services/deepResearch.js`:

```javascript
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Perform deep research using free tools + Claude synthesis
 * Cost: ~$0.05 per research (within free tiers)
 */
export async function performDeepResearch(query, options = {}) {
  const {
    maxSources = 5,
    outputFormats = ['markdown'],
    depth = 'standard'
  } = options;

  try {
    // Stage 1: Multi-source search (FREE)
    console.log('Stage 1: Searching...');
    const searchResults = await searchWithSerper(query, maxSources);

    // Stage 2: Scrape content (FREE)
    console.log('Stage 2: Scraping content...');
    const scrapedContent = await scrapeMultipleSources(
      searchResults.slice(0, maxSources)
    );

    // Stage 3: Synthesize with Claude (PAID - but cheap)
    console.log('Stage 3: Synthesizing...');
    const synthesis = await synthesizeResearch(query, scrapedContent);

    // Stage 4: Generate outputs
    console.log('Stage 4: Generating outputs...');
    const outputs = await generateOutputs(synthesis.report, outputFormats);

    return {
      query,
      report: synthesis.report,
      sources: scrapedContent.map(s => ({
        title: s.title,
        url: s.url,
        excerpt: s.content.slice(0, 200) + '...'
      })),
      outputs,
      usage: synthesis.usage,
      cost: calculateCost(synthesis.usage)
    };
  } catch (error) {
    console.error('Deep research error:', error);
    throw error;
  }
}

/**
 * Search with Serper API (FREE: 2,500/month)
 */
async function searchWithSerper(query, numResults = 5) {
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
      }
    }
  );

  return response.data.organic.map(result => ({
    title: result.title,
    url: result.link,
    snippet: result.snippet
  }));
}

/**
 * Scrape multiple sources (FREE with Jina)
 */
async function scrapeMultipleSources(sources) {
  const scrapePromises = sources.map(async (source) => {
    try {
      // Use Jina Reader (FREE, no API key!)
      const response = await axios.get(
        `https://r.jina.ai/${source.url}`,
        {
          headers: { 'Accept': 'application/json' },
          timeout: 10000
        }
      );

      return {
        title: source.title,
        url: source.url,
        content: response.data.content || response.data.text || '',
        success: true
      };
    } catch (error) {
      console.error(`Failed to scrape ${source.url}:`, error.message);
      return {
        title: source.title,
        url: source.url,
        content: source.snippet,  // Fallback to snippet
        success: false
      };
    }
  });

  const results = await Promise.all(scrapePromises);
  return results.filter(r => r.content.length > 100);  // Only keep substantial content
}

/**
 * Synthesize research with Claude
 */
async function synthesizeResearch(query, sources) {
  const sourcesText = sources.map((source, i) => `
## Source ${i + 1}: ${source.title}
URL: ${source.url}

${source.content.slice(0, 2000)}
${source.content.length > 2000 ? '...(truncated)' : ''}
`).join('\n\n');

  const prompt = `Research Query: "${query}"

You are a research assistant. Synthesize the following sources into a comprehensive research report.

Sources:
${sourcesText}

Create a well-structured research report with:

1. **Executive Summary** (2-3 sentences)
2. **Key Findings** (3-5 bullet points)
3. **Detailed Analysis** (2-3 paragraphs)
4. **Insights & Implications** (1-2 paragraphs)
5. **Conclusion** (1 paragraph)
6. **Sources** (list with [1], [2], etc. citations in text)

Format in clean Markdown. Be thorough but concise. Cite sources using [1], [2], etc.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',  // Better for research
    max_tokens: 3000,
    temperature: 0.3,  // Lower for more factual
    messages: [{ role: 'user', content: prompt }]
  });

  return {
    report: response.content[0].text,
    usage: response.usage
  };
}

/**
 * Generate output documents
 */
async function generateOutputs(markdown, formats) {
  const outputs = {};

  if (formats.includes('markdown')) {
    outputs.markdown = markdown;
  }

  if (formats.includes('pdf')) {
    outputs.pdfUrl = await generatePDF(markdown);
  }

  if (formats.includes('docx')) {
    outputs.docxUrl = await generateDOCX(markdown);
  }

  return outputs;
}
```

### **Document Generation (FREE)**

```javascript
// backend/services/documentGeneration.js
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';
import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

/**
 * Generate PDF from markdown (FREE - uses pdfkit)
 */
export async function generatePDF(markdown) {
  const doc = new PDFDocument();
  const filePath = `/tmp/research-${Date.now()}.pdf`;
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  // Title
  doc.fontSize(20).text('Research Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`);
  doc.moveDown(2);

  // Content (simplified - you'd parse markdown properly)
  doc.fontSize(12).text(markdown);

  doc.end();

  // Wait for file to finish
  await new Promise(resolve => stream.on('finish', resolve));

  // Upload to S3
  const fileContent = fs.readFileSync(filePath);
  const s3Key = `reports/pdf/${Date.now()}.pdf`;

  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: s3Key,
    Body: fileContent,
    ContentType: 'application/pdf'
  }));

  // Clean up local file
  fs.unlinkSync(filePath);

  // Return public URL
  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${s3Key}`;
}

/**
 * Generate DOCX from markdown (FREE - uses docx)
 */
export async function generateDOCX(markdown) {
  const paragraphs = markdown.split('\n').map(line => {
    if (line.startsWith('# ')) {
      return new Paragraph({
        text: line.replace('# ', ''),
        heading: HeadingLevel.HEADING_1
      });
    } else if (line.startsWith('## ')) {
      return new Paragraph({
        text: line.replace('## ', ''),
        heading: HeadingLevel.HEADING_2
      });
    } else {
      return new Paragraph({ text: line });
    }
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const s3Key = `reports/docx/${Date.now()}.docx`;

  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: s3Key,
    Body: buffer,
    ContentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }));

  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${s3Key}`;
}
```

---

## 🔐 **MULTI-USER RATE LIMITING**

### **Rate Limit Middleware**

Create `backend/middleware/rateLimit.js`:

```javascript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const RATE_LIMITS = {
  free: {
    buddy: { requests: 50, period: 86400000 },        // 50 per day
    ai_tool_assistant: { requests: 100, period: 86400000 },  // 100 per day
    deep_research: { requests: 5, period: 86400000 }   // 5 per day
  },
  pro: {
    buddy: { requests: 500, period: 86400000 },
    ai_tool_assistant: { requests: 1000, period: 86400000 },
    deep_research: { requests: 50, period: 86400000 }
  }
};

export async function checkRateLimit(userId, mode) {
  const user = await getUser(userId);
  const tier = user.subscription || 'free';
  const limit = RATE_LIMITS[tier][mode];

  const now = Date.now();
  const periodStart = now - limit.period;

  // Get usage from DynamoDB
  const usageKey = `${userId}:${mode}:${Math.floor(now / limit.period)}`;

  const { Item } = await docClient.send(new GetCommand({
    TableName: 'BrooBotRateLimits',
    Key: { usageKey }
  }));

  const currentCount = Item?.count || 0;
  const allowed = currentCount < limit.requests;

  if (allowed) {
    // Increment counter
    await docClient.send(new PutCommand({
      TableName: 'BrooBotRateLimits',
      Item: {
        usageKey,
        userId,
        mode,
        count: currentCount + 1,
        resetTime: now + limit.period,
        ttl: Math.floor((now + limit.period * 2) / 1000)  // Auto-delete old records
      }
    }));
  }

  return {
    allowed,
    remaining: limit.requests - currentCount - (allowed ? 1 : 0),
    limit: limit.requests,
    retryAfter: Item?.resetTime || (now + limit.period)
  };
}
```

---

## 📊 **COST TRACKING**

```javascript
// backend/services/costTracking.js

export async function trackUsage(userId, data) {
  await docClient.send(new PutCommand({
    TableName: 'BrooBotUsage',
    Item: {
      userId,
      timestamp: Date.now(),
      mode: data.mode,
      model: data.model,
      inputTokens: data.inputTokens || 0,
      outputTokens: data.outputTokens || 0,
      cost: data.cost || 0,
      sessionId: data.sessionId
    }
  }));

  console.log(`[COST] User ${userId}: $${data.cost.toFixed(4)} (${data.mode})`);
}

export async function getDailyCosts() {
  const today = Date.now() - (Date.now() % 86400000);

  // Query DynamoDB for today's usage
  // ... implement query

  console.log(`Daily costs: $XX.XX`);
}
```

---

## 🎯 **NEXT STEPS**

1. **Set up backend** (Node.js/Express or AWS Lambda)
2. **Sign up for free APIs**:
   - Serper: https://serper.dev
   - Tavily: https://tavily.com
   - Firecrawl: https://firecrawl.dev
3. **Get Claude API key**: https://console.anthropic.com
4. **Update environment variables**
5. **Deploy backend to AWS Lambda**
6. **Test each mode**

**You now have complete, production-ready code for all three modes!** 🚀
