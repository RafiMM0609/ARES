// src/components/wallet/WalletLogin.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { walletService } from '@/services/wallet.service';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui';

interface WalletLoginProps {
  userType?: 'client' | 'freelancer' | 'both';
  onSuccess?: (isNewUser: boolean) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function WalletLogin({
  userType = 'freelancer',
  onSuccess,
  onError,
  className = '',
}: WalletLoginProps) {
  const {
    isConnected,
    address,
    isQINetwork,
    connect,
    switchNetwork,
    loading: walletLoading,
    error: walletError,
  } = useWallet();

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Memoize wallet availability check
  const isWalletDetected = useMemo(() => {
    if (typeof window === 'undefined') return true; // SSR: assume available
    return walletService.isAvailable();
  }, []);

  const handleWalletLogin = useCallback(async () => {
    if (!address) {
      setAuthError('No wallet connected');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    try {
      // Step 1: Get nonce and message from server
      const { message } = await authService.getWalletNonce(address);

      // Step 2: Request signature from wallet (wallet availability already checked via isWalletDetected)
      const signature = await window.ethereum!.request({
        method: 'personal_sign',
        params: [message, address],
      }) as string;

      // Step 3: Send signature to server for verification
      const result = await authService.walletLogin({
        address,
        signature,
        message,
        user_type: userType,
      });

      // Step 4: Handle success
      if (onSuccess) {
        onSuccess(result.isNewUser);
      } else {
        // Default redirect based on user type
        // Using window.location.href for full page reload to ensure auth cookies are properly included
        const redirectPath = result.user?.user_type === 'freelancer' ? '/freelancer' : '/client';
        window.location.href = redirectPath;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Wallet authentication failed';
      setAuthError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setAuthLoading(false);
    }
  }, [address, userType, onSuccess, onError]);

  // If wallet is not available
  if (!isWalletDetected) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-yellow-800">
          <WalletWarningIcon />
          <span className="font-medium">Wallet Not Detected</span>
        </div>
        <p className="mt-2 text-sm text-yellow-700">
          Please install{' '}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-yellow-900"
          >
            MetaMask
          </a>{' '}
          to use wallet login.
        </p>
      </div>
    );
  }

  const loading = walletLoading || authLoading;
  const error = authError || walletError;

  return (
    <div className={`space-y-4 ${className}`}>
      {!isConnected ? (
        // Step 1: Connect Wallet
        <Button
          onClick={connect}
          loading={loading}
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
        >
          <WalletIcon />
          Connect Wallet
        </Button>
      ) : !isQINetwork ? (
        // Step 2: Switch to QI Network
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Connected: {address ? walletService.formatAddress(address) : ''}</span>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Please switch to QI Network to continue
            </p>
          </div>
          <Button
            onClick={switchNetwork}
            loading={loading}
            variant="primary"
            className="w-full"
          >
            Switch to QI Network
          </Button>
        </div>
      ) : (
        // Step 3: Sign & Login
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>QI Network: {address ? walletService.formatAddress(address) : ''}</span>
          </div>
          <Button
            onClick={handleWalletLogin}
            loading={loading}
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
          >
            <WalletIcon />
            Sign in with Wallet
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <p className="text-xs text-gray-500 text-center">
        Secure login using your QI Network wallet
      </p>
    </div>
  );
}

function WalletIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

function WalletWarningIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

export default WalletLogin;
