# BrooBot Architecture & Implementation Strategy

## Cost-Effective, High-Quality AI Implementation Guide

This guide explains the best approaches for implementing each mode with minimal cost, maximum quality, and reduced complexity.

---

## 🎯 Overview: Three-Mode Strategy

### Mode Comparison

| Mode | Complexity | Cost | Best Approach |
|------|-----------|------|---------------|
| **Buddy Mode** 💬 | Low | Medium | Direct Claude API |
| **AI Tool Assistant** 🔧 | Low | **FREE/Very Low** | Static DB + embeddings |
| **Deep Research** 🔍 | High | Medium-High | Multi-agent + free tools |

---

## 💬 **MODE 1: Buddy Mode - Direct API Approach**

### **Architecture**

```
User Message → Backend API → Claude API → Response → User
```

### **Implementation Strategy**

#### **Option A: Claude API Haiku (RECOMMENDED)**
**Cost**: ~$0.25 per 1M input tokens, ~$1.25 per 1M output tokens

```javascript
// Backend: src/services/claudeService.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function buddyModeChat(messages, userId) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',  // Cheapest, fast, good quality
      max_tokens: 1024,
      messages: messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      // Optional: Add user-specific system prompt
      system: `You are BrooBot, a helpful AI assistant.
               Current user: ${userId}
               Be friendly, concise, and helpful.`
    });

    return {
      content: response.content[0].text,
      usage: response.usage,  // Track for billing
      model: 'claude-3-haiku'
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw error;
  }
}
```

**Cost Estimation**:
- Average conversation: 500 tokens input, 300 tokens output
- Cost per conversation: ~$0.0005 (half a cent!)
- 1000 conversations: ~$0.50

#### **Option B: Claude API Sonnet (Better Quality)**
**Cost**: ~$3 per 1M input tokens, ~$15 per 1M output tokens

Use for premium users or when quality is critical.

### **Multi-User Implementation**

```javascript
// Backend: User request handling
app.post('/api/chat', authenticate, async (req, res) => {
  const { messages, sessionId } = req.body;
  const userId = req.user.id;

  // Rate limiting per user
  const userRateLimit = await checkRateLimit(userId);
  if (!userRateLimit.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: userRateLimit.retryAfter
    });
  }

  // Track usage per user for billing/limits
  await trackUsage(userId, {
    mode: 'buddy',
    sessionId,
    timestamp: new Date()
  });

  // Call Claude API
  const response = await buddyModeChat(messages, userId);

  // Store conversation in DB (optional)
  await saveMessage(userId, sessionId, {
    userMessage: messages[messages.length - 1],
    assistantResponse: response
  });

  res.json({
    message: response.content,
    usage: response.usage
  });
});
```

### **Cost Optimization Tips**

1. **Use Haiku for most requests** (95% cheaper than GPT-4)
2. **Implement token limits** - Max 1000 tokens output
3. **Cache system prompts** - Reduce input tokens
4. **Rate limiting** - 20 messages per hour per free user
5. **Compress chat history** - Only send last 10 messages

---

## 🔧 **MODE 2: AI Tool Assistant - FREE/Low-Cost Approach**

### **Architecture** (Nearly FREE!)

```
User Query → Embedding (free) → Vector Search → Match Tools → Format Response
                                     ↓
                              [Static Tools DB]
```

### **Why This Is Cheap**

No API calls needed! Use embeddings once, then pure database lookups.

### **Implementation Strategy**

#### **Step 1: Build Comprehensive Tools Database**

