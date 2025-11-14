/**
 * AI Tools Database
 * Comprehensive list of free and paid AI tools
 */

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
      model: 'GPT-3.5 Turbo',
      limitations: 'Rate limits during peak hours',
      features: ['Unlimited conversations', 'Web browsing (Plus)', 'Image analysis (Plus)']
    },
    paidTier: {
      price: '$20/month',
      model: 'GPT-4',
      features: ['Priority access', 'Advanced data analysis', 'DALL-E image generation']
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
    rating: 4.8
  },
  {
    id: '2',
    name: 'Claude',
    description: 'Advanced AI assistant by Anthropic, excellent for analysis, coding, and long conversations',
    category: 'General AI',
    subcategories: ['Analysis', 'Writing', 'Coding', 'Research'],
    url: 'https://claude.ai',
    isFree: true,
    freeTier: {
      model: 'Claude 3 Sonnet',
      features: ['Long context window', 'Document analysis', 'Coding assistance']
    },
    paidTier: {
      price: '$20/month',
      model: 'Claude 3 Opus',
      features: ['5x more usage', 'Priority access', 'Extended context']
    },
    useCases: [
      'Document analysis',
      'Code review and generation',
      'Research synthesis',
      'Complex reasoning tasks',
      'Long-form content creation'
    ],
    tags: ['chatbot', 'analysis', 'coding', 'research', 'anthropic', 'reliable'],
    rating: 4.9
  },
  {
    id: '3',
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
    paidTier: {
      price: '$20/month',
      features: ['300+ Pro searches/day', 'Choose AI model', 'API access']
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
    id: '4',
    name: 'Midjourney',
    description: 'AI image generation from text descriptions, creating stunning art and designs',
    category: 'Image Generation',
    subcategories: ['Art', 'Design', 'Creative', 'Illustration'],
    url: 'https://www.midjourney.com',
    isFree: false,
    paidTier: {
      price: '$10-60/month',
      features: ['High-resolution images', 'Commercial use', 'Fast generation', 'Private mode']
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
    id: '5',
    name: 'DALL-E 3',
    description: 'OpenAI\'s advanced image generation model, integrated with ChatGPT Plus',
    category: 'Image Generation',
    subcategories: ['Art', 'Design', 'Creative'],
    url: 'https://openai.com/dall-e-3',
    isFree: false,
    paidTier: {
      price: '$20/month (via ChatGPT Plus)',
      features: ['Text-to-image generation', 'Image editing', 'High quality']
    },
    useCases: [
      'Marketing materials',
      'Social media graphics',
      'Concept visualization',
      'Creative projects'
    ],
    tags: ['image', 'art', 'generation', 'openai', 'creative'],
    rating: 4.6
  },
  {
    id: '6',
    name: 'Runway ML',
    description: 'AI-powered video editing and generation tools for creators',
    category: 'Video',
    subcategories: ['Video Editing', 'Video Generation', 'Creative'],
    url: 'https://runwayml.com',
    isFree: true,
    freeTier: {
      limitations: '125 credits per month',
      features: ['Gen-2 video generation', 'Image tools', 'Basic editing']
    },
    paidTier: {
      price: '$12-76/month',
      features: ['More credits', 'HD export', 'Unlimited projects']
    },
    useCases: [
      'Video content creation',
      'Special effects',
      'Video editing',
      'Animation',
      'Social media videos'
    ],
    tags: ['video', 'creative', 'generation', 'editing', 'animation'],
    rating: 4.5
  },
  {
    id: '7',
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
    paidTier: {
      price: '$49/month',
      features: ['Unlimited words', 'Priority support', 'Brand voice']
    },
    useCases: [
      'Marketing copy',
      'Product descriptions',
      'Social media posts',
      'Email campaigns',
      'Ad copy'
    ],
    tags: ['copywriting', 'marketing', 'content', 'business', 'writing'],
    rating: 4.4
  },
  {
    id: '8',
    name: 'Notion AI',
    description: 'AI writing assistant integrated directly into your Notion workspace',
    category: 'Productivity',
    subcategories: ['Writing', 'Productivity', 'Organization'],
    url: 'https://www.notion.so/product/ai',
    isFree: false,
    paidTier: {
      price: '$10/user/month',
      features: ['Integrated with Notion', 'Writing assistance', 'Summaries', 'Translations']
    },
    useCases: [
      'Note-taking enhancement',
      'Document writing',
      'Summarization',
      'Task management',
      'Knowledge organization'
    ],
    tags: ['productivity', 'writing', 'notes', 'organization'],
    rating: 4.6
  },
  {
    id: '9',
    name: 'Grammarly',
    description: 'AI-powered writing assistant for grammar, spelling, and style improvements',
    category: 'Writing & Marketing',
    subcategories: ['Writing', 'Editing', 'Grammar'],
    url: 'https://www.grammarly.com',
    isFree: true,
    freeTier: {
      features: ['Grammar checking', 'Spelling', 'Basic punctuation']
    },
    paidTier: {
      price: '$12-15/month',
      features: ['Advanced suggestions', 'Plagiarism detection', 'Tone detector']
    },
    useCases: [
      'Email writing',
      'Document editing',
      'Professional communication',
      'Academic writing'
    ],
    tags: ['writing', 'grammar', 'editing', 'productivity'],
    rating: 4.7
  },
  {
    id: '10',
    name: 'GitHub Copilot',
    description: 'AI pair programmer that helps you write code faster',
    category: 'Coding',
    subcategories: ['Coding', 'Development', 'Programming'],
    url: 'https://github.com/features/copilot',
    isFree: false,
    paidTier: {
      price: '$10/month',
      features: ['Code completion', 'Multiple languages', 'IDE integration']
    },
    useCases: [
      'Code completion',
      'Function generation',
      'Debugging assistance',
      'Learning new languages',
      'Boilerplate code'
    ],
    tags: ['coding', 'programming', 'development', 'github', 'productivity'],
    rating: 4.8
  },
  {
    id: '11',
    name: 'Jasper',
    description: 'AI content platform for businesses to create marketing content at scale',
    category: 'Writing & Marketing',
    subcategories: ['Marketing', 'Content', 'Business', 'Copywriting'],
    url: 'https://www.jasper.ai',
    isFree: false,
    paidTier: {
      price: '$49-125/month',
      features: ['Long-form content', 'Brand voice', 'Team collaboration', 'SEO mode']
    },
    useCases: [
      'Blog post writing',
      'Marketing campaigns',
      'Product descriptions',
      'Social media content',
      'Email marketing'
    ],
    tags: ['marketing', 'content', 'business', 'writing', 'seo'],
    rating: 4.5
  },
  {
    id: '12',
    name: 'Hugging Face',
    description: 'Platform for machine learning models and AI tools with free access to thousands of models',
    category: 'Development',
    subcategories: ['Machine Learning', 'AI Models', 'Development'],
    url: 'https://huggingface.co',
    isFree: true,
    freeTier: {
      features: ['Access to 100k+ models', 'Inference API', 'Community resources']
    },
    useCases: [
      'Custom AI model deployment',
      'Text generation',
      'Image processing',
      'NLP tasks',
      'Research'
    ],
    tags: ['ml', 'development', 'models', 'free', 'opensource'],
    rating: 4.8
  }
];
