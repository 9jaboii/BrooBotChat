/**
 * Simple authentication middleware (mock for local development)
 * In production, this would validate JWT tokens from AWS Amplify
 */

export function authenticate(req, res, next) {
  // For local development, accept any request
  // In production, verify JWT token here

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  // Mock user - extract from token in production
  req.user = {
    id: 'mock-user-123',
    email: 'test@example.com',
    subscription: {
      tier: 'free' // free, lite, pro
    }
  };

  next();
}

/**
 * Optional authentication - doesn't require auth but extracts user if present
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    req.user = {
      id: 'mock-user-123',
      email: 'test@example.com',
      subscription: { tier: 'free' }
    };
  }

  next();
}