```javascript
// Backend: data/aiToolsDatabase.js
export const AI_TOOLS_DATABASE = [
  {
    id: '1',
    name: 'ChatGPT',
    description: 'Conversational AI for writing, coding, analysis, and general questions',
    category: 'General AI',
    subcategories: ['Writing', 'Coding', 'Research'],
    url: 'https://chat.openai.com',
    isFree: true,
    freeTier: {
      limitations: 'GPT-3.5 model, rate limits',
      features: 'Unlimited conversations, web browsing (limited)'
    },
    paidTier: {
      price: '$20/month',
      features: 'GPT-4, priority access, plugins'
    },
    useCases: [
      'Writing blog posts and articles',
      'Coding assistance and debugging',
      'Answering questions',
      'Brainstorming ideas'
    ],
    tags: ['chatbot', 'writing', 'coding', 'general', 'popular'],
    rating: 4.8,
    lastUpdated: '2024-01-15'
  },
  {
    id: '2',
    name: 'Perplexity AI',
    description: 'AI-powered search engine with cited sources',
    category: 'Research & Search',
    subcategories: ['Research', 'Search', 'Citations'],
    url: 'https://www.perplexity.ai',
    isFree: true,
    freeTier: {
      limitations: '5 Pro searches per day',
      features: 'Unlimited Quick searches, source citations'
    },
    useCases: [
      'Research with sources',
      'Fact-checking',
      'Academic research',
      'Current events analysis'
    ],
    tags: ['research', 'search', 'citations', 'sources', 'academic'],
    rating: 4.7
  },
  // Add 50-100 more tools...
  {
    id: '3',
    name: 'Runway ML',
    description: 'AI video editing and generation',
    category: 'Video',
    subcategories: ['Video Editing', 'Video Generation', 'Creative'],
    url: 'https://runwayml.com',
    isFree: true,
    freeTier: {
      limitations: '125 credits/month',
      features: 'Gen-2 video generation, image tools'
    },
    tags: ['video', 'creative', 'generation', 'editing'],
    rating: 4.6
  },
  // ... Continue with comprehensive list
];
```

#### **Step 2: Simple Keyword Matching (FREE)**

```javascript
// Backend: services/toolRecommendation.js

export function findRelevantTools(userQuery, limit = 5) {
  const queryLower = userQuery.toLowerCase();
  const queryWords = queryLower.split(' ');

  // Score each tool based on keyword matches
  const scoredTools = AI_TOOLS_DATABASE.map(tool => {
    let score = 0;

    // Check category match
    if (tool.category.toLowerCase().includes(queryLower)) score += 10;

    // Check subcategories
    tool.subcategories?.forEach(sub => {
      if (queryLower.includes(sub.toLowerCase())) score += 8;
    });

    // Check tags
    tool.tags.forEach(tag => {
      if (queryWords.includes(tag)) score += 5;
    });

    // Check use cases
    tool.useCases?.forEach(useCase => {
      queryWords.forEach(word => {
        if (useCase.toLowerCase().includes(word) && word.length > 3) {
          score += 3;
        }
      });
    });

    // Check description
    queryWords.forEach(word => {
      if (tool.description.toLowerCase().includes(word) && word.length > 3) {
        score += 2;
      }
    });

    // Boost free tools slightly
    if (tool.isFree) score += 1;

    return { ...tool, relevanceScore: score };
  });

  // Sort by score and return top matches
  return scoredTools
    .filter(tool => tool.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}
```

**Cost**: $0 (No API calls!)

#### **Step 3: Optional - Better Matching with Free Embeddings**

For better quality, use free sentence transformers:

```javascript
// Use transformers.js (runs in Node.js, no API)
import { pipeline } from '@xenova/transformers';

let embedder = null;

async function initEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction',
      'Xenova/all-MiniLM-L6-v2'  // Free, runs locally
    );
  }
  return embedder;
}

// Pre-compute embeddings for all tools (one-time)
export async function precomputeToolEmbeddings() {
  const model = await initEmbedder();

  const toolsWithEmbeddings = await Promise.all(
    AI_TOOLS_DATABASE.map(async (tool) => {
      const text = `${tool.name} ${tool.description} ${tool.tags.join(' ')}`;
      const embedding = await model(text, { pooling: 'mean', normalize: true });
      return {
        ...tool,
        embedding: Array.from(embedding.data)
      };
    })
  );

  // Save to database
  await saveToolEmbeddings(toolsWithEmbeddings);
}

// Find similar tools using cosine similarity
export async function findSimilarTools(userQuery, limit = 5) {
  const model = await initEmbedder();
  const queryEmbedding = await model(userQuery, { pooling: 'mean', normalize: true });

  const toolsWithScores = toolsWithEmbeddings.map(tool => ({
    ...tool,
    similarity: cosineSimilarity(queryEmbedding.data, tool.embedding)
  }));

  return toolsWithScores
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  return dotProduct;  // Normalized vectors, so dotProduct = cosine similarity
}
```

