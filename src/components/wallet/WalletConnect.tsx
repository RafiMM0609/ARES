// src/components/wallet/WalletConnect.tsx
'use client';

import { useMemo } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { walletService } from '@/services/wallet.service';
import { Button } from '@/components/ui';

interface WalletConnectProps {
  showBalance?: boolean;
  showNetworkStatus?: boolean;
  className?: string;
}

export function WalletConnect({
  showBalance = true,
  showNetworkStatus = true,
  className = '',
}: WalletConnectProps) {
  const {
    isConnected,
    address,
    balance,
    isQINetwork,
    connect,
    disconnect,
    switchNetwork,
    loading,
    error,
  } = useWallet();

  // Memoize wallet availability check to avoid repeated checks on every render
  const isWalletDetected = useMemo(() => {
    if (typeof window === 'undefined') return true; // SSR: assume available
    return walletService.isAvailable();
  }, []);

  // If wallet is not available (e.g., no QIE Wallet or MetaMask)
  if (!isWalletDetected) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-yellow-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">Wallet Not Detected</span>
        </div>
        <p className="mt-2 text-sm text-yellow-700">
          Please install{' '}
          <a
            href="https://www.qiewallet.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-yellow-900 font-medium"
          >
            QIE Wallet
          </a>{' '}
          (recommended) or{' '}
          <a
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-yellow-900"
          >
            MetaMask
          </a>{' '}
          to connect.
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={`space-y-3 ${className}`}>
        <Button
          onClick={connect}
          loading={loading}
          className="w-full flex items-center justify-center gap-2"
        >
          <WalletIcon />
          Connect Wallet
        </Button>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <p className="text-xs text-gray-500">
          Connect to QI Network for payments
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 ${className}`}>
      {/* Connected Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">Connected</span>
        </div>
        <Button
          variant="secondary"
          onClick={disconnect}
          className="text-xs py-1 px-2"
        >
          Disconnect
        </Button>
      </div>

      {/* Address */}
      <div className="bg-white rounded border border-gray-200 px-3 py-2">
        <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
        <p className="font-mono text-sm text-gray-900 break-all">
          {address ? walletService.formatAddress(address) : '-'}
        </p>
      </div>

      {/* Balance */}
      {showBalance && (
        <div className="bg-white rounded border border-gray-200 px-3 py-2">
          <p className="text-xs text-gray-500 mb-1">Balance</p>
          <p className="font-semibold text-gray-900">
            {balance ? `${parseFloat(balance).toFixed(4)} QIE` : '-'}
          </p>
        </div>
      )}

      {/* Network Status */}
      {showNetworkStatus && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isQINetwork ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isQINetwork ? 'QI Network' : 'Wrong Network'}
            </span>
          </div>
          {!isQINetwork && (
            <Button
              variant="primary"
              onClick={switchNetwork}
              loading={loading}
              className="text-xs py-1 px-2"
            >
              Switch to QI
            </Button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
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

export default WalletConnect;
