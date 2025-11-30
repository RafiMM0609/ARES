// src/lib/qi-network.ts
// QI (QIE) Blockchain Network Configuration

export const QI_NETWORK_CONFIG = {
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
};

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

// Validate if a chain ID is the QI Network
export const isQINetwork = (chainId: number | string): boolean => {
  const numericChainId = typeof chainId === 'string' 
    ? parseInt(chainId, chainId.startsWith('0x') ? 16 : 10)
    : chainId;
  return numericChainId === QI_NETWORK_CONFIG.chainId;
};
