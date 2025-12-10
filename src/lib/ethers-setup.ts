// src/lib/ethers-setup.ts
// Centralized Ethers.js provider setup and configuration for QI Network

import { ethers, BrowserProvider, JsonRpcProvider, Signer, Eip1193Provider } from 'ethers';
import { getQIRpcUrl, QI_NETWORK_CONFIG } from './qi-network';

/**
 * Provider types for different connection methods
 */
export type ProviderType = 'browser' | 'rpc';

/**
 * Get a browser provider from window.ethereum (MetaMask, etc.)
 * Requires user interaction for wallet connection
 */
export function getBrowserProvider(): BrowserProvider | null {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  return new ethers.BrowserProvider(window.ethereum as Eip1193Provider);
}

/**
 * Get a JSON-RPC provider for the QI Network
 * Suitable for read-only operations without wallet connection
 */
export function getQIRpcProvider(): JsonRpcProvider {
  const rpcUrl = getQIRpcUrl();
  return new ethers.JsonRpcProvider(rpcUrl, {
    chainId: QI_NETWORK_CONFIG.chainId,
    name: QI_NETWORK_CONFIG.chainName,
  });
}

/**
 * Get a JSON-RPC provider for a custom RPC URL
 * @param rpcUrl - Custom RPC endpoint URL
 * @param chainId - Optional chain ID for the network
 */
export function getCustomRpcProvider(rpcUrl: string, chainId?: number): JsonRpcProvider {
  return new ethers.JsonRpcProvider(rpcUrl, chainId);
}

/**
 * Get the appropriate provider based on type
 * @param type - 'browser' for wallet provider or 'rpc' for JSON-RPC provider
 */
export function getProvider(type: ProviderType = 'browser'): BrowserProvider | JsonRpcProvider | null {
  if (type === 'browser') {
    return getBrowserProvider();
  }
  return getQIRpcProvider();
}

/**
 * Get a signer from the browser provider
 * Requires wallet connection and user authorization
 * @param accountIndex - Account index to use (default: 0)
 */
export async function getSigner(accountIndex: number = 0): Promise<Signer> {
  const provider = getBrowserProvider();
  if (!provider) {
    throw new Error('No browser provider available. Please install MetaMask or a compatible wallet.');
  }
  return provider.getSigner(accountIndex);
}

/**
 * Get the current connected wallet address
 */
export async function getSignerAddress(): Promise<string> {
  const signer = await getSigner();
  return signer.getAddress();
}

/**
 * Check if a provider is connected and ready
 */
export async function isProviderReady(provider: BrowserProvider | JsonRpcProvider): Promise<boolean> {
  try {
    const network = await provider.getNetwork();
    return network.chainId !== BigInt(0);
  } catch {
    return false;
  }
}

/**
 * Get current network information from provider
 */
export async function getNetworkInfo(provider: BrowserProvider | JsonRpcProvider) {
  const network = await provider.getNetwork();
  return {
    chainId: Number(network.chainId),
    name: network.name,
  };
}

/**
 * Check if the current provider is connected to QI Network
 */
export async function isConnectedToQINetwork(provider: BrowserProvider | JsonRpcProvider): Promise<boolean> {
  try {
    const network = await provider.getNetwork();
    return Number(network.chainId) === QI_NETWORK_CONFIG.chainId;
  } catch {
    return false;
  }
}

/**
 * Wait for a specific number of blocks
 * Useful for ensuring transaction finality
 */
export async function waitForBlocks(
  provider: BrowserProvider | JsonRpcProvider,
  numberOfBlocks: number
): Promise<void> {
  const startBlock = await provider.getBlockNumber();
  const targetBlock = startBlock + numberOfBlocks;

  return new Promise((resolve) => {
    const checkBlock = async () => {
      const currentBlock = await provider.getBlockNumber();
      if (currentBlock >= targetBlock) {
        resolve();
      } else {
        // Check again in a few seconds
        setTimeout(checkBlock, 3000);
      }
    };
    checkBlock();
  });
}

/**
 * Get the current block number
 */
export async function getCurrentBlockNumber(provider?: BrowserProvider | JsonRpcProvider): Promise<number> {
  const prov = provider || getQIRpcProvider();
  return prov.getBlockNumber();
}

/**
 * Get block information by block number or tag
 */
export async function getBlock(
  blockNumberOrTag: number | string,
  provider?: BrowserProvider | JsonRpcProvider
) {
  const prov = provider || getQIRpcProvider();
  return prov.getBlock(blockNumberOrTag);
}

/**
 * Get the current gas price
 */
export async function getGasPrice(provider?: BrowserProvider | JsonRpcProvider): Promise<bigint> {
  const prov = provider || getQIRpcProvider();
  const feeData = await prov.getFeeData();
  return feeData.gasPrice || BigInt(0);
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
  transaction: {
    to?: string;
    from?: string;
    data?: string;
    value?: bigint;
  },
  provider?: BrowserProvider | JsonRpcProvider
): Promise<bigint> {
  const prov = provider || getQIRpcProvider();
  return prov.estimateGas(transaction);
}

/**
 * Export commonly used ethers utilities for convenience
 */
export {
  ethers,
  BrowserProvider,
  JsonRpcProvider,
  type Signer,
};