**Cost**: $0 (Runs locally, no API calls!)

#### **Step 4: Optional Enhanced Response with Claude**

Only if you want AI to explain why tools match:

```javascript
export async function enhanceToolRecommendations(userQuery, tools) {
  const toolsList = tools.map((t, i) =>
    `${i + 1}. ${t.name}: ${t.description}`
  ).join('\n');

  const prompt = `User needs: "${userQuery}"

Available tools:
${toolsList}

Briefly explain why these tools are good matches (2-3 sentences max).`;

  const response = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',  // Cheap
    max_tokens: 200,  // Keep it short
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content[0].text;
}
```

**Cost**: ~$0.0001 per request (optional enhancement)

### **Complete Cost Breakdown**

- **Basic keyword matching**: FREE
- **With local embeddings**: FREE (one-time compute)
- **With Claude enhancement**: $0.0001 per query
- **1000 recommendations**: $0 - $0.10

---

## 🔍 **MODE 3: Deep Research - Multi-Agent Free Tools**

### **Architecture** (Hybrid - Free + Paid)

```
User Query → Research Agent → [Multiple Free Tools] → Synthesize → Response
                ↓
         ┌─────────────────────┐
         │  Free Tools Used:   │
         │  - Serper API       │ (Free tier: 2500/month)
         │  - Jina Reader      │ (Free)
         │  - Firecrawl        │ (Free tier: 500/month)
         │  - Tavily           │ (Free tier: 1000/month)
         └─────────────────────┘
                ↓
         Claude API (synthesis)
```

### **Free Research Tools You Can Use**

#### **1. Serper API - Free Google Search**
**Free Tier**: 2,500 searches/month

```javascript
// services/searchService.js
import axios from 'axios';

export async function searchWeb(query) {
  const response = await axios.post(
    'https://google.serper.dev/search',
    { q: query, num: 10 },
    { headers: { 'X-API-KEY': process.env.SERPER_API_KEY } }
  );

  return response.data.organic.map(result => ({
    title: result.title,
    link: result.link,
    snippet: result.snippet
  }));
}
```

**Sign up**: https://serper.dev (Free tier)

#### **2. Jina Reader - Free Web Scraping**
**Free Tier**: Unlimited with rate limits

```javascript
export async function scrapeWebpage(url) {
  const response = await axios.get(
    `https://r.jina.ai/${url}`,
    { headers: { 'Accept': 'application/json' } }
  );

  return {
    title: response.data.title,
    content: response.data.content,
    markdown: response.data.markdown
  };
}
```

**No API key needed!** Just use the URL pattern.

#### **3. Firecrawl - Free Web Scraping**
**Free Tier**: 500 pages/month

```javascript
import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY
});

export async function scrapeWithFirecrawl(url) {
  const result = await firecrawl.scrapeUrl(url, {
    formats: ['markdown', 'html'],
    onlyMainContent: true
  });

  return result.markdown;
}
```

**Sign up**: https://firecrawl.dev (Free tier)

#### **4. Tavily - AI Search API**
**Free Tier**: 1,000 searches/month

```javascript
import { tavily } from '@tavily/core';

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });

