# MoneyMule 🎯

A milestone-based funding platform with jury voting system for early-stage projects. Built with Factory Pattern for scalability and advanced governance features.

## 🌟 Overview

MoneyMule revolutionizes early-stage project funding by implementing a milestone-based approach where investors commit funds that are only released when specific project milestones are approved by an authorized jury. This system ensures accountability, reduces risk, and enables partial funding with community governance.

## 📚 Documentation

### 📖 Detailed Documentation
- **[📋 MoneyMule Contract Guide](.docs/MoneyMule.md)** - Complete contract documentation, API reference, and usage examples
- **[🪙 USDC Contract Guide](.docs/USDC.md)** - USDC deployment, configuration, and network specifications

### 🏗️ **Architecture**

```
MoneyMuleFactory.sol     ──┐
├─ Create & track rounds    │
├─ Authorize jurors         │── Factory Layer
├─ Global management        │
└─ Emergency controls       │
                           ──┘
MoneyMuleRound.sol       ──┐
├─ Individual rounds        │
├─ Jury voting system       │── Round Layer  
├─ Milestone management     │
└─ Fund management          │
                           ──┘
```

## ✨ **Key Features**

### **🎯 Funding & Governance**
- **📊 Partial Funding**: Rounds can proceed with partial funding
- **🗳️ Jury Voting**: 3 authorized wallets decide milestone approval
- **⏰ Deadline System**: Specific deadlines per milestone
- **🚫 Restricted Voting**: Only jury can vote (not founders/investors)
- **🔄 Anyone Can Trigger**: Community can activate deadline voting

### **🔐 Security & Controls**
- **🏭 Factory Pattern**: Scalable and gas-optimized
- **🛡️ Security First**: ReentrancyGuard, SafeERC20, comprehensive validations
- **🚨 Emergency Features**: Pause, cancel, withdrawal protections
- **💰 Proportional Release**: Funds released proportionally to funding achieved

### **💡 User Experience**
- **👥 Whitelist System**: Founder-controlled investor access
- **🔄 Multiple Rounds**: Independent rounds per project
- **📈 Transparent Tracking**: Full visibility of funding and milestones
- **⚡ Automatic Transitions**: Smart phase management

## 🚀 Quick Start

### Installation
```bash
# Clone and setup
git clone https://github.com/TomasDmArg/money-mule-contracts.git
cd money-mule-contracts    
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy demo
npx hardhat run scripts/deploy-factory.ts
```

## 🎯 **How It Works**

### **1. 📊 Funding Phase**
```typescript
// 1. Factory owner authorizes jurors
await factory.authorizeJuror(juror1.address);

// 2. Founder creates round with milestones & deadlines
const milestones = [{
  description: "Development Phase",
  fundingAmount: ethers.parseEther("40"),
  deadline: fundingDeadline + 86400,
  juryWallets: [juror1, juror2, juror3]
}];

const [roundId, roundContract] = await factory.createFundingRound(
  tokenAddress,
  ethers.parseEther("100"),
  fundingDeadline,
  milestones
);

// 3. Founder whitelists investors
await roundContract.whitelistInvestor(investor.address);

// 4. Investors fund (ONLY during funding phase)
await roundContract.invest(ethers.parseEther("50"));
```

### **2. 🗳️ Execution Phase**
```typescript
// 5. Anyone triggers milestone deadline
await roundContract.triggerMilestoneDeadline(1);

// 6. Jury votes (ONLY authorized wallets)
await roundContract.castJuryVote(1, true);  // Approve
await roundContract.castJuryVote(1, false); // Reject

// 7. Founder completes approved milestone
await roundContract.completeMilestone(1);

// 8. Funds released after verification delay
await roundContract.releaseFunds(1);
```

### **3. 💰 Fund Management**
```typescript
// Investors can withdraw in various scenarios:
// - After funding deadline failure
// - After round cancellation  
// - Proportional to unreleased funds
await roundContract.withdrawInvestment(0); // 0 = withdraw all available
```

## 🧪 Testing

### **Run All Tests**
```bash
# Factory + Round system (Current)
npx hardhat test test/MoneyMuleFactory.ts

# Legacy tests (for reference)
npx hardhat test test/MoneyMule.ts

# All tests
npx hardhat test
```

