# MoneyMule Contract Documentation

This project includes a milestone-based funding platform smart contract deployed on the MoneyMule network for hackathon demonstration purposes.

## Overview

**MoneyMule** is a revolutionary milestone-based funding platform that enables secure, objective-driven investments with automated fund release upon milestone completion. The platform ensures accountability, reduces risk, and aligns incentives between founders and early-stage investors.

### Key Features

- **🔒 Secure Fund Escrow**: Funds are held safely until milestones are met
- **🎯 Milestone-Based Releases**: Automatic fund release upon objective completion
- **👥 Investor Whitelist**: Founder-controlled investor access
- **⚡ Oracle Verification**: 24-hour verification delay for milestone completion
- **🛡️ Dispute Resolution**: Built-in mechanisms for conflict resolution
- **⏰ Time-Limited Rounds**: Configurable funding deadlines
- **🔄 Investor Protection**: Withdrawal rights if projects fail

## Quick Setup Guide

### Prerequisites

Ensure you have the following configured before deployment:

1. **Environment Configuration**
   
   Create a `.env` file in your project root with the following variables:
   
   ```env
   PRIVATE_KEY=your_private_key_here
   MONEYMULE_RPC_URL=https://moneymule-2751721147387000-1.jsonrpc.sagarpc.io
   MONEYMULE_CONTRACT_ADDRESS=0xfe2546EA1718E293168E0Fc901F00DD1a59547dF
   ```

2. **Node.js Dependencies**
   
   Install the required dependencies:
   
   ```bash
   npm install
   ```

3. **Contract Compilation**
   
   Compile the smart contracts:
   
   ```bash
   npm run compile
   ```

## Deployment Instructions

### Production Deployment (MoneyMule Network)

1. **Deploy MoneyMule Contract**
   
   ```bash
   npm run deploy:moneymule
   ```

2. **Verify Contract Deployment**
   
   The deployment script will automatically verify the contract and display:
   - Contract address
   - Contract owner
   - Verification delay (24 hours)
   - Contract paused state

### Local Development Deployment

1. **Start Local Network**
   
   ```bash
   npm run deploy:local
   ```

2. **Deploy to Local Network**
   
   ```bash
   npm run deploy:moneymule:local
   ```

### Alternative Deployment Methods

#### Using Hardhat Ignition

```bash
# Deploy using Ignition modules
npm run deploy:contracts
```

#### Manual Deployment

```bash
# Deploy directly with Hardhat
npx hardhat run scripts/deploy-moneymule.ts --network moneymule
```

## Available Commands

### Main Network Commands

```bash
# Compile smart contracts
npm run compile

# Deploy MoneyMule contract to MoneyMule network
npm run deploy:moneymule

# Run demo setup with sample data
npm run demo

# Run tests
npm run test

# Run test coverage
npm run test:coverage

# Clean build artifacts
npm run clean

# Generate TypeScript types
npm run typechain
```

### Local Development Commands

```bash
# Start local Hardhat node
npm run deploy:local

# Deploy MoneyMule contract locally
npm run deploy:moneymule:local

# Run demo setup locally
npm run demo:local
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

### Production MoneyMule Contract

| Property | Value |
|----------|-------|
| **Contract Address** | `0xfe2546EA1718E293168E0Fc901F00DD1a59547dF` |
| **Contract Name** | MoneyMule |
| **Contract Owner** | `0xa6e4e006EeD9fEA0C378A42d32a033F4B4f4A15b` |
| **Verification Delay** | 86400 seconds (24 hours) |
| **Contract Status** | Active (not paused) |
| **Solidity Version** | 0.8.28 |

### Contract Features

#### Funding Round Management
- **Create Funding Rounds**: Founders can create funding rounds with specific target amounts and deadlines
- **Milestone Definition**: Each round includes multiple milestones with individual funding amounts
- **Investor Whitelisting**: Founders control which investors can participate

#### Investment Flow
- **Secure Investments**: Funds are held in escrow until milestones are completed
- **Automatic Releases**: Funds are released after milestone completion and verification delay
- **Investor Protection**: Ability to withdraw funds if projects fail or are cancelled

#### Security Features
- **Reentrancy Protection**: Built-in protection against reentrancy attacks
- **Pausable Contract**: Owner can pause contract in emergencies
- **Access Control**: Role-based permissions for different operations

## Contract Interface

### Core Functions

#### For Founders

```solidity
// Create a new funding round
function createFundingRound(
    uint256 targetAmount,
    uint256 deadline,
    string[] calldata milestoneDescriptions,
    uint256[] calldata milestoneFunding
) external returns (uint256);

// Whitelist an investor
function whitelistInvestor(uint256 roundId, address investor) external;

// Complete a milestone
function completeMilestone(uint256 milestoneId) external;

// Release funds after verification delay
function releaseFunds(uint256 milestoneId) external;

// Cancel a funding round
function cancelFundingRound(uint256 roundId) external;
```

#### For Investors

```solidity
// Invest in a funding round
function invest(uint256 roundId) external payable;

// Withdraw investment if project fails
function withdrawInvestment(uint256 roundId) external;

// Check investment amount
function getInvestmentAmount(uint256 roundId, address investor) external view returns (uint256);

// Check whitelist status
function isWhitelisted(uint256 roundId, address investor) external view returns (bool);
```

### View Functions

```solidity
// Get funding round details
function getFundingRound(uint256 roundId) external view returns (...);

// Get round milestones
function getRoundMilestones(uint256 roundId) external view returns (uint256[] memory);

// Get investor rounds
function getInvestorRounds(address investor) external view returns (uint256[] memory);

