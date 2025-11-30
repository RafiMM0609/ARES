// src/types/ethereum.d.ts
// Type declarations for window.ethereum (MetaMask and other wallet providers)

interface EthereumEvent {
  connect: { chainId: string };
  disconnect: { error: { message: string; code: number } };
  accountsChanged: string[];
  chainChanged: string;
  message: { type: string; data: unknown };
}

interface RequestArguments {
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

interface EthereumProvider {
  isMetaMask?: boolean;
  isCoinbaseWallet?: boolean;
  isWalletConnect?: boolean;
  request: (args: RequestArguments) => Promise<unknown>;
  on<K extends keyof EthereumEvent>(event: K, handler: (data: EthereumEvent[K]) => void): void;
  removeListener<K extends keyof EthereumEvent>(event: K, handler: (data: EthereumEvent[K]) => void): void;
  selectedAddress: string | null;
  chainId: string | null;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};
