/**
 * API Helper utilities for consistent error handling and validation
 */

import { Message } from '@types';

/**
 * Validate and normalize message from backend
 * Ensures all required fields are present and properly typed
 */
export function normalizeMessage(backendMessage: any): Message {
  // Ensure we have all required fields
  if (!backendMessage) {
    throw new Error('Message is null or undefined');
  }

  // Validate required fields
  if (!backendMessage.role) {
    throw new Error('Message missing required field: role');
  }

  if (!backendMessage.content) {
    throw new Error('Message missing required field: content');
  }

  if (!backendMessage.mode) {
    throw new Error('Message missing required field: mode');
  }

  // Create normalized message with all required fields
  const normalizedMessage: Message = {
    id: backendMessage.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    role: backendMessage.role,
    content: backendMessage.content,
    // Convert timestamp string to Date object
    timestamp: backendMessage.timestamp
      ? new Date(backendMessage.timestamp)
      : new Date(),
    mode: backendMessage.mode,
    metadata: backendMessage.metadata || {}
  };

  // Validate timestamp is valid
  if (isNaN(normalizedMessage.timestamp.getTime())) {
    normalizedMessage.timestamp = new Date();
  }

  return normalizedMessage;
}

/**
 * Safely extract error message from various error formats
 */
export function extractErrorMessage(error: any): string {
  // Axios error with response
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Network error
  if (error.code === 'ERR_NETWORK') {
    return 'Cannot connect to backend. Make sure the backend server is running.';
  }

  if (error.message?.includes('ECONNREFUSED')) {
    return 'Backend server is not running. Start it with: cd backend && npm start';
  }

  // Generic error
  if (error.message) {
    return error.message;
  }

  return 'An unknown error occurred';
}

/**
 * Check if backend is available
 */
export async function checkBackendHealth(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl.replace('/api', '')}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    return false;
  }
}

/**
 * Validate chat request before sending
 */
export function validateChatRequest(messages: Message[], mode: string): { valid: boolean; error?: string } {
  if (!messages || messages.length === 0) {
    return { valid: false, error: 'Messages array is empty' };
  }

  if (!mode) {
    return { valid: false, error: 'Mode is required' };
  }

  const validModes = ['buddy', 'ai_tool_assistant', 'deep_research'];
  if (!validModes.includes(mode)) {
    return { valid: false, error: `Invalid mode: ${mode}` };
  }

  // Validate last message is from user
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user') {
    return { valid: false, error: 'Last message must be from user' };
  }

  return { valid: true };
}

/**
 * Create user message with proper structure
 */
export function createUserMessage(content: string, mode: string): Message {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    role: 'user',
    content,
    timestamp: new Date(),
    mode: mode as any,
    metadata: {}
  };
}

/**
 * Retry logic for failed requests
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
      console.log(`Retrying request (attempt ${attempt + 2}/${maxRetries + 1})...`);
    }
  }

  throw lastError;
}
