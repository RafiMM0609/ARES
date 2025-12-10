# Ethers.js Setup for QI Network Integration

This directory contains a comprehensive setup and utility functions for integrating with the QI Network (QIE Blockchain) using Ethers.js v6.

## Overview

The ARES platform uses Ethers.js for Web3 integration with the QI Network, which is an EVM-compatible blockchain. The setup is organized into modular files for better maintainability.

## File Structure

### Core Setup Files

- **`ethers-setup.ts`** - Provider setup and initialization
- **`contract-utils.ts`** - Smart contract interaction utilities
- **`transaction-utils.ts`** - Transaction building and monitoring
- **`web3-utils.ts`** - General Web3 utility functions
- **`qi-network.ts`** - QI Network configuration
- **`wallet-auth.ts`** - Wallet authentication utilities
- **`index.ts`** - Central export file

## Quick Start

### 1. Provider Setup

```typescript
import { getBrowserProvider, getQIRpcProvider, getSigner } from '@/lib/ethers-setup';

// Get browser provider (requires MetaMask or compatible wallet)
const browserProvider = getBrowserProvider();

// Get QI RPC provider (for read-only operations)
const rpcProvider = getQIRpcProvider();

// Get signer for transactions
const signer = await getSigner();
```

### 2. Wallet Connection

```typescript
import { useWallet } from '@/hooks';

function WalletComponent() {
  const { connect, disconnect, address, balance, isConnected } = useWallet();
  
  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Address: {address}</p>
          <p>Balance: {balance} QIE</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}
```

### 3. Sending Transactions

```typescript
import { sendQIE, waitForConfirmation } from '@/lib/transaction-utils';

// Send QIE tokens
const tx = await sendQIE(recipientAddress, '1.5'); // Send 1.5 QIE
console.log('Transaction hash:', tx.hash);

// Wait for confirmation
const receipt = await waitForConfirmation(tx.hash, 2); // Wait for 2 confirmations
console.log('Transaction confirmed:', receipt);
```

### 4. Smart Contract Interaction

```typescript
import { getContract, callContractMethod, executeAndWait } from '@/lib/contract-utils';

// Create contract instance
const contract = await getContract(contractAddress, contractABI, true);

// Read from contract (view/pure functions)
const result = await callContractMethod(contract, 'balanceOf', [userAddress]);

// Write to contract (state-changing functions)
const { transaction, receipt } = await executeAndWait(
  contract,
  'transfer',
  [recipientAddress, ethers.parseEther('10')],
  { gasLimit: 100000n }
);
```

### 5. Utility Functions

```typescript
import {
  formatAddress,
  isValidAddress,
  weiToEther,
  etherToWei,
  formatCurrency,
} from '@/lib/web3-utils';

// Format address for display
const shortAddress = formatAddress('0x1234...5678'); // "0x1234...5678"

// Validate address
const valid = isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

// Convert units
const ether = weiToEther(1000000000000000000n); // "1.0"
const wei = etherToWei('1.5'); // 1500000000000000000n

// Format currency
const formatted = formatCurrency('1.234567', 'QIE', 2); // "1.23 QIE"
```

## QI Network Configuration

The QI Network is configured in `qi-network.ts`:

- **Mainnet Chain ID**: 5656 (0x1618)
- **Testnet Chain ID**: 6531 (0x1973)
- **Native Currency**: QIE
- **RPC URLs**: Multiple endpoints for redundancy
- **Block Explorer**: https://explorer.qiblockchain.online (mainnet)

Currently defaults to **testnet** for safety during development.

## API Reference

### Ethers Setup (`ethers-setup.ts`)

#### Provider Functions

- `getBrowserProvider()` - Get MetaMask/wallet provider
- `getQIRpcProvider()` - Get QI Network RPC provider
- `getCustomRpcProvider(url, chainId?)` - Get custom RPC provider
- `getSigner(accountIndex?)` - Get wallet signer
- `getSignerAddress()` - Get connected wallet address

#### Network Functions

- `isProviderReady(provider)` - Check if provider is connected
- `getNetworkInfo(provider)` - Get current network information
- `isConnectedToQINetwork(provider)` - Check if on QI Network
- `getCurrentBlockNumber(provider?)` - Get current block number
- `getBlock(blockNumber, provider?)` - Get block information
- `getGasPrice(provider?)` - Get current gas price
- `estimateGas(transaction, provider?)` - Estimate gas for transaction

