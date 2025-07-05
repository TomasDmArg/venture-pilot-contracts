# USDC Contract Documentation

This project includes an ERC20 USDC smart contract with minting capabilities deployed on the MoneyMule network.

## Quick Setup Guide

### Prerequisites

Ensure you have the following configured before deployment:

1. **Environment Configuration**
   
   Create a `.env` file in your project root with the following variables:
   
   ```env
   PRIVATE_KEY=your_private_key_here
   MONEYMULE_RPC_URL=https://moneymule-2751721147387000-1.jsonrpc.sagarpc.io
   GENESIS_ADDRESSES=0xaddress1,0xaddress2,0xaddress3
   INITIAL_MINT_AMOUNT=1000000000
   ```

2. **Contract Deployment**
   
   Deploy the USDC contract to the MoneyMule network:
   
   ```bash
   npm run deploy:usdc
   ```

3. **Contract Verification**
   
   Verify the deployed contract:
   
   ```bash
   npm run verify:usdc
   ```

## Available Commands

### Main Network Commands

```bash
# Compile smart contracts
npm run compile

# Deploy USDC contract to MoneyMule network
npm run deploy:usdc

# Verify USDC contract on MoneyMule network
npm run verify:usdc

# Mint additional tokens
npm run mint:usdc
```

### Local Development Commands

```bash
# Deploy USDC contract locally
npm run deploy:usdc:local

# Verify USDC contract locally
npm run verify:usdc:local

# Mint tokens locally
npm run mint:usdc:local
```

## Network Information

### MoneyMule Network Specifications

| Parameter | Value |
|-----------|-------|
| **Chain ID** | 2751721147387000 |
| **RPC URL** | https://moneymule-2751721147387000-1.jsonrpc.sagarpc.io |
| **Native Currency** | mule |
| **Block Explorer** | https://moneymule-2751721147387000-1.sagaexplorer.io:443a |

## Deployed Contract Details

### Test USDC Contract

**Faucet**: To be determined (TBD)

| Property | Value |
|----------|-------|
| **Contract Address** | `0xA2bE65F0Bfb810eF7B17807F3cd10D428f989A4a` |
| **Contract Name** | USD Coin |
| **Contract Symbol** | USDC |
| **Contract Decimals** | 6 |
| **Contract Owner** | `0xa6e4e006EeD9fEA0C378A42d32a033F4B4f4A15b` |
| **Total Supply** | 3,000,000,000 USDC |

## Usage Notes

- The contract implements the ERC20 standard with additional minting functionality
- Only the contract owner can mint new tokens
- The contract is deployed on the MoneyMule testnet for development and testing purposes
- All transactions require sufficient mule tokens for gas fees

## Support

For technical support or questions regarding the USDC contract implementation, please refer to the project documentation or contact the development team.
