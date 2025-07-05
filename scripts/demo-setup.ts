import { network } from "hardhat";

async function main() {
  console.log("🚀 Setting up MoneyMule Demo...");

  // Try to get ethers from network connection
  let ethers: any;
  try {
    const connection = await network.connect();
    ethers = (connection as any).ethers;
    if (!ethers) {
      throw new Error("ethers not available");
    }
  } catch (error) {
    console.log("Falling back to dynamic import for ethers...");
    const hre = await import("hardhat");
    ethers = (hre as any).ethers;
  }

  // Get signers
  const [owner, founder, investor1, investor2, investor3] = await ethers.getSigners();

  console.log("Deploying MoneyMule contract...");
  
  // Deploy MoneyMule contract
  const MoneyMule = await ethers.getContractFactory("MoneyMule");
  const moneyMule = await MoneyMule.deploy();
  await moneyMule.waitForDeployment();
  
  const contractAddress = await moneyMule.getAddress();
  console.log(`✅ MoneyMule deployed to: ${contractAddress}`);

  // Demo data
  const targetAmount = ethers.parseEther("10"); // 10 ETH
  const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days from now
  
  const milestoneDescriptions = [
    "MVP Development - Core platform features",
    "Beta Release - User testing and feedback",
    "Production Launch - Full platform release"
  ];
  
  const milestoneFunding = [
    ethers.parseEther("3"), // 3 ETH for MVP
    ethers.parseEther("3"), // 3 ETH for Beta
    ethers.parseEther("4")  // 4 ETH for Production
  ];

  console.log("\n📋 Creating Demo Funding Round...");
  
  // Create funding round
  const createTx = await moneyMule.connect(founder).createFundingRound(
    targetAmount,
    deadline,
    milestoneDescriptions,
    milestoneFunding
  );
  
  await createTx.wait();
  console.log("✅ Funding round created with ID: 1");

  // Get round info
  const roundInfo = await moneyMule.getFundingRound(1);
  console.log(`   Target Amount: ${ethers.formatEther(roundInfo.targetAmount)} ETH`);
  console.log(`   Deadline: ${new Date(Number(roundInfo.deadline) * 1000).toLocaleString()}`);
  console.log(`   Milestones: ${roundInfo.milestonesCount}`);

  console.log("\n👥 Setting up Demo Investors...");
  
  // Whitelist investors
  await moneyMule.connect(founder).whitelistInvestor(1, investor1.address);
  await moneyMule.connect(founder).whitelistInvestor(1, investor2.address);
  await moneyMule.connect(founder).whitelistInvestor(1, investor3.address);
  
  console.log(`✅ Whitelisted investor1: ${investor1.address}`);
  console.log(`✅ Whitelisted investor2: ${investor2.address}`);
  console.log(`✅ Whitelisted investor3: ${investor3.address}`);

  console.log("\n💰 Demo Investment Scenario...");
  
  // Demo investments
  await moneyMule.connect(investor1).invest(1, { value: ethers.parseEther("4") });
  await moneyMule.connect(investor2).invest(1, { value: ethers.parseEther("3") });
  await moneyMule.connect(investor3).invest(1, { value: ethers.parseEther("3") });
  
  console.log("✅ Investor1 invested 4 ETH");
  console.log("✅ Investor2 invested 3 ETH");
  console.log("✅ Investor3 invested 3 ETH");

  // Check funding status
  const updatedRound = await moneyMule.getFundingRound(1);
  console.log(`💡 Total raised: ${ethers.formatEther(updatedRound.currentAmount)} ETH`);
  console.log(`💡 Funding status: ${updatedRound.status === 1n ? "✅ COMPLETED" : "⏳ Active"}`);

  console.log("\n🎯 Demo Data Summary:");
  console.log("==================");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Founder Address: ${founder.address}`);
  console.log(`Funding Round ID: 1`);
  console.log(`Target Amount: ${ethers.formatEther(targetAmount)} ETH`);
  console.log(`Amount Raised: ${ethers.formatEther(updatedRound.currentAmount)} ETH`);
  console.log(`Investors: 3 whitelisted and invested`);
  console.log(`Milestones: 3 created and ready for completion`);

  console.log("\n🎬 Demo Flow Instructions:");
  console.log("=========================");
  console.log("1. ✅ Funding round created and fully funded");
  console.log("2. 🔄 Founder can now complete milestones using:");
  console.log(`   await moneyMule.connect(founder).completeMilestone(1); // First milestone`);
  console.log("3. ⏰ Wait 24 hours (or fast-forward time in tests)");
  console.log("4. 💸 Release funds using:");
  console.log(`   await moneyMule.connect(founder).releaseFunds(1);`);
  console.log("5. 🔄 Repeat for remaining milestones");

  console.log("\n📊 Gas Usage Estimates:");
  console.log("=======================");
  console.log("- Create Funding Round: ~200K gas");
  console.log("- Whitelist Investor: ~50K gas");
  console.log("- Invest: ~100K gas");
  console.log("- Complete Milestone: ~80K gas");
  console.log("- Release Funds: ~60K gas");

  console.log("\n🎯 Demo is ready for presentation! 🎯");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 