### **Test Coverage**
- ✅ Factory management & juror authorization
- ✅ Round creation & validation
- ✅ Funding phase & investor whitelisting
- ✅ Jury voting system & deadline triggers
- ✅ Milestone completion & fund release
- ✅ Investment withdrawal & edge cases
- ✅ Complete lifecycle integration tests

## 📋 **Smart Contract API**

### **MoneyMuleFactory**
```solidity
// Core Functions
function createFundingRound(
    address token,
    uint256 targetAmount,
    uint256 fundingDeadline,
    MilestoneData[] calldata milestones
) external returns (uint256 roundId, address roundContract);

function authorizeJuror(address juror) external;
function revokeJuror(address juror) external;

// View Functions
function getRoundContract(uint256 roundId) external view returns (address);
function getFounderRounds(address founder) external view returns (uint256[] memory);
function getInvestorRounds(address investor) external view returns (uint256[] memory);
```

### **MoneyMuleRound**
```solidity
// Funding Phase
function whitelistInvestor(address investor) external;
function invest(uint256 amount) external;
function moveToExecutionPhase() external;

// Jury Voting System
function triggerMilestoneDeadline(uint256 milestoneId) external;
function castJuryVote(uint256 milestoneId, bool approve) external;
function finalizeMilestoneVoting(uint256 milestoneId) external;

// Milestone Management
function completeMilestone(uint256 milestoneId) external;
function releaseFunds(uint256 milestoneId) external;

// Investment Management
function withdrawInvestment(uint256 amount) external;
function getWithdrawableAmount(address investor) external view returns (uint256);
```

## 🔄 **User Flows**

### **👑 For Founders**
1. Create funding round with milestones & jury
2. Whitelist trusted investors
3. Wait for funding completion (full/partial)
4. Complete milestones approved by jury
5. Release funds after verification delay

### **💰 For Investors**  
1. Get whitelisted by founder
2. Invest during funding phase only
3. Monitor milestone progress
4. Withdraw funds under specific conditions

### **⚖️ For Jury Members**
1. Get authorized by factory owner
2. Vote on milestones when deadlines triggered
3. Decide project continuation based on evidence

### **🌍 For Community**
1. Anyone can trigger milestone deadlines
2. Transparent voting process observation
3. Verify fund releases and project progress

## 🌐 Deployment & Scripts

### **📦 Available Scripts**

```bash
# 🚀 Main Deployment (with demo interactions)
npx hardhat run scripts/deploy-factory.ts --network [network]

# 🎬 Complete Demo (full lifecycle demonstration)  
npx hardhat run scripts/demo-factory.ts --network hardhat

# 🏭 Production Deployment (factory only)
npx hardhat run scripts/deploy-production.ts --network [network]

# 🛠️ Factory Management (post-deployment operations)
npx hardhat run scripts/manage-factory.ts --network [network]
```

### **🎯 Script Descriptions**

#### **1. deploy-factory.ts** - Main Deployment
- Deploys complete system (Factory + MockERC20)
- Authorizes demo jurors
- Creates sample funding round
- Demonstrates basic interactions
- **Best for**: Development and testing

#### **2. demo-factory.ts** - Complete Demo
- Full lifecycle demonstration
- Multiple participants (9 accounts)
- Complete milestone execution
- Jury voting simulation
- Time manipulation for testing
- **Best for**: Understanding system behavior

#### **3. deploy-production.ts** - Production Ready
- Deploys Factory only (no mock tokens)
- Production-oriented output
- Security reminders
- Verification instructions
- **Best for**: Mainnet/testnet deployment

#### **4. manage-factory.ts** - Post-Deployment Management
- Connect to existing factory
- View factory status and rounds
- Management operations guide
- Example commands
- **Best for**: Operating deployed factories

### **🚀 Quick Deployment Guide**

#### **Local Development**
```bash
# Start local node
npx hardhat node

# Deploy with demo (new terminal)
npx hardhat run scripts/deploy-factory.ts --network localhost

# Or run complete demo
npx hardhat run scripts/demo-factory.ts --network hardhat
```

