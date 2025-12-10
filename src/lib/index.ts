// src/lib/index.ts
// Central export file for all library utilities

// Ethers.js setup and provider management
export * from './ethers-setup';

// Smart contract utilities
export * from './contract-utils';

// Transaction utilities
export * from './transaction-utils';

// Web3 utility functions
export * from './web3-utils';

// QI Network configuration
export * from './qi-network';

// Wallet authentication utilities
export {
  generateNonce,
  createSignMessage,
  verifyWalletSignature,
  isValidWalletAddress,
  normalizeAddress as normalizeWalletAddress, // Renamed to avoid shadowing
} from './wallet-auth';

// Wallet constants
export * from './wallet-constants';

// Auth utilities
export {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  hashSessionToken,
  generateSessionToken,
  getTokenExpiration,
  getUserFromRequest,
  type JWTPayload,
  type SessionData,
} from './auth';

// Auth Edge utilities
export {
  verifyTokenEdge,
  type JWTPayload as JWTPayloadEdge,
} from './auth-edge';

// Validation utilities
export * from './validation';

// Prisma client
export { prisma, prisma as db } from './prisma';

// Database types
export * from './database.types';
