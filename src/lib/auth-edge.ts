// src/lib/auth-edge.ts
// Edge-compatible JWT verification using jose library
import * as jose from 'jose';

// Get JWT secret from environment or use a default for development
// Note: In production, JWT_SECRET should always be set in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  userType: string;
}

/**
 * Verify and decode a JWT token (Edge-compatible)
 * Uses jose library which works in Edge runtime
 */
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    
    // Validate that required properties exist and are strings
    const userId = payload.userId;
    const email = payload.email;
    const userType = payload.userType;
    
    if (typeof userId !== 'string' || typeof email !== 'string' || typeof userType !== 'string') {
      console.error('Token payload missing required properties');
      return null;
    }
    
    return { userId, email, userType };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
