// Core application types

export enum AppMode {
  BUDDY = 'buddy',
  AI_TOOL_ASSISTANT = 'ai_tool_assistant',
  DEEP_RESEARCH = 'deep_research',
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  mode: AppMode;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  isStreaming?: boolean;
  isError?: boolean;
  sources?: ResearchSource[];
  attachments?: Attachment[];
  toolRecommendations?: ToolRecommendation[];
}

export interface ResearchSource {
  id: string;
  url: string;
  title: string;
  excerpt: string;
  scrapedAt: Date;
}

export interface Attachment {
  id: string;
  type: 'pdf' | 'pptx' | 'docx' | 'image' | 'code' | 'text';
  name: string;
  url: string;
  size: number;
  createdAt: Date;
}

export interface ToolRecommendation {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  isFree: boolean;
  rating?: number;
  tags: string[];
}

export interface ChatSession {
  id: string;
  userId: string;
  mode: AppMode;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AppState {
  currentMode: AppMode;
  isAuthenticated: boolean;
  user: User | null;
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  error: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ChatCompletionRequest {
  messages: Message[];
  mode: AppMode;
  sessionId?: string;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  message: Message;
  sessionId: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface ResearchRequest {
  query: string;
  outputFormats: Array<'pdf' | 'pptx' | 'docx' | 'markdown' | 'code' | 'image'>;
  depth: 'quick' | 'standard' | 'deep';
}

export interface ResearchResponse {
  content: string;
  sources: ResearchSource[];
  attachments: Attachment[];
  completedAt: Date;
}