export async function researchWithTavily(query) {
  const response = await client.search(query, {
    searchDepth: 'advanced',
    maxResults: 5,
    includeAnswer: true,
    includeRawContent: true
  });

  return {
    answer: response.answer,
    sources: response.results
  };
}
```

**Sign up**: https://tavily.com (Free tier)

### **Multi-Agent Research Implementation**

```javascript
// services/deepResearchService.js

export async function performDeepResearch(query, outputFormats = ['markdown']) {
  // Stage 1: Multi-source search (FREE)
  const [serperResults, tavilyResults] = await Promise.all([
    searchWeb(query).catch(() => []),
    researchWithTavily(query).catch(() => null)
  ]);

  // Stage 2: Scrape top sources (FREE)
  const topUrls = serperResults.slice(0, 5).map(r => r.link);
  const scrapedContent = await Promise.all(
    topUrls.map(async url => {
      try {
        // Try Jina first (free, no key)
        const content = await scrapeWebpage(url);
        return { url, ...content };
      } catch {
        return null;
      }
    })
  );

  const validContent = scrapedContent.filter(c => c !== null);

  // Stage 3: Synthesize with Claude (PAID - but cheap)
  const synthesisPrompt = `Research Query: "${query}"

Sources:
${validContent.map((c, i) => `
Source ${i + 1}: ${c.title}
URL: ${c.url}
Content: ${c.content.slice(0, 1000)}...
`).join('\n')}

${tavilyResults?.answer ? `\nTavily Summary: ${tavilyResults.answer}` : ''}

Create a comprehensive research report with:
1. Executive Summary
2. Key Findings (3-5 points)
3. Detailed Analysis
4. Conclusions
5. Cited Sources

Format in Markdown.`;

  const synthesis = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',  // Better for research
    max_tokens: 3000,
    messages: [{ role: 'user', content: synthesisPrompt }]
  });

  const report = synthesis.content[0].text;

  // Stage 4: Generate outputs (if requested)
  const outputs = {};

  if (outputFormats.includes('markdown')) {
    outputs.markdown = report;
  }

  if (outputFormats.includes('pdf')) {
    outputs.pdf = await generatePDF(report);  // Use free library
  }

  if (outputFormats.includes('docx')) {
    outputs.docx = await generateDOCX(report);  // Use free library
  }

  return {
    report,
    sources: validContent.map(c => ({
      title: c.title,
      url: c.url,
      excerpt: c.content.slice(0, 200)
    })),
    outputs,
    usage: synthesis.usage
  };
}
```

### **Document Generation (FREE)**

```javascript
// services/documentGeneration.js
import PDFDocument from 'pdfkit';  // Free
import { Document, Packer, Paragraph } from 'docx';  // Free
import fs from 'fs';

