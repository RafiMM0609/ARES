# Ethers.js Usage Examples

This directory contains example code demonstrating how to use the Ethers.js utilities for QI Network integration in the ARES platform.

## Overview

The examples in this directory are for **reference and learning purposes only**. They demonstrate various use cases and patterns for interacting with the QI Network using our Ethers.js setup.

## Files

- **`ethers-usage-examples.ts`** - Comprehensive examples covering all major use cases

## Important Notes

⚠️ **Do not run these files directly**. They are meant to be reference material. Copy the relevant code snippets into your application code as needed.

## Examples Included

### 1. Provider Setup
Learn how to initialize providers for browser-based wallet connections and RPC connections.

### 2. Sending QIE Tokens
Simple examples of sending native QIE tokens from one address to another.

### 3. Smart Contract Reading
Read data from smart contracts using view/pure functions.

### 4. Smart Contract Writing
Execute state-changing functions on smart contracts.

### 5. Event Listening
Listen for and react to smart contract events in real-time.

### 6. Transaction Monitoring
Monitor transaction status with polling and callbacks.

### 7. Address Utilities
Validate and format Ethereum addresses.

### 8. Unit Conversions
Convert between Wei, Gwei, and Ether units.

### 9. Message Signing
Sign messages with wallet for authentication and verification.

### 10. Hashing
Use keccak256 and other hashing functions.

### 11. Complete Payment Flow
End-to-end example with error handling and best practices.

## Usage in Your Code

To use these examples in your application:

1. Review the example code
2. Copy the relevant function or pattern
3. Adapt it to your specific use case
4. Import the necessary utilities from `@/lib`
5. Test thoroughly on QI Testnet first

## Example Integration

```typescript
import { sendQIE, waitForConfirmation } from '@/lib';

async function handlePayment(to: string, amount: string) {
  try {
    const tx = await sendQIE(to, amount);
    const receipt = await waitForConfirmation(tx.hash, 2);
    return { success: true, receipt };
  } catch (error) {
    return { success: false, error };
  }
}
```

## Best Practices

1. **Always validate addresses** before sending transactions
2. **Use try-catch blocks** for error handling
3. **Wait for confirmations** for important transactions
4. **Test on testnet first** before mainnet deployment
5. **Monitor transaction status** for better user experience
6. **Handle errors gracefully** with user-friendly messages

## Network Configuration

The examples assume you're using the QI Network (default: testnet). To switch networks, update the configuration in `src/lib/qi-network.ts`.

## Documentation

For complete API reference, see:
- **[ETHERS_SETUP_GUIDE.md](../ETHERS_SETUP_GUIDE.md)** - Complete documentation
- **[README.md](../README.md)** - Project overview

## Support

If you encounter issues or have questions:
1. Check the main documentation
2. Review the Ethers.js v6 documentation
3. Open an issue in the repository

## Security

⚠️ **Security Reminders:**
- Never commit private keys or sensitive data
- Always validate user input
- Use environment variables for sensitive configuration
- Test thoroughly before production deployment