#### **Testnet/Production Deployment**
```bash
# Deploy to network
npx hardhat run scripts/deploy-production.ts --network [network]

# Verify contracts
npx hardhat verify --network [network] [factory-address]

# Manage factory
FACTORY_ADDRESS=[address] npx hardhat run scripts/manage-factory.ts --network [network]
```

### **⚙️ Environment Setup**
```env
# Required for all networks
PRIVATE_KEY=your-private-key-here

# For additional accounts (demo scripts)
PRIVATE_KEY_2=second-account-private-key
PRIVATE_KEY_3=third-account-private-key
# ... (up to PRIVATE_KEY_6)

# For Saga Chainlet
SAGA_RPC_URL=https://your-saga-chainlet-rpc

# For factory management
FACTORY_ADDRESS=deployed-factory-address

# For verification
ETHERSCAN_API_KEY=your-etherscan-api-key
```

## 🔒 Security Features

### **Built-in Protections**
- **🛡️ Reentrancy Guard**: All critical functions protected
- **🔐 Access Control**: Role-based permissions with validation
- **✅ Input Validation**: Comprehensive parameter checking
- **🚨 Emergency Controls**: Pause, cancel, emergency recovery
- **🧮 Safe Math**: Solidity 0.8+ overflow protection
- **💎 Safe Transfers**: OpenZeppelin SafeERC20 usage

### **Governance Security**
- **🎯 Voting Isolation**: Only authorized jury can vote
- **⏰ Time Controls**: Deadlines and verification delays
- **🔄 Transparent Process**: All actions emit events
- **💰 Fund Protection**: Multiple withdrawal conditions

## 📊 **Contract Events**

```solidity
// Factory Events
event RoundCreated(uint256 indexed roundId, address indexed roundContract, address indexed founder);
event JurorAuthorized(address indexed juror);
event JurorRevoked(address indexed juror);

// Round Events
event InvestorWhitelisted(address indexed investor);
event InvestmentMade(address indexed investor, uint256 amount);
event PhaseChanged(RoundPhase newPhase);
event MilestoneDeadlineTriggered(uint256 indexed milestoneId, address indexed triggeredBy);
event JuryVoteCast(uint256 indexed milestoneId, address indexed juror, bool approve);
event MilestoneVotingFinalized(uint256 indexed milestoneId, MilestoneStatus result);
event MilestoneCompleted(uint256 indexed milestoneId);
event FundsReleased(uint256 indexed milestoneId, uint256 amount);
event InvestmentWithdrawn(address indexed investor, uint256 amount);
```

## 🎮 **Demo Scenarios**

### **Scenario 1: Successful Full Lifecycle**
1. Create round with 2 milestones (40 ETH + 60 ETH)
2. Complete funding (100 ETH total)
3. Trigger first milestone deadline
4. Jury approves (3/3 votes)
5. Complete milestone and release 40 ETH
6. Repeat for second milestone
7. Project completed successfully

### **Scenario 2: Partial Funding Success**
1. Create round targeting 100 ETH
2. Only receive 60 ETH by deadline
3. Move to execution phase with partial funding
4. Jury votes on milestones considering reduced scope
5. Proportional fund release (e.g., 24 ETH instead of 40 ETH)

### **Scenario 3: Milestone Rejection**
1. Funding completed successfully
2. First milestone deadline triggered
3. Jury rejects milestone (2/3 votes against)
4. Founder cannot complete milestone
5. Investors withdraw remaining funds
6. Project marked as failed

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 **Built For**

**ETH Global Cannes 2025** - Demonstrating innovative milestone-based funding with jury governance for early-stage ventures.

### **Tech Stack**
- 🔨 **Hardhat 3** - Development framework
- 🛡️ **OpenZeppelin** - Security & standards
- ⚡ **Viem** - Testing framework
- 🌐 **Saga Chainlet** - Deployment network

---

### 📋 **Key Principles**

1. **💰 Funding Restriction**: Only add funds during initial phase
2. **🗳️ Voting Restriction**: Only authorized jury votes (NOT founders/investors)  
3. **⏰ Community Trigger**: Anyone can activate deadline voting
4. **💎 Proportional Release**: Funds released proportionally to achieved funding
5. **🚨 Emergency Safety**: Owner controls for critical situations

**🎉 This system completely implements partial funding with jury governance!**