export async function generatePDF(markdown) {
  const doc = new PDFDocument();
  const stream = fs.createWriteStream('/tmp/report.pdf');

  doc.pipe(stream);
  doc.fontSize(16).text('Research Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(markdown);
  doc.end();

  return stream.path;  // Return file path or upload to S3
}

export async function generateDOCX(markdown) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: 'Research Report',
          heading: 'Heading1'
        }),
        new Paragraph({
          text: markdown
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('/tmp/report.docx', buffer);

  return '/tmp/report.docx';
}
```

### **Cost Breakdown for Deep Research**

| Component | Cost per Research | Free Tier |
|-----------|------------------|-----------|
| Serper Search | FREE | 2,500/month |
| Jina Scraping | FREE | Unlimited* |
| Firecrawl | FREE | 500/month |
| Tavily Research | FREE | 1,000/month |
| Claude Synthesis | ~$0.05 | N/A |
| Document Gen | FREE | Unlimited |
| **Total** | **~$0.05** | **Mixed** |

**With free tiers: First 500 researches/month = $0**

---

## 💰 **COMPLETE COST ANALYSIS**

### **Monthly Cost for 1000 Active Users**

Assumptions:
- Average user: 50 Buddy chats, 10 tool searches, 2 deep researches/month

| Mode | Usage | Cost per User | Total Cost |
|------|-------|--------------|------------|
| Buddy Mode | 50 chats | $0.025 | $25 |
| AI Tool Assistant | 10 searches | $0.001 | $1 |
| Deep Research | 2 researches | $0.10 | $100 |
| **Total** | - | **$0.126** | **$126/month** |

**Add infrastructure**:
- AWS Lambda: ~$10/month
- DynamoDB: ~$5/month (on-demand)
- S3 Storage: ~$5/month
- CloudFront: ~$10/month

**Total: ~$156/month for 1000 users = $0.156 per user**

### **Free Tier Coverage**

With free tiers, first 500 users essentially FREE:
- Serper: 2,500 searches (covers 500 researches)
- Tavily: 1,000 searches (covers 500 researches)
- Firecrawl: 500 pages
- Claude: Pay per use (but very cheap with Haiku)

---

## 🏗️ **MULTI-USER ARCHITECTURE**

### **Backend Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                      AWS API Gateway                         │
│                    (Authentication: Cognito)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                              │
        ▼                                              ▼
┌──────────────────┐                        ┌──────────────────┐
│  Lambda Function │                        │  Lambda Function │
│   (Buddy Mode)   │                        │  (Tool Search)   │
│                  │                        │                  │
│  - Rate limiting │                        │  - Free search   │
│  - User tracking │                        │  - No API calls  │
│  - Claude API    │                        │  - Fast response │
└────────┬─────────┘                        └──────────────────┘
         │
         ▼
┌──────────────────┐
│  Lambda Function │
│ (Deep Research)  │
│                  │
│  - Multi-agent   │
│  - Free tools    │
│  - Claude synth  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│              DynamoDB                     │
│                                           │
│  - User sessions                          │
│  - Chat history                           │
│  - Usage tracking                         │
│  - Rate limits                            │
└───────────────────────────────────────────┘
```

### **User Request Flow**

```javascript
// Lambda: api/chat/route.js

export async function handler(event, context) {
  // 1. Authenticate user
  const userId = event.requestContext.authorizer.claims.sub;

  // 2. Parse request
  const { mode, messages, query } = JSON.parse(event.body);

  // 3. Check rate limits
  const rateLimit = await checkUserRateLimit(userId, mode);
  if (!rateLimit.allowed) {
    return {
      statusCode: 429,
      body: JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: rateLimit.retryAfter,
        remainingQuota: rateLimit.remaining
      })
    };
  }

  // 4. Route to appropriate handler
  let response;
  switch (mode) {
    case 'buddy':
      response = await handleBuddyMode(userId, messages);
      break;
    case 'ai_tool_assistant':
      response = await handleToolAssistant(userId, query);
      break;
    case 'deep_research':
      response = await handleDeepResearch(userId, query);
      break;
  }

  // 5. Track usage for billing/limits
  await trackUsage(userId, {
    mode,
    timestamp: Date.now(),
    tokensUsed: response.usage?.total_tokens || 0,
    cost: calculateCost(response.usage)
  });

  // 6. Return response
  return {
    statusCode: 200,
    body: JSON.stringify(response)
  };
}
```

### **Rate Limiting Strategy**

```javascript
// services/rateLimiting.js

const RATE_LIMITS = {
  free: {
    buddy: { requests: 50, period: 'day' },
    ai_tool_assistant: { requests: 100, period: 'day' },
    deep_research: { requests: 5, period: 'day' }
  },
  pro: {
    buddy: { requests: 500, period: 'day' },
    ai_tool_assistant: { requests: 1000, period: 'day' },
    deep_research: { requests: 50, period: 'day' }
  }
};

export async function checkUserRateLimit(userId, mode) {
  const user = await getUser(userId);
  const tier = user.subscription || 'free';
  const limit = RATE_LIMITS[tier][mode];

  // Get usage from DynamoDB
  const usage = await getUserUsage(userId, mode, limit.period);

  const allowed = usage.count < limit.requests;
  const remaining = limit.requests - usage.count;

  return {
    allowed,
    remaining,
    limit: limit.requests,
    retryAfter: allowed ? 0 : usage.resetTime
  };
}
```

---

## 🚀 **RECOMMENDED IMPLEMENTATION PHASES**

### **Phase 1: MVP (Weeks 1-2)**
1. ✅ Buddy Mode with Claude Haiku
2. ✅ AI Tool Assistant with keyword search (free)
3. ✅ Basic rate limiting
4. ✅ User authentication

**Cost**: $10-20/month for initial users

### **Phase 2: Enhanced (Weeks 3-4)**
1. ✅ Deep Research with free tools (Serper, Jina)
2. ✅ Document generation (PDF, DOCX)
3. ✅ Usage tracking and analytics
4. ✅ Improved rate limiting

**Cost**: $50-100/month for 500 users

### **Phase 3: Scale (Month 2)**
1. ✅ Enhanced embeddings for tool search
2. ✅ Multi-agent research orchestration
3. ✅ Caching layer for common queries
4. ✅ Premium tier with higher limits

**Cost**: $150-300/month for 1000+ users

---

## 💡 **KEY RECOMMENDATIONS**

### **DO THIS** ✅
1. Use **Claude Haiku** for Buddy Mode (95% cheaper)
2. Use **keyword search** for AI Tool Assistant (FREE)
3. Use **free APIs** (Serper, Jina, Tavily) for research
4. Implement **aggressive rate limiting** on free tier
5. **Cache common queries** to reduce API calls
6. Use **local document generation** (pdfkit, docx)

### **DON'T DO THIS** ❌
1. Don't use GPT-4 for every request (too expensive)
2. Don't call AI for tool recommendations (use search)
3. Don't scrape without free APIs (rate limits)
4. Don't generate docs with AI (use libraries)
5. Don't skip rate limiting (costs will explode)
6. Don't use embeddings API (use local models)

---

## 📊 **MONITORING & OPTIMIZATION**

```javascript
// Track costs in real-time
export async function logUsage(userId, mode, usage) {
  await dynamodb.put({
    TableName: 'BrooBotUsage',
    Item: {
      userId,
      timestamp: Date.now(),
      mode,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cost: calculateCost(usage),
      model: usage.model
    }
  });
}

// Daily cost analysis
export async function analyzeDailyCosts() {
  const today = Date.now() - (Date.now() % 86400000);

  const results = await dynamodb.query({
    TableName: 'BrooBotUsage',
    IndexName: 'TimestampIndex',
    KeyConditionExpression: '#ts >= :today',
    ExpressionAttributeNames: { '#ts': 'timestamp' },
    ExpressionAttributeValues: { ':today': today }
  });

  const totalCost = results.Items.reduce((sum, item) => sum + item.cost, 0);
  const totalRequests = results.Items.length;

  console.log(`Daily Stats: ${totalRequests} requests, $${totalCost.toFixed(2)}`);

  return { totalCost, totalRequests, avgCostPerRequest: totalCost / totalRequests };
}
```

---

## 🎯 **FINAL COST SUMMARY**

| Tier | Users | Monthly Cost | Cost per User |
|------|-------|--------------|---------------|
| MVP | 50 | $10-20 | $0.20-0.40 |
| Growth | 500 | $50-100 | $0.10-0.20 |
| Scale | 1000 | $150-300 | $0.15-0.30 |
| Enterprise | 10,000 | $1,000-2,000 | $0.10-0.20 |

**With optimization and free tiers, you can serve hundreds of users for under $100/month!**

---

## 📞 **NEXT STEPS**

1. **Start with MVP**: Buddy Mode + Tool Assistant (keyword)
2. **Sign up for free APIs**: Serper, Tavily, Firecrawl
3. **Implement rate limiting**: Protect against abuse
4. **Monitor costs**: Track usage daily
5. **Optimize**: Use free tools where possible

**Questions? See the implementation examples in the next guide!**
