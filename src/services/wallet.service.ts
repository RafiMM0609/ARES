// src/services/wallet.service.ts
// Wallet service for QI Network blockchain integration

import { ethers, BrowserProvider, formatEther, parseEther, Eip1193Provider } from 'ethers';
import { QI_NETWORK_CONFIG, QI_NETWORK_PARAMS, isQINetwork, getQIRpcUrl } from '@/lib/qi-network';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  isQINetwork: boolean;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

// Check if MetaMask or similar wallet is available
export const isWalletAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

// Get the wallet provider
export const getProvider = (): BrowserProvider | null => {
  if (!isWalletAvailable() || !window.ethereum) return null;
  return new BrowserProvider(window.ethereum as Eip1193Provider);
};

// Request wallet connection
export const connectWallet = async (): Promise<{ address: string; chainId: number }> => {
  if (!isWalletAvailable() || !window.ethereum) {
    throw new Error('No wallet detected. Please install MetaMask or a compatible wallet.');
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    }) as string[];

    const chainIdHex = await window.ethereum.request({
      method: 'eth_chainId',
    }) as string;

    const chainId = parseInt(chainIdHex, 16);

    return {
      address: accounts[0],
      chainId,
    };
  } catch (error) {
    if ((error as { code?: number }).code === 4001) {
      throw new Error('Wallet connection was rejected by user.');
    }
    throw error;
  }
};

// Switch to QI Network
export const switchToQINetwork = async (): Promise<boolean> => {
  if (!isWalletAvailable() || !window.ethereum) {
    throw new Error('No wallet detected.');
  }

  try {
    // Try to switch to QI Network
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: QI_NETWORK_PARAMS.chainId }],
    });
    return true;
  } catch (switchError) {
    // Chain not added, try to add it
    if ((switchError as { code?: number }).code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [QI_NETWORK_PARAMS],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add QI Network:', addError);
        throw new Error('Failed to add QI Network to wallet.');
      }
    }
    throw switchError;
  }
};

// Get wallet balance
export const getBalance = async (address: string): Promise<string> => {
  const provider = getProvider();
  if (!provider) {
    throw new Error('No wallet provider available.');
  }

  const balance = await provider.getBalance(address);
  return formatEther(balance);
};

// Get QI Network balance using RPC directly
export const getQIBalance = async (address: string): Promise<string> => {
  try {
    const provider = new ethers.JsonRpcProvider(getQIRpcUrl());
    const balance = await provider.getBalance(address);
    return formatEther(balance);
  } catch (error) {
    console.error('Failed to get QI balance:', error);
    return '0';
  }
};

// Get current chain ID
export const getCurrentChainId = async (): Promise<number | null> => {
  if (!isWalletAvailable() || !window.ethereum) return null;

  try {
    const chainIdHex = await window.ethereum.request({
      method: 'eth_chainId',
    }) as string;
    return parseInt(chainIdHex, 16);
  } catch {
    return null;
  }
};

// Get connected accounts
export const getConnectedAccounts = async (): Promise<string[]> => {
  if (!isWalletAvailable() || !window.ethereum) return [];

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    }) as string[];
    return accounts || [];
  } catch {
    return [];
  }
};

// Disconnect wallet (just clears local state, wallet stays connected)
export const disconnectWallet = (): void => {
  // Note: There's no standard way to programmatically disconnect
  // The user must disconnect from their wallet directly
  console.log('Wallet disconnection requested. User must disconnect from wallet.');
};

// Send QIE tokens
export const sendQIE = async (
  toAddress: string,
  amount: string
): Promise<TransactionResult> => {
  const provider = getProvider();
  if (!provider) {
    return { success: false, error: 'No wallet provider available.' };
  }

  try {
    // Check if on QI Network
    const chainId = await getCurrentChainId();
    if (!chainId || !isQINetwork(chainId)) {
      // Try to switch to QI Network
      await switchToQINetwork();
    }

    const signer = await provider.getSigner();
    const tx = await signer.sendTransaction({
      to: toAddress,
      value: parseEther(amount),
    });

    // Wait for transaction confirmation
    // tx.wait() can return null if transaction is dropped/replaced
    const receipt = await tx.wait();
    
    // Use tx.hash as fallback if receipt is null or doesn't have hash
    const transactionHash = receipt?.hash ?? tx.hash;
    
    return {
      success: true,
      hash: transactionHash,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
    return { success: false, error: errorMessage };
  }
};

// Format address for display (truncate middle)
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Validate Ethereum address
export const isValidAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

// Export network config for use in components
export { QI_NETWORK_CONFIG, isQINetwork };

// Wallet service object for consistent API
export const walletService = {
  isAvailable: isWalletAvailable,
  connect: connectWallet,
  disconnect: disconnectWallet,
  getBalance,
  getQIBalance,
  switchToQINetwork,
  getCurrentChainId,
  getConnectedAccounts,
  sendQIE,
  formatAddress,
  isValidAddress,
  config: QI_NETWORK_CONFIG,
};
