// src/lib/wallet-auth.ts
// Wallet-based authentication utilities for SSO with QI Network

import { ethers } from 'ethers';
import { randomBytes } from 'crypto';

/**
 * Generate a unique nonce for wallet authentication
 * The nonce ensures that each signature request is unique and prevents replay attacks
 */
export function generateNonce(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create the message that will be signed by the wallet
 * This message should be human-readable and include the nonce for security
 */
export function createSignMessage(nonce: string, domain?: string): string {
  const timestamp = new Date().toISOString();
  const appName = 'ARES';
  const domainText = domain ? `\nDomain: ${domain}` : '';
  
  return `Welcome to ${appName}!

Please sign this message to verify your wallet ownership.

This request will not trigger a blockchain transaction or cost any gas fees.${domainText}

Nonce: ${nonce}
Timestamp: ${timestamp}`;
}

/**
 * Verify a signed message and extract the wallet address
 * @param message - The original message that was signed
 * @param signature - The signature produced by the wallet
 * @returns The wallet address that signed the message, or null if verification fails
 */
export function verifyWalletSignature(message: string, signature: string): string | null {
  try {
    // Recover the address that signed the message
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return null;
  }
}

/**
 * Validate that a string is a valid Ethereum address
 */
export function isValidWalletAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Normalize wallet address to lowercase for consistency
 */
export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}
