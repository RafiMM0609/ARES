// src/components/wallet/WalletBalance.tsx
'use client';

import { useWallet } from '@/hooks/useWallet';
import { walletService } from '@/services/wallet.service';
import { Button } from '@/components/ui';

interface WalletBalanceProps {
  className?: string;
  showRefresh?: boolean;
}

export function WalletBalance({ className = '', showRefresh = true }: WalletBalanceProps) {
  const { isConnected, address, balance, isQINetwork, refreshBalance, loading } = useWallet();

  if (!isConnected) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isQINetwork ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        <span className="text-sm text-gray-600 font-mono">
          {address ? walletService.formatAddress(address) : '-'}
        </span>
      </div>
      <div className="text-sm font-semibold text-gray-900">
        {balance ? `${parseFloat(balance).toFixed(4)} QIE` : '-'}
      </div>
      {showRefresh && (
        <Button
          variant="secondary"
          onClick={refreshBalance}
          disabled={loading}
          className="text-xs py-1 px-2"
        >
          ↻
        </Button>
      )}
    </div>
  );
}

export default WalletBalance;
