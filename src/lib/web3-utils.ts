// src/lib/web3-utils.ts
// General Web3 utility functions for QI Network

import { ethers } from 'ethers';
import { getQIRpcProvider } from './ethers-setup';

/**
 * Format an address for display (truncate middle)
 * @param address - Full Ethereum address
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 */
export function formatAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Validate if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Validate and checksum an Ethereum address
 * Returns the checksummed address or null if invalid
 */
export function getChecksumAddress(address: string): string | null {
  try {
    return ethers.getAddress(address);
  } catch {
    return null;
  }
}

/**
 * Normalize address to lowercase for comparison
 */
export function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

/**
 * Check if two addresses are the same (case-insensitive)
 */
export function isSameAddress(address1: string, address2: string): boolean {
  return normalizeAddress(address1) === normalizeAddress(address2);
}

// ============================================================================
// Unit Conversion Utilities
// ============================================================================

/**
 * Convert Wei to Ether
 */
export function weiToEther(wei: bigint | string): string {
  return ethers.formatEther(wei);
}

/**
 * Convert Ether to Wei
 */
export function etherToWei(ether: string): bigint {
  return ethers.parseEther(ether);
}

/**
 * Convert Wei to Gwei
 */
export function weiToGwei(wei: bigint | string): string {
  return ethers.formatUnits(wei, 'gwei');
}

/**
 * Convert Gwei to Wei
 */
export function gweiToWei(gwei: string): bigint {
  return ethers.parseUnits(gwei, 'gwei');
}

/**
 * Convert between any units
 * @param value - Value to convert
 * @param fromUnit - Source unit (wei, gwei, ether, etc.)
 * @param toUnit - Target unit
 */
export function convertUnits(
  value: string | bigint,
  fromUnit: number | string = 'ether',
  toUnit: number | string = 'wei'
): string {
  // First convert to wei (base unit)
  const weiValue = typeof value === 'bigint' 
    ? value 
    : ethers.parseUnits(value.toString(), fromUnit);
  
  // Then convert from wei to target unit
  return ethers.formatUnits(weiValue, toUnit);
}

/**
 * Format currency amount with symbol
 * @param amount - Amount in ether
 * @param symbol - Currency symbol (default: 'QIE')
 * @param decimals - Number of decimal places to show
 */
export function formatCurrency(
  amount: string | bigint,
  symbol: string = 'QIE',
  decimals: number = 4
): string {
  const amountStr = typeof amount === 'bigint' ? weiToEther(amount) : amount;
  const numAmount = parseFloat(amountStr);
  const formatted = numAmount.toFixed(decimals);
  return `${formatted} ${symbol}`;
}

/**
 * Format currency with appropriate precision
 * Shows more decimals for small amounts, fewer for large amounts
 */
export function formatCurrencyAuto(
  amount: string | bigint,
  symbol: string = 'QIE'
): string {
  const amountStr = typeof amount === 'bigint' ? weiToEther(amount) : amount;
  const numAmount = parseFloat(amountStr);
  
  let decimals = 4;
  if (numAmount >= 1000) decimals = 2;
  else if (numAmount >= 10) decimals = 3;
  else if (numAmount < 0.01) decimals = 6;
  
  return formatCurrency(amountStr, symbol, decimals);
}

// ============================================================================
// Hexadecimal Utilities
// ============================================================================

/**
 * Convert string to hexadecimal
 */
export function stringToHex(str: string): string {
  return ethers.hexlify(ethers.toUtf8Bytes(str));
}

/**
 * Convert hexadecimal to string
 */
export function hexToString(hex: string): string {
  return ethers.toUtf8String(hex);
}

/**
 * Convert number to hexadecimal
 */
export function numberToHex(num: number | bigint): string {
  return ethers.toBeHex(num);
}

/**
 * Convert hexadecimal to number
 */
export function hexToNumber(hex: string): number {
  return parseInt(hex, 16);
}

/**
 * Pad hexadecimal string to specific byte length
 */
export function padHex(hex: string, bytes: number): string {
  return ethers.zeroPadValue(hex, bytes);
}

// ============================================================================
// Hashing Utilities
// ============================================================================

/**
 * Compute keccak256 hash of data
 */