### Contract Utils (`contract-utils.ts`)

#### Contract Instance Creation

- `getReadOnlyContract(address, abi, provider?)` - Read-only contract
- `getWritableContract(address, abi)` - Read-write contract
- `getContract(address, abi, writable?)` - Auto-select contract type

#### Contract Interactions

- `callContractMethod(contract, methodName, args?)` - Call read-only method
- `executeContractTransaction(contract, methodName, args?, options?)` - Execute transaction
- `waitForTransaction(transaction, confirmations?)` - Wait for tx confirmation
- `executeAndWait(contract, methodName, args?, options?)` - Execute and wait
- `estimateContractGas(contract, methodName, args?)` - Estimate gas

#### Events

- `parseContractEvents(contract, receipt)` - Parse events from receipt
- `listenToContractEvent(contract, eventName, callback)` - Listen for events
- `getPastEvents(contract, eventName, fromBlock?, toBlock?)` - Query past events

#### Utilities

- `isContract(address, provider?)` - Check if address is a contract
- `getContractBytecode(address, provider?)` - Get contract bytecode

### Transaction Utils (`transaction-utils.ts`)

#### Building Transactions

- `buildTransferTransaction(to, amount, from?)` - Build QIE transfer
- `buildTransaction(params)` - Build custom transaction
- `sendTransaction(transaction)` - Send prepared transaction
- `sendQIE(to, amount)` - Quick QIE transfer

#### Transaction Monitoring

- `waitForConfirmation(txHash, confirmations?, timeout?)` - Wait for confirmation
- `getTransactionStatus(txHash)` - Get transaction status
- `getTransaction(txHash)` - Get transaction details
- `getTransactionReceipt(txHash)` - Get transaction receipt
- `isTransactionSuccessful(txHash)` - Check if transaction succeeded

#### Transaction Information

- `calculateTransactionFee(receipt)` - Calculate fee from receipt
- `formatTransactionReceipt(receipt)` - Format receipt for display
- `estimateTransactionCost(transaction)` - Estimate total cost
- `getRecommendedGasPrice(multiplier?)` - Get gas price with multiplier

#### Advanced

- `monitorTransaction(txHash, callback, interval?)` - Monitor with polling
- `cancelTransaction(txHash)` - Cancel pending transaction

### Web3 Utils (`web3-utils.ts`)

#### Address Utilities

- `formatAddress(address, startChars?, endChars?)` - Format for display
- `isValidAddress(address)` - Validate Ethereum address
- `getChecksumAddress(address)` - Get checksummed address
- `normalizeAddress(address)` - Normalize to lowercase
- `isSameAddress(addr1, addr2)` - Compare addresses

#### Unit Conversion

- `weiToEther(wei)` - Convert Wei to Ether
- `etherToWei(ether)` - Convert Ether to Wei
- `weiToGwei(wei)` - Convert Wei to Gwei
- `gweiToWei(gwei)` - Convert Gwei to Wei
- `convertUnits(value, fromUnit, toUnit)` - Convert between units
- `formatCurrency(amount, symbol?, decimals?)` - Format with symbol
- `formatCurrencyAuto(amount, symbol?)` - Auto-precision formatting

#### Hexadecimal Utilities

- `stringToHex(str)` - Convert string to hex
- `hexToString(hex)` - Convert hex to string
- `numberToHex(num)` - Convert number to hex
- `hexToNumber(hex)` - Convert hex to number
- `padHex(hex, bytes)` - Pad hex to byte length

#### Hashing

- `keccak256(data)` - Compute keccak256 hash
- `keccak256Hex(hex)` - Hash hex string
- `randomBytes32()` - Generate random bytes32
- `randomBytes(length)` - Generate random bytes

#### Block & Timestamp

- `getCurrentTimestamp()` - Get current block timestamp
- `getBlockTimestamp(blockNumber)` - Get block timestamp
- `estimateBlockAtTimestamp(timestamp, avgBlockTime?)` - Estimate block number
- `secondsToBlocks(seconds, avgBlockTime?)` - Convert seconds to blocks
- `blocksToSeconds(blocks, avgBlockTime?)` - Convert blocks to seconds

