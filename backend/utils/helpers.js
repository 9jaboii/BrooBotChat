/**
 * Utility functions for backend
 */

/**
 * Generate a unique message ID
 * Format: msg_{timestamp}_{random}
 */
export function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format a message response consistently
 */
export function formatMessageResponse(content, mode, metadata = {}) {
  return {
    id: generateMessageId(),
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
    mode,
    metadata
  };
}

/**
 * Validate required fields in request
 */
export function validateRequest(req, requiredFields) {
  const missing = [];

  for (const field of requiredFields) {
    if (!req.body[field]) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Create standardized error response
 */
export function errorResponse(message, statusCode = 500, details = {}) {
  return {
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    ...details
  };
}

/**
 * Create standardized success response
 */
export function successResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}
