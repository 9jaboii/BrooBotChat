import Anthropic from '@anthropic-ai/sdk';
import { formatMessageResponse } from '../utils/helpers.js';

// Lazy initialization - create client when needed, not at module load time
let anthropicClient = null;

function getAnthropicClient() {
  const USE_MOCK = process.env.USE_MOCK_MODE === 'true';

  if (USE_MOCK || !process.env.ANTHROPIC_API_KEY) {
    return null;
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    console.log('[BUDDY MODE] Anthropic client initialized');
  }

  return anthropicClient;
}

/**
 * Handle Buddy Mode chat requests
 * Cost: ~$0.0005 per conversation (using Haiku)
 */
export async function handleBuddyMode(messages, userId, sessionId) {
  try {
    // Get the Anthropic client (lazy initialization)
    const anthropic = getAnthropicClient();

    // Use mock responses if API key not configured or mock mode enabled
    if (!anthropic) {
      return handleBuddyModeMock(messages, userId, sessionId);
    }

    // Prepare messages for Claude
    const claudeMessages = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    console.log(`[BUDDY MODE] Sending request to Claude API for user ${userId}`);

    // Call Claude API with Haiku (fastest and cheapest model)
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      temperature: 0.7,
      system: getBuddySystemPrompt(userId),
      messages: claudeMessages
    });

    const assistantMessage = formatMessageResponse(
      response.content[0].text,
      'buddy',
      {
        model: 'claude-3-haiku',
        usage: response.usage
      }
    );

    // Log usage for monitoring
    const cost = calculateCost(response.usage);
    console.log(`[BUDDY MODE] Request completed - Cost: $${cost.toFixed(4)}, Tokens: ${response.usage.input_tokens + response.usage.output_tokens}`);

    return {
      message: assistantMessage,
      sessionId,
      usage: response.usage,
      cost
    };
  } catch (error) {
    console.error('[BUDDY MODE] Error:', error);

    // Fallback to mock on error
    if (error.status === 429) {
      console.log('[BUDDY MODE] Rate limit hit, falling back to mock');
      return handleBuddyModeMock(messages, userId, sessionId);
    }

    throw error;
  }
}

/**
 * Mock Buddy Mode for testing without API key
 */
function handleBuddyModeMock(messages, userId, sessionId) {
  const lastUserMessage = messages[messages.length - 1]?.content || '';

  let mockResponse = '';

  // Generate contextual mock responses
  const lowerMessage = lastUserMessage.toLowerCase();

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    mockResponse = "Hello! 👋 I'm BrooBot, your friendly AI assistant. I'm here to help you with anything you need. What can I do for you today?";
  } else if (lowerMessage.includes('how are you')) {
    mockResponse = "I'm doing great, thank you for asking! As an AI assistant, I'm always ready and excited to help. How can I assist you today?";
  } else if (lowerMessage.includes('joke')) {
    mockResponse = "Sure! Here's one: Why did the AI go to therapy? Because it had too many deep learning issues! 😄\n\nBut seriously, I'm here to help with real questions too. What else can I do for you?";
  } else if (lowerMessage.includes('code') || lowerMessage.includes('program')) {
    mockResponse = "I can definitely help with coding! I'm experienced in many programming languages including JavaScript, Python, Java, C++, and more.\n\nWhat kind of code help do you need? I can:\n- Debug existing code\n- Explain programming concepts\n- Write new functions\n- Review code\n- Suggest best practices";
  } else if (lowerMessage.includes('write') || lowerMessage.includes('essay') || lowerMessage.includes('article')) {
    mockResponse = "I'd be happy to help with writing! I can assist with:\n- Blog posts and articles\n- Essays and research papers\n- Creative writing\n- Professional emails\n- Technical documentation\n\nWhat would you like to write about?";
  } else {
    mockResponse = `I understand you're asking about: "${lastUserMessage}"\n\n**[MOCK MODE]** This is a mock response because Claude API is not configured yet.\n\nTo enable real AI responses:\n1. Get your API key from https://console.anthropic.com\n2. Add it to backend/.env as ANTHROPIC_API_KEY\n3. Restart the backend server\n\nIn the meantime, I can still help you test the interface! Try asking about:\n- Coding help\n- Writing assistance\n- General questions`;
  }

  return {
    message: formatMessageResponse(
      mockResponse,
      'buddy',
      {
        model: 'mock',
        isMock: true
      }
    ),
    sessionId,
    usage: { input_tokens: 0, output_tokens: 0 },
    cost: 0
  };
}

/**
 * System prompt for Buddy Mode
 */
function getBuddySystemPrompt(userId) {
  return `You are BrooBot, a friendly and helpful AI assistant created to help users with a wide variety of tasks.

Your personality:
- Friendly, approachable, and conversational
- Professional but not overly formal
- Patient and helpful
- Clear and concise in explanations
- Encouraging and supportive

Your capabilities:
- General conversation and questions
- Writing assistance (essays, articles, emails, creative writing)
- Coding help (debugging, explanations, code generation)
- Problem-solving and brainstorming
- Research and information gathering
- Learning support and tutoring
- Creative projects

Guidelines:
- Be conversational and natural
- Provide clear, well-structured answers
- Ask clarifying questions when needed
- Break down complex topics into simple terms
- Use examples when helpful
- Be honest about limitations
- Stay on topic but be flexible
- Use appropriate formatting (markdown, code blocks, lists)

Remember: You're a helpful buddy, not just a search engine. Engage meaningfully with the user.

User ID: ${userId}`;
}

/**
 * Calculate cost based on token usage
 * Claude Haiku pricing: $0.25 per 1M input tokens, $1.25 per 1M output tokens
 */
function calculateCost(usage) {
  const INPUT_COST_PER_TOKEN = 0.25 / 1_000_000;
  const OUTPUT_COST_PER_TOKEN = 1.25 / 1_000_000;

  const inputCost = usage.input_tokens * INPUT_COST_PER_TOKEN;
  const outputCost = usage.output_tokens * OUTPUT_COST_PER_TOKEN;

  return inputCost + outputCost;
}
