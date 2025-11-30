// src/hooks/useWallet.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  walletService,
  WalletState,
  isWalletAvailable,
  isQINetwork,
} from '@/services/wallet.service';

interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useWallet(): UseWalletReturn {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    isQINetwork: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check initial connection state
  const checkConnection = useCallback(async () => {
    if (!isWalletAvailable()) {
      return;
    }

    try {
      const accounts = await walletService.getConnectedAccounts();
      const chainId = await walletService.getCurrentChainId();

      if (accounts.length > 0 && chainId) {
        const balance = await walletService.getBalance(accounts[0]);
        setState({
          isConnected: true,
          address: accounts[0],
          balance,
          chainId,
          isQINetwork: isQINetwork(chainId),
        });
      }
    } catch (err) {
      console.error('Failed to check wallet connection:', err);
    }
  }, []);

  // Connect wallet
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { address, chainId } = await walletService.connect();
      
      // If not on QI Network, prompt to switch
      if (!isQINetwork(chainId)) {
        try {
          await walletService.switchToQINetwork();
          // Re-fetch chain ID after switch
          const newChainId = await walletService.getCurrentChainId();
          const balance = await walletService.getQIBalance(address);
          setState({
            isConnected: true,
            address,
            balance,
            chainId: newChainId || chainId,
            isQINetwork: newChainId ? isQINetwork(newChainId) : false,
          });
        } catch {
          // User declined network switch, still connect but show current network
          const balance = await walletService.getBalance(address);
          setState({
            isConnected: true,
            address,
            balance,
            chainId,
            isQINetwork: false,
          });
          setError('Please switch to QI Network for full functionality.');
        }
      } else {
        const balance = await walletService.getQIBalance(address);
        setState({
          isConnected: true,
          address,
          balance,
          chainId,
          isQINetwork: true,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    walletService.disconnect();
    setState({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      isQINetwork: false,
    });
    setError(null);
  }, []);

  // Switch to QI Network
  const switchNetwork = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await walletService.switchToQINetwork();
      const chainId = await walletService.getCurrentChainId();
      
      if (state.address) {
        const balance = await walletService.getQIBalance(state.address);
        setState(prev => ({
          ...prev,
          balance,
          chainId: chainId || prev.chainId,
          isQINetwork: chainId ? isQINetwork(chainId) : false,
        }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch network';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [state.address]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!state.address) return;

    try {
      const balance = state.isQINetwork
        ? await walletService.getQIBalance(state.address)
        : await walletService.getBalance(state.address);
      
      setState(prev => ({ ...prev, balance }));
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  }, [state.address, state.isQINetwork]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!isWalletAvailable() || !window.ethereum) return;

    const ethereum = window.ethereum;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        disconnect();
      } else if (accounts[0] !== state.address) {
        // Account changed
        const balance = state.isQINetwork
          ? await walletService.getQIBalance(accounts[0])
          : await walletService.getBalance(accounts[0]);
        
        setState(prev => ({
          ...prev,
          address: accounts[0],
          balance,
        }));
      }
    };

    const handleChainChanged = async (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      const isQI = isQINetwork(chainId);
      
      if (state.address) {
        const balance = isQI
          ? await walletService.getQIBalance(state.address)
          : await walletService.getBalance(state.address);
        
        setState(prev => ({
          ...prev,
          chainId,
          balance,
          isQINetwork: isQI,
        }));
      } else {
        setState(prev => ({
          ...prev,
          chainId,
          isQINetwork: isQI,
        }));
      }

      if (!isQI && state.isConnected) {
        setError('Please switch to QI Network for payments.');
      } else {
        setError(null);
      }
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    // Check initial connection
    checkConnection();

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.address, state.isConnected, state.isQINetwork, disconnect, checkConnection]);

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
    loading,
    error,
  };
}
