# USDC Contract Documentation

![](https://img.shields.io/badge/ERC20-informational?style=flat&logo=ethereum&logoColor=white&color=6aa6f8)
![](https://img.shields.io/badge/Mintable-informational?style=flat&logo=token&logoColor=white&color=6aa6f8)
![](https://img.shields.io/badge/Saga_Chainlet-informational?style=flat&logo=blockchain&logoColor=white&color=6aa6f8)
![](https://img.shields.io/badge/Testing_Token-informational?style=flat&logo=test&logoColor=white&color=6aa6f8)

ERC20 USDC smart contract with minting capabilities deployed on the Saga Chainlet for MoneyMule platform testing.

## Overview

This USDC contract is a standard ERC20 token implementation with additional minting functionality specifically designed for testing the MoneyMule platform. It provides a stable testing environment for funding rounds and milestone-based transactions.

## Contract Details

### 🌐 Deployed Contract
| Property | Value |
|----------|-------|
| **Contract Address** | `0xA2bE65F0Bfb810eF7B17807F3cd10D428f989A4a` |
| **Token Name** | USD Coin |
| **Token Symbol** | USDC |
| **Decimals** | 6 |
| **Total Supply** | 3,000,000,000 USDC |
| **Contract Owner** | `0xa6e4e006EeD9fEA0C378A42d32a033F4B4f4A15b` |

### 🌐 Network Configuration
| Parameter | Value |
|-----------|-------|
| **Chain ID** | 2751721147387000 |
| **RPC URL** | https://moneymule-2751721147387000-1.jsonrpc.sagarpc.io |
| **Native Currency** | mule |
| **Block Explorer** | https://moneymule-2751721147387000-1.sagaexplorer.io |

## Features

### 🔄 **ERC20 Standard**
- Full ERC20 compatibility
- Standard transfer, approve, and allowance functions
- Transfer events and balance tracking
- Decimal precision handling (6 decimals)

### 🪙 **Minting Capabilities**
- Owner-controlled minting
- Batch minting for multiple addresses
- Genesis address pre-minting
- Supply management controls

### 🛡️ **Security Features**
- OpenZeppelin implementation
- Owner-based access control
- Safe transfer mechanisms
- Overflow protection

## Quick Setup

### Prerequisites
```bash
# Install dependencies
npm install

# Compile contracts
npm run compile
```

### Environment Configuration
```env
# Required
PRIVATE_KEY=your-private-key-here

# Network
SAGA_RPC_URL=https://moneymule-2751721147387000-1.jsonrpc.sagarpc.io

# Genesis addresses for initial distribution
GENESIS_ADDRESSES=0xaddress1,0xaddress2,0xaddress3
INITIAL_MINT_AMOUNT=1000000000
```

## Deployment

### 🚀 **Deploy to Saga Chainlet**
```bash
# Deploy USDC contract
npm run deploy:usdc

# Verify deployment
npm run verify:usdc
```

### 🏠 **Local Development**
```bash
# Deploy locally
npm run deploy:usdc:local

# Verify locally
npm run verify:usdc:local
```

## Usage

### 🪙 **Minting Tokens**
```bash
# Mint additional tokens
npm run mint:usdc

# Mint locally
npm run mint:usdc:local
```

### 💰 **Token Operations**
```typescript
import { ethers } from "ethers";

// Connect to USDC contract
const usdc = new ethers.Contract(
  "0xA2bE65F0Bfb810eF7B17807F3cd10D428f989A4a",
  USDCABI,
  signer
);

// Check balance
const balance = await usdc.balanceOf(address);
console.log("Balance:", ethers.formatUnits(balance, 6), "USDC");

// Transfer tokens
await usdc.transfer(recipient, ethers.parseUnits("100", 6));

// Approve spending
await usdc.approve(spender, ethers.parseUnits("1000", 6));

// Mint tokens (owner only)
await usdc.mint(recipient, ethers.parseUnits("500", 6));
```

## Contract Interface

### 📋 **Standard ERC20 Functions**
```solidity
function totalSupply() external view returns (uint256);
function balanceOf(address account) external view returns (uint256);
function transfer(address to, uint256 amount) external returns (bool);
function allowance(address owner, address spender) external view returns (uint256);
function approve(address spender, uint256 amount) external returns (bool);
function transferFrom(address from, address to, uint256 amount) external returns (bool);
```

### 🪙 **Minting Functions**
```solidity
/**
 * @dev Mint tokens to a specific address
 * @param to Address to mint tokens to
 * @param amount Amount to mint (in wei, 6 decimals)
 */
function mint(address to, uint256 amount) external;

/**
 * @dev Batch mint tokens to multiple addresses
 * @param recipients Array of addresses to mint to
 * @param amounts Array of amounts to mint
 */
function batchMint(address[] memory recipients, uint256[] memory amounts) external;
```

### 👑 **Owner Functions**
```solidity
function owner() external view returns (address);
function transferOwnership(address newOwner) external;
function renounceOwnership() external;
```

## Integration with MoneyMule

### 🔗 **Using USDC in Funding Rounds**
```typescript
// Create funding round with USDC
const tx = await factory.createFundingRound(
  "0xA2bE65F0Bfb810eF7B17807F3cd10D428f989A4a", // USDC address
  ethers.parseUnits("10000", 6), // 10,000 USDC target
  fundingDeadline,
  milestones
);

// Approve USDC for round contract
await usdc.approve(roundAddress, ethers.parseUnits("1000", 6));

// Invest with USDC
await round.invest(ethers.parseUnits("1000", 6));
```

### 💸 **Funding Distribution**
```typescript
// Check round token
const roundInfo = await round.getRoundInfo();
console.log("Round token:", roundInfo.tokenAddr);

// Verify it's USDC
const isUSDC = roundInfo.tokenAddr === "0xA2bE65F0Bfb810eF7B17807F3cd10D428f989A4a";
```

## Available NPM Scripts

### 🛠️ **Main Operations**
```bash
# Deployment
npm run deploy:usdc              # Deploy to Saga Chainlet
npm run deploy:usdc:local        # Deploy locally

# Minting
npm run mint:usdc               # Mint tokens on Saga Chainlet
npm run mint:usdc:local         # Mint tokens locally

# Verification
npm run verify:usdc             # Verify on Saga Chainlet
npm run verify:usdc:local       # Verify locally
```

### ⚙️ **Development**
```bash
# Core operations
npm run compile                 # Compile contracts
npm run test                    # Run tests
npm run clean                   # Clean artifacts
```

## Testing

### 🧪 **Test Cases**
The USDC contract includes tests for:
- Standard ERC20 functionality
- Minting and batch minting
- Owner controls and permissions
- Integration with MoneyMule rounds
- Edge cases and error conditions

### 🚀 **Running Tests**
```bash
# Run all tests
npm run test

# Run specific USDC tests
npx hardhat test test/USDC.ts

# Run with coverage
npm run test:coverage
```

## Security Considerations

### 🔒 **Built-in Security**
- **OpenZeppelin Base**: Uses battle-tested ERC20 implementation
- **Owner Controls**: Only owner can mint new tokens
- **Safe Math**: Solidity 0.8+ overflow protection
- **Access Control**: Proper permission checks

### 🛡️ **Best Practices**
1. **Owner Management**: Use multisig wallet for production
2. **Minting Limits**: Monitor total supply increases
3. **Testing**: Thoroughly test all integrations
4. **Monitoring**: Track large transfers and minting events

## Events

### 📊 **ERC20 Events**
```solidity
event Transfer(address indexed from, address indexed to, uint256 value);
event Approval(address indexed owner, address indexed spender, uint256 value);
```

### 🪙 **Minting Events**
```solidity
event Mint(address indexed to, uint256 amount);
event BatchMint(address[] indexed recipients, uint256[] amounts);
```

### 👑 **Ownership Events**
```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
```

## Troubleshooting

### ❌ **Common Issues**

#### **Deployment Fails**
- Check private key is set in `.env`
- Verify sufficient mule tokens for gas
- Confirm RPC URL is accessible

#### **Minting Fails**
- Verify caller is contract owner
- Check recipient address is valid
- Ensure amount is properly formatted (6 decimals)

#### **Transfer Issues**
- Confirm sufficient balance
- Check token approval for transfers
- Verify recipient address

### 🔧 **Solutions**
```typescript
// Check balance before transfer
const balance = await usdc.balanceOf(sender);
if (balance < amount) {
  throw new Error("Insufficient balance");
}

// Verify owner before minting
const owner = await usdc.owner();
if (owner !== signer.address) {
  throw new Error("Not contract owner");
}

// Format amounts correctly
const amount = ethers.parseUnits("100", 6); // 100 USDC
```

## Faucet Information

### 🚰 **Token Distribution**
Currently, USDC tokens are distributed through:
- Genesis address pre-minting
- Owner-controlled minting
- Development team distribution

### 📧 **Request Tokens**
For testing purposes, contact the development team with:
- Your wallet address
- Required amount for testing
- Intended use case

## Support

For technical support or questions regarding the USDC contract:

1. **Documentation**: Reference this guide and contract comments
2. **Testing**: Use the test suite for implementation examples
3. **Community**: Join discussions in the project repository
4. **Issues**: Report bugs through GitHub issues

## License

This project is licensed under the MIT License - see the LICENSE file for details.