#### Data Encoding/Decoding

- `encodeFunctionData(abi, functionName, args?)` - Encode function call
- `decodeFunctionResult(abi, functionName, data)` - Decode function result
- `encodeParameters(types, values)` - Encode parameters
- `decodeParameters(types, data)` - Decode parameters

#### Signatures

- `signMessage(message)` - Sign message with wallet
- `verifyMessage(message, signature)` - Verify signed message
- `recoverAddress(messageHash, signature)` - Recover signer address

#### Miscellaneous

- `isBytes32(value)` - Check if valid bytes32
- `isTransactionHash(value)` - Check if valid tx hash
- `parseBigNumber(value)` - Parse bigint string
- `formatNumber(num, decimals?)` - Format with thousand separators

## Examples

### Example 1: Complete Payment Flow

```typescript
import { sendQIE, waitForConfirmation, formatTransactionReceipt } from '@/lib';

async function sendPayment(to: string, amount: string) {
  try {
    // Send transaction
    const tx = await sendQIE(to, amount);
    console.log('Transaction sent:', tx.hash);
    
    // Wait for confirmation
    const receipt = await waitForConfirmation(tx.hash, 2);
    
    if (receipt) {
      const formatted = formatTransactionReceipt(receipt);
      console.log('Payment confirmed:', formatted);
      return { success: true, receipt: formatted };
    }
  } catch (error) {
    console.error('Payment failed:', error);
    return { success: false, error };
  }
}
```

### Example 2: Contract Event Listening

```typescript
import { getContract, listenToContractEvent } from '@/lib';

async function watchTransfers() {
  const contract = await getContract(tokenAddress, tokenABI, false);
  
  // Listen for Transfer events
  const cleanup = listenToContractEvent(
    contract,
    'Transfer',
    (from, to, amount) => {
      console.log(`Transfer: ${from} -> ${to}, Amount: ${amount}`);
    }
  );
  
  // Stop listening after 1 hour
  setTimeout(cleanup, 3600000);
}
```

### Example 3: Transaction Monitoring

```typescript
import { monitorTransaction, TransactionStatus } from '@/lib';

function trackTransaction(txHash: string) {
  const stopMonitoring = monitorTransaction(
    txHash,
    (status, receipt) => {
      console.log('Status:', status);
      
      if (status === TransactionStatus.CONFIRMED) {
        console.log('Transaction confirmed!', receipt);
      } else if (status === TransactionStatus.FAILED) {
        console.log('Transaction failed!', receipt);
      }
    },
    5000 // Check every 5 seconds
  );
  
  // Can stop monitoring manually
  // stopMonitoring();
}
```

## Best Practices

1. **Always validate addresses** before sending transactions
2. **Use try-catch blocks** for all async operations
3. **Wait for confirmations** for important transactions
4. **Estimate gas** before executing transactions
5. **Use read-only providers** when you don't need to write
6. **Handle network switching** gracefully
7. **Monitor transaction status** for better UX
8. **Cache provider instances** to avoid unnecessary recreations

## Error Handling

```typescript
import { sendQIE } from '@/lib';

async function safeSend(to: string, amount: string) {
  try {
    const tx = await sendQIE(to, amount);
    return { success: true, tx };
  } catch (error) {
    if (error.code === 'ACTION_REJECTED') {
      return { success: false, error: 'User rejected transaction' };
    } else if (error.code === 'INSUFFICIENT_FUNDS') {
      return { success: false, error: 'Insufficient funds' };
    } else {
      return { success: false, error: error.message };
    }
  }
}
```

## Testing

Test your integration on QI Testnet before deploying to mainnet:

1. Switch to testnet in `qi-network.ts`
2. Get testnet QIE from faucet
3. Test all functionality
4. Switch to mainnet for production

## Security Notes

- Never expose private keys
- Always validate user input
- Use checksummed addresses
- Implement rate limiting for RPC calls
- Monitor for unusual activity
- Keep Ethers.js updated

## Support

For issues or questions:
- Check the [Ethers.js documentation](https://docs.ethers.org/v6/)
- Review QI Network documentation
- Open an issue in the repository

## License

This code is part of the ARES platform and follows the same license.
