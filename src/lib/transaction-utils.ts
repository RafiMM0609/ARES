// src/lib/transaction-utils.ts
// Transaction building and monitoring utilities for QI Network

import { ethers, TransactionRequest, TransactionResponse, TransactionReceipt } from 'ethers';
import { getBrowserProvider, getQIRpcProvider, getSigner, getGasPrice } from './ethers-setup';
import { parseEther, formatEther } from 'ethers';

/**
 * Transaction status enum
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  UNKNOWN = 'unknown',
}

/**
 * Build a simple QIE transfer transaction
 */
export async function buildTransferTransaction(
  toAddress: string,
  amount: string,
  fromAddress?: string
): Promise<TransactionRequest> {
  const provider = getQIRpcProvider();
  const gasPrice = await getGasPrice(provider);
  
  const transaction: TransactionRequest = {
    to: toAddress,
    value: parseEther(amount),
    gasPrice,
    gasLimit: BigInt(21000), // Standard gas limit for simple transfers
  };

  if (fromAddress) {
    transaction.from = fromAddress;
  }

  return transaction;
}

/**
 * Build a transaction with data (for contract interactions)
 */
export async function buildTransaction(params: {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: bigint;
  from?: string;
}): Promise<TransactionRequest> {
  const provider = getQIRpcProvider();
  const gasPrice = await getGasPrice(provider);

  const transaction: TransactionRequest = {
    to: params.to,
    gasPrice,
  };

  if (params.value) {
    transaction.value = parseEther(params.value);
  }

  if (params.data) {
    transaction.data = params.data;
  }

  if (params.gasLimit) {
    transaction.gasLimit = params.gasLimit;
  }

  if (params.from) {
    transaction.from = params.from;
  }

  return transaction;
}

/**
 * Send a transaction using the connected wallet
 */
export async function sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse> {
  const signer = await getSigner();
  return signer.sendTransaction(transaction);
}

/**
 * Send a simple QIE transfer
 */
export async function sendQIE(toAddress: string, amount: string): Promise<TransactionResponse> {
  const signer = await getSigner();
  const transaction = await buildTransferTransaction(toAddress, amount);
  return signer.sendTransaction(transaction);
}

/**
 * Wait for transaction confirmation
 * @param txHash - Transaction hash
 * @param confirmations - Number of block confirmations to wait for
 * @param timeout - Timeout in milliseconds (default: 120000 = 2 minutes)
 */
export async function waitForConfirmation(
  txHash: string,
  confirmations: number = 1,
  timeout: number = 120000
): Promise<TransactionReceipt | null> {
  const provider = getQIRpcProvider();
  
  // Create a promise that rejects after timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Transaction confirmation timeout')), timeout);
  });

  // Race between transaction wait and timeout
  try {
    const receipt = await Promise.race([
      provider.waitForTransaction(txHash, confirmations),
      timeoutPromise,
    ]);
    return receipt;
  } catch (error) {
    console.error('Error waiting for transaction confirmation:', error);
    throw error;
  }
}

/**
 * Get transaction status
 */
export async function getTransactionStatus(txHash: string): Promise<TransactionStatus> {
  const provider = getQIRpcProvider();
  
  try {
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      // Check if transaction exists but is not yet mined
      const tx = await provider.getTransaction(txHash);
      if (tx) {
        return TransactionStatus.PENDING;
      }
      return TransactionStatus.UNKNOWN;
    }
    
    // Receipt exists, check status
    if (receipt.status === 1) {
      return TransactionStatus.CONFIRMED;
    } else {
      return TransactionStatus.FAILED;
    }
  } catch (error) {
    console.error('Error getting transaction status:', error);
    return TransactionStatus.UNKNOWN;
  }
}

/**
 * Get transaction details
 */
export async function getTransaction(txHash: string): Promise<TransactionResponse | null> {
  const provider = getQIRpcProvider();
  return provider.getTransaction(txHash);
}

/**
 * Get transaction receipt
 */
export async function getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
  const provider = getQIRpcProvider();
  return provider.getTransactionReceipt(txHash);
}

/**
 * Calculate transaction fee from receipt
 */
export function calculateTransactionFee(receipt: TransactionReceipt): string {
  const gasUsed = receipt.gasUsed;
  const gasPrice = receipt.gasPrice;
  const fee = gasUsed * gasPrice;
  return formatEther(fee);
}

