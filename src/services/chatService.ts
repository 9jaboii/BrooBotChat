import axios from 'axios';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  AppMode,
  Message,
  ToolRecommendation,
} from '@types';
import {
  normalizeMessage,
  extractErrorMessage,
  validateChatRequest,
  retryRequest
} from '@/utils/apiHelpers';

// Mock AI Tools Database
const mockAITools: ToolRecommendation[] = [
  {
    id: '1',
    name: 'ChatGPT',
    description: 'Conversational AI for various tasks',
    category: 'General AI',
    url: 'https://chat.openai.com',
    isFree: true,
    rating: 4.8,
    tags: ['chatbot', 'writing', 'coding'],
  },
  {
    id: '2',
    name: 'Midjourney',
    description: 'AI image generation from text prompts',
    category: 'Image Generation',
    url: 'https://www.midjourney.com',
    isFree: false,
    rating: 4.9,
    tags: ['image', 'art', 'creative'],
  },
  {
    id: '3',
    name: 'Copy.ai',
    description: 'AI-powered copywriting assistant',
    category: 'Writing',
    url: 'https://www.copy.ai',
    isFree: true,
    rating: 4.5,
    tags: ['writing', 'marketing', 'content'],
  },
  {
    id: '4',
    name: 'Perplexity AI',
    description: 'AI-powered search and research',
    category: 'Research',
    url: 'https://www.perplexity.ai',
    isFree: true,
    rating: 4.7,
    tags: ['research', 'search', 'learning'],
  },
  {
    id: '5',
    name: 'Notion AI',
    description: 'AI writing assistant integrated with Notion',
    category: 'Productivity',
    url: 'https://www.notion.so/product/ai',
    isFree: false,
    rating: 4.6,
    tags: ['productivity', 'notes', 'writing'],
  },
];

export const sendChatMessage = async (
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> => {
  try {
    // Validate request
    const validation = validateChatRequest(request.messages, request.mode);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Special handling for AI Tool Assistant mode
    if (request.mode === AppMode.AI_TOOL_ASSISTANT) {
      const lastMessage = request.messages[request.messages.length - 1];

      // Use retry logic for tool search
      const toolResponse = await retryRequest(
        () => chatAPI.findTools(lastMessage.content),
        2,
        500
      );

      const responseMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: toolResponse.message,
        timestamp: new Date(),
        mode: request.mode,
        metadata: {
          toolRecommendations: toolResponse.tools,
          totalFound: toolResponse.totalFound
        },
      };

      return {
        message: responseMessage,
        sessionId: request.sessionId || '',
      };
    }

    // For Buddy Mode and Deep Research, use the chat endpoint with retry
    const response = await retryRequest(
      () => chatAPI.sendMessage(request),
      2,
      1000
    );

    // Normalize and validate the response message
    const normalizedMessage = normalizeMessage(response.message);

    return {
      message: normalizedMessage,
      sessionId: response.sessionId || request.sessionId || '',
      usage: response.usage
    };
  } catch (error: any) {
    const errorMessage = extractErrorMessage(error);
    console.error('Chat API Error:', errorMessage, error);

    // If backend is not available, fall back to mock
    if (error.code === 'ERR_NETWORK' || error.message?.includes('ECONNREFUSED') || error.message?.includes('connect to backend')) {
      console.warn('Backend not available, falling back to mock responses');
      return await simulateAIResponse(request);
    }

    // Re-throw with better error message
    throw new Error(errorMessage);
  }
};

// Simulated AI response for development
const simulateAIResponse = async (
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const lastMessage = request.messages[request.messages.length - 1];
  let responseContent = '';
  let metadata: any = {};

  switch (request.mode) {
    case AppMode.BUDDY:
      responseContent = generateBuddyResponse(lastMessage.content);
      break;

    case AppMode.AI_TOOL_ASSISTANT:
      const tools = findRelevantTools(lastMessage.content);
      responseContent = generateToolRecommendationResponse(lastMessage.content, tools);
      metadata.toolRecommendations = tools;
      break;

    case AppMode.DEEP_RESEARCH:
      responseContent = generateResearchResponse(lastMessage.content);
      metadata.sources = [
        {
          id: '1',
          url: 'https://example.com/source1',
          title: 'Research Source 1',
          excerpt: 'This is a sample excerpt from the research...',
          scrapedAt: new Date(),
        },
      ];
      break;
  }

  const responseMessage: Message = {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: responseContent,
    timestamp: new Date(),
    mode: request.mode,
    metadata,
  };

  return {
    message: responseMessage,
    sessionId: request.sessionId || '',
  };
};

const generateBuddyResponse = (userMessage: string): string => {
  // Simple mock response
  const responses = [
    `I understand you're asking about "${userMessage}". I'm here to help! This is a development mode, so I'm providing a simulated response. Once connected to Claude API, I'll provide more detailed and accurate answers.`,
    `That's an interesting question about "${userMessage}". Let me help you with that. In production, this will be powered by Claude AI for more comprehensive responses.`,
    `Great question! Regarding "${userMessage}", I can assist you with that. This is currently a demo response - the full version will use Claude's advanced capabilities.`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
};

const findRelevantTools = (query: string): ToolRecommendation[] => {
  const lowerQuery = query.toLowerCase();

  // Simple keyword matching
  const relevantTools = mockAITools.filter((tool) => {
    return (
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.tags.some((tag) => lowerQuery.includes(tag)) ||
      tool.category.toLowerCase().includes(lowerQuery)
    );
  });

  // If no specific matches, return some popular tools
  if (relevantTools.length === 0) {
    return mockAITools.slice(0, 3);
  }

  return relevantTools.slice(0, 5);
};

const generateToolRecommendationResponse = (
  query: string,
  tools: ToolRecommendation[]
): string => {
  return `Based on your request "${query}", I've found ${tools.length} AI tool${
    tools.length !== 1 ? 's' : ''
  } that might help you:\n\nThese tools are specifically selected to match your needs. You can explore them using the cards below. Once we integrate with Claude API, I'll provide even more personalized recommendations with detailed use cases!`;
};

const generateResearchResponse = (query: string): string => {
  return `# Research Results for: "${query}"\n\n## Overview\n\nI've conducted research on your query. This is a simulated response for development purposes.\n\n## Key Findings\n\n1. **First Finding**: Important information about ${query}\n2. **Second Finding**: Additional insights discovered\n3. **Third Finding**: Comprehensive analysis results\n\n## Detailed Analysis\n\nIn a production environment, this section would contain:\n- Web scraping results from multiple sources\n- Synthesized information\n- Citations and references\n- Generated documents (PDF, PPTX, DOCX)\n- Visual representations\n\n## Next Steps\n\nOnce integrated with Claude API and web scraping capabilities:\n- Real-time research across multiple sources\n- Document generation in your preferred format\n- Interactive visualizations\n- Code snippets if applicable\n\nSee the sources below for reference materials.`;
};

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT || 'http://localhost:3001/api';

export const chatAPI = {
  sendMessage: async (request: ChatCompletionRequest) => {
    // Get auth token from localStorage
    const token = localStorage.getItem('auth_token') || 'mock-token';

    const response = await axios.post(`${API_BASE_URL}/chat`, request, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  findTools: async (query: string) => {
    const token = localStorage.getItem('auth_token') || 'mock-token';

    const response = await axios.post(`${API_BASE_URL}/tools/search`,
      { query, limit: 5 },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  },

  // Health check endpoint
  checkHealth: async () => {
    const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.data;
  },
};
