// examples/ethers-usage-examples.ts
// Example usage of the Ethers.js utilities for QI Network
// These examples demonstrate how to use the setup files

/**
 * IMPORTANT: These are example code snippets for reference.
 * Do not run this file directly. Copy the relevant examples into your application code.
 * 
 * Note: The imports use '@/lib' which is a path alias configured in tsconfig.json.
 * In actual application code within src/, this will resolve correctly.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - This file is for reference only and not meant to be compiled directly

import {
  // Provider setup
  getBrowserProvider,
  getQIRpcProvider,
  getSigner,
  getSignerAddress,
  
  // Contract utilities
  getContract,
  callContractMethod,
  executeAndWait,
  listenToContractEvent,
  
  // Transaction utilities
  sendQIE,
  waitForConfirmation,
  getTransactionStatus,
  monitorTransaction,
  TransactionStatus,
  
  // Web3 utilities
  formatAddress,
  isValidAddress,
  weiToEther,
  etherToWei,
  formatCurrency,
  keccak256,
  signMessage,
  verifyMessage,
} from '@/lib';

// ============================================================================
// Example 1: Basic Provider Setup
// ============================================================================

async function exampleProviderSetup() {
  // Get browser provider (requires MetaMask or compatible wallet)
  const browserProvider = getBrowserProvider();
  if (!browserProvider) {
    console.log('No wallet detected');
    return;
  }

  // Get QI RPC provider (for read-only operations, no wallet needed)
  const rpcProvider = getQIRpcProvider();

  // Get signer (requires wallet connection)
  const signer = await getSigner();
  const address = await getSignerAddress();
  console.log('Connected address:', address);

  // Get balance
  const balance = await rpcProvider.getBalance(address);
  console.log('Balance:', weiToEther(balance), 'QIE');
}

// ============================================================================
// Example 2: Sending QIE Tokens
// ============================================================================

async function exampleSendQIE() {
  const recipientAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const amount = '1.5'; // 1.5 QIE

  try {
    // Send transaction
    const tx = await sendQIE(recipientAddress, amount);
    console.log('Transaction hash:', tx.hash);

    // Wait for confirmation (2 confirmations)
    const receipt = await waitForConfirmation(tx.hash, 2);
    
    if (receipt) {
      console.log('Transaction confirmed!');
      console.log('Block number:', receipt.blockNumber);
      console.log('Gas used:', receipt.gasUsed.toString());
    }
  } catch (error) {
    console.error('Transaction failed:', error);
  }
}

// ============================================================================
// Example 3: Smart Contract Interaction (Read)
// ============================================================================

async function exampleReadContract() {
  const contractAddress = '0x1234567890123456789012345678901234567890';
  const contractABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function totalSupply() view returns (uint256)',
    'function name() view returns (string)',
  ];

  // Create read-only contract instance
  const contract = await getContract(contractAddress, contractABI, false);

  // Call view functions
  const userAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const balance = await callContractMethod(contract, 'balanceOf', [userAddress]);
  const totalSupply = await callContractMethod(contract, 'totalSupply', []);
  const name = await callContractMethod(contract, 'name', []);

  console.log('Token name:', name);
  console.log('Total supply:', totalSupply.toString());
  console.log('User balance:', balance.toString());
}

// ============================================================================
// Example 4: Smart Contract Interaction (Write)
// ============================================================================

async function exampleWriteContract() {
  const contractAddress = '0x1234567890123456789012345678901234567890';
  const contractABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
  ];

  // Create writable contract instance
  const contract = await getContract(contractAddress, contractABI, true);

  const recipientAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const amount = etherToWei('10'); // 10 tokens

  try {
    // Execute transaction and wait for confirmation
    const { transaction, receipt } = await executeAndWait(
      contract,
      'transfer',
      [recipientAddress, amount],
      { 
        gasLimit: BigInt(100000),
        confirmations: 2,
      }
    );

    console.log('Transfer successful!');
    console.log('Transaction hash:', transaction.hash);
    console.log('Block:', receipt?.blockNumber);
  } catch (error) {
    console.error('Transfer failed:', error);
  }
}

// ============================================================================
// Example 5: Listening to Contract Events
// ============================================================================

async function exampleListenToEvents() {
  const contractAddress = '0x1234567890123456789012345678901234567890';
  const contractABI = [
    'event Transfer(address indexed from, address indexed to, uint256 value)',
  ];

  const contract = await getContract(contractAddress, contractABI, false);

  // Listen for Transfer events
  const cleanup = listenToContractEvent(
    contract,
    'Transfer',
    (from: string, to: string, value: bigint) => {
      console.log('Transfer detected:');
      console.log('From:', from);
      console.log('To:', to);
      console.log('Value:', weiToEther(value), 'tokens');
    }
  );

  // Stop listening after 1 hour
  setTimeout(() => {
    cleanup();
    console.log('Stopped listening for events');
  }, 3600000);
}

// ============================================================================
// Example 6: Transaction Monitoring
// ============================================================================

async function exampleMonitorTransaction() {
  const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  const stopMonitoring = monitorTransaction(
    txHash,
    (status, receipt) => {
      console.log('Transaction status:', status);

      switch (status) {
        case TransactionStatus.PENDING:
          console.log('Transaction is pending...');
          break;
        case TransactionStatus.CONFIRMED:
          console.log('Transaction confirmed!');
          console.log('Block:', receipt?.blockNumber);
          break;
        case TransactionStatus.FAILED:
          console.log('Transaction failed!');
          break;
        case TransactionStatus.UNKNOWN:
          console.log('Transaction status unknown');
          break;
      }
    },
    5000 // Check every 5 seconds
  );

  // Can stop monitoring manually if needed
  // stopMonitoring();
}

// ============================================================================
// Example 7: Address Validation and Formatting
// ============================================================================

async function exampleAddressUtils() {
  const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  // Validate address
  if (isValidAddress(address)) {
    console.log('Valid address');
  }

  // Format address for display (truncate middle)
  const shortAddress = formatAddress(address);
  console.log('Formatted:', shortAddress); // "0x742d...f0bEb"

  // Custom formatting
  const customFormat = formatAddress(address, 8, 6);
  console.log('Custom format:', customFormat); // "0x742d35...5f0bEb"
}

// ============================================================================
// Example 8: Unit Conversions
// ============================================================================

async function exampleUnitConversions() {
  // Wei to Ether
  const weiAmount = BigInt('1000000000000000000'); // 1 ether in wei
  const etherAmount = weiToEther(weiAmount);
  console.log('Amount in Ether:', etherAmount); // "1.0"

  // Ether to Wei
  const etherValue = '1.5';
  const weiValue = etherToWei(etherValue);
  console.log('Amount in Wei:', weiValue.toString()); // "1500000000000000000"

  // Format currency
  const formatted = formatCurrency('1.234567', 'QIE', 2);
  console.log('Formatted currency:', formatted); // "1.23 QIE"
}

// ============================================================================
// Example 9: Message Signing and Verification
// ============================================================================

async function exampleMessageSigning() {
  const message = 'Sign this message to verify your wallet ownership';

  try {
    // Sign message with wallet
    const signature = await signMessage(message);
    console.log('Signature:', signature);

    // Verify signature
    const signerAddress = verifyMessage(message, signature);
    console.log('Signer address:', signerAddress);

    // Check if signer matches expected address
    const expectedAddress = await getSignerAddress();
    if (signerAddress.toLowerCase() === expectedAddress.toLowerCase()) {
      console.log('Signature verified!');
    }
  } catch (error) {
    console.error('Signing failed:', error);
  }
}

// ============================================================================
// Example 10: Hashing
// ============================================================================

async function exampleHashing() {
  const data = 'Hello, QI Network!';
  
  // Hash a string
  const hash = keccak256(data);
  console.log('Hash:', hash);

  // This is useful for creating unique identifiers or verifying data integrity
}

// ============================================================================
// Example 11: Complete Payment Flow with Error Handling
// ============================================================================

async function exampleCompletePaymentFlow() {
  const recipientAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const amount = '1.5';

  try {
    // Validate recipient address
    if (!isValidAddress(recipientAddress)) {
      throw new Error('Invalid recipient address');
    }

    // Send transaction
    console.log(`Sending ${amount} QIE to ${formatAddress(recipientAddress)}...`);
    const tx = await sendQIE(recipientAddress, amount);
    console.log('Transaction submitted:', tx.hash);

    // Monitor transaction status
    let isMonitoring = true;
    const stopMonitoring = monitorTransaction(
      tx.hash,
      (status, receipt) => {
        if (!isMonitoring) return;

        switch (status) {
          case TransactionStatus.PENDING:
            console.log('⏳ Transaction pending...');
            break;
          case TransactionStatus.CONFIRMED:
            console.log('✅ Transaction confirmed!');
            if (receipt) {
              console.log('Block:', receipt.blockNumber);
              console.log('Gas used:', receipt.gasUsed.toString());
            }
            isMonitoring = false;
            break;
          case TransactionStatus.FAILED:
            console.log('❌ Transaction failed!');
            isMonitoring = false;
            break;
        }
      },
      3000
    );

    // Wait for confirmation
    const receipt = await waitForConfirmation(tx.hash, 2);
    stopMonitoring();

    if (receipt && receipt.status === 1) {
      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } else {
      return {
        success: false,
        error: 'Transaction failed',
      };
    }
  } catch (error) {
    console.error('Payment flow error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export examples for reference
export {
  exampleProviderSetup,
  exampleSendQIE,
  exampleReadContract,
  exampleWriteContract,
  exampleListenToEvents,
  exampleMonitorTransaction,
  exampleAddressUtils,
  exampleUnitConversions,
  exampleMessageSigning,
  exampleHashing,
  exampleCompletePaymentFlow,
};