// Get next round ID
function getNextRoundId() external view returns (uint256);

// Get milestone details
function milestones(uint256 milestoneId) external view returns (...);
```

## Usage Examples

### Creating a Funding Round

```typescript
import { ethers } from "ethers";
import { MoneyMule } from "./typechain-types";

const provider = new ethers.JsonRpcProvider("https://moneymule-2751721147387000-1.jsonrpc.sagarpc.io");
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const moneyMule = new ethers.Contract(
    "0xfe2546EA1718E293168E0Fc901F00DD1a59547dF",
    MoneyMuleABI,
    wallet
) as MoneyMule;

// Create a funding round
const tx = await moneyMule.createFundingRound(
    ethers.parseEther("10"), // 10 mule tokens
    Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
    ["MVP Development", "Beta Testing", "Production Launch"],
    [ethers.parseEther("3"), ethers.parseEther("3"), ethers.parseEther("4")]
);

await tx.wait();
console.log("Funding round created!");
```

### Whitelisting Investors

```typescript
// Whitelist multiple investors
const investors = [
    "0x742d35Cc6634C0532925a3b8D564d69e7C2C6F3d",
    "0x742d35Cc6634C0532925a3b8D564d69e7C2C6F3e",
    "0x742d35Cc6634C0532925a3b8D564d69e7C2C6F3f"
];

for (const investor of investors) {
    const tx = await moneyMule.whitelistInvestor(1, investor);
    await tx.wait();
    console.log(`Investor ${investor} whitelisted`);
}
```

### Making an Investment

```typescript
// Invest in a funding round
const investmentAmount = ethers.parseEther("1"); // 1 mule token
const tx = await moneyMule.invest(1, { value: investmentAmount });
await tx.wait();
console.log("Investment made successfully!");
```

## Testing

### Run Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

The contract includes comprehensive tests covering:
- Funding round creation and management
- Investor whitelisting and investments
- Milestone completion and fund release
- Emergency scenarios and edge cases
- Access control and security features

## Security Considerations

### Implemented Security Measures

1. **Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuard
2. **Access Control**: Ownable pattern for administrative functions
3. **Pausable Contract**: Emergency pause functionality
4. **Input Validation**: Comprehensive validation of all inputs
5. **Time Delays**: 24-hour verification delay for milestone completion

### Best Practices

1. **Multi-signature Wallets**: Consider using multi-sig wallets for contract ownership
2. **Regular Audits**: Conduct regular security audits
3. **Monitoring**: Monitor contract events and transactions
4. **Backup Plans**: Have contingency plans for emergency scenarios

## Events

The contract emits the following events for monitoring and integration:

```solidity
event FundingRoundCreated(uint256 indexed roundId, address indexed founder, uint256 targetAmount, uint256 deadline, uint256 milestonesCount);
event InvestorWhitelisted(uint256 indexed roundId, address indexed investor);
event InvestmentMade(uint256 indexed roundId, address indexed investor, uint256 amount);
event MilestoneCompleted(uint256 indexed milestoneId, uint256 indexed roundId);
event FundsReleased(uint256 indexed milestoneId, uint256 indexed roundId, uint256 amount);
event InvestmentWithdrawn(uint256 indexed roundId, address indexed investor, uint256 amount);
event FundingRoundCancelled(uint256 indexed roundId);
```

## Troubleshooting

### Common Issues

1. **Deployment Fails**
   - Check your private key is correctly set in `.env`
   - Ensure you have sufficient mule tokens for gas fees
   - Verify the RPC URL is accessible

2. **Transaction Reverts**
   - Check you have the correct permissions for the operation
   - Verify contract state (not paused, round is active, etc.)
   - Ensure sufficient gas limit

3. **Investor Cannot Invest**
   - Verify investor is whitelisted for the round
   - Check funding round deadline hasn't passed
   - Ensure investment doesn't exceed target amount

### Getting Help

1. **Check Contract State**: Use view functions to check current state
2. **Review Events**: Monitor emitted events for transaction details
3. **Test Locally**: Use local deployment for debugging
4. **Check Documentation**: Refer to function documentation in the contract

## Integration

### Frontend Integration

The contract provides a comprehensive interface for frontend applications:

```typescript
// Example React hook for contract interaction
import { useContract } from './hooks/useContract';

const useFundingRound = (roundId: number) => {
    const contract = useContract();
    
    const getFundingRound = async () => {
        return await contract.getFundingRound(roundId);
    };
    
    const invest = async (amount: string) => {
        return await contract.invest(roundId, { value: ethers.parseEther(amount) });
    };
    
    return { getFundingRound, invest };
};
```

### Backend Integration

For server-side applications:

```typescript
import { MoneyMule } from './typechain-types';
import { ethers } from 'ethers';

class MoneyMuleService {
    private contract: MoneyMule;
    
    constructor() {
        const provider = new ethers.JsonRpcProvider(process.env.MONEYMULE_RPC_URL);
        this.contract = new ethers.Contract(
            process.env.MONEYMULE_CONTRACT_ADDRESS!,
            MoneyMuleABI,
            provider
        ) as MoneyMule;
    }
    
    async getFundingRounds() {
        // Implementation
    }
    
    async monitorEvents() {
        // Event monitoring implementation
    }
}
```

## Support

For technical support or questions regarding the MoneyMule contract implementation:

1. **Documentation**: Refer to this documentation and contract comments
2. **Testing**: Use the comprehensive test suite for examples
3. **Community**: Join the MoneyMule community for discussions
4. **Issues**: Report bugs or issues through the project repository

## License

This project is licensed under the MIT License - see the LICENSE file for details.
