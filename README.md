# MoneyMule 🎯

A milestone-based funding tool for early-stage investors that enables secure, objective-driven investment with automated fund release upon milestone completion.

## 🌟 Overview

MoneyMule revolutionizes early-stage project funding by implementing a milestone-based approach where investors commit funds that are only released when specific project milestones are verifiably completed. This tool ensures accountability, reduces risk, and aligns incentives between founders and early-stage investors.

### Key Features

- **🔒 Secure Fund Escrow**: Funds are held safely until milestones are met
- **🎯 Milestone-Based Releases**: Automatic fund release upon objective completion
- **👥 Investor Whitelist**: Founder-controlled investor access
- **⚡ Oracle Verification**: Decentralized milestone verification system
- **🛡️ Dispute Resolution**: Built-in mechanisms for conflict resolution
- **⏰ Time-Limited Rounds**: Configurable funding deadlines
- **🔄 Investor Protection**: Withdrawal rights if projects fail

## 🚀 Quick Start

### Prerequisites

- Node.js v22 or later
- npm or pnpm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/TomasDmArg/money-mule-contracts.git
cd money-mule-contracts    

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat ignition deploy ignition/modules/MoneyMule.ts
```

### First Deployment

```bash
# Deploy to Saga Chainlet
npx hardhat ignition deploy ignition/modules/MoneyMule.ts --network saga

# Setup demo data
npx hardhat run scripts/demo-setup.ts --network saga
```

## 📋 How It Works

### 1. Funding Round Creation
```solidity
// Founder creates a funding round with milestones
createFundingRound(
    10000, // Target amount (in tokens)
    1640995200, // Deadline timestamp
    ["MVP Development", "Beta Testing", "Launch"] // Milestones
);
```

### 2. Investor Whitelisting
```solidity
// Founder whitelists trusted investors
whitelistInvestor(0x742d35Cc6634C0532925a3b8D4021d25...);
```

### 3. Investment Process
```solidity
// Whitelisted investors contribute funds
invest(5000); // Amount in tokens
```

### 4. Milestone Completion
```solidity
// Oracle verifies and completes milestones
completeMilestone(0); // Milestone ID
```

### 5. Fund Release
```solidity
// Funds automatically released to founder
releaseFunds(0); // Milestone ID
```

## 🧪 Testing

### Run All Tests
```bash
npx hardhat test
```

### Run Solidity Tests Only
```bash
npx hardhat test solidity
```

### Run Integration Tests Only
```bash
npx hardhat test nodejs
```

### Test Coverage
```bash
npx hardhat coverage
```

## 🔧 Configuration

### Network Configuration

Edit `hardhat.config.ts` to configure networks:

```typescript
networks: {
  saga: {
    url: "https://chainlet-rpc-url",
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

### Environment Variables

Create a `.env` file:

```env
PRIVATE_KEY=your-private-key-here
SAGA_RPC_URL=https://your-saga-chainlet-rpc
ETHERSCAN_API_KEY=your-etherscan-api-key
```

## 🎮 Demo Scenarios

### Scenario 1: Successful Funding Flow
1. Create funding round with 3 milestones
2. Whitelist 3 investors
3. Investors contribute funds
4. Complete milestones sequentially
5. Funds released to founder

### Scenario 2: Failed Project
1. Create funding round
2. First milestone fails verification
3. Investors withdraw remaining funds
4. Project marked as failed

### Scenario 3: Dispute Resolution
1. Milestone marked complete
2. Dispute initiated by stakeholder
3. Oracle verification with delay
4. Resolution and appropriate fund release

## 🔒 Security Features

### Built-in Protections
- **Reentrancy Guard**: Prevents reentrancy attacks
- **Access Control**: Role-based permissions
- **Input Validation**: Comprehensive parameter checking
- **Emergency Pause**: Circuit breaker for critical issues
- **Integer Overflow Protection**: Solidity 0.8+ built-in safety

### Security Best Practices
- All state-changing functions protected
- Events emitted for transparency
- Gas-optimized operations
- Minimal external dependencies

## 📊 Contract API

### Core Functions

```solidity
// Funding Round Management
function createFundingRound(uint256 targetAmount, uint256 deadline, string[] calldata milestones)
function whitelistInvestor(address investor)
function invest(uint256 amount)

// Milestone Management
function completeMilestone(uint256 milestoneId)
function releaseFunds(uint256 milestoneId)
function initializeDispute(uint256 milestoneId)

// Investor Functions
function withdrawInvestment()
function getInvestmentAmount(address investor) view returns (uint256)

// Admin Functions
function emergencyPause()
function updateOracle(address newOracle)
```

### Events

```solidity
event FundingRoundCreated(uint256 indexed roundId, uint256 targetAmount, uint256 deadline);
event InvestorWhitelisted(address indexed investor);
event InvestmentMade(address indexed investor, uint256 amount);
event MilestoneCompleted(uint256 indexed milestoneId);
event FundsReleased(uint256 indexed milestoneId, uint256 amount);
event DisputeInitiated(uint256 indexed milestoneId);
event InvestmentWithdrawn(address indexed investor, uint256 amount);
```

## 🌐 Deployment

### Local Development
```bash
# Start local node
npx hardhat node

# Deploy to local network
npx hardhat ignition deploy ignition/modules/MoneyMule.ts --network localhost
```

### Saga Chainlet
```bash
# Deploy to Saga Chainlet
npx hardhat ignition deploy ignition/modules/MoneyMule.ts --network saga --verify
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Hardhat 3](https://hardhat.org/)
- Security by [OpenZeppelin](https://openzeppelin.com/)
- Testing with [Viem](https://viem.sh/)
- Deployed on [Saga Chainlet](https://www.saga.xyz/)

Built for ETH Global Cannes 2025 hackathon - demonstrating innovative milestone-based funding for early-stage ventures.