// src/lib/contract-utils.ts
// Smart contract interaction utilities for QI Network

import { ethers, Contract, ContractInterface, BrowserProvider, JsonRpcProvider, InterfaceAbi } from 'ethers';
import { getBrowserProvider, getQIRpcProvider, getSigner } from './ethers-setup';

/**
 * Create a contract instance for read-only operations
 * Uses JSON-RPC provider, no wallet required
 */
export function getReadOnlyContract(
  address: string,
  abi: InterfaceAbi,
  provider?: JsonRpcProvider
): Contract {
  const prov = provider || getQIRpcProvider();
  return new ethers.Contract(address, abi, prov);
}

/**
 * Create a contract instance for read-write operations
 * Requires wallet connection and signer
 */
export async function getWritableContract(
  address: string,
  abi: InterfaceAbi
): Promise<Contract> {
  const signer = await getSigner();
  return new ethers.Contract(address, abi, signer);
}

/**
 * Get contract instance that can be used for both read and write
 * Automatically uses signer if available, otherwise uses RPC provider
 */
export async function getContract(
  address: string,
  abi: InterfaceAbi,
  writeable: boolean = false
): Promise<Contract> {
  if (writeable) {
    return getWritableContract(address, abi);
  }
  return getReadOnlyContract(address, abi);
}

/**
 * Call a read-only contract function (view/pure functions)
 * @param contract - Contract instance
 * @param methodName - Name of the contract method
 * @param args - Arguments to pass to the method
 */
export async function callContractMethod<T = unknown>(
  contract: Contract,
  methodName: string,
  args: unknown[] = []
): Promise<T> {
  try {
    const result = await contract[methodName](...args);
    return result as T;
  } catch (error) {
    console.error(`Failed to call contract method ${methodName}:`, error);
    throw error;
  }
}

/**
 * Execute a state-changing contract transaction
 * @param contract - Contract instance (must be writable)
 * @param methodName - Name of the contract method
 * @param args - Arguments to pass to the method
 * @param options - Transaction options (gasLimit, value, etc.)
 */
export async function executeContractTransaction(
  contract: Contract,
  methodName: string,
  args: unknown[] = [],
  options: {
    gasLimit?: bigint;
    value?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  } = {}
) {
  try {
    const tx = await contract[methodName](...args, options);
    return tx;
  } catch (error) {
    console.error(`Failed to execute contract transaction ${methodName}:`, error);
    throw error;
  }
}

/**
 * Wait for a contract transaction to be mined
 * @param transaction - Transaction response from contract call
 * @param confirmations - Number of confirmations to wait for (default: 1)
 */
export async function waitForTransaction(
  transaction: ethers.ContractTransactionResponse,
  confirmations: number = 1
) {
  try {
    const receipt = await transaction.wait(confirmations);
    return receipt;
  } catch (error) {
    console.error('Failed to wait for transaction:', error);
    throw error;
  }
}

/**
 * Execute a contract transaction and wait for confirmation
 * Combines executeContractTransaction and waitForTransaction
 */
export async function executeAndWait(
  contract: Contract,
  methodName: string,
  args: unknown[] = [],
  options: {
    gasLimit?: bigint;
    value?: bigint;
    confirmations?: number;
  } = {}
) {
  const { confirmations = 1, ...txOptions } = options;
  const tx = await executeContractTransaction(contract, methodName, args, txOptions);
  const receipt = await waitForTransaction(tx, confirmations);
  return { transaction: tx, receipt };
}

/**
 * Estimate gas for a contract method call
 */
export async function estimateContractGas(
  contract: Contract,
  methodName: string,
  args: unknown[] = []
): Promise<bigint> {
  try {
    const gasEstimate = await contract[methodName].estimateGas(...args);
    return gasEstimate;
  } catch (error) {
    console.error(`Failed to estimate gas for ${methodName}:`, error);
    throw error;
  }
}

/**
 * Parse contract event logs from a transaction receipt
 */
export function parseContractEvents(
  contract: Contract,
  receipt: ethers.ContractTransactionReceipt | null
) {
  if (!receipt) return [];
  
  const events = [];
  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog({
        topics: [...log.topics],
        data: log.data,
      });
      if (parsedLog) {
        events.push({
          name: parsedLog.name,
          args: parsedLog.args,
          signature: parsedLog.signature,
        });
      }
    } catch {
      // Log doesn't belong to this contract or couldn't be parsed
      continue;
    }
  }
  return events;
}

/**
 * Listen for contract events
 * @param contract - Contract instance
 * @param eventName - Name of the event to listen for
 * @param callback - Function to call when event is emitted
 * @returns Cleanup function to remove the listener
 */
export function listenToContractEvent(
  contract: Contract,
  eventName: string,
  callback: (...args: unknown[]) => void
): () => void {
  contract.on(eventName, callback);
  
  // Return cleanup function
  return () => {
    contract.off(eventName, callback);
  };
}

/**
 * Get past contract events
 * @param contract - Contract instance
 * @param eventName - Name of the event
 * @param fromBlock - Starting block number (default: 0)
 * @param toBlock - Ending block number (default: 'latest')
 */
export async function getPastEvents(
  contract: Contract,
  eventName: string,
  fromBlock: number | string = 0,
  toBlock: number | string = 'latest'
) {
  try {
    const filter = contract.filters[eventName]();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    return events;
  } catch (error) {
    console.error(`Failed to get past events for ${eventName}:`, error);
    throw error;
  }
}

/**
 * Check if an address is a contract
 * @param address - Address to check
 * @param provider - Provider to use for checking
 */
export async function isContract(
  address: string,
  provider?: BrowserProvider | JsonRpcProvider
): Promise<boolean> {
  const prov = provider || getQIRpcProvider();
  const code = await prov.getCode(address);
  return code !== '0x';
}

/**
 * Get contract bytecode
 */
export async function getContractBytecode(
  address: string,
  provider?: BrowserProvider | JsonRpcProvider
): Promise<string> {
  const prov = provider || getQIRpcProvider();
  return prov.getCode(address);
}