export function keccak256(data: string | Uint8Array): string {
  if (typeof data === 'string') {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }
  return ethers.keccak256(data);
}

/**
 * Compute keccak256 hash of hex string
 */
export function keccak256Hex(hex: string): string {
  return ethers.keccak256(hex);
}

/**
 * Generate a random bytes32 value
 */
export function randomBytes32(): string {
  return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Generate random bytes of specific length
 */
export function randomBytes(length: number): string {
  return ethers.hexlify(ethers.randomBytes(length));
}

// ============================================================================
// Block and Timestamp Utilities
// ============================================================================

/**
 * Get the current block timestamp
 */
export async function getCurrentTimestamp(): Promise<number> {
  const provider = getQIRpcProvider();
  const block = await provider.getBlock('latest');
  return block?.timestamp || 0;
}

/**
 * Get timestamp of a specific block
 */
export async function getBlockTimestamp(blockNumber: number): Promise<number> {
  const provider = getQIRpcProvider();
  const block = await provider.getBlock(blockNumber);
  return block?.timestamp || 0;
}

/**
 * Estimate block number at a specific timestamp
 * Note: This is an approximation based on average block time
 */
export async function estimateBlockAtTimestamp(
  timestamp: number,
  averageBlockTime: number = 3 // QI Network block time in seconds
): Promise<number> {
  const provider = getQIRpcProvider();
  const currentBlock = await provider.getBlock('latest');
  
  if (!currentBlock) {
    throw new Error('Could not fetch current block');
  }

  const timeDiff = timestamp - currentBlock.timestamp;
  const blockDiff = Math.floor(timeDiff / averageBlockTime);
  
  return currentBlock.number + blockDiff;
}

/**
 * Convert seconds to approximate number of blocks
 */
export function secondsToBlocks(seconds: number, averageBlockTime: number = 3): number {
  return Math.floor(seconds / averageBlockTime);
}

/**
 * Convert blocks to approximate seconds
 */
export function blocksToSeconds(blocks: number, averageBlockTime: number = 3): number {
  return blocks * averageBlockTime;
}

// ============================================================================
// Data Encoding/Decoding Utilities
// ============================================================================

/**
 * ABI encode function call data
 */
export function encodeFunctionData(
  abi: ethers.InterfaceAbi,
  functionName: string,
  args: unknown[] = []
): string {
  const iface = new ethers.Interface(abi);
  return iface.encodeFunctionData(functionName, args);
}

/**
 * ABI decode function result
 */
export function decodeFunctionResult(
  abi: ethers.InterfaceAbi,
  functionName: string,
  data: string
): ethers.Result {
  const iface = new ethers.Interface(abi);
  return iface.decodeFunctionResult(functionName, data);
}

/**
 * ABI encode parameters
 */
export function encodeParameters(types: string[], values: unknown[]): string {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  return abiCoder.encode(types, values);
}

/**
 * ABI decode parameters
 */
export function decodeParameters(types: string[], data: string): ethers.Result {
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  return abiCoder.decode(types, data);
}

// ============================================================================
// Signature Utilities
// ============================================================================

/**
 * Sign a message with wallet
 */
export async function signMessage(message: string): Promise<string> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No wallet provider available');
  }

  const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
  const signer = await provider.getSigner();
  return signer.signMessage(message);
}

/**
 * Verify a signed message
 */
export function verifyMessage(message: string, signature: string): string {
  return ethers.verifyMessage(message, signature);
}

/**
 * Recover address from signature and message hash
 */
export function recoverAddress(messageHash: string, signature: string): string {
  return ethers.recoverAddress(messageHash, signature);
}

// ============================================================================
// Miscellaneous Utilities
// ============================================================================

/**
 * Check if value is a valid bytes32 hex string
 */
export function isBytes32(value: string): boolean {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

/**
 * Check if value is a valid transaction hash
 */
export function isTransactionHash(value: string): boolean {
  return isBytes32(value);
}

/**
 * Parse and validate a big number string
 */
export function parseBigNumber(value: string): bigint | null {
  try {
    return BigInt(value);
  } catch {
    return null;
  }
}

/**
 * Format large numbers with thousand separators
 */
export function formatNumber(num: number | string, decimals: number = 2): string {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(numValue);
}
