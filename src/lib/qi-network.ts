// src/lib/qi-network.ts
// QI (QIE) Blockchain Network Configuration

// Network type configuration
type NetworkType = 'mainnet' | 'testnet';

interface NetworkConfig {
  chainId: number;
  chainIdHex: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

// Get network type from environment variable
const getNetworkType = (): NetworkType => {
  // const networkType = process.env.NEXT_PUBLIC_NETWORK_TYPE;
  // if (networkType === 'mainnet' || networkType === 'testnet') {
  //   return networkType;
  // }
  // Default to testnet for development safety
  return 'testnet';
};

// Network configurations
const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
  mainnet: {
    chainId: 5656,
    chainIdHex: '0x1618', // 5656 in hex
    chainName: 'QIE Blockchain',
    nativeCurrency: {
      name: 'QIE',
      symbol: 'QIE',
      decimals: 18,
    },
    rpcUrls: [
      'https://rpc-main1.qiblockchain.online',
      'https://rpc-main2.qiblockchain.online',
    ],
    blockExplorerUrls: ['https://explorer.qiblockchain.online'],
  },
  testnet: {
    chainId: 6531,
    chainIdHex: '0x1973', // 6531 in hex
    chainName: 'QIE Testnet',
    nativeCurrency: {
      name: 'QIE',
      symbol: 'QIE',
      decimals: 18,
    },
    rpcUrls: [
      'https://rpc1testnet.qie.digital',
      // 'https://rpc-testnet2.qiblockchain.online',
    ],
    blockExplorerUrls: ['https://testnet.qie.digital/'],
  },
};

// Export current network configuration
export const CURRENT_NETWORK: NetworkType = getNetworkType();
export const QI_NETWORK_CONFIG: NetworkConfig = NETWORK_CONFIGS[CURRENT_NETWORK];

// Network parameters for adding to MetaMask
export const QI_NETWORK_PARAMS = {
  chainId: QI_NETWORK_CONFIG.chainIdHex,
  chainName: QI_NETWORK_CONFIG.chainName,
  nativeCurrency: QI_NETWORK_CONFIG.nativeCurrency,
  rpcUrls: QI_NETWORK_CONFIG.rpcUrls,
  blockExplorerUrls: QI_NETWORK_CONFIG.blockExplorerUrls,
};

// Get the primary RPC URL
export const getQIRpcUrl = (): string => {
  return QI_NETWORK_CONFIG.rpcUrls[0];
};

// Validate if a chain ID is the QI Network (checks current network)
export const isQINetwork = (chainId: number | string): boolean => {
  const numericChainId = typeof chainId === 'string' 
  ? parseInt(chainId, chainId.startsWith('0x') ? 16 : 10)
  : chainId;
  return numericChainId === QI_NETWORK_CONFIG.chainId;
};

// Get network display name for UI
export const getNetworkDisplayName = (): string => {
  return `${QI_NETWORK_CONFIG.chainName} (${CURRENT_NETWORK})`;
};
