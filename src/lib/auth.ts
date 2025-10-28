// src/lib/auth.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// Get JWT secret from environment or use a default for development
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days
const SALT_ROUNDS = 10;

export interface JWTPayload {
  userId: string;
  email: string;
  userType: string;
}

export interface SessionData {
  userId: string;
  email: string;
  userType: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Hash a session token for storage
 */
export async function hashSessionToken(token: string): Promise<string> {
  return bcrypt.hash(token, SALT_ROUNDS);
}

/**
 * Generate a random session token
 */
export function generateSessionToken(): string {
  return jwt.sign(
    { random: Math.random().toString(36) },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Calculate token expiration date
 */
export function getTokenExpiration(): Date {
  const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  return new Date(Date.now() + expiresIn);
}

/**
 * Extract and verify user from request
 * Returns the user payload if authenticated, null otherwise
 */
export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }

  return verifyToken(token);
}
