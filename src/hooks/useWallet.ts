// src/hooks/useWallet.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  walletService,
  WalletState,
  isWalletAvailable,
  isQINetwork,
} from '@/services/wallet.service';
import { WALLET_CONNECTED_KEY } from '@/lib/wallet-constants';

interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

// Helper to check if wallet should auto-connect
const shouldAutoConnect = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(WALLET_CONNECTED_KEY) === 'true';
};

// Helper to set wallet connection preference
const setWalletConnected = (connected: boolean): void => {
  if (typeof window === 'undefined') return;
  if (connected) {
    localStorage.setItem(WALLET_CONNECTED_KEY, 'true');
  } else {
    localStorage.removeItem(WALLET_CONNECTED_KEY);
  }
};

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
  const autoConnectAttempted = useRef(false);
  
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
        // Remember that wallet is connected
        setWalletConnected(true);
      }
    } catch (err) {
      console.error('Failed to check wallet connection:', err);
    }
  }, []);

  // Auto-connect wallet if user previously logged in with wallet
  const autoConnect = useCallback(async () => {
    if (!isWalletAvailable() || !window.ethereum) {
      return false;
    }

    try {
      // Request accounts - this will attempt to reconnect.
      // If permission was previously granted and not revoked, it will auto-approve.
      // If permission was revoked, the user may see a connection prompt.
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (!isMounted.current) return false;

      if (accounts.length > 0) {
        const chainId = await walletService.getCurrentChainId();
        const balance = await walletService.getBalance(accounts[0]);
        
        if (!isMounted.current) return false;
        
        setState({
          isConnected: true,
          address: accounts[0],
          balance,
          chainId: chainId || null,
          isQINetwork: chainId ? isQINetwork(chainId) : false,
        });
        return true;
      }
    } catch (err: any) {
      console.error('Auto-connect failed:', err);
      // Handle specific error codes
      if (err.code === -32001 && err.message?.includes('Already processing connect')) {
        // Wallet is already processing a connection request, retry after a short delay
        setTimeout(() => {
          if (isMounted.current && !stateRef.current.isConnected) {
            autoConnect();
          }
        }, 1000);
        return false;
      }
      // If auto-connect fails, clear the preference
      setWalletConnected(false);
    }
    return false;
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
          // Remember wallet connection preference
          setWalletConnected(true);
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
          // Remember wallet connection preference
          setWalletConnected(true);
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
        // Remember wallet connection preference
        setWalletConnected(true);
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
    // Clear wallet connection preference
    setWalletConnected(false);
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
        // User disconnected from wallet extension
        setState({
          isConnected: false,
          address: null,
          balance: null,
          chainId: null,
          isQINetwork: false,
        });
        setError(null);
        // Clear wallet connection preference when user explicitly disconnects
        setWalletConnected(false);
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

    // Check initial connection first, then auto-connect if needed
    const initializeConnection = async () => {
      // First check if already connected (eth_accounts)
      await checkConnection();
      
      // If not connected but user previously logged in with wallet, try to auto-connect
      if (!stateRef.current.isConnected && shouldAutoConnect() && !autoConnectAttempted.current) {
        autoConnectAttempted.current = true;
        await autoConnect();
      }
    };

    initializeConnection();

    return () => {
      isMounted.current = false;
      if (ethereum && typeof ethereum.removeListener === 'function') {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [checkConnection, autoConnect]);

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
