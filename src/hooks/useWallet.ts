// src/hooks/useWallet.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  walletService,
  WalletState,
  isWalletAvailable,
  isQINetwork,
} from '@/services/wallet.service';
import { log } from 'console';

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
  
  // Use refs to track mounted state and avoid stale closures
  const isMounted = useRef(true);
  const stateRef = useRef(state);
  
  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Check initial connection state
  const checkConnection = useCallback(async () => {
    if (!isWalletAvailable()) {
      return;
    }

    try {
      const accounts = await walletService.getConnectedAccounts();
      const chainId = await walletService.getCurrentChainId();
      console.log("Data accounts", accounts);
      console.log("Data chain id", chainId);
      

      if (!isMounted.current) return;

      if (accounts.length > 0 && chainId) {
        const balance = await walletService.getBalance(accounts[0]);
        if (!isMounted.current) return;
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
      
      if (!isMounted.current) return;
      
      // If not on QI Network, prompt to switch
      if (!isQINetwork(chainId)) {
        try {
          await walletService.switchToQINetwork();
          if (!isMounted.current) return;
          
          // Re-fetch chain ID after switch
          const newChainId = await walletService.getCurrentChainId();
          const balance = await walletService.getQIBalance(address);
          if (!isMounted.current) return;
          
          setState({
            isConnected: true,
            address,
            balance,
            chainId: newChainId || chainId,
            isQINetwork: newChainId ? isQINetwork(newChainId) : false,
          });
        } catch {
          if (!isMounted.current) return;
          
          // User declined network switch, still connect but show current network
          const balance = await walletService.getBalance(address);
          if (!isMounted.current) return;
          
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
        if (!isMounted.current) return;
        
        setState({
          isConnected: true,
          address,
          balance,
          chainId,
          isQINetwork: true,
        });
      }
    } catch (err) {
      if (!isMounted.current) return;
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
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
      if (!isMounted.current) return;
      
      const chainId = await walletService.getCurrentChainId();
      const currentAddress = stateRef.current.address;
      
      if (currentAddress) {
        const balance = await walletService.getQIBalance(currentAddress);
        if (!isMounted.current) return;
        
        setState(prev => ({
          ...prev,
          balance,
          chainId: chainId || prev.chainId,
          isQINetwork: chainId ? isQINetwork(chainId) : false,
        }));
      }
    } catch (err) {
      if (!isMounted.current) return;
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch network';
      setError(errorMessage);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    const currentState = stateRef.current;
    if (!currentState.address) return;

    try {
      const balance = currentState.isQINetwork
        ? await walletService.getQIBalance(currentState.address)
        : await walletService.getBalance(currentState.address);
      
      if (!isMounted.current) return;
      setState(prev => ({ ...prev, balance }));
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  }, []);

  // Listen for account and chain changes - setup once on mount
  useEffect(() => {
    isMounted.current = true;
    
    if (!isWalletAvailable() || !window.ethereum) {
      return;
    }

    const ethereum = window.ethereum;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (!isMounted.current) return;
      
      if (accounts.length === 0) {
        // User disconnected
        setState({
          isConnected: false,
          address: null,
          balance: null,
          chainId: null,
          isQINetwork: false,
        });
        setError(null);
      } else {
        const currentState = stateRef.current;
        if (accounts[0] !== currentState.address) {
          try {
            // Account changed
            const balance = currentState.isQINetwork
              ? await walletService.getQIBalance(accounts[0])
              : await walletService.getBalance(accounts[0]);
            
            if (!isMounted.current) return;
            
            setState(prev => ({
              ...prev,
              address: accounts[0],
              balance,
            }));
          } catch (err) {
            console.error('Failed to update balance after account change:', err);
          }
        }
      }
    };

    const handleChainChanged = async (chainIdHex: string) => {
      if (!isMounted.current) return;
      
      const chainId = parseInt(chainIdHex, 16);
      const isQI = isQINetwork(chainId);
      const currentState = stateRef.current;
      
      try {
        if (currentState.address) {
          const balance = isQI
            ? await walletService.getQIBalance(currentState.address)
            : await walletService.getBalance(currentState.address);
          
          if (!isMounted.current) return;
          
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

        if (!isQI && currentState.isConnected) {
          setError('Please switch to QI Network for payments.');
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('Failed to handle chain change:', err);
      }
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    // Check initial connection
    checkConnection();

    return () => {
      isMounted.current = false;
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [checkConnection]);

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