/**
 * Format transaction receipt for display
 */
export function formatTransactionReceipt(receipt: TransactionReceipt) {
  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    from: receipt.from,
    to: receipt.to,
    gasUsed: receipt.gasUsed.toString(),
    gasPrice: receipt.gasPrice.toString(),
    fee: calculateTransactionFee(receipt),
    status: receipt.status === 1 ? 'Success' : 'Failed',
    confirmations: receipt.confirmations,
  };
}

/**
 * Estimate total transaction cost (gas * gasPrice)
 */
export async function estimateTransactionCost(transaction: TransactionRequest): Promise<string> {
  const provider = getQIRpcProvider();
  
  let gasLimit: bigint;
  if (transaction.gasLimit) {
    gasLimit = BigInt(transaction.gasLimit.toString());
  } else {
    gasLimit = await provider.estimateGas(transaction);
  }

  const feeData = await provider.getFeeData();
  const gasPrice = transaction.gasPrice || feeData.gasPrice || BigInt(0);
  
  const cost = gasLimit * BigInt(gasPrice.toString());
  return formatEther(cost);
}

/**
 * Get recommended gas price with multiplier for faster confirmation
 * @param multiplier - Gas price multiplier (e.g., 1.1 for 10% higher)
 */
export async function getRecommendedGasPrice(multiplier: number = 1.0): Promise<bigint> {
  const provider = getQIRpcProvider();
  const feeData = await provider.getFeeData();
  const baseGasPrice = feeData.gasPrice || BigInt(0);
  
  // Apply multiplier and convert to bigint
  const adjustedPrice = BigInt(Math.floor(Number(baseGasPrice) * multiplier));
  return adjustedPrice;
}

/**
 * Monitor transaction status with polling
 * @param txHash - Transaction hash to monitor
 * @param callback - Callback function called on status change
 * @param interval - Polling interval in milliseconds (default: 3000)
 * @returns Function to stop monitoring
 */
export function monitorTransaction(
  txHash: string,
  callback: (status: TransactionStatus, receipt?: TransactionReceipt | null) => void,
  interval: number = 3000
): () => void {
  let isMonitoring = true;
  let lastStatus: TransactionStatus = TransactionStatus.UNKNOWN;

  const checkStatus = async () => {
    if (!isMonitoring) return;

    try {
      const status = await getTransactionStatus(txHash);
      
      // Only call callback if status changed
      if (status !== lastStatus) {
        lastStatus = status;
        
        if (status === TransactionStatus.CONFIRMED || status === TransactionStatus.FAILED) {
          const receipt = await getTransactionReceipt(txHash);
          callback(status, receipt);
          isMonitoring = false; // Stop monitoring after final status
        } else {
          callback(status);
        }
      }

      // Continue monitoring if not in final state
      if (isMonitoring && status === TransactionStatus.PENDING) {
        setTimeout(checkStatus, interval);
      }
    } catch (error) {
      console.error('Error monitoring transaction:', error);
      callback(TransactionStatus.UNKNOWN);
    }
  };

  // Start monitoring
  checkStatus();

  // Return function to stop monitoring
  return () => {
    isMonitoring = false;
  };
}

/**
 * Cancel/replace a pending transaction (by sending with higher gas price)
 * Note: This only works for pending transactions
 */
export async function cancelTransaction(txHash: string): Promise<TransactionResponse | null> {
  const provider = getBrowserProvider();
  if (!provider) {
    throw new Error('Browser provider not available');
  }

  const tx = await provider.getTransaction(txHash);
  if (!tx) {
    throw new Error('Transaction not found');
  }

  const status = await getTransactionStatus(txHash);
  if (status !== TransactionStatus.PENDING) {
    throw new Error('Can only cancel pending transactions');
  }

  // Create a new transaction with same nonce but higher gas price
  const signer = await getSigner();
  const address = await signer.getAddress();
  
  const cancelTx: TransactionRequest = {
    from: address,
    to: address,
    value: BigInt(0),
    nonce: tx.nonce,
    gasPrice: tx.gasPrice ? tx.gasPrice * BigInt(2) : undefined, // Double the gas price
  };

  return signer.sendTransaction(cancelTx);
}

/**
 * Check if transaction was successful
 */
export async function isTransactionSuccessful(txHash: string): Promise<boolean> {
  const receipt = await getTransactionReceipt(txHash);
  return receipt?.status === 1;
